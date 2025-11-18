const { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } = require("@aptos-labs/ts-sdk");

class AptosClientManager {
  constructor() {
    this.aptos = null;
    this.account = null;
  }

  async initialize() {
    try {
      // Determine network from environment
      const network = process.env.NETWORK === 'mainnet' ? Network.MAINNET :
                      process.env.NETWORK === 'testnet' ? Network.TESTNET :
                      Network.DEVNET;

      // Initialize Aptos client with SDK v5
      const config = new AptosConfig({
        network,
        fullnode: process.env.APTOS_NODE_URL
      });
      this.aptos = new Aptos(config);

      // Initialize account if private key is provided
      if (process.env.SERVER_PRIVATE_KEY) {
        // Remove 'ed25519-priv-0x' prefix if present
        const privateKeyHex = process.env.SERVER_PRIVATE_KEY.replace('ed25519-priv-0x', '').replace('0x', '');
        const privateKey = new Ed25519PrivateKey(privateKeyHex);
        this.account = Account.fromPrivateKey({ privateKey });
        console.log('🔑 Server account initialized:', this.account.accountAddress.toString());
      }

      console.log('🌊 Aptos client manager initialized successfully on', network);
    } catch (error) {
      console.error('❌ Error initializing Aptos client manager:', error);
      throw error; // Re-throw to ensure calling service knows about the failure
    }
  }

  getAptosClient() {
    if (!this.aptos) {
      throw new Error('Aptos client not initialized. Call initialize() first.');
    }
    return this.aptos;
  }

  getServerAccount() {
    if (!this.account) {
      throw new Error('Server account not initialized. Check SERVER_PRIVATE_KEY environment variable.');
    }
    return this.account;
  }

  isInitialized() {
    return !!this.aptos && !!this.account;
  }
}

module.exports = new AptosClientManager(); // Export as a singleton
