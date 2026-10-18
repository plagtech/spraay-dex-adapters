export type SpraayErrorCode =
  | 'NO_RECIPIENTS'
  | 'TOO_MANY_RECIPIENTS'
  | 'LENGTH_MISMATCH'
  | 'INVALID_ADDRESS'
  | 'INVALID_AMOUNT'
  | 'INVALID_TOKEN'
  | 'UNSUPPORTED_CHAIN'
  | 'CHAIN_MISMATCH'
  | 'MISSING_ACCOUNT'
  | 'INSUFFICIENT_ALLOWANCE'
  | 'TRANSACTION_REVERTED'
  | 'NOT_OPERATOR'
  | 'POOL_NOT_REGISTERED'
  | 'NOT_IMPLEMENTED'
  | 'HOOK_ADDRESS_NOT_FOUND'

/** Every error thrown by the SDK itself (not by viem or the RPC) is a `SpraayError`. */
export class SpraayError extends Error {
  override name = 'SpraayError'
  readonly code: SpraayErrorCode

  constructor(code: SpraayErrorCode, message: string) {
    super(message)
    this.code = code
  }
}
