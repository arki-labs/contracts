import { z } from 'zod';
import type { FailureOf } from '@arki/failure';
/**
 * The id of a user: `usr_` followed by an id. Every package that refers to a user, whether or
 * not it owns the user table, uses this one type, so ids pass between packages without a
 * dependency between them.
 */
export type UserId = `usr_${string}`;
/** Validates a user id: a string that starts with `usr_`. */
export declare const userIdSchema: z.ZodCustom<`usr_${string}`, `usr_${string}`>;
/**
 * One prefixed id kind, declared once: `export const storyId = defineId('sty_')`.
 * The prefix is the single source. The type, the zod schema and the generator
 * all come from it, so nobody writes `sty_` twice.
 *
 * Browser-safe on purpose: no Drizzle here. `@arki/db/id`'s `idColumns(storyId)`
 * turns the same declaration into table columns on the server.
 */
export interface IdDeclaration<P extends string> extends ReturnType<typeof prefixedId<P>> {
}
/**
 * A prefixed id with a domain brand: `defineId('sty_', { kind: 'story' })`.
 *
 * Both declarations are interfaces over the implementation's return type: the shape stays written
 * once, and a dependent's `.d.ts` prints this name. A `ReturnType` alias prints the anonymous body,
 * with its Zod schema type, in every dependent (`TYPES_E001`). `ids.emitted.test.ts` guards that.
 */
export interface BrandedIdDeclaration<P extends string, Kind extends string> extends ReturnType<typeof brandedId<P, Kind>> {
}
/** Canonical failures returned by ID generation, including unexpected provider faults. */
export declare const ID_GENERATION_FAILURES: readonly [import("@arki/failure").FailureDefinition<"contracts.random_source_unavailable", undefined>, import("@arki/failure").FailureDefinition<"failure.unexpected_defect", undefined>];
/** The exact failure union derived from the canonical generation definitions. */
export type IdGenerationFailure = FailureOf<(typeof ID_GENERATION_FAILURES)[number]>;
/** The successful ID inferred from its canonical schema, including any domain brand. */
export type IdOf<D extends {
    readonly schema: z.ZodType;
}> = z.output<D['schema']>;
type SingleKind<Kind extends string, All = Kind> = Kind extends '' ? never : Kind extends unknown ? [All] extends [Kind] ? Kind : never : never;
declare const customIdFormatSchema: z.ZodReadonly<z.ZodObject<{
    alphabet: z.ZodString;
    length: z.ZodNumber;
}, z.core.$strict>>;
type IdFormat = 'uuid' | z.output<typeof customIdFormatSchema>;
/**
 * Declare a prefixed id. The prefix is kept exactly as given, so a table
 * that already stores `hlgt_…` ids keeps working: switching a feature to
 * `defineId('hlgt_')` changes no stored value.
 *
 * @example
 * ```ts
 * // features/story/model/ids.ts — browser-safe, the contract can import it
 * export const storyId = defineId('sty_');
 * export type StoryId = IdOf<typeof storyId>;   // `sty_${string}`
 *
 * storyId.schema.parse('sty_k3…');              // StoryId
 * storyId.create();                             // StoryId | IdGenerationFailure
 * ```
 */
export declare function defineId<const P extends string>(prefix: P): IdDeclaration<P>;
/**
 * Give same-format IDs distinct domain types without changing their stored values.
 * `format: 'uuid'` generates UUID v4; `{ alphabet, length }` uniformly samples
 * 1–256 characters from 2–256 distinct, non-surrogate UTF-16 characters.
 * The format is copied and frozen at definition time. Omitting it keeps the
 * default 24-character body. Schemas still validate only the stored prefix.
 */
export declare function defineId<const P extends string, const Kind extends string>(prefix: P, options: {
    readonly kind: Kind & (Record<never, never> extends Record<Kind, never> ? never : SingleKind<Kind>);
    readonly format?: IdFormat;
}): BrandedIdDeclaration<P, Kind>;
declare function prefixedId<const P extends string>(prefix: P): {
    /** The stored prefix, unchanged. */
    readonly prefix: P;
    /** Validates successful IDs; generation failures never enter the schema type. */
    readonly schema: z.ZodTemplateLiteral<`${P}${string}`>;
    /** A new prefixed ID, or a canonical failure when secure generation cannot finish. */
    readonly create: () => `${P}${string}` | IdGenerationFailure;
    /** Validates the canonical schema and narrows to its success-only domain type. */
    readonly is: (value: unknown) => value is `${P}${string}`;
};
declare function brandedId<const P extends string, const Kind extends string>(prefix: P, _kind: Kind, format?: IdFormat): {
    /** The stored prefix, unchanged. */
    readonly prefix: P;
    /** Validates successful IDs; generation failures never enter the schema type. */
    readonly schema: PropertyKey extends Kind ? z.ZodTemplateLiteral<[P] extends infer T ? T extends [P] ? T extends z.core.$ZodTemplateLiteralPart[] ? `${z.core.$PartsToTemplateLiteral<T>}${string}` : never : never : never> : z.core.$ZodBranded<z.ZodTemplateLiteral<[P] extends infer T ? T extends [P] ? T extends z.core.$ZodTemplateLiteralPart[] ? `${z.core.$PartsToTemplateLiteral<T>}${string}` : never : never : never>, Kind, "out">;
    /** A new prefixed ID, or a canonical failure when secure generation cannot finish. */
    readonly create: () => z.infer<PropertyKey extends Kind ? z.ZodTemplateLiteral<[P] extends infer T ? T extends [P] ? T extends z.core.$ZodTemplateLiteralPart[] ? `${z.core.$PartsToTemplateLiteral<T>}${string}` : never : never : never> : z.core.$ZodBranded<z.ZodTemplateLiteral<[P] extends infer T ? T extends [P] ? T extends z.core.$ZodTemplateLiteralPart[] ? `${z.core.$PartsToTemplateLiteral<T>}${string}` : never : never : never>, Kind, "out">> | IdGenerationFailure;
    /** Validates the canonical schema and narrows to its success-only domain type. */
    readonly is: (value: unknown) => value is z.infer<PropertyKey extends Kind ? z.ZodTemplateLiteral<[P] extends infer T ? T extends [P] ? T extends z.core.$ZodTemplateLiteralPart[] ? `${z.core.$PartsToTemplateLiteral<T>}${string}` : never : never : never> : z.core.$ZodBranded<z.ZodTemplateLiteral<[P] extends infer T ? T extends [P] ? T extends z.core.$ZodTemplateLiteralPart[] ? `${z.core.$PartsToTemplateLiteral<T>}${string}` : never : never : never>, Kind, "out">>;
};
/**
 * Generate the unprefixed body shared by modern declarations and legacy DB IDs.
 * This is an entropy primitive, not a domain identity declaration: use `defineId`
 * to associate a body with its schema and ID kind.
 *
 * The body is a cuid2 (`@paralleldrive/cuid2`): 24 characters, a letter
 * first, then letters and digits; a SHA3 of time, a counter, a host
 * fingerprint and random salt. Every random bit comes from Web Crypto's
 * `getRandomValues`, resolved per generation: an unusable provider answers
 * `RandomSourceUnavailable`, a provider that breaks the protocol answers
 * `UnexpectedDefect`, and no provider-owned value is ever iterated.
 *
 * A cuid2 costs about 100 µs on Bun and Node (the hash and the base-36
 * conversion), so it is for entity identities, not per-request ids;
 * `format: 'uuid'` stays at well under a microsecond.
 */
export declare function createIdBody(): string | IdGenerationFailure;
/** The prefixes that appear twice in a tuple of declarations (`never` when all differ). */
type DuplicatePrefixes<T extends readonly unknown[], Seen extends string = never> = T extends readonly [
    infer Head,
    ...infer Rest
] ? Head extends {
    readonly prefix: infer P extends string;
} ? [P] extends [Seen] ? P | DuplicatePrefixes<Rest, Seen> : DuplicatePrefixes<Rest, Seen | P> : DuplicatePrefixes<Rest, Seen> : never;
type UniquePrefixGuard<T extends readonly unknown[]> = [DuplicatePrefixes<T>] extends [never] ? unknown : {
    readonly 'IDS: two declarations share a prefix': DuplicatePrefixes<T>;
};
/**
 * Check that no two id kinds of one app can be mistaken for each other.
 * Call it once with every declaration of the app — usually in a test.
 *
 * - Two declarations with the same prefix are a compile error (when the
 *   prefixes are literal types) and throw at runtime.
 * - A prefix that starts another one (`'sub'` and `'sub_'`) also throws:
 *   `sub_abc` passes both schemas, so the ids are not really distinct.
 *
 * @example
 * ```ts
 * // apps/my-app/backend/src/ids.test.ts
 * it('every id prefix is unique', () => assertUniqueIdPrefixes(storyId, podId, sceneId));
 * ```
 */
export declare function assertUniqueIdPrefixes<const T extends readonly IdDeclaration<string>[]>(...ids: T & UniquePrefixGuard<T>): void;
export {};
//# sourceMappingURL=ids.d.ts.map