const { PublicKey } = require('@solana/web3.js');
const solanaClientManager = require('./SolanaClientManager');

// PDA cache for frequently accessed accounts
const pdaCache = new Map();

class SolanaGameQueries {
    /**
     * Derive Config PDA
     */
    deriveConfigPda() {
        const cacheKey = 'config';
        if (pdaCache.has(cacheKey)) {
            return pdaCache.get(cacheKey);
        }

        const programId = solanaClientManager.getProgramId();
        const [pda, bump] = PublicKey.findProgramAddressSync(
            [Buffer.from('config')],
            programId
        );

        pdaCache.set(cacheKey, { pda, bump });
        return { pda, bump };
    }

    /**
     * Derive GameStore PDA
     */
    deriveGameStorePda() {
        const cacheKey = 'game_store';
        if (pdaCache.has(cacheKey)) {
            return pdaCache.get(cacheKey);
        }

        const programId = solanaClientManager.getProgramId();
        const [pda, bump] = PublicKey.findProgramAddressSync(
            [Buffer.from('game_store')],
            programId
        );

        pdaCache.set(cacheKey, { pda, bump });
        return { pda, bump };
    }

    /**
     * Derive Game PDA from game ID
     */
    deriveGamePda(gameId) {
        const cacheKey = `game_${gameId}`;
        if (pdaCache.has(cacheKey)) {
            return pdaCache.get(cacheKey);
        }

        const programId = solanaClientManager.getProgramId();
        const gameIdBuffer = Buffer.alloc(8);
        gameIdBuffer.writeBigUInt64LE(BigInt(gameId));

        const [pda, bump] = PublicKey.findProgramAddressSync(
            [Buffer.from('game'), gameIdBuffer],
            programId
        );

        pdaCache.set(cacheKey, { pda, bump });
        return { pda, bump };
    }

    /**
     * Derive PendingWithdrawal PDA for a player
     */
    derivePendingWithdrawalPda(playerAddress) {
        const programId = solanaClientManager.getProgramId();
        const playerPubkey = new PublicKey(playerAddress);

        const [pda, bump] = PublicKey.findProgramAddressSync(
            [Buffer.from('pending_withdrawal'), playerPubkey.toBuffer()],
            programId
        );

        return { pda, bump };
    }

    /**
     * Derive Vault PDA
     */
    deriveVaultPda() {
        const cacheKey = 'vault';
        if (pdaCache.has(cacheKey)) {
            return pdaCache.get(cacheKey);
        }

        const programId = solanaClientManager.getProgramId();
        const [pda, bump] = PublicKey.findProgramAddressSync(
            [Buffer.from('vault')],
            programId
        );

        pdaCache.set(cacheKey, { pda, bump });
        return { pda, bump };
    }

    /**
     * Get game information by ID
     */
    async getGameInfo(gameId) {
        try {
            const program = solanaClientManager.getProgram();
            const { pda } = this.deriveGamePda(gameId);

            // Fetch account data using Anchor
            const game = await program.account.game.fetch(pda);

            // Convert to plain JavaScript object
            return {
                id: game.id.toString(),
                creator: game.creator.toBase58(),
                stakeAmount: game.stakeAmount.toString(),
                minPlayers: game.minPlayers,
                players: game.players.map(p => p.toBase58()),
                deposits: game.deposits.map(d => d.toString()),
                status: Object.keys(game.status)[0], // Convert enum to string
                totalPool: game.totalPool.toString(),
                createdAt: game.createdAt.toString(),
                bump: game.bump,
            };
        } catch (error) {
            if (error.message.includes('Account does not exist')) {
                return null;
            }
            console.error(`Error fetching game ${gameId}:`, error);
            throw error;
        }
    }

    /**
     * Get players in a game
     */
    async getGamePlayers(gameId) {
        const game = await this.getGameInfo(gameId);
        return game ? game.players : [];
    }

    /**
     * Get contract configuration
     */
    async getContractInfo() {
        try {
            const program = solanaClientManager.getProgram();
            const { pda } = this.deriveConfigPda();

            const config = await program.account.config.fetch(pda);

            return {
                admin: config.admin.toBase58(),
                serverSigner: config.serverSigner.toBase58(),
                feeRecipient: config.feeRecipient.toBase58(),
                houseCutBps: config.houseCutBps,
                initialized: config.initialized,
                bump: config.bump,
            };
        } catch (error) {
            if (error.message.includes('Account does not exist')) {
                return null;
            }
            console.error('Error fetching contract config:', error);
            throw error;
        }
    }

    /**
     * Get pending withdrawal amount for a player
     */
    async getPendingWithdrawal(playerAddress) {
        try {
            const program = solanaClientManager.getProgram();
            const { pda } = this.derivePendingWithdrawalPda(playerAddress);

            const withdrawal = await program.account.pendingWithdrawal.fetch(pda);

            return {
                player: withdrawal.player.toBase58(),
                amount: withdrawal.amount.toString(),
                bump: withdrawal.bump,
            };
        } catch (error) {
            if (error.message.includes('Account does not exist')) {
                return { player: playerAddress, amount: '0', bump: 0 };
            }
            console.error(`Error fetching pending withdrawal for ${playerAddress}:`, error);
            throw error;
        }
    }

    /**
     * Get next game ID from GameStore
     */
    async getNextGameId() {
        try {
            const program = solanaClientManager.getProgram();
            const { pda } = this.deriveGameStorePda();

            const gameStore = await program.account.gameStore.fetch(pda);
            return gameStore.nextGameId.toString();
        } catch (error) {
            if (error.message.includes('Account does not exist')) {
                return '1'; // Default if not initialized
            }
            console.error('Error fetching next game ID:', error);
            throw error;
        }
    }

    /**
     * Check if a game exists
     */
    async gameExists(gameId) {
        const game = await this.getGameInfo(gameId);
        return game !== null;
    }

    /**
     * Get vault balance
     */
    async getVaultBalance() {
        const connection = solanaClientManager.getConnection();
        const { pda } = this.deriveVaultPda();

        const balance = await connection.getBalance(pda);
        return balance; // Returns lamports
    }

    /**
     * Clear PDA cache (useful for testing)
     */
    clearCache() {
        pdaCache.clear();
    }
}

module.exports = new SolanaGameQueries();
