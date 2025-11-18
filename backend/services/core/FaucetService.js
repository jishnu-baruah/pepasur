const AptosService = require('../aptos/AptosService');
const FaucetRequest = require('../../models/FaucetRequest');
const { formatTimeRemaining } = require('../../utils/timeFormatter');

class FaucetService {
  constructor() {
    this.aptosService = new AptosService();
    this.FAUCET_AMOUNT_APT = 0.01; // 0.01 APT per request
    this.FAUCET_AMOUNT_OCTAS = this.FAUCET_AMOUNT_APT * 100000000;
    this.COOLDOWN_HOURS = 24;
  }

  /**
   * Validate Aptos address format
   * @param {string} address
   * @returns {boolean}
   */
  isValidAddress(address) {
    if (!address) return false;
    return address.startsWith('0x') && address.length === 66;
  }

  /**
   * Claim faucet tokens for user (server signs transaction)
   * @param {string} userAddress - User's Aptos address
   * @returns {Promise<object>} Transaction details
   */
  async claimTokensForUser(userAddress) {
    try {
      console.log(`💰 Processing faucet claim for ${userAddress}`);

      // Validate address
      if (!this.isValidAddress(userAddress)) {
        throw new Error('Invalid Aptos address format');
      }

      // Check rate limit
      const eligibility = await FaucetRequest.canRequest(userAddress);

      if (!eligibility.canRequest) {
        const error = new Error('Rate limit exceeded. You can only claim once every 24 hours.');
        error.nextRequestTime = eligibility.nextRequestTime;
        error.timeRemaining = formatTimeRemaining(eligibility.timeRemaining);
        error.statusCode = 429;
        throw error;
      }

      // Send APT using AptosService (server signs)
      const transactionHash = await this.aptosService.sendAPT(
        userAddress,
        this.FAUCET_AMOUNT_OCTAS
      );

      // Record the request
      const faucetRequest = new FaucetRequest({
        address: userAddress,
        amount: this.FAUCET_AMOUNT_APT,
        transactionHash
      });

      await faucetRequest.save();

      const nextClaimTime = new Date(Date.now() + this.COOLDOWN_HOURS * 60 * 60 * 1000);

      console.log(`✅ Faucet claim successful for ${userAddress}`);

      return {
        transactionHash,
        amount: this.FAUCET_AMOUNT_APT,
        amountOctas: this.FAUCET_AMOUNT_OCTAS,
        recipient: userAddress,
        nextClaimTime,
        message: `Successfully sent ${this.FAUCET_AMOUNT_APT} APT`
      };
    } catch (error) {
      console.error('❌ Error claiming faucet tokens:', error);
      throw error;
    }
  }

  /**
   * Get faucet info for a user
   * @param {string} userAddress
   * @returns {Promise<object>}
   */
  async getFaucetInfo(userAddress) {
    try {
      const eligibility = await FaucetRequest.canRequest(userAddress);

      return {
        faucetAmount: this.FAUCET_AMOUNT_APT,
        cooldownHours: this.COOLDOWN_HOURS,
        canClaim: eligibility.canRequest,
        lastClaimTime: eligibility.lastRequestTime,
        nextClaimTime: eligibility.nextRequestTime,
        timeRemaining: formatTimeRemaining(eligibility.timeRemaining)
      };
    } catch (error) {
      console.error('❌ Error getting faucet info:', error);
      throw error;
    }
  }

  /**
   * Get claim countdown for a user
   * @param {string} userAddress
   * @returns {Promise<object>}
   */
  async getClaimCountdown(userAddress) {
    try {
      const eligibility = await FaucetRequest.canRequest(userAddress);

      return {
        canClaim: eligibility.canRequest,
        timeUntilNextClaim: eligibility.timeRemaining || 0
      };
    } catch (error) {
      console.error('❌ Error getting claim countdown:', error);
      throw error;
    }
  }



  /**
   * Get faucet statistics
   * @returns {Promise<object>}
   */
  async getFaucetStats() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [totalRequests, last24Hours, last7Days, totalDistributed] = await Promise.all([
        FaucetRequest.countDocuments(),
        FaucetRequest.countDocuments({ requestedAt: { $gte: oneDayAgo } }),
        FaucetRequest.countDocuments({ requestedAt: { $gte: oneWeekAgo } }),
        FaucetRequest.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ])
      ]);

      return {
        totalRequests,
        last24Hours,
        last7Days,
        totalDistributed: totalDistributed[0]?.total || 0,
        faucetAmount: this.FAUCET_AMOUNT_APT,
        cooldownHours: this.COOLDOWN_HOURS
      };
    } catch (error) {
      console.error('❌ Error getting faucet stats:', error);
      throw error;
    }
  }

  /**
   * Get server wallet info
   * @returns {Promise<object>}
   */
  async getServerWalletInfo() {
    try {
      if (!this.aptosService.account) {
        return {
          address: null,
          balance: null,
          status: 'Not initialized'
        };
      }

      const address = this.aptosService.account.accountAddress.toString();

      // Get account balance
      let balance = null;
      try {
        const resources = await this.aptosService.aptos.getAccountResources({
          accountAddress: address
        });

        const coinResource = resources.find(
          r => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
        );

        if (coinResource) {
          balance = parseInt(coinResource.data.coin.value) / 100000000; // Convert octas to APT
        }
      } catch (balanceError) {
        console.warn('Could not fetch server balance:', balanceError.message);
      }

      return {
        address,
        balance,
        balanceAPT: balance,
        status: 'Active'
      };
    } catch (error) {
      console.error('❌ Error getting server wallet info:', error);
      return {
        address: null,
        balance: null,
        status: 'Error: ' + error.message
      };
    }
  }

  /**
   * Get service status
   * @returns {object}
   */
  getServiceStatus() {
    return {
      initialized: !!this.aptosService.account,
      faucetAmount: this.FAUCET_AMOUNT_APT,
      cooldownHours: this.COOLDOWN_HOURS,
      network: process.env.NETWORK || 'devnet'
    };
  }
}

module.exports = FaucetService;
