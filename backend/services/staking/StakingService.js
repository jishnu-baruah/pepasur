const SolanaService = require('../solana/SolanaService');
const { lamportsToSol, solToLamports } = require('../../utils/tokenConversion');
const crypto = require('crypto');

class StakingService {
  constructor() {
    this.stakeAmount = 10000000; // 0.01 SOL in lamports
    this.minPlayers = 4;
    this.totalPool = 40000000; // 0.04 SOL (4 players x 0.01 SOL)
    this.stakedGames = new Map(); // Track staked games
    this.playerStakes = new Map(); // Track individual player stakes
    this.solanaService = SolanaService;
    this.initialize();
  }

  async initialize() {
    try {
      // Ensure SolanaService is initialized
      if (!this.solanaService.isReady()) {
        await this.solanaService.initialize();
      }

      const network = process.env.SOLANA_NETWORK || 'devnet';
      console.log('💰 Staking service initialized successfully on', network);
      console.log(`💰 Stake amount: ${lamportsToSol(this.stakeAmount)} SOL per player`);
      console.log(`💰 Total pool: ${lamportsToSol(this.totalPool)} SOL for 4 players`);
    } catch (error) {
      console.error('❌ Error initializing staking service:', error);
    }
  }

  async checkBalance(playerAddress) {
    try {
      if (!this.solanaService.isReady()) {
        console.log('⚠️ SolanaService not initialized, using mock balance for testing');
        return {
          balance: "1000000000", // 1 SOL
          balanceInSOL: "1.0",
          sufficient: true,
          mock: true
        };
      }

      try {
        const connection = this.solanaService.getConnection();
        const { PublicKey } = require('@solana/web3.js');
        const pubkey = new PublicKey(playerAddress);

        const balance = await connection.getBalance(pubkey);
        console.log(`💰 Player ${playerAddress} balance: ${lamportsToSol(balance)} SOL`);

        return {
          balance: balance.toString(),
          balanceInSOL: lamportsToSol(balance).toString(),
          sufficient: balance >= this.stakeAmount
        };
      } catch (error) {
        console.error('❌ Error checking balance:', error.message);
        throw error;
      }
    } catch (error) {
      console.error('❌ Error checking balance:', error);
      throw error;
    }
  }

  async stakeForGame(gameId, playerAddress, roomCode) {
    try {
      console.log(`💰 Player ${playerAddress} staking ${lamportsToSol(this.stakeAmount)} SOL for game ${gameId}`);

      if (!this.validateRoomCode(roomCode)) {
        throw new Error('Invalid room code');
      }

      if (!this.stakedGames.has(gameId)) {
        this.stakedGames.set(gameId, {
          roomCode: roomCode,
          players: [],
          totalStaked: 0,
          status: 'waiting',
          createdAt: Date.now()
        });
      }

      const game = this.stakedGames.get(gameId);

      if (game.players.includes(playerAddress)) {
        throw new Error('Player already staked for this game');
      }

      if (game.players.length >= this.minPlayers) {
        throw new Error('Game is full');
      }

      if (game.status !== 'waiting') {
        throw new Error('Game has already started');
      }

      // Ensure SolanaService is initialized
      if (!this.solanaService.isReady()) {
        await this.solanaService.initialize();
      }

      const result = await this.solanaService.joinGame(gameId, playerAddress);
      const txHash = result.transactionSignature || result.transaction;

      game.players.push(playerAddress);
      game.totalStaked += this.stakeAmount;

      this.playerStakes.set(`${gameId}-${playerAddress}`, {
        gameId: gameId,
        playerAddress: playerAddress,
        amount: this.stakeAmount,
        txHash: txHash,
        timestamp: Date.now(),
        status: 'staked'
      });

      console.log(`💰 Stake successful! Game ${gameId} now has ${game.players.length}/${this.minPlayers} players`);
      console.log(`💰 Total staked: ${lamportsToSol(game.totalStaked)} SOL`);

      if (game.players.length === this.minPlayers) {
        game.status = 'full';
        console.log(`🎮 Game ${gameId} is ready to start with full stake pool!`);
      }

      return {
        success: true,
        txHash: txHash,
        amount: this.stakeAmount.toString(),
        gameStatus: game.status,
        playersCount: game.players.length,
        totalStaked: game.totalStaked.toString()
      };
    } catch (error) {
      console.error('❌ Error staking for game:', error);
      throw error;
    }
  }

  getGameStakingInfo(gameId) {
    const game = this.stakedGames.get(gameId);
    if (!game) {
      return null;
    }

    return {
      gameId: gameId,
      roomCode: game.roomCode,
      players: game.players,
      playersCount: game.players.length,
      minPlayers: this.minPlayers,
      totalStaked: game.totalStaked.toString(),
      totalStakedInSOL: lamportsToSol(game.totalStaked).toString(),
      status: game.status,
      createdAt: game.createdAt,
      isReady: game.players.length === this.minPlayers
    };
  }

  // Get player's stake info
  getPlayerStakeInfo(gameId, playerAddress) {
    const stakeKey = `${gameId}-${playerAddress}`;
    const stake = this.playerStakes.get(stakeKey);

    if (!stake) {
      return null;
    }

    return {
      gameId: stake.gameId,
      playerAddress: stake.playerAddress,
      amount: stake.amount.toString(),
      amountInSOL: lamportsToSol(stake.amount).toString(),
      txHash: stake.txHash,
      timestamp: stake.timestamp,
      status: stake.status
    };
  }

  calculateRewards(gameId, winners, losers, gameRoles, eliminatedPlayers) {
    try {
      const game = this.stakedGames.get(gameId);
      if (!game) {
        console.error(`❌ Game ${gameId} not found in stakedGames`);
        console.error(`   Available games:`, Array.from(this.stakedGames.keys()));
        throw new Error(`Game not found in staking service (gameId: ${gameId})`);
      }

      const totalPool = game.totalStaked;
      const houseCutBps = 200; // 2%
      const houseCut = Math.floor((totalPool * houseCutBps) / 10000);
      const rewardPool = totalPool - houseCut;

      // Calculate actual stake per player from the total pool
      const playerCount = game.players.length;
      const stakePerPlayer = playerCount > 0 ? Math.floor(totalPool / playerCount) : 0;

      const rewards = [];
      const mafiaWon = winners.some((player) => gameRoles[player] === 'Mafia');

      if (mafiaWon) {
        const mafiaPlayers = winners.filter((player) => gameRoles[player] === 'Mafia');
        const mafiaRewardPerPlayer = mafiaPlayers.length > 0 ? Math.floor(rewardPool / mafiaPlayers.length) : 0;

        mafiaPlayers.forEach((playerAddress) => {
          rewards.push({
            playerAddress: playerAddress,
            role: 'ASUR',
            stakeAmount: stakePerPlayer.toString(),
            rewardAmount: mafiaRewardPerPlayer.toString(),
            totalReceived: mafiaRewardPerPlayer.toString(), // Winner only gets reward, not stake back
          });
        });

        losers.forEach((playerAddress) => {
          rewards.push({
            playerAddress: playerAddress,
            role: gameRoles[playerAddress] === 'Doctor' ? 'DEVA' : gameRoles[playerAddress] === 'Detective' ? 'RISHI' : 'MANAV',
            stakeAmount: stakePerPlayer.toString(),
            rewardAmount: '0',
            totalReceived: '0',
          });
        });
      } else {
        const allPlayers = Object.keys(gameRoles);
        const nonMafiaPlayers = allPlayers.filter((player) => gameRoles[player] !== 'Mafia');
        const nonMafiaRewardPerPlayer = nonMafiaPlayers.length > 0 ? Math.floor(rewardPool / nonMafiaPlayers.length) : 0;

        nonMafiaPlayers.forEach((playerAddress) => {
          rewards.push({
            playerAddress: playerAddress,
            role: gameRoles[playerAddress] === 'Doctor' ? 'DEVA' : gameRoles[playerAddress] === 'Detective' ? 'RISHI' : 'MANAV',
            stakeAmount: stakePerPlayer.toString(),
            rewardAmount: nonMafiaRewardPerPlayer.toString(),
            totalReceived: nonMafiaRewardPerPlayer.toString(), // Winner only gets reward, not stake back
          });
        });

        losers.forEach((playerAddress) => {
          if (gameRoles[playerAddress] === 'Mafia') {
            rewards.push({
              playerAddress: playerAddress,
              role: 'ASUR',
              stakeAmount: stakePerPlayer.toString(),
              rewardAmount: '0',
              totalReceived: '0',
            });
          }
        });
      }

      console.log(`💰 Reward calculation (in lamports):`);
      console.log(`   Total pool: ${totalPool} lamports (${lamportsToSol(totalPool)} SOL)`);
      console.log(`   House cut: ${houseCut} lamports (${lamportsToSol(houseCut)} SOL)`);
      console.log(`   Reward pool: ${rewardPool} lamports (${lamportsToSol(rewardPool)} SOL)`);

      return {
        gameId: gameId,
        totalPool: totalPool.toString(),
        houseCut: houseCut.toString(),
        rewardPool: rewardPool.toString(),
        rewards: rewards,
      };
    } catch (error) {
      console.error('❌ Error calculating rewards:', error);
      throw error;
    }
  }

  async distributeRewards(gameId, rewards) {
    try {
      // Ensure SolanaService is initialized
      if (!this.solanaService.isReady()) {
        await this.solanaService.initialize();
      }

      const winners = rewards.rewards.map((r) => r.playerAddress);
      const payoutAmounts = rewards.rewards.map((r) => r.totalReceived);

      console.log(`💰 Submitting settlement for game ${gameId}`);
      console.log(`   Winners:`, winners);
      console.log(`   Payouts (lamports):`, payoutAmounts);

      const result = await this.solanaService.submitSettlement(gameId, winners, payoutAmounts);
      const txHash = result.transactionSignature;

      const game = this.stakedGames.get(gameId);
      if (game) {
        game.status = 'completed';
        game.completedAt = Date.now();
      }

      // Format distributions for frontend with SOL conversion
      const distributions = rewards.rewards.map((r) => ({
        playerAddress: r.playerAddress,
        role: r.role,
        stakeAmount: r.stakeAmount,
        rewardAmount: r.rewardAmount,
        totalReceived: r.totalReceived,
        // Add SOL-formatted values for display
        stakeAmountInSOL: lamportsToSol(parseInt(r.stakeAmount)).toFixed(4),
        rewardInSOL: lamportsToSol(parseInt(r.rewardAmount)).toFixed(4),
        totalReceivedInSOL: lamportsToSol(parseInt(r.totalReceived)).toFixed(4),
      }));

      console.log(`✅ Settlement successful! Transaction: ${txHash}`);

      return {
        success: true,
        gameId: gameId,
        settlementTxHash: txHash,
        distributions: distributions, // Include detailed breakdown for frontend
        totalPool: rewards.totalPool,
        houseCut: rewards.houseCut,
        rewardPool: rewards.rewardPool,
      };
    } catch (error) {
      console.error('❌ Error distributing rewards:', error);
      throw error;
    }
  }

  // Validate room code format
  validateRoomCode(roomCode) {
    // Room code should be 6 characters, alphanumeric
    return /^[A-Z0-9]{6}$/.test(roomCode);
  }

  // Get all staked games
  getAllStakedGames() {
    const games = [];
    for (const [gameId, game] of this.stakedGames) {
      games.push({
        gameId: gameId,
        roomCode: game.roomCode,
        players: game.players,
        playersCount: game.players.length,
        minPlayers: this.minPlayers,
        totalStaked: game.totalStaked.toString(),
        totalStakedInSOL: lamportsToSol(game.totalStaked).toString(),
        status: game.status,
        createdAt: game.createdAt,
        isReady: game.players.length === this.minPlayers
      });
    }
    return games;
  }

  // Clean up completed games (optional)
  cleanupCompletedGames() {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000; // 24 hours

    for (const [gameId, game] of this.stakedGames) {
      if (game.status === 'completed' && (now - game.completedAt) > oneDayMs) {
        this.stakedGames.delete(gameId);
        console.log(`🧹 Cleaned up completed game ${gameId}`);
      }
    }
  }
}

module.exports = StakingService;
