/**
 * Solana and Pepasur program error handling utilities
 */

/**
 * Pepasur program error codes (6000-6011)
 * These correspond to the custom errors defined in the Solana program
 */
export const PEPASUR_ERROR_CODES = {
    GAME_NOT_FOUND: 6000,
    GAME_NOT_IN_LOBBY: 6001,
    INVALID_STAKE: 6002,
    ALREADY_SETTLED: 6003,
    NOT_AUTHORIZED: 6004,
    INVALID_SIGNATURE: 6005,
    GAME_NOT_IN_PROGRESS: 6006,
    NO_PENDING_WITHDRAWAL: 6007,
    GAME_ALREADY_STARTED: 6008,
    MIN_PLAYERS_NOT_MET: 6009,
    MAX_PLAYERS_REACHED: 6010,
    MATH_OVERFLOW: 6011,
} as const;

/**
 * User-friendly error messages for Pepasur program errors
 */
export const PEPASUR_ERROR_MESSAGES: Record<number, string> = {
    [PEPASUR_ERROR_CODES.GAME_NOT_FOUND]: 'Game not found. It may have been cancelled or does not exist.',
    [PEPASUR_ERROR_CODES.GAME_NOT_IN_LOBBY]: 'Game has already started. You cannot join at this time.',
    [PEPASUR_ERROR_CODES.INVALID_STAKE]: 'Invalid stake amount. Please enter a valid amount greater than zero.',
    [PEPASUR_ERROR_CODES.ALREADY_SETTLED]: 'This game has already been settled.',
    [PEPASUR_ERROR_CODES.NOT_AUTHORIZED]: 'You are not authorized to perform this action.',
    [PEPASUR_ERROR_CODES.INVALID_SIGNATURE]: 'Invalid server signature. Please contact support.',
    [PEPASUR_ERROR_CODES.GAME_NOT_IN_PROGRESS]: 'Game is not in progress. Cannot settle at this time.',
    [PEPASUR_ERROR_CODES.NO_PENDING_WITHDRAWAL]: 'You have no pending withdrawals.',
    [PEPASUR_ERROR_CODES.GAME_ALREADY_STARTED]: 'Game has already started.',
    [PEPASUR_ERROR_CODES.MIN_PLAYERS_NOT_MET]: 'Minimum number of players not met.',
    [PEPASUR_ERROR_CODES.MAX_PLAYERS_REACHED]: 'Maximum number of players reached. Game is full.',
    [PEPASUR_ERROR_CODES.MATH_OVERFLOW]: 'Calculation overflow error. Please contact support.',
};

/**
 * Common Solana error patterns and their user-friendly messages
 */
const SOLANA_ERROR_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
    {
        pattern: /insufficient funds/i,
        message: 'Insufficient SOL balance. Please add more SOL to your wallet.',
    },
    {
        pattern: /blockhash not found|transaction expired/i,
        message: 'Transaction expired. Please try again.',
    },
    {
        pattern: /account not found/i,
        message: 'Account not found. Please ensure you are connected to the correct network.',
    },
    {
        pattern: /invalid account owner/i,
        message: 'Invalid account. This may be a network configuration issue.',
    },
    {
        pattern: /account data size exceeded/i,
        message: 'Transaction too large. Please contact support.',
    },
    {
        pattern: /signature verification failed/i,
        message: 'Signature verification failed. Please try again.',
    },
    {
        pattern: /user rejected/i,
        message: 'Transaction was rejected in your wallet.',
    },
    {
        pattern: /wallet not connected/i,
        message: 'Please connect your wallet first.',
    },
    {
        pattern: /network request failed/i,
        message: 'Network error. Please check your connection and try again.',
    },
    {
        pattern: /timeout/i,
        message: 'Transaction timed out. Please try again.',
    },
];

/**
 * Get user-friendly error message for a Pepasur program error code
 * @param errorCode - The Pepasur error code (6000-6011)
 * @returns User-friendly error message
 */
export function getPepasurErrorMessage(errorCode: number): string {
    return PEPASUR_ERROR_MESSAGES[errorCode] || `Unknown program error (code: ${errorCode})`;
}

/**
 * Parse Anchor/Solana program error code from error message
 * @param errorMessage - The error message string
 * @returns Error code if found, null otherwise
 */
function parseAnchorErrorCode(errorMessage: string): number | null {
    // Try to match Anchor error format: "custom program error: 0x1770" (hex)
    const hexMatch = errorMessage.match(/custom program error:\s*0x([0-9a-f]+)/i);
    if (hexMatch) {
        return parseInt(hexMatch[1], 16);
    }

    // Try to match decimal format
    const decMatch = errorMessage.match(/custom program error:\s*(\d+)/i);
    if (decMatch) {
        return parseInt(decMatch[1], 10);
    }

    // Try to match error code in parentheses
    const codeMatch = errorMessage.match(/error code:\s*(\d+)/i);
    if (codeMatch) {
        return parseInt(codeMatch[1], 10);
    }

    return null;
}

/**
 * Handle Solana transaction errors and return user-friendly messages
 * @param error - The error object from a failed transaction
 * @returns User-friendly error message
 */
export function handleSolanaError(error: any): string {
    // Handle null/undefined
    if (!error) {
        return 'An unknown error occurred.';
    }

    // Get error message
    const errorMessage = error.message || error.toString();

    // Try to parse Pepasur program error code
    const errorCode = parseAnchorErrorCode(errorMessage);
    if (errorCode !== null && errorCode in PEPASUR_ERROR_MESSAGES) {
        return getPepasurErrorMessage(errorCode);
    }

    // Check for common Solana error patterns
    for (const { pattern, message } of SOLANA_ERROR_PATTERNS) {
        if (pattern.test(errorMessage)) {
            return message;
        }
    }

    // Check if error has logs with more details
    if (error.logs && Array.isArray(error.logs)) {
        const logString = error.logs.join(' ');
        const logErrorCode = parseAnchorErrorCode(logString);
        if (logErrorCode !== null && logErrorCode in PEPASUR_ERROR_MESSAGES) {
            return getPepasurErrorMessage(logErrorCode);
        }
    }

    // Return original error message if no pattern matches
    return errorMessage || 'Transaction failed. Please try again.';
}

/**
 * Check if an error is a user rejection
 * @param error - The error object
 * @returns true if the user rejected the transaction
 */
export function isUserRejection(error: any): boolean {
    if (!error) return false;
    const message = error.message || error.toString();
    return /user rejected|user denied|user cancelled/i.test(message);
}

/**
 * Check if an error is a network error
 * @param error - The error object
 * @returns true if it's a network-related error
 */
export function isNetworkError(error: any): boolean {
    if (!error) return false;
    const message = error.message || error.toString();
    return /network|timeout|connection|fetch failed/i.test(message);
}

/**
 * Format error for logging (includes full details)
 * @param error - The error object
 * @returns Formatted error string for logging
 */
export function formatErrorForLogging(error: any): string {
    if (!error) return 'Unknown error';

    const parts: string[] = [];

    if (error.message) {
        parts.push(`Message: ${error.message}`);
    }

    if (error.code) {
        parts.push(`Code: ${error.code}`);
    }

    if (error.logs && Array.isArray(error.logs)) {
        parts.push(`Logs: ${error.logs.join(', ')}`);
    }

    if (error.stack) {
        parts.push(`Stack: ${error.stack}`);
    }

    return parts.length > 0 ? parts.join(' | ') : error.toString();
}
