import type { BuildRefine } from 'drizzle-orm/zod';
import type { z } from 'zod/v4';
import type { InferInsertModel, InferSelectModel, Table } from 'drizzle-orm';
export { bufferSchema, createSchemaFactory, jsonSchema, literalSchema, } from 'drizzle-orm/zod';
export * as formData from 'zod-form-data';
export * from 'zod/v4';
/**
 * Symbol used to tag a Drizzle column builder with its runtime validation
 * schema. Producers (like `@arki/db`'s ID factories) write to
 * `builder.config[COLUMN_ZOD_SCHEMA]` at column-construction time; this
 * package's `createSelectSchema`/`createInsertSchema`/`createUpdateSchema`
 * wrappers read it back and merge it into the refine map automatically.
 *
 * Using `Symbol.for(...)` keeps the symbol globally registered so any package
 * resolves to the same value, even with multiple module copies.
 */
export declare const COLUMN_ZOD_SCHEMA: unique symbol;
/**
 * Per-key Zod shape derived from a Drizzle table's inferred model.
 * Preserves branded `$type<>()` types and JSON shapes that drizzle-zod's
 * runtime extractor erases (it walks `dataType` strings, not the `_.data` phantom).
 *
 * Two subtleties make this mapping more involved than `[K in keyof T]: ZodType<T[K]>`:
 *
 *  1. The `-?` modifier strips the optional flag from source keys. If we left
 *     it, ZodObject would see `Shape['b']` as `ZodType<...> | undefined` and
 *     collapse the per-key inference to `unknown`.
 *  2. For source keys whose value type includes `undefined` (i.e. were optional),
 *     we wrap the ZodType in `ZodOptional` so Zod re-introduces optionality at
 *     parse time. We exclude `undefined` from the inner type so the parsed
 *     output is the actual value type.
 */
type StrongShape<TInferred> = {
    [K in keyof TInferred]-?: undefined extends TInferred[K] ? z.ZodOptional<z.ZodType<Exclude<TInferred[K], undefined>, Exclude<TInferred[K], undefined>>> : z.ZodType<TInferred[K], TInferred[K]>;
};
type StrongSchema<TInferred> = z.ZodObject<StrongShape<TInferred>, z.core.$strip>;
/**
 * Refine signature reused from drizzle-zod — accepts either a replacement
 * Zod schema or a callback that receives the auto-derived schema for that
 * column and returns a refined schema.
 */
type Refine<TTable extends Table> = BuildRefine<TTable['_']['columns'], Record<string, never>>;
/**
 * Build a select schema from a Drizzle table that preserves branded ID and
 * `jsonb('col').$type<Shape>()` typings AND auto-applies any runtime validation
 * schema producers stashed on the column via {@link COLUMN_ZOD_SCHEMA}.
 *
 * Runtime behavior matches drizzle-zod's `createSelectSchema` (including any
 * `refine` overrides) PLUS the auto-applied per-column schemas from `@arki/db`
 * ID factories — so `\`plan_\${string}\`` IDs are validated at parse time,
 * not just typed at compile time.
 *
 * The TypeScript output type is widened to the table's `InferSelectModel`
 * shape, so `z.infer<typeof schema>['id']` is `\`plan_\${string}\``, not `string`.
 *
 * @example
 * const planSelectSchema = createSelectSchema(plans);
 * planSelectSchema.parse({ id: 'wrong_prefix_xyz', ... }); // throws
 */
export declare function createSelectSchema<TTable extends Table>(table: TTable, refine?: Refine<TTable>): StrongSchema<InferSelectModel<TTable>>;
/**
 * Build an insert schema from a Drizzle table that preserves branded ID and
 * `jsonb('col').$type<Shape>()` typings AND auto-applies any runtime validation
 * schema producers stashed on the column via {@link COLUMN_ZOD_SCHEMA}.
 */
export declare function createInsertSchema<TTable extends Table>(table: TTable, refine?: Refine<TTable>): StrongSchema<InferInsertModel<TTable>>;
/**
 * Build an update schema from a Drizzle table — every column becomes optional
 * but otherwise preserves branded ID and `jsonb('col').$type<Shape>()` typings
 * AND auto-applies producer-stashed schemas.
 */
export declare function createUpdateSchema<TTable extends Table>(table: TTable, refine?: Refine<TTable>): StrongSchema<Partial<InferInsertModel<TTable>>>;
//# sourceMappingURL=schema.d.ts.map