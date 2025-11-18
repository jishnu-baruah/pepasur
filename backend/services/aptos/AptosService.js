const aptosClientManager = require('./AptosClientManager');
const aptosGameTransactions = require('./AptosGameTransactions');
const aptosGameQueries = require('./AptosGameQueries');
const { buildSignAndSubmitTransaction } = require('../../utils/aptosTransactionUtils');
const crypto = require('crypto');

class AptosService {
  constructor() {
    this.aptosClientManager = aptosClientManager;
    this.aptosGameTransactions = aptosGameTransactions(this); // Pass this instance
    this.aptosGameQueries = aptosGameQueries;
    // Initialize the Aptos client manager
    this.aptosClientManager.initialize().catch(error => {
      console.error('Failed to initialize AptosClientManager in AptosService:', error);
    });
  }











  async withdraw() {
    try {
      const aptos = this.aptosClientManager.getAptosClient();
      const account = this.aptosClientManager.getServerAccount();

      const transactionHash = await buildSignAndSubmitTransaction(
        aptos,
        account,
        {
          function: `${process.env.PEPASUR_APTOS_CONTRACT_ADDRESS}::pepasur::withdraw`,
          functionArguments: [],
        }
      );

      console.log(`✅ Withdrawal transaction confirmed: ${transactionHash}`);
      return transactionHash;
    } catch (error) {
      console.error('❌ Error withdrawing funds:', error);
      throw error;
    }
  }

  /**
   * Send APT from server account to recipient (faucet)
   * @param {string} recipientAddress - Address to send APT to
   * @param {number} amountInOctas - Amount in octas (1 APT = 100000000 octas)
   * @returns {Promise<string>} Transaction hash
   */
  async sendAPT(recipientAddress, amountInOctas) {
    try {
      const aptos = this.aptosClientManager.getAptosClient();
      const account = this.aptosClientManager.getServerAccount();

      console.log(`💰 Sending ${amountInOctas / 100000000} APT to ${recipientAddress}`);

      const transactionHash = await buildSignAndSubmitTransaction(
        aptos,
        account,
        {
          function: '0x1::aptos_account::transfer',
          functionArguments: [recipientAddress, amountInOctas],
        }
      );

      console.log(`✅ Transfer successful. Transaction: ${transactionHash}`);
      return transactionHash;
    } catch (error) {
      console.error('❌ Error sending APT:', error);
      throw error;
    }
  }

  // Proxy methods for AptosGameTransactions
  async createGame(stakeAmount, minPlayers) {
    return this.aptosGameTransactions.createGame(stakeAmount, minPlayers);
  }

  async joinGame(gameId, playerAddress) {
    return this.aptosGameTransactions.joinGame(gameId, playerAddress);
  }

  async storeRoleCommit(gameId, commit) {
    return this.aptosGameTransactions.storeRoleCommit(gameId, commit);
  }

  async submitSettlement(gameId, winners, payoutAmounts) {
    return this.aptosGameTransactions.submitSettlement(gameId, winners, payoutAmounts);
  }

  async emergencyCancel(gameId) {
    return this.aptosGameTransactions.emergencyCancel(gameId);
  }

  // Proxy methods for AptosGameQueries
  async getGameInfo(gameId) {
    return this.aptosGameQueries.getGameInfo(gameId);
  }

  async getGamePlayers(gameId) {
    return this.aptosGameQueries.getGamePlayers(gameId);
  }

  async getContractInfo() {
    return this.aptosGameQueries.getContractInfo();
  }
}

module.exports = AptosService;
