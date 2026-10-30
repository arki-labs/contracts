/**
 * Operations: one typed identity per contract procedure.
 *
 * An oRPC contract already knows every procedure's path, input, output,
 * errors and meta. `operations(contract)` turns that into plain data — a
 * tree of {@link Operation}s — so the client can carry the identity next to
 * its query utils and a policy written once on the contract (say,
 * `offlineSafe: true`) can be checked by the compiler where it is used.
 *
 * Plain objects, no Proxy. Safe to log, compare by `name`, and persist
 * (`path` and `name` only). The walk reads only path and meta, so a
 * `minifyContractRouter` output works the same as the full contract.
 */
import type { AnyContractRouter, ContractProcedure, ErrorFromErrorMap, InferSchemaInput, InferSchemaOutput, Meta } from '@orpc/contract';
/** One procedure's identity. The types ride along in a phantom field. */
export type Operation<TInput, TOutput, TError, TMeta extends Meta> = {
    /** `['posts', 'create']` */
    readonly path: readonly string[];
    /** `'posts.create'` — the same string the server stores as `procedure_path`. */
    readonly name: string;
    /** The contract's meta, value and type. */
    readonly meta: TMeta;
    /** Phantom. Never assigned; carries the types only. */
    readonly '~types'?: {
        readonly input: TInput;
        readonly output: TOutput;
        readonly error: TError;
    };
};
/** Any operation at all. */
export type AnyOperation = Operation<unknown, unknown, unknown, Meta>;
/** The operation of one contract procedure. Input is the client side of the schema; output the parsed side. */
export type OperationOf<C> = C extends ContractProcedure<infer I, infer O, infer E, infer M> ? Operation<InferSchemaInput<I>, InferSchemaOutput<O>, ErrorFromErrorMap<E>, M> : never;
/** The operation tree of a contract: the same keys, an {@link Operation} at every leaf. */
export type Operations<C> = C extends ContractProcedure<infer _I, infer _O, infer _E, infer _M> ? OperationOf<C> : {
    readonly [K in keyof C as K & string]: Operations<C[K]>;
};
export type InputOf<Op extends AnyOperation> = NonNullable<Op['~types']>['input'];
export type OutputOf<Op extends AnyOperation> = NonNullable<Op['~types']>['output'];
export type ErrorOf<Op extends AnyOperation> = NonNullable<Op['~types']>['error'];
export type MetaOf<Op extends AnyOperation> = Op['meta'];
/** Key under which a utils object carries its operation. `~` like oRPC's own `'~orpc'`. */
export declare const OPERATION = "~op";
/** A value that carries an operation under {@link OPERATION} — a utils leaf from `createOrpcUtils`. */
export type Identified<Op extends AnyOperation> = {
    readonly [OPERATION]: Op;
};
/**
 * Walk a contract once and return its operation tree. Throws `TypeError`,
 * naming the path, for a key that contains `.` or is reserved (`~op`, `key`,
 * `call`, `queryKey`, `queryOptions`, `infiniteKey`, `infiniteOptions`,
 * `mutationKey`, `mutationOptions`).
 */
export declare function operations<const C extends AnyContractRouter>(contract: C): Operations<C>;
/** The operation at a path, or `undefined`. For replay loops and tools. */
export declare function operationAt(contract: AnyContractRouter, path: readonly string[]): AnyOperation | undefined;
/**
 * Read the operation a value carries. Throws `TypeError` for a value that
 * has none — a raw oRPC client or utils leaf, or a forged object — so plain
 * JavaScript callers get the same check the compiler gives TypeScript ones.
 */
export declare function operationOf<Op extends AnyOperation>(carrier: Identified<Op>): Op;
//# sourceMappingURL=orpc.d.ts.map