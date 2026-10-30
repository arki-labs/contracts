import { z } from 'zod';
import { isFailure, orThrow, UnexpectedDefect, ValidatorDefect } from '@arki/failure';
import { CONTRACTS_ERROR_CODES, ContractsError, InvalidCursor, InvalidCursorValue } from './errors.js';
const cursorValue = z.union([z.string(), z.number(), z.boolean(), z.date()]);
/** Canonical failures returned by cursor decoding. */
export const CURSOR_DECODE_FAILURES = [InvalidCursor, ValidatorDefect, UnexpectedDefect];
/** Canonical failures returned by cursor encoding. */
export const CURSOR_ENCODE_FAILURES = [InvalidCursorValue, ValidatorDefect, UnexpectedDefect];
/** Canonical cursor failures for adapters that expose both operations. */
export const CURSOR_FAILURES = [InvalidCursor, InvalidCursorValue, ValidatorDefect, UnexpectedDefect];
const cursorText = z
    .string()
    .max(1024)
    .regex(/^[\w-]*$/)
    .refine(value => value.length % 4 !== 1);
/** A validator defect is different from data that fails its checks. */
function validate(schema, value) {
    try {
        return schema.safeParse(value);
    }
    catch (error) {
        return ValidatorDefect({ cause: error });
    }
}
/** Tagged so a `Date` comes back a `Date`, not a string that happens to look like one. */
const encodedValue = z.union([
    z.tuple([z.literal('s'), z.string()]),
    z.tuple([z.literal('n'), z.number()]),
    z.tuple([z.literal('b'), z.boolean()]),
    z.tuple([z.literal('d'), z.iso.datetime()]),
]);
function encodeValue(value) {
    if (typeof value === 'string')
        return ['s', value];
    if (typeof value === 'number')
        return ['n', value];
    if (typeof value === 'boolean')
        return ['b', value];
    return ['d', value.toISOString()];
}
function decodeValue([tag, value]) {
    return tag === 'd' ? new Date(value) : value;
}
/* ---- base64url over UTF-8: btoa + atob + URI coding exist in every runtime we ship to.
   TextEncoder/TextDecoder are not used: Hermes (React Native) has no TextDecoder. ---- */
function toBase64Url(text) {
    // encodeURIComponent yields the UTF-8 bytes as %XX; turn each into one binary-string character.
    const binary = encodeURIComponent(text).replaceAll(/%([\dA-F]{2})/g, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)));
    return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
function fromBase64Url(text) {
    const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
    let escaped = '';
    for (const char of binary)
        escaped += `%${(char.codePointAt(0) ?? 0).toString(16).padStart(2, '0')}`;
    return decodeURIComponent(escaped);
}
/**
 * Declare how a list is ordered. Write it once in `model/` and use it in the
 * contract (`pageInput(storyOrder)`) and in the repository
 * (`keysetQuery(storyOrder, stories)` from `@arki/db/pagination`).
 *
 * End the order on a unique key (usually `id`); the cursor is the values of
 * these keys on the last row of a page, base64url-encoded JSON. It is opaque
 * to clients, not secret: a hand-made cursor only moves the start of a page,
 * it never skips the query's own filters (ownership included).
 *
 * @example
 * ```ts
 * export const storyOrder = keyset({ createdAt: 'desc', id: 'desc' });
 * const cursor = storyOrder.encode({ createdAt: row.createdAt, id: row.id });
 * // Check or forward a failure before passing the successful cursor to decode.
 * ```
 */
export function keyset(order) {
    // `Object.keys` is typed `string[]`; these are exactly the keys of `order`.
    const keys = Object.freeze(Object.keys(order));
    if (keys.length === 0)
        throw new ContractsError(CONTRACTS_ERROR_CODES.invalidKeyset, 'keyset: declare at least one key, and end on a unique one.');
    const payload = z.array(encodedValue).length(keys.length);
    const decode = (cursor) => {
        try {
            const text = validate(cursorText, cursor);
            if (isFailure(text))
                return text;
            if (!text.success)
                return InvalidCursor();
            let parsed;
            try {
                parsed = JSON.parse(fromBase64Url(text.data));
            }
            catch (error) {
                if (error instanceof SyntaxError ||
                    error instanceof URIError ||
                    (error instanceof Error && error.name === 'InvalidCharacterError'))
                    return InvalidCursor({ cause: error });
                return UnexpectedDefect({ cause: error });
            }
            const result = validate(payload, parsed);
            if (isFailure(result))
                return result;
            if (!result.success)
                return InvalidCursor();
            const values = {};
            for (const [index, key] of keys.entries()) {
                const encoded = result.data[index];
                if (encoded !== undefined)
                    Object.defineProperty(values, key, { value: decodeValue(encoded), enumerable: true });
            }
            // Erasure seam: payload checked one value per key; each field is defined above.
            return values;
        }
        catch (error) {
            return UnexpectedDefect({ cause: error });
        }
    };
    const encode = (row) => {
        try {
            if (typeof row !== 'object' || row === null)
                return InvalidCursorValue();
            const values = [];
            for (const key of keys) {
                const result = validate(cursorValue, row[key]);
                if (isFailure(result))
                    return result;
                if (!result.success)
                    return InvalidCursorValue();
                values.push(encodeValue(result.data));
            }
            // Validate the wire output too: valid Dates may use extended ISO years
            // outside the decoder schema, and must not become unreadable cursors.
            const payloadResult = validate(payload, values);
            if (isFailure(payloadResult))
                return payloadResult;
            if (!payloadResult.success)
                return InvalidCursorValue();
            const cursor = toBase64Url(JSON.stringify(payloadResult.data));
            const result = validate(cursorText, cursor);
            if (isFailure(result))
                return result;
            return result.success ? result.data : InvalidCursorValue();
        }
        catch (error) {
            return UnexpectedDefect({ cause: error });
        }
    };
    return {
        order,
        keys,
        encode,
        decode,
        // Zod is an explicit foreign validator boundary: expected input refusals
        // become issues; unexpected codec defects must reach the parsing owner.
        cursor: cursorText.refine(value => {
            const result = decode(value);
            if (InvalidCursor.is(result))
                return false;
            orThrow(result);
            return true;
        }, { error: 'Invalid cursor' }),
    };
}
/**
 * The input schema of a paged list: `{ cursor?, limit }`. No cursor means
 * the first page. Extend it with the list's own filters:
 * `pageInput(storyOrder).extend({ status: storyStatus })`.
 */
export function pageInput(order, options = {}) {
    const maxLimit = options.maxLimit ?? 100;
    return z.object({
        cursor: order.cursor.optional(),
        limit: z
            .int()
            .min(1)
            .max(maxLimit)
            .default(Math.min(options.defaultLimit ?? 20, maxLimit)),
    });
}
/**
 * The output schema of a paged list: the items and the cursor of the next
 * page, `null` on the last page — so "is there more?" is never a guess
 * from a full-looking page.
 */
export function page(item) {
    return z.object({ items: z.array(item), nextCursor: z.string().nullable() });
}
//# sourceMappingURL=pagination.js.map