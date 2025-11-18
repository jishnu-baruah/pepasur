/**
 * Token Conversion Utilities for Solana
 * 
 * Solana: 1 SOL = 1,000,000,000 lamports (10^9)
 */

// Constants
const LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * Convert lamports to SOL
 * @param {number|string} lamports - Amount in lamports
 * @returns {number} Amount in SOL
 */
function lamportsToSol(lamports) {
    const amount = typeof lamports === 'string' ? parseInt(lamports) : lamports;
    return amount / LAMPORTS_PER_SOL;
}

/**
 * Convert SOL to lamports
 * @param {number} sol - Amount in SOL
 * @returns {number} Amount in lamports
 */
function solToLamports(sol) {
    return Math.floor(sol * LAMPORTS_PER_SOL);
}

/**
 * Format lamports as SOL string
 * @param {number|string} lamports - Amount in lamports
 * @param {number} decimals - Number of decimal places (default: 4)
 * @returns {string} Formatted string (e.g., "1.5000 SOL")
 */
function formatSolAmount(lamports, decimals = 4) {
    const sol = lamportsToSol(lamports);
    return `${sol.toFixed(decimals)} SOL`;
}

/**
 * Format lamports as SOL number string (no unit)
 * @param {number|string} lamports - Amount in lamports
 * @param {number} decimals - Number of decimal places (default: 4)
 * @returns {string} Formatted number string (e.g., "1.5000")
 */
function formatSolNumber(lamports, decimals = 4) {
    const sol = lamportsToSol(lamports);
    return sol.toFixed(decimals);
}

/**
 * Parse SOL amount string to lamports
 * @param {string} solString - SOL amount as string (e.g., "1.5")
 * @returns {number} Amount in lamports
 */
function parseSolToLamports(solString) {
    const sol = parseFloat(solString);
    if (isNaN(sol)) {
        throw new Error(`Invalid SOL amount: ${solString}`);
    }
    return solToLamports(sol);
}

/**
 * Validate lamports amount
 * @param {number|string} lamports - Amount to validate
 * @returns {boolean} True if valid
 */
function isValidLamportsAmount(lamports) {
    const amount = typeof lamports === 'string' ? parseInt(lamports) : lamports;
    return !isNaN(amount) && amount >= 0 && Number.isInteger(amount);
}

/**
 * Validate SOL amount
 * @param {number} sol - Amount to validate
 * @returns {boolean} True if valid
 */
function isValidSolAmount(sol) {
    return !isNaN(sol) && sol >= 0;
}

/**
 * Get minimum stake in lamports (e.g., 0.01 SOL)
 * @returns {number} Minimum stake in lamports
 */
function getMinimumStake() {
    return solToLamports(0.01); // 0.01 SOL = 10,000,000 lamports
}

/**
 * Calculate house fee
 * @param {number|string} totalPool - Total pool in lamports
 * @param {number} houseCutBps - House cut in basis points (e.g., 200 = 2%)
 * @returns {number} House fee in lamports
 */
function calculateHouseFee(totalPool, houseCutBps = 200) {
    const pool = typeof totalPool === 'string' ? parseInt(totalPool) : totalPool;
    return Math.floor((pool * houseCutBps) / 10000);
}

/**
 * Calculate remaining pool after house fee
 * @param {number|string} totalPool - Total pool in lamports
 * @param {number} houseCutBps - House cut in basis points (e.g., 200 = 2%)
 * @returns {number} Remaining pool in lamports
 */
function calculateRemainingPool(totalPool, houseCutBps = 200) {
    const pool = typeof totalPool === 'string' ? parseInt(totalPool) : totalPool;
    const houseFee = calculateHouseFee(pool, houseCutBps);
    return pool - houseFee;
}

module.exports = {
    // Constants
    LAMPORTS_PER_SOL,

    // Conversion functions
    lamportsToSol,
    solToLamports,

    // Formatting functions
    formatSolAmount,
    formatSolNumber,
    parseSolToLamports,

    // Validation functions
    isValidLamportsAmount,
    isValidSolAmount,

    // Utility functions
    getMinimumStake,
    calculateHouseFee,
    calculateRemainingPool,
};
