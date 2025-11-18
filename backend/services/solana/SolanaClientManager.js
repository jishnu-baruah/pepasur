const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { AnchorProvider, Program } = require('@coral-xyz/anchor');
const idl = require('../../idl/pepasur.json');

class SolanaClientManager {
    constructor() {
        this.connection = null;
        this.serverKeypair = null;
        this.programId = null;
        this.program = null;
        this.provider = null;
    }

    async initialize() {
        try {
            // Load server keypair from environment
            const secretKeyString = process.env.SOLANA_SERVER_PRIVATE_KEY;
            if (!secretKeyString) {
                throw new Error('SOLANA_SERVER_PRIVATE_KEY not found in environment');
            }

            const secretKey = JSON.parse(secretKeyString);
            this.serverKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));

            // Connect to Solana RPC
            const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
            this.connection = new Connection(rpcUrl, 'confirmed');

            // Load program ID
            const programIdString = process.env.PEPASUR_PROGRAM_ID;
            if (!programIdString) {
                throw new Error('PEPASUR_PROGRAM_ID not found in environment');
            }
            this.programId = new PublicKey(programIdString);

            // Create Anchor provider
            const wallet = {
                publicKey: this.serverKeypair.publicKey,
                signTransaction: async (tx) => {
                    tx.partialSign(this.serverKeypair);
                    return tx;
                },
                signAllTransactions: async (txs) => {
                    return txs.map((tx) => {
                        tx.partialSign(this.serverKeypair);
                        return tx;
                    });
                },
            };

            this.provider = new AnchorProvider(
                this.connection,
                wallet,
                { commitment: 'confirmed' }
            );

            // Initialize Anchor program
            this.program = new Program(idl, this.programId, this.provider);

            console.log('✅ Solana client initialized');
            console.log('   Server pubkey:', this.serverKeypair.publicKey.toBase58());
            console.log('   Program ID:', this.programId.toBase58());
            console.log('   RPC URL:', rpcUrl);

            // Check connection
            const version = await this.connection.getVersion();
            console.log('   Solana version:', version['solana-core']);

            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Solana client:', error);
            throw error;
        }
    }

    getConnection() {
        if (!this.connection) {
            throw new Error('Solana client not initialized. Call initialize() first.');
        }
        return this.connection;
    }

    getServerKeypair() {
        if (!this.serverKeypair) {
            throw new Error('Solana client not initialized. Call initialize() first.');
        }
        return this.serverKeypair;
    }

    getProgramId() {
        if (!this.programId) {
            throw new Error('Solana client not initialized. Call initialize() first.');
        }
        return this.programId;
    }

    getProgram() {
        if (!this.program) {
            throw new Error('Solana client not initialized. Call initialize() first.');
        }
        return this.program;
    }

    getProvider() {
        if (!this.provider) {
            throw new Error('Solana client not initialized. Call initialize() first.');
        }
        return this.provider;
    }

    /**
     * Check if the client is initialized
     */
    isInitialized() {
        return this.connection !== null && this.serverKeypair !== null && this.programId !== null;
    }

    /**
     * Get the server's SOL balance
     */
    async getServerBalance() {
        const balance = await this.connection.getBalance(this.serverKeypair.publicKey);
        return balance / 1_000_000_000; // Convert lamports to SOL
    }
}

// Export singleton instance
const solanaClientManager = new SolanaClientManager();
module.exports = solanaClientManager;
