import { getColumns } from 'drizzle-orm';
import { createInsertSchema as drizzleCreateInsertSchema, createSelectSchema as drizzleCreateSelectSchema, createUpdateSchema as drizzleCreateUpdateSchema, } from 'drizzle-orm/zod';
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
export const COLUMN_ZOD_SCHEMA = Symbol.for('@arki/contracts/columnZodSchema');
function readColumnSchema(column) {
    const cfg = column?.config;
    const schema = cfg?.[COLUMN_ZOD_SCHEMA];
    return schema && typeof schema === 'object' && '_zod' in schema
        ? schema
        : undefined;
}
/**
 * Walk every column on `table`, look up the optional Zod schema each producer
 * stashed via `COLUMN_ZOD_SCHEMA`, and merge it into the user-provided refine.
 *
 * The schema is registered as a CALLBACK refinement (`(_) => schema`) so that
 * drizzle-zod's `HandleRefinement` correctly wraps `ZodNullable` around it for
 * nullable columns. A bare-schema refinement bypasses the nullability wrap and
 * would refuse `null` at runtime for nullable foreign keys.
 *
 * User-provided refines win over auto-derived ones, so explicit overrides on a
 * specific column always take priority.
 */
function autoRefine(table, userRefine) {
    const columns = getColumns(table);
    const refine = { ...(userRefine ?? {}) };
    for (const [key, column] of Object.entries(columns)) {
        if (key in refine)
            continue;
        const schema = readColumnSchema(column);
        if (schema) {
            refine[key] = (() => schema);
        }
    }
    return refine;
}
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
export function createSelectSchema(table, refine) {
    return drizzleCreateSelectSchema(table, autoRefine(table, refine));
}
/**
 * Build an insert schema from a Drizzle table that preserves branded ID and
 * `jsonb('col').$type<Shape>()` typings AND auto-applies any runtime validation
 * schema producers stashed on the column via {@link COLUMN_ZOD_SCHEMA}.
 */
export function createInsertSchema(table, refine) {
    return drizzleCreateInsertSchema(table, autoRefine(table, refine));
}
/**
 * Build an update schema from a Drizzle table — every column becomes optional
 * but otherwise preserves branded ID and `jsonb('col').$type<Shape>()` typings
 * AND auto-applies producer-stashed schemas.
 */
export function createUpdateSchema(table, refine) {
    return drizzleCreateUpdateSchema(table, autoRefine(table, refine));
}
//# sourceMappingURL=schema.js.map