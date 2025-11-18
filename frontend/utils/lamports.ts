/**
 * Solana token conversion utilities
 * Handles conversions between SOL and lamports, and migration from Aptos octas
 */

/**
 * Number of lamports per SOL
 * 1 SOL = 1,000,000,000 lamports (10^9)
 */
export const LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * Number of octas per APT (for migration reference)
 * 1 APT = 100,000,000 octas (10^8)
 */
const OCTAS_PER_APT = 100_000_000;

/**
 * Convert lamports to SOL
 * @param lamports - Amount in lamports
 * @returns Amount in SOL
 */
export function lamportsToSol(lamports: number | bigint): number {
    const lamportsNum = typeof lamports === 'bigint' ? Number(lamports) : lamports;
    return lamportsNum / LAMPORTS_PER_SOL;
}

/**
 * Convert SOL to lamports
 * @param sol - Amount in SOL
 * @returns Amount in lamports
 */
export function solToLamports(sol: number): number {
    return Math.floor(sol * LAMPORTS_PER_SOL);
}

/**
 * Format SOL amount for display
 * @param lamports - Amount in lamports
 * @param decimals - Number of decimal places (default: 4)
 * @returns Formatted string with SOL suffix
 */
export function formatSol(lamports: number | bigint, decimals: number = 4): string {
    const sol = lamportsToSol(lamports);
    return `${sol.toFixed(decimals)} SOL`;
}

/**
 * Convert Aptos octas to Solana lamports for migration
 * Maintains proportional value: 1 APT ≈ 0.1 SOL
 * @param octas - Amount in Aptos octas
 * @returns Amount in Solana lamports
 */
export function octasToLamports(octas: number | bigint): number {
    const octasNum = typeof octas === 'bigint' ? Number(octas) : octas;
    // Convert octas to APT, then APT to SOL (10:1 ratio), then SOL to lamports
    // octas / 10^8 = APT
    // APT * 0.1 = SOL
    // SOL * 10^9 = lamports
    // Simplified: octas * 10 = lamports
    return Math.floor(octasNum * 10);
}

/**
 * Parse SOL amount from string input
 * @param solString - String representation of SOL amount
 * @returns Amount in lamports, or null if invalid
 */
export function parseSolInput(solString: string): number | null {
    const trimmed = solString.trim();
    if (!trimmed) return null;

    const sol = parseFloat(trimmed);
    if (isNaN(sol) || sol < 0) return null;

    return solToLamports(sol);
}

/**
 * Validate lamports amount
 * @param lamports - Amount to validate
 * @returns true if valid (positive integer)
 */
export function isValidLamports(lamports: number): boolean {
    return Number.isInteger(lamports) && lamports > 0;
}
