import { z } from 'zod/v4';
/** Validates a user id: a string that starts with `usr_`. */
export const userIdSchema = z.custom(value => typeof value === 'string' && value.startsWith('usr_'), {
    message: 'Expected a user id: a string starting with "usr_"',
});
//# sourceMappingURL=ids.js.map