import { getContractRouter, isContractProcedure } from '@orpc/contract';
import { is } from '@arki/schema';
import { CONTRACTS_ERROR_CODES, ContractsError } from './errors.js';
import { objectSchema } from './inspection.js';
import { operationSchema } from './operation-schema.js';
/** Key under which a utils object carries its operation. `~` like oRPC's own `'~orpc'`. */
export const OPERATION = '~op';
/**
 * Keys a contract may not use. A group's utils object holds its children
 * next to the query-utils methods, so a child named `key` (or any of these)
 * would be silently shadowed. oRPC's own proxy has the same collision; we
 * fail loud instead.
 */
const RESERVED_KEYS = new Set([
    OPERATION,
    'key',
    'call',
    'queryKey',
    'queryOptions',
    'infiniteKey',
    'infiniteOptions',
    'mutationKey',
    'mutationOptions',
]);
function operationFor(procedure, path) {
    return Object.freeze({ path: Object.freeze([...path]), name: path.join('.'), meta: procedure['~orpc'].meta });
}
function checkKey(key, path) {
    const where = [...path, key].join(' > ');
    if (key.includes('.')) {
        throw new ContractsError(CONTRACTS_ERROR_CODES.invalidContractKey, `Contract key "${key}" at ${where} contains ".": operation names join the path with ".", so it would be ambiguous.`);
    }
    if (RESERVED_KEYS.has(key)) {
        throw new ContractsError(CONTRACTS_ERROR_CODES.invalidContractKey, `Contract key "${key}" at ${where} is reserved: the query utils use that name on every group.`);
    }
}
function walk(node, path) {
    if (isContractProcedure(node))
        return operationFor(node, path);
    return Object.freeze(Object.fromEntries(Object.entries(node).map(([key, child]) => {
        checkKey(key, path);
        return [key, walk(child, [...path, key])];
    })));
}
// Erasure seam: TypeScript cannot check a recursive walk against the recursive
// mapped type `Operations<C>`, so the implementation returns `unknown` and the
// overload above states the result. The type tests in `orpc.test-d.ts` pin it.
export function operations(contract) {
    return walk(contract, []);
}
/** The operation at a path, or `undefined`. For replay loops and tools. */
export function operationAt(contract, path) {
    const node = getContractRouter(contract, path);
    return isContractProcedure(node) ? operationFor(node, path) : undefined;
}
export function operationOf(carrier) {
    const op = is(carrier, objectSchema) ? Reflect.get(carrier, OPERATION) : undefined;
    if (!is(op, operationSchema)) {
        throw new ContractsError(CONTRACTS_ERROR_CODES.notAnOperation, `Expected a value that carries an operation under "${OPERATION}" (a leaf of createOrpcUtils); got one without it.`);
    }
    return op;
}
//# sourceMappingURL=orpc.js.map