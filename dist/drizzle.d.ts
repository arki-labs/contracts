/** Runtime-backed select, insert and update schemas built from a Drizzle table. */
import type { Column, ColumnIsGeneratedAlwaysAs, Table } from 'drizzle-orm';
import type { GetZodType, jsonSchema as nativeJsonSchema } from 'drizzle-orm/zod';
import { z } from 'zod';
export { bufferSchema, createSchemaFactory, jsonSchema, literalSchema } from 'drizzle-orm/zod';
/** Runtime-only column metadata shared with ID factories, including duplicate module copies. */
export declare const COLUMN_ZOD_SCHEMA: unique symbol;
/**
 * Declare a JSONB column from its runtime schema. The application type is the
 * schema output. Reuse that schema in an explicit refinement for precise
 * validator input/output inference: `{ profile: () => profileSchema }`.
 * Output must be recursively JSON-compatible and accepted as schema input.
 * Parsing stored output must preserve its value; types cannot prove stability.
 * Use a separate wire codec in refinements. Non-finite JSON output is rejected.
 * This does not install a database driver codec or run transforms on queries.
 */
export declare function jsonColumn<TSchema extends z.ZodType>(name: string, schema: JsonStorableSchema<TSchema>): import("drizzle-orm/pg-core").Set$Type<import("drizzle-orm/pg-core").PgJsonbBuilder, z.output<TSchema>>;
/**
 * The schemas a JSON column accepts: output that is JSON, and that the
 * schema takes back as input. `jsonColumn` and `@arki/db`'s column kit
 * (`c.json(name, schema)`) both require it.
 */
export type JsonStorableSchema<TSchema extends z.ZodType> = TSchema & ([z.output<TSchema>] extends [z.core.util.JSONType] ? [z.output<TSchema>] extends [z.input<TSchema>] ? unknown : never : never);
/** The schema stamped on a JSON column: the column's schema, refusing output that is not JSON (such as `NaN`). */
export declare function jsonStorageSchema(schema: z.ZodType): z.ZodType;
type JsonColumnSchema<TDriver> = unknown extends TDriver ? typeof nativeJsonSchema : [Exclude<TDriver, string>] extends [never] ? typeof nativeJsonSchema : Exclude<TDriver, string> extends (infer TElement)[] ? z.ZodArray<JsonColumnSchema<TElement>> : typeof nativeJsonSchema;
type ColumnSchema<TColumn extends Column> = TColumn['_']['dataType'] extends 'object json' ? JsonColumnSchema<TColumn['_']['driverParam']> : GetZodType<TColumn, Record<string, never>>;
type Refine<TTable extends Table> = {
    [K in keyof TTable['_']['columns']]?: z.ZodType | ((schema: ColumnSchema<TTable['_']['columns'][K]>) => z.ZodType);
};
type Mode = 'select' | 'insert' | 'update';
type Nullable<TColumn extends Column, TSchema extends z.ZodType> = TColumn['_']['notNull'] extends true ? TSchema : z.ZodNullable<TSchema>;
type Wrapped<TMode extends Mode, TColumn extends Column, TSchema extends z.ZodType> = TMode extends 'select' ? Nullable<TColumn, TSchema> : TMode extends 'update' ? z.ZodOptional<Nullable<TColumn, TSchema>> : TColumn['_']['notNull'] extends true ? TColumn['_']['hasDefault'] extends true ? z.ZodOptional<TSchema> : TSchema : z.ZodOptional<z.ZodNullable<TSchema>>;
type Field<TMode extends Mode, TColumn extends Column, TRefine> = TRefine extends z.ZodType ? TRefine : TRefine extends (schema: ColumnSchema<TColumn>) => z.ZodType ? Wrapped<TMode, TColumn, ReturnType<TRefine>> : Wrapped<TMode, TColumn, ColumnSchema<TColumn>>;
type TableSchema<TMode extends Mode, TTable extends Table, TRefine> = z.ZodObject<{
    [K in keyof TTable['_']['columns'] as TMode extends 'select' ? K : K extends keyof TRefine ? TRefine[K] extends z.ZodType ? K : ColumnIsGeneratedAlwaysAs<TTable['_']['columns'][K]> extends true ? never : K : ColumnIsGeneratedAlwaysAs<TTable['_']['columns'][K]> extends true ? never : K]: Field<TMode, TTable['_']['columns'][K], K extends keyof TRefine ? TRefine[K] : undefined>;
}>;
/** Build a select validator; only explicit runtime schemas promise refined output types. */
export declare function createSelectSchema<TTable extends Table>(table: TTable, refine?: undefined): TableSchema<'select', TTable, Record<never, never>>;
export declare function createSelectSchema<TTable extends Table, TRefine extends Refine<TTable>>(table: TTable, refine: TRefine & Record<Exclude<keyof TRefine, keyof TTable['_']['columns']>, never>): TableSchema<'select', TTable, TRefine>;
export declare function createSelectSchema<TTable extends Table, TRefine extends Refine<TTable>>(table: TTable, refine: (TRefine & Record<Exclude<keyof TRefine, keyof TTable['_']['columns']>, never>) | undefined): TableSchema<'select', TTable, TRefine> | TableSchema<'select', TTable, Record<never, never>>;
/** Build an insert validator, preserving defaults and callback schema input/output. */
export declare function createInsertSchema<TTable extends Table>(table: TTable, refine?: undefined): TableSchema<'insert', TTable, Record<never, never>>;
export declare function createInsertSchema<TTable extends Table, TRefine extends Refine<TTable>>(table: TTable, refine: TRefine & Record<Exclude<keyof TRefine, keyof TTable['_']['columns']>, never>): TableSchema<'insert', TTable, TRefine>;
export declare function createInsertSchema<TTable extends Table, TRefine extends Refine<TTable>>(table: TTable, refine: (TRefine & Record<Exclude<keyof TRefine, keyof TTable['_']['columns']>, never>) | undefined): TableSchema<'insert', TTable, TRefine> | TableSchema<'insert', TTable, Record<never, never>>;
/** Build an update validator; callback-refined columns retain nullability and become optional. */
export declare function createUpdateSchema<TTable extends Table>(table: TTable, refine?: undefined): TableSchema<'update', TTable, Record<never, never>>;
export declare function createUpdateSchema<TTable extends Table, TRefine extends Refine<TTable>>(table: TTable, refine: TRefine & Record<Exclude<keyof TRefine, keyof TTable['_']['columns']>, never>): TableSchema<'update', TTable, TRefine>;
export declare function createUpdateSchema<TTable extends Table, TRefine extends Refine<TTable>>(table: TTable, refine: (TRefine & Record<Exclude<keyof TRefine, keyof TTable['_']['columns']>, never>) | undefined): TableSchema<'update', TTable, TRefine> | TableSchema<'update', TTable, Record<never, never>>;
//# sourceMappingURL=drizzle.d.ts.map