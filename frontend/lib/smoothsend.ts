/**
 * SmoothSend API Client
 * Handles all communication with the SmoothSend gasless transaction service
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface SmoothSendConfig {
  apiUrl: string
  apiKey: string
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface EstimateFeeRequest {
  sender: string
  recipient: string
  amount: string
  assetType: string
  network: 'testnet' | 'mainnet'
  decimals: number
  symbol: string
}

export interface EstimateFeeResponse {
  feeInUsd: number
  estimatedGas: number
  network: string
}

export interface GaslessTransactionRequest {
  sender: string
  recipient: string
  amount: string
  assetType: string
  network: 'testnet' | 'mainnet'
  decimals: number
  symbol: string
}

export interface GaslessTransactionResponse {
  success: boolean
  message?: string
  transactionBytes?: number[]
  hash?: string
  txnHash?: string // Legacy mode returns txnHash
  gasUsed?: string
  vmStatus?: string
  sender?: string
  fee?: string
  totalAmount?: string
  feeBreakdown?: any
  transaction?: {
    sender: string
    recipient: string
    amount: string
    assetType: string
    network: string
  }
}

// ============================================================================
// Error Types
// ============================================================================

export class SmoothSendError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public apiResponse?: any
  ) {
    super(message)
    this.name = 'SmoothSendError'
  }
}

// ============================================================================
// API Client
// ============================================================================

export class SmoothSendClient {
  private config: SmoothSendConfig

  constructor(config: SmoothSendConfig) {
    this.config = config

    // Debug log initialization in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[SmoothSend] Client initialized:', {
        apiUrl: config.apiUrl,
        apiKeyProvided: !!config.apiKey,
        apiKeyLength: config.apiKey?.length || 0,
        apiKeyPreview: config.apiKey ? `${config.apiKey.substring(0, 10)}...` : 'MISSING'
      })
    }
  }

  /**
   * Estimate the fee for a gasless transaction
   */
  async estimateFee(params: EstimateFeeRequest): Promise<EstimateFeeResponse> {
    return this.request<EstimateFeeResponse>('/estimate-fee', params)
  }

  /**
   * Submit a gasless transaction (Step 1: Get transaction bytes for signing)
   */
  async sendGaslessTransaction(
    params: GaslessTransactionRequest
  ): Promise<GaslessTransactionResponse> {
    return this.request<GaslessTransactionResponse>('/gasless-transaction', params)
  }

  /**
   * Submit signed transaction (Step 2: Submit with signature)
   */
  async submitSignedTransaction(
    transactionBytes: number[],
    authenticatorBytes: number[]
  ): Promise<GaslessTransactionResponse> {
    return this.request<GaslessTransactionResponse>('/gasless-transaction', {
      transactionBytes,
      authenticatorBytes
    })
  }

  /**
   * Private method to make HTTP requests with proper headers
   */
  private async request<T>(endpoint: string, body: any): Promise<T> {
    const url = `${this.config.apiUrl}${endpoint}`

    // Log request in development mode
    const isDevelopment = process.env.NODE_ENV === 'development'
    if (isDevelopment) {
      console.log('[SmoothSend API] Request:', {
        url,
        method: 'POST',
        apiKey: this.config.apiKey ? `${this.config.apiKey.substring(0, 10)}...` : 'MISSING',
        apiKeyLength: this.config.apiKey?.length || 0,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey ? 'PROVIDED' : 'MISSING'
        },
        body
      })
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey
        },
        body: JSON.stringify(body)
      })

      // Parse response body
      const data = await response.json()

      // Log response in development mode
      if (isDevelopment) {
        console.log('[SmoothSend API] Response:', {
          status: response.status,
          data
        })
      }

      // Handle non-2xx responses
      if (!response.ok) {
        throw new SmoothSendError(
          data.message || data.error || `HTTP ${response.status}`,
          response.status,
          data
        )
      }

      return data as T
    } catch (error) {
      // Log errors in development mode with stack traces
      if (isDevelopment) {
        console.error('[SmoothSend API] Error:', {
          endpoint,
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
          } : error
        })
      }

      // Re-throw SmoothSendError as-is
      if (error instanceof SmoothSendError) {
        throw error
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new SmoothSendError('Network error. Please check your connection.')
      }

      // Handle other errors
      throw new SmoothSendError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      )
    }
  }
}

// ============================================================================
// Error Handler Utility
// ============================================================================

/**
 * Convert API errors into user-friendly messages
 */
export function handleAPIError(error: unknown): string {
  if (error instanceof SmoothSendError) {
    switch (error.statusCode) {
      case 401:
        return 'Authentication failed. Invalid API key.'
      case 429:
        return 'Rate limit exceeded. Please try again later.'
      case 400:
        if (error.apiResponse?.message) {
          return error.apiResponse.message
        }
        return 'Invalid request. Please check your input.'
      case 500:
        return 'Server error. Please try again later.'
      default:
        return error.message || 'An unexpected error occurred.'
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('fetch') || error.message.includes('Network')) {
      return 'Network error. Please check your connection.'
    }
    return error.message
  }

  return 'An unexpected error occurred.'
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Singleton instance of the SmoothSend API client
 * Uses configuration from environment variables
 */
export const smoothSendClient = new SmoothSendClient({
  apiUrl: process.env.NEXT_PUBLIC_SMOOTHSEND_API_URL || 'https://proxy.smoothsend.xyz/api/v1/relayer',
  apiKey: process.env.NEXT_PUBLIC_SMOOTHSEND_API_KEY || 'pk_nogas_UGZwmvgv3EoHLAbK0mcMg1DcswPPJn1A'
})
