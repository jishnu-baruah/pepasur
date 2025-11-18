const solanaClientManager = require('./SolanaClientManager');
const solanaGameTransactions = require('./SolanaGameTransactions');
const solanaGameQueries = require('./SolanaGameQueries');

class SolanaService {
    constructor() {
        this.clientManager = solanaClientManager;
        this.transactions = solanaGameTransactions;
        this.queries = solanaGameQueries;
        this.initialized = false;
    }

    /**
     * Initialize the Solana service
     */
    async initialize() {
        if (this.initialized) {
            console.log('⚠️  SolanaService already initialized');
            return;
        }

        try {
            await this.clientManager.initialize();
            this.initialized = true;
            console.log('✅ SolanaService initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize SolanaService:', error);
            throw error;
        }
    }

    /**
     * Check if service is ready
     */
    isReady() {
        return this.initialized && this.clientManager.isInitialized();
    }

    // ==================== Game Operations ====================

    /**
     * Create a new game
     * @param {number} stakeAmount - Stake amount in lamports
     * @param {number} minPlayers - Minimum players required
     * @returns {Promise<{gameId: string, transactionSignature: string}>}
     */
    async createGame(stakeAmount, minPlayers) {
        this.ensureInitialized();
        return await this.transactions.createGame(stakeAmount, minPlayers);
    }

    /**
     * Build join game transaction for player to sign
     * @param {string} gameId - Game ID
     * @param {string} playerAddress - Player's wallet address
     * @returns {Promise<{transaction: string}>}
     */
    async joinGame(gameId, playerAddress) {
        this.ensureInitialized();
        return await this.transactions.joinGame(gameId, playerAddress);
    }

    /**
     * Submit settlement for a completed game
     * @param {string} gameId - Game ID
     * @param {string[]} winners - Array of winner addresses
     * @param {string[]} payoutAmounts - Array of payout amounts in lamports
     * @returns {Promise<{transactionSignature: string}>}
     */
    async submitSettlement(gameId, winners, payoutAmounts) {
        this.ensureInitialized();
        return await this.transactions.submitSettlement(gameId, winners, payoutAmounts);
    }

    /**
     * Cancel a game (emergency function)
     * @param {string} gameId - Game ID
     * @returns {Promise<{transactionSignature: string}>}
     */
    async emergencyCancel(gameId) {
        this.ensureInitialized();
        return await this.transactions.emergencyCancel(gameId);
    }

    // ==================== Query Operations ====================

    /**
     * Get game information
     * @param {string} gameId - Game ID
     * @returns {Promise<Object|null>}
     */
    async getGameInfo(gameId) {
        this.ensureInitialized();
        return await this.queries.getGameInfo(gameId);
    }

    /**
     * Get players in a game
     * @param {string} gameId - Game ID
     * @returns {Promise<string[]>}
     */
    async getGamePlayers(gameId) {
        this.ensureInitialized();
        return await this.queries.getGamePlayers(gameId);
    }

    /**
     * Get contract configuration
     * @returns {Promise<Object>}
     */
    async getContractInfo() {
        this.ensureInitialized();
        return await this.queries.getContractInfo();
    }

    /**
     * Get pending withdrawal for a player
     * @param {string} playerAddress - Player's wallet address
     * @returns {Promise<{player: string, amount: string, bump: number}>}
     */
    async getPendingWithdrawal(playerAddress) {
        this.ensureInitialized();
        return await this.queries.getPendingWithdrawal(playerAddress);
    }

    /**
     * Get next game ID
     * @returns {Promise<string>}
     */
    async getNextGameId() {
        this.ensureInitialized();
        return await this.queries.getNextGameId();
    }

    /**
     * Check if a game exists
     * @param {string} gameId - Game ID
     * @returns {Promise<boolean>}
     */
    async gameExists(gameId) {
        this.ensureInitialized();
        return await this.queries.gameExists(gameId);
    }

    /**
     * Get vault balance
     * @returns {Promise<number>} Balance in lamports
     */
    async getVaultBalance() {
        this.ensureInitialized();
        return await this.queries.getVaultBalance();
    }

    // ==================== Utility Operations ====================

    /**
     * Send SOL to a recipient (faucet functionality)
     * @param {string} recipientAddress - Recipient's wallet address
     * @param {number} amountInLamports - Amount in lamports
     * @returns {Promise<string>} Transaction signature
     */
    async sendSOL(recipientAddress, amountInLamports) {
        this.ensureInitialized();
        return await this.transactions.sendSOL(recipientAddress, amountInLamports);
    }

    /**
     * Get server's SOL balance
     * @returns {Promise<number>} Balance in SOL
     */
    async getServerBalance() {
        this.ensureInitialized();
        return await this.clientManager.getServerBalance();
    }

    /**
     * Get connection instance
     */
    getConnection() {
        this.ensureInitialized();
        return this.clientManager.getConnection();
    }

    /**
     * Get program instance
     */
    getProgram() {
        this.ensureInitialized();
        return this.clientManager.getProgram();
    }

    /**
     * Get program ID
     */
    getProgramId() {
        this.ensureInitialized();
        return this.clientManager.getProgramId();
    }

    // ==================== Helper Methods ====================

    /**
     * Ensure service is initialized
     * @private
     */
    ensureInitialized() {
        if (!this.initialized) {
            throw new Error('SolanaService not initialized. Call initialize() first.');
        }
    }

    /**
     * Clear PDA cache (useful for testing)
     */
    clearCache() {
        this.queries.clearCache();
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            clientReady: this.clientManager.isInitialized(),
            programId: this.initialized ? this.clientManager.getProgramId().toBase58() : null,
            network: process.env.SOLANA_NETWORK || 'devnet',
            rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
        };
    }
}

// Export singleton instance
module.exports = new SolanaService();
