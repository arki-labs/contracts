import { getColumns } from 'drizzle-orm';
import { jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema as drizzleInsert, createSelectSchema as drizzleSelect, createUpdateSchema as drizzleUpdate, } from 'drizzle-orm/zod';
import { z } from 'zod';
import { is } from '@arki/schema';
import { CONTRACTS_ERROR_CODES, ContractsError } from './errors.js';
import { dimensionsSchema, nativeSchema, objectSchema } from './inspection.js';
export { bufferSchema, createSchemaFactory, jsonSchema, literalSchema } from 'drizzle-orm/zod';
/** Runtime-only column metadata shared with ID factories, including duplicate module copies. */
export const COLUMN_ZOD_SCHEMA = Symbol.for('@arki/contracts/columnZodSchema');
const jsonValueSchema = z.json();
/**
 * Declare a JSONB column from its runtime schema. The application type is the
 * schema output. Reuse that schema in an explicit refinement for precise
 * validator input/output inference: `{ profile: () => profileSchema }`.
 * Output must be recursively JSON-compatible and accepted as schema input.
 * Parsing stored output must preserve its value; types cannot prove stability.
 * Use a separate wire codec in refinements. Non-finite JSON output is rejected.
 * This does not install a database driver codec or run transforms on queries.
 */
export function jsonColumn(name, schema) {
    const builder = jsonb(name).$type();
    const config = Reflect.get(builder, 'config');
    if (!is(config, objectSchema)) {
        throw new ContractsError(CONTRACTS_ERROR_CODES.invalidColumnMetadata, 'The Drizzle builder has no column config.');
    }
    Object.assign(config, { [COLUMN_ZOD_SCHEMA]: jsonStorageSchema(schema) });
    return builder;
}
/** The schema stamped on a JSON column: the column's schema, refusing output that is not JSON (such as `NaN`). */
export function jsonStorageSchema(schema) {
    return schema.refine(value => jsonValueSchema.safeParse(value).success, 'Expected JSON storage output');
}
function readColumnSchema(column) {
    const config = Reflect.get(column, 'config');
    if (!is(config, objectSchema))
        return;
    const schema = Reflect.get(config, COLUMN_ZOD_SCHEMA);
    return is(schema, nativeSchema) ? schema : undefined;
}
function autoRefine(table, userRefine) {
    const refine = { ...userRefine };
    for (const [key, column] of Object.entries(getColumns(table))) {
        if (key in refine)
            continue;
        const schema = readColumnSchema(column);
        if (schema) {
            const dimensions = Reflect.get(column, 'dimensions');
            let storedSchema = schema;
            if (is(dimensions, dimensionsSchema)) {
                for (let dimension = 0; dimension < dimensions; dimension += 1)
                    storedSchema = z.array(storedSchema);
            }
            refine[key] = () => storedSchema;
        }
    }
    return refine;
}
export function createSelectSchema(table, refine) {
    return drizzleSelect(table, autoRefine(table, refine));
}
export function createInsertSchema(table, refine) {
    return drizzleInsert(table, autoRefine(table, refine));
}
export function createUpdateSchema(table, refine) {
    return drizzleUpdate(table, autoRefine(table, refine));
}
//# sourceMappingURL=drizzle.js.map