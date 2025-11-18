const SolanaService = require('../solana/SolanaService');
const StakingManager = require('../staking/StakingManager');

class GameRewardService {
  constructor(gameManager) {
    this.gameManager = gameManager; // Reference to GameManager for accessing game state
    this.solanaService = SolanaService; // Use SolanaService singleton
    this.stakingManager = new StakingManager(gameManager);
  }

  async handleRewardDistribution(gameId, game) {
    try {
      console.log(`💰 Processing rewards for staked game ${gameId}`);

      // Determine winners and losers
      const winners = game.winners || [];
      const losers = game.players.filter(player => !winners.includes(player));

      console.log(`💰 Winners: ${winners.length}, Losers: ${losers.length}`);

      // Distribute rewards using contract gameId
      const contractGameId = game.onChainGameId;
      console.log(`💰 Game ${gameId} has onChainGameId: ${contractGameId}`);
      if (!contractGameId) {
        console.error('❌ No contract gameId available for reward distribution');
        return game;
      }

      // Check on-chain game status before attempting settlement
      try {
        // Ensure SolanaService is initialized
        if (!this.solanaService.isReady()) {
          await this.solanaService.initialize();
        }

        const gameInfo = await this.solanaService.getGameInfo(contractGameId);
        console.log(`📊 On-chain game status:`, gameInfo);

        // Status: Lobby, InProgress, Settled, Cancelled
        if (gameInfo && gameInfo.status) {
          if (gameInfo.status === 'Lobby') {
            console.error(`❌ Cannot settle game ${contractGameId} - still in LOBBY status on-chain`);
            console.error(`   This means not all players have joined on-chain yet.`);
            console.error(`   Players in backend: ${game.players.length}`);
            console.error(`   Players on-chain: ${gameInfo.players?.length || 'unknown'}`);
            return game;
          }

          if (gameInfo.status === 'Settled') {
            console.log(`✅ Game ${contractGameId} already settled on-chain, skipping settlement`);
            return game;
          }

          if (gameInfo.status === 'Cancelled') {
            console.log(`⚠️ Game ${contractGameId} was cancelled on-chain, skipping settlement`);
            return game;
          }
        }
      } catch (statusError) {
        console.error(`❌ Error checking on-chain game status:`, statusError.message);
        console.error(`   Proceeding with settlement anyway`);
        // Don't return early - proceed with settlement
      }

      console.log(`💰 Using contract gameId: ${contractGameId}`);
      console.log(`💰 Winners:`, winners);
      console.log(`💰 Losers:`, losers);
      console.log(`💰 Game roles:`, game.roles);
      console.log(`💰 Eliminated players:`, game.eliminated || []);

      // Check if game exists in staking service
      let stakingGame = this.stakingManager.stakingService.stakedGames.get(contractGameId);
      if (!stakingGame) {
        console.warn(`⚠️ Game ${contractGameId} not found in staking service - attempting recovery`);
        console.log(`💰 Available staked games:`, Array.from(this.stakingManager.stakingService.stakedGames.keys()));

        // RECOVERY: Try to reconstruct the staking game from the main game data
        if (game.stakingRequired && game.stakeAmount) {
          console.log(`🔧 Reconstructing staking data for game ${contractGameId}`);

          // Calculate total staked based on player count and stake amount
          const totalStaked = game.players.length * game.stakeAmount;

          // Register the game in staking service
          this.stakingManager.stakingService.stakedGames.set(contractGameId, {
            roomCode: game.roomCode,
            players: game.players,
            totalStaked: totalStaked,
            status: 'active',
            createdAt: game.createdAt || Date.now()
          });

          stakingGame = this.stakingManager.stakingService.stakedGames.get(contractGameId);
          console.log(`✅ Successfully reconstructed staking data - continuing with reward calculation`);
        } else {
          console.error(`❌ Cannot reconstruct - game not configured for staking`);
          console.error(`   Skipping reward calculation and distribution`);
          return game; // Skip rewards but don't crash
        }
      }

      // Calculate rewards using contract gameId
      const rewards = this.stakingManager.stakingService.calculateRewards(contractGameId, winners, losers, game.roles, game.eliminated || []);
      console.log(`💰 Rewards calculated:`, rewards);

      const distributionResult = await this.stakingManager.stakingService.distributeRewards(contractGameId, rewards);

      console.log(`💰 Rewards distributed for game ${gameId}:`, distributionResult);

      // Store reward info in game
      game.rewards = distributionResult;

    } catch (error) {
      console.error('❌ Error distributing rewards:', error);
      // Don't throw error - game should still end even if rewards fail
    }
  }
}

module.exports = GameRewardService;
