import { z } from 'zod/v4';
/**
 * The id of a user: `usr_` followed by an id. Every package that refers to a user, whether or
 * not it owns the user table, uses this one type, so ids pass between packages without a
 * dependency between them.
 */
export type UserId = `usr_${string}`;
/** Validates a user id: a string that starts with `usr_`. */
export declare const userIdSchema: z.ZodCustom<`usr_${string}`, `usr_${string}`>;
//# sourceMappingURL=ids.d.ts.map