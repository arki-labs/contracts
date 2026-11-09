/** Identity-preserving schemas for native contracts, metadata and provider capabilities. */
import { z } from 'zod';
/** Native records may include arrays or class instances; inspecting never clones them. */
export declare const objectSchema: z.ZodCustom<object, object>;
/** Inspect callability without replacing a provider or losing its receiver. */
export declare const callableSchema: z.ZodCustom<(...args: never[]) => unknown, (...args: never[]) => unknown>;
/** Native Zod schema metadata retains the original schema and its transformations. */
export declare const nativeSchema: z.ZodInstanceOf<z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>;
/** Definition options and provider results are validated without coercion. */
export declare const idPrefixSchema: z.ZodString;
export declare const idKindSchema: z.ZodString;
export declare const uuidFormatSchema: z.ZodOptional<z.ZodLiteral<"uuid">>;
export declare const uuidV4Schema: z.ZodString;
/** Drizzle owns the dimension value; inspection retains its native number contract. */
export declare const dimensionsSchema: z.ZodCustom<number, number>;
//# sourceMappingURL=inspection.d.ts.map