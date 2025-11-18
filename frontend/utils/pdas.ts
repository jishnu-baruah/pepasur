/**
 * Program Derived Address (PDA) utilities for Pepasur Solana program
 * PDAs are deterministic addresses derived from seeds that allow the program to sign transactions
 */

import { PublicKey } from '@solana/web3.js';

/**
 * PDA seeds used by the Pepasur program
 */
const SEEDS = {
    CONFIG: 'config',
    GAME_STORE: 'game_store',
    GAME: 'game',
    PENDING_WITHDRAWAL: 'pending_withdrawal',
    VAULT: 'vault',
} as const;

/**
 * Cache for derived PDAs to improve performance
 * Key format: "seed:value:programId"
 */
const pdaCache = new Map<string, { address: PublicKey; bump: number }>();

/**
 * Generate cache key for PDA
 */
function getCacheKey(seed: string, value: string, programId: string): string {
    return `${seed}:${value}:${programId}`;
}

/**
 * Derive a PDA with caching
 * @param seeds - Array of seeds (strings or Buffers)
 * @param programId - The program ID
 * @param cacheKey - Optional cache key for storing result
 * @returns Object containing the PDA address and bump seed
 */
async function derivePdaWithCache(
    seeds: (string | Buffer | Uint8Array)[],
    programId: PublicKey,
    cacheKey?: string
): Promise<{ address: PublicKey; bump: number }> {
    // Check cache if key provided
    if (cacheKey && pdaCache.has(cacheKey)) {
        return pdaCache.get(cacheKey)!;
    }

    // Convert all seeds to Buffer
    const seedBuffers = seeds.map((seed) => {
        if (typeof seed === 'string') {
            return Buffer.from(seed);
        }
        return Buffer.from(seed);
    });

    // Derive PDA
    const [address, bump] = await PublicKey.findProgramAddress(seedBuffers, programId);

    const result = { address, bump };

    // Cache result if key provided
    if (cacheKey) {
        pdaCache.set(cacheKey, result);
    }

    return result;
}

/**
 * Derive the Config PDA
 * Seed: ["config"]
 * @param programId - The Pepasur program ID
 * @returns Object containing the Config PDA address and bump seed
 */
export async function deriveConfigPda(
    programId: PublicKey
): Promise<{ address: PublicKey; bump: number }> {
    const cacheKey = getCacheKey(SEEDS.CONFIG, '', programId.toBase58());
    return derivePdaWithCache([SEEDS.CONFIG], programId, cacheKey);
}

/**
 * Derive the GameStore PDA
 * Seed: ["game_store"]
 * @param programId - The Pepasur program ID
 * @returns Object containing the GameStore PDA address and bump seed
 */
export async function deriveGameStorePda(
    programId: PublicKey
): Promise<{ address: PublicKey; bump: number }> {
    const cacheKey = getCacheKey(SEEDS.GAME_STORE, '', programId.toBase58());
    return derivePdaWithCache([SEEDS.GAME_STORE], programId, cacheKey);
}

/**
 * Derive a Game PDA from game ID
 * Seed: ["game", game_id (as 8-byte little-endian)]
 * @param gameId - The game ID (u64)
 * @param programId - The Pepasur program ID
 * @returns Object containing the Game PDA address and bump seed
 */
export async function deriveGamePda(
    gameId: number | bigint,
    programId: PublicKey
): Promise<{ address: PublicKey; bump: number }> {
    // Convert game ID to 8-byte little-endian buffer
    const gameIdBuffer = Buffer.alloc(8);
    gameIdBuffer.writeBigUInt64LE(BigInt(gameId));

    const cacheKey = getCacheKey(SEEDS.GAME, gameId.toString(), programId.toBase58());
    return derivePdaWithCache([SEEDS.GAME, gameIdBuffer], programId, cacheKey);
}

/**
 * Derive a PendingWithdrawal PDA for a player
 * Seed: ["pending_withdrawal", player_pubkey]
 * @param player - The player's public key (as PublicKey or base58 string)
 * @param programId - The Pepasur program ID
 * @returns Object containing the PendingWithdrawal PDA address and bump seed
 */
export async function derivePendingWithdrawalPda(
    player: PublicKey | string,
    programId: PublicKey
): Promise<{ address: PublicKey; bump: number }> {
    const playerPubkey = typeof player === 'string' ? new PublicKey(player) : player;

    const cacheKey = getCacheKey(
        SEEDS.PENDING_WITHDRAWAL,
        playerPubkey.toBase58(),
        programId.toBase58()
    );

    return derivePdaWithCache(
        [SEEDS.PENDING_WITHDRAWAL, playerPubkey.toBuffer()],
        programId,
        cacheKey
    );
}

/**
 * Derive the Vault Authority PDA
 * Seed: ["vault"]
 * @param programId - The Pepasur program ID
 * @returns Object containing the Vault Authority PDA address and bump seed
 */
export async function deriveVaultAuthorityPda(
    programId: PublicKey
): Promise<{ address: PublicKey; bump: number }> {
    const cacheKey = getCacheKey(SEEDS.VAULT, '', programId.toBase58());
    return derivePdaWithCache([SEEDS.VAULT], programId, cacheKey);
}

/**
 * Clear the PDA cache
 * Useful when switching networks or program IDs
 */
export function clearPdaCache(): void {
    pdaCache.clear();
}

/**
 * Get cache statistics (for debugging)
 * @returns Object with cache size and keys
 */
export function getPdaCacheStats(): { size: number; keys: string[] } {
    return {
        size: pdaCache.size,
        keys: Array.from(pdaCache.keys()),
    };
}

/**
 * Batch derive multiple Game PDAs
 * Useful for fetching multiple games at once
 * @param gameIds - Array of game IDs
 * @param programId - The Pepasur program ID
 * @returns Array of objects containing PDA addresses and bump seeds
 */
export async function deriveGamePdasBatch(
    gameIds: (number | bigint)[],
    programId: PublicKey
): Promise<Array<{ gameId: number | bigint; address: PublicKey; bump: number }>> {
    const results = await Promise.all(
        gameIds.map(async (gameId) => {
            const pda = await deriveGamePda(gameId, programId);
            return { gameId, ...pda };
        })
    );
    return results;
}

/**
 * Verify if an address is a valid PDA for the given seeds
 * @param address - The address to verify
 * @param seeds - The seeds used to derive the PDA
 * @param programId - The program ID
 * @returns true if the address is a valid PDA for the given seeds
 */
export async function verifyPda(
    address: PublicKey,
    seeds: (string | Buffer | Uint8Array)[],
    programId: PublicKey
): Promise<boolean> {
    try {
        const derived = await derivePdaWithCache(seeds, programId);
        return derived.address.equals(address);
    } catch {
        return false;
    }
}

/**
 * Get all PDA seeds for reference
 * @returns Object containing all seed constants
 */
export function getPdaSeeds() {
    return { ...SEEDS };
}
