const aptosClientManager = require('./AptosClientManager');

class AptosGameQueries {
  constructor() {
    this.aptosClientManager = aptosClientManager;
  }

  async getGameInfo(gameId) {
    try {
      const aptos = this.aptosClientManager.getAptosClient();

      const result = await aptos.view({
        payload: {
          function: `${process.env.PEPASUR_APTOS_CONTRACT_ADDRESS}::pepasur::get_game_info`,
          functionArguments: [gameId],
        },
      });

      return result[0];
    } catch (error) {
      console.error('❌ Error getting game info from chain:', error);
      throw error;
    }
  }

  async getGamePlayers(gameId) {
    try {
      const aptos = this.aptosClientManager.getAptosClient();

      const result = await aptos.view({
        payload: {
          function: `${process.env.PEPASUR_APTOS_CONTRACT_ADDRESS}::pepasur::get_game_players`,
          functionArguments: [gameId],
        },
      });

      return result[0];
    } catch (error) {
      console.error('❌ Error getting game players from chain:', error);
      throw error;
    }
  }

  async getContractInfo() {
    try {
      const aptos = this.aptosClientManager.getAptosClient();

      const contractAddress = process.env.PEPASUR_APTOS_CONTRACT_ADDRESS;

      // Get Config resource which contains server_signer as vector<u8> (public key)
      const config = await aptos.getAccountResource({
        accountAddress: contractAddress,
        resourceType: `${contractAddress}::pepasur::Config`,
      });

      console.log(`📋 Raw Config resource:`, JSON.stringify(config, null, 2));

      const result = {
        admin: config.admin,
        serverSignerPubkey: config.server_signer, // This is vector<u8> containing the public key
        feeRecipient: config.fee_recipient,
        houseCutBps: config.house_cut_bps,
        initialized: config.initialized,
      };

      console.log(`📋 Contract info retrieved:`, result);
      return result;
    } catch (error) {
      console.error('❌ Error getting contract info from chain:', error);
      throw error;
    }
  }
}

module.exports = new AptosGameQueries(); // Export as a singleton
