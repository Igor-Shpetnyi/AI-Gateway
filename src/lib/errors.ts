export type GatewayErrorCode =
  | 'UNAUTHORIZED'
  | 'QUOTA_EXCEEDED'
  | 'MODEL_UNAVAILABLE'
  | 'MODEL_NOT_ALLOWED'
  | 'ALL_PROVIDERS_DOWN'
  | 'RATE_LIMITED'

export class GatewayError extends Error {
  constructor(
    public readonly code: GatewayErrorCode,
    message: string,
    public readonly statusCode: number
  ) {
    super(message)
    this.name = 'GatewayError'
  }
}
