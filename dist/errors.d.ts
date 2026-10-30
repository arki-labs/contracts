/**
 * Static definition misuse raises {@link ContractsError} with a stable code.
 * Cursor and ID generation operations return canonical failures. Match on code. A `ContractsError` is a
 * `TypeError`, so `instanceof TypeError` checks written before the codes still hold.
 */
/** Stable error codes of `@arki/contracts`. */
export declare const CONTRACTS_ERROR_CODES: {
    /**
     * `defineId` got a non-string prefix.
     *
     * @fix Supply the exact stored prefix as a string; use `''` for unprefixed IDs.
     * @verify bun run test -- src/ids.test.ts
     */
    readonly invalidIdPrefix: 'ARKI_CONTRACTS_E001';
    /**
     * `assertUniqueIdPrefixes` found two prefixes that are equal or start one another.
     *
     * @fix Give each id kind a prefix that does not start another one.
     * @verify bun run test -- src/ids.test.ts
     */
    readonly overlappingIdPrefixes: 'ARKI_CONTRACTS_E002';
    /**
     * Reserved legacy exception code; ID generation now returns RandomSourceUnavailable.
     *
     * @fix Provide Web Crypto getRandomValues; application-owned secure providers must fail closed in every supported mode.
     * @verify bun run test:runtimes
     */
    readonly noRandomSource: 'ARKI_CONTRACTS_E003';
    /**
     * `keyset` got no keys.
     *
     * @fix Declare at least one key. Order by NOT NULL columns and end on a unique one.
     * @verify bun run test -- src/pagination.test.ts
     */
    readonly invalidKeyset: 'ARKI_CONTRACTS_E004';
    /**
     * Reserved legacy exception code; cursor decoding now returns InvalidCursor.
     *
     * @fix Send back a cursor exactly as the same keyset returned it, or start from the first page.
     * @verify bun run test -- src/pagination.test.ts
     */
    readonly invalidCursor: 'ARKI_CONTRACTS_E005';
    /**
     * A contract key contains `.` or uses a reserved name.
     *
     * @fix Rename the contract key: no `.`, and not a name the query utils reserve.
     * @verify bun run test -- src/orpc.test.ts
     */
    readonly invalidContractKey: 'ARKI_CONTRACTS_E006';
    /**
     * `operationOf` got a value that carries no operation.
     *
     * @fix Pass a leaf of `createOrpcUtils`, or an object built by `operations()`.
     * @verify bun run test -- src/orpc.test.ts
     */
    readonly notAnOperation: 'ARKI_CONTRACTS_E007';
    /**
     * The Drizzle column builder has no runtime config for its schema metadata.
     *
     * @fix Use a supported Drizzle column builder and matching Drizzle version.
     * @verify bun run test -- src/drizzle.test.ts
     */
    readonly invalidColumnMetadata: 'ARKI_CONTRACTS_E008';
    /**
     * `defineId` received a missing, empty or non-string domain kind.
     *
     * @fix Supply a non-empty literal domain name, such as `billing.refund`.
     * @verify bun run test -- src/ids.test.ts
     */
    readonly invalidIdKind: 'ARKI_CONTRACTS_E009';
    /**
     * `defineId` received an unsupported generation format.
     *
     * @fix Use 'uuid', omit format, or supply 2–256 distinct non-surrogate UTF-16 alphabet characters and an integer length of 1–256.
     * @verify bun run test -- src/ids.test.ts
     */
    readonly invalidIdFormat: 'ARKI_CONTRACTS_E010';
};
/** The code of a {@link ContractsError}. */
export type ContractsErrorCode = (typeof CONTRACTS_ERROR_CODES)[keyof typeof CONTRACTS_ERROR_CODES];
/** A coded failure of an `@arki/contracts` function. */
export declare class ContractsError extends TypeError {
    readonly code: ContractsErrorCode;
    /** What to do about it, in one sentence. */
    readonly remediation: string;
    constructor(code: ContractsErrorCode, message: string, options?: ErrorOptions);
}
/** A cursor cannot be decoded for this keyset.
 * @fix Send back the cursor unchanged, or start from the first page.
 * @verify bun run test -- src/pagination.test.ts
 */
export declare const InvalidCursor: import("@arki/failure").FailureDefinition<"contracts.invalid_cursor", undefined>;
/** A row has a missing or unrepresentable cursor key.
 * @fix Use non-null strings, finite numbers, booleans or valid Dates and keep the cursor within 1024 characters.
 * @verify bun run test -- src/pagination.test.ts
 */
export declare const InvalidCursorValue: import("@arki/failure").FailureDefinition<"contracts.invalid_cursor_value", undefined>;
/** Secure ID generation has no usable Web Crypto provider.
 * @fix Provide Web Crypto getRandomValues, or randomUUID for UUID declarations; application-owned secure providers must fail closed in every supported mode.
 * @verify bun run test -- src/ids.test.ts
 */
export declare const RandomSourceUnavailable: import("@arki/failure").FailureDefinition<"contracts.random_source_unavailable", undefined>;
//# sourceMappingURL=errors.d.ts.map