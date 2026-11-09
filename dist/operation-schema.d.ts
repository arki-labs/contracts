/** Identity-preserving schema for an oRPC operation. Reached only by the `./orpc` adapter entry. */
import { z } from 'zod';
import type { AnyOperation } from './orpc.js';
/** The public Operation type is the source; its phantom field has no runtime data. */
export declare const operationSchema: z.ZodCustom<AnyOperation, AnyOperation>;
//# sourceMappingURL=operation-schema.d.ts.map