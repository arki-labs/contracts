import { z } from 'zod';
/**
 * Keyset ("cursor") pagination, the browser-safe half: the order a list is
 * sorted by, the opaque cursor that marks where the next page starts, and
 * the page schemas a contract uses. `@arki/db/pagination` turns the same
 * declaration into `ORDER BY` and `WHERE` on the server.
 *
 * Why keyset and not offset: with `OFFSET`, a row inserted while someone is
 * reading shifts every later page by one, so a row repeats or vanishes. A
 * keyset cursor says "after this row", which stays true while rows come and go.
 *
 * Why the order must end on a unique key: rows with the same `createdAt`
 * (a bulk import writes thousands) have no order of their own, and Postgres
 * may return them differently on every query. `id` breaks the tie.
 */
/** Sort direction of one key. */
export type SortDirection = 'asc' | 'desc';
/** The sort order: row field → direction, most significant first. `{ createdAt: 'desc', id: 'desc' }`. */
export type KeysetOrder = Readonly<Record<string, SortDirection>>;
declare const cursorValue: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodDate]>;
/** What a cursor can hold for one key of a NOT NULL column. */
export type CursorValue = z.output<typeof cursorValue>;
/** The decoded cursor: one value per key of the order. */
export type CursorValues<O extends KeysetOrder> = {
    readonly [K in keyof O]: CursorValue;
};
/** A keyset declaration, including its inferred codec failures. */
export type Keyset<O extends KeysetOrder> = ReturnType<typeof keyset<O>>;
/** Canonical failures returned by cursor decoding. */
export declare const CURSOR_DECODE_FAILURES: readonly [import("@arki/failure").FailureDefinition<"contracts.invalid_cursor", undefined>, import("@arki/failure").FailureDefinition<"schema.validator_defect", undefined>, import("@arki/failure").FailureDefinition<"failure.unexpected_defect", undefined>];
/** Canonical failures returned by cursor encoding. */
export declare const CURSOR_ENCODE_FAILURES: readonly [import("@arki/failure").FailureDefinition<"contracts.invalid_cursor_value", undefined>, import("@arki/failure").FailureDefinition<"schema.validator_defect", undefined>, import("@arki/failure").FailureDefinition<"failure.unexpected_defect", undefined>];
/** Canonical cursor failures for adapters that expose both operations. */
export declare const CURSOR_FAILURES: readonly [import("@arki/failure").FailureDefinition<"contracts.invalid_cursor", undefined>, import("@arki/failure").FailureDefinition<"contracts.invalid_cursor_value", undefined>, import("@arki/failure").FailureDefinition<"schema.validator_defect", undefined>, import("@arki/failure").FailureDefinition<"failure.unexpected_defect", undefined>];
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
export declare function keyset<const O extends KeysetOrder>(order: O): {
    readonly order: O;
    readonly keys: readonly (keyof O & string)[];
    readonly encode: (row: CursorValues<O>) => string | import("@arki/failure").Failure<"contracts.invalid_cursor_value", undefined> | import("@arki/failure").Failure<"failure.unexpected_defect", undefined> | import("@arki/failure").Failure<"schema.validator_defect", undefined>;
    readonly decode: (cursor: string) => CursorValues<O> | import("@arki/failure").Failure<"contracts.invalid_cursor", undefined> | import("@arki/failure").Failure<"failure.unexpected_defect", undefined> | import("@arki/failure").Failure<"schema.validator_defect", undefined>;
    readonly cursor: z.ZodString;
};
/** Limits for {@link pageInput}. */
export type PageInputOptions = {
    /** Page size when the client sends none. Default 20. */
    readonly defaultLimit?: number;
    /** The largest page a client may ask for. Default 100. */
    readonly maxLimit?: number;
};
/**
 * The input schema of a paged list: `{ cursor?, limit }`. No cursor means
 * the first page. Extend it with the list's own filters:
 * `pageInput(storyOrder).extend({ status: storyStatus })`.
 */
export declare function pageInput<O extends KeysetOrder>(order: Keyset<O>, options?: PageInputOptions): z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodInt>;
}, z.core.$strip>;
/**
 * The output schema of a paged list: the items and the cursor of the next
 * page, `null` on the last page — so "is there more?" is never a guess
 * from a full-looking page.
 */
export declare function page<T extends z.ZodType>(item: T): z.ZodObject<{
    items: z.ZodArray<T>;
    nextCursor: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/** One page of `T`, as {@link page} describes it. */
export type Page<T> = {
    readonly items: T[];
    readonly nextCursor: string | null;
};
export {};
//# sourceMappingURL=pagination.d.ts.map