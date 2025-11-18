const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const SolanaService = require('../solana/SolanaService');
const StakingManager = require('../staking/StakingManager');
const GameRepository = require('./GameRepository');
const TaskManager = require('../core/TaskManager');
const PhaseManager = require('./PhaseManager');
const GameRewardService = require('./GameRewardService'); // Import GameRewardService

class GameManager {
  // Dummy comment to force module reload
  constructor(socketManager = null, solanaService = null) {
    this.solanaService = solanaService || SolanaService; // Store SolanaService instance
    this.games = new Map(); // gameId -> game state
    this.detectiveReveals = new Map(); // gameId -> reveals[]
    this.roomCodes = new Map(); // roomCode -> gameId
    this.socketManager = socketManager; // Reference to SocketManager
    this.stakingManager = new StakingManager(this); // Initialize staking manager
    this.gameRepository = new GameRepository(); // Initialize game repository
    this.taskManager = new TaskManager(this); // Initialize task manager
    this.phaseManager = new PhaseManager(this); // Initialize phase manager
    this.gameRewardService = new GameRewardService(this); // Initialize GameRewardService
    this.gameStartTimes = new Map(); // gameId -> timestamp
    this.phaseStartTimes = new Map(); // gameId -> timestamp
    this.MAX_GAME_DURATION = 30 * 60 * 1000; // 30 minutes
    this.MAX_PHASE_DURATION = 5 * 60 * 1000; // 5 minutes

    // Start monitoring service
    this.phaseManager.startMonitoringService();
  }

  // Create a new game with staking requirement
  async createGame(creatorAddress, stakeAmount, minPlayers, contractGameId = null, isPublic = false, settings = null) {
    const gameId = uuidv4();
    const roomCode = this.gameRepository.generateRoomCode();

    // Default settings if not provided (phase durations only)
    const defaultSettings = {
      nightPhaseDuration: 30,
      resolutionPhaseDuration: 10,
      taskPhaseDuration: 30,
      votingPhaseDuration: 10
    };

    const game = {
      gameId,
      roomCode,
      creator: creatorAddress,
      players: [creatorAddress],
      roles: {}, // address -> role (only server knows)
      phase: 'lobby',
      day: 1,
      timeLeft: 0,
      startedAt: null,
      stakeAmount: stakeAmount || 1000000000, // 1 SOL in lamports
      minPlayers: minPlayers || parseInt(process.env.DEFAULT_MIN_PLAYERS) || 4,
      maxPlayers: parseInt(process.env.DEFAULT_MAX_PLAYERS) || 10,
      pendingActions: {}, // address -> { commit, revealed }
      task: null,
      votes: {}, // address -> votedFor
      votingResolved: false, // Track if voting results have been shown
      stakingRequired: true, // Require staking for this game
      stakingStatus: 'waiting', // waiting, ready, completed
      playerStakes: new Map(), // Track which players have staked
      eliminated: [],
      winners: [],
      roleCommit: null,
      status: 'lobby', // Fixed: should be 'lobby' not 'active'
      isPublic: isPublic,
      settings: settings || defaultSettings // Store custom settings
    };

    if (contractGameId) {
      game.onChainGameId = contractGameId;
      console.log(`🎮 Using provided contract gameId: ${contractGameId}`);
    } else if (game.stakingRequired) {
      try {
        console.log(`🎮 Creating game on-chain with stake: ${game.stakeAmount} lamports (${game.stakeAmount / 1000000000} SOL)`);

        if (!this.solanaService) {
          throw new Error('SolanaService not initialized in GameManager.');
        }

        // Ensure SolanaService is initialized
        if (!this.solanaService.isReady()) {
          await this.solanaService.initialize();
        }

        const result = await this.solanaService.createGame(game.stakeAmount, game.minPlayers);
        const onChainGameId = result.gameId;

        console.log(`✅ Game created on-chain with ID: ${onChainGameId}`);
        console.log(`✅ Transaction signature: ${result.transactionSignature}`);
        game.onChainGameId = onChainGameId;

      } catch (error) {
        console.error('❌ Error creating game on-chain:', error);
      }
    }

    // Save to in-memory for real-time operations
    this.games.set(gameId, game);
    this.roomCodes.set(roomCode, gameId);

    // Save to MongoDB for persistence and public lobby queries (with timeout)
    await this.gameRepository.createGame({
      gameId,
      roomCode,
      creator: creatorAddress,
      isPublic,
      stakeAmount: game.stakeAmount,
      minPlayers: game.minPlayers,
      maxPlayers: game.maxPlayers,
      currentPlayers: [creatorAddress],
      status: 'lobby',
      phase: 'lobby',
      onChainGameId: game.onChainGameId,
      stakingRequired: game.stakingRequired,
      settings: game.settings
    });

    // Register game in StakingService if staking is required
    if (game.stakingRequired && game.onChainGameId) {
      console.log(`💰 Registering game in StakingService with contract gameId: ${game.onChainGameId}`);
      this.stakingManager.stakingService.stakedGames.set(game.onChainGameId, {
        roomCode: game.roomCode,
        players: [],
        totalStaked: 0,
        status: 'waiting',
        createdAt: Date.now()
      });
    }

    console.log(`🎮 Game created: ${gameId} (Room: ${roomCode}) by ${creatorAddress}`);
    console.log(`💰 Staking required: ${game.stakingRequired ? 'YES' : 'NO'}`);
    console.log(`🌐 Public: ${isPublic ? 'YES' : 'NO'}`);


    return { gameId, roomCode, game };
  }

  // Stake U2U for a game
  async stakeForGame(gameId, playerAddress, roomCode) {
    return this.stakingManager.stakeForGame(gameId, playerAddress, roomCode);
  }

  // Check if game is ready to start (all players staked)
  isGameReadyToStart(gameId) {
    return this.stakingManager.isGameReadyToStart(gameId);
  }

  // Record that a player has staked
  async recordPlayerStake(gameId, playerAddress, transactionHash) {
    return this.stakingManager.recordPlayerStake(gameId, playerAddress, transactionHash);
  }

  // Get game staking info
  getGameStakingInfo(gameId) {
    return this.stakingManager.getGameStakingInfo(gameId);
  }

  // Check and update game phase based on staking status
  async checkStakingStatus(gameId) {
    return this.stakingManager.checkStakingStatus(gameId);
  }

  // Get player's stake info
  getPlayerStakeInfo(gameId, playerAddress) {
    return this.stakingManager.getPlayerStakeInfo(gameId, playerAddress);
  }

  // Check player balance
  async checkPlayerBalance(playerAddress) {
    return this.stakingManager.checkPlayerBalance(playerAddress);
  }

  // Get game by gameId
  getGame(gameId) {
    return this.games.get(gameId);
  }

  // Join a game by gameId
  joinGame(gameId, playerAddress) {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.phase !== 'lobby') {
      throw new Error('Game already started');
    }

    // If player is already in game, just return the game (no error)
    if (game.players.includes(playerAddress)) {
      console.log(`Player ${playerAddress} is already in game ${gameId}, returning existing game`);
      return game;
    }

    if (game.players.length >= game.maxPlayers) {
      throw new Error('Game is full');
    }

    game.players.push(playerAddress);

    // Don't auto-start here - let checkStakingStatus handle it with proper delay
    console.log(`Player ${playerAddress} joined game ${gameId}. Total players: ${game.players.length}`);

    // Check if game is ready to start after adding player
    this.stakingManager.checkStakingStatus(gameId);

    // Emit game state update when player joins
    if (this.socketManager) {
      try {
        this.socketManager.emitGameStateUpdate(gameId);
      } catch (error) {
        console.error(`❌ Error emitting game state update when player joins:`, error);
      }
    }

    return game;
  }

  // Join a game by room code
  joinGameByRoomCode(roomCode, playerAddress) {
    console.log(`Attempting to join game with room code: ${roomCode}`);
    console.log(`Available room codes:`, Array.from(this.roomCodes.keys()));

    const gameId = this.roomCodes.get(roomCode);
    if (!gameId) {
      console.log(`Room code ${roomCode} not found in roomCodes map`);
      throw new Error('Room code not found');
    }

    console.log(`Found game ${gameId} for room code ${roomCode}`);
    return this.joinGame(gameId, playerAddress);
  }

  // Get game by room code
  getGameByRoomCode(roomCode) {
    const gameId = this.roomCodes.get(roomCode);
    if (!gameId) {
      return null;
    }

    return this.games.get(gameId);
  }

  // Leave a game (allowed in any phase)
  async leaveGame(gameId, playerAddress) {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const playerIndex = game.players.indexOf(playerAddress);
    if (playerIndex === -1) {
      throw new Error('Player not in this game');
    }

    const isInLobby = game.phase === 'lobby';
    const isActiveGame = !isInLobby;

    console.log(`👋 Player ${playerAddress} leaving game ${gameId} (phase: ${game.phase})`);

    // LOBBY PHASE: Remove player entirely
    if (isInLobby) {
      // Remove player from in-memory game
      game.players.splice(playerIndex, 1);

      // Remove player's stake tracking
      if (game.playerStakes && game.playerStakes.has(playerAddress)) {
        game.playerStakes.delete(playerAddress);
      }

      console.log(`👋 Player ${playerAddress} left lobby ${gameId}. Remaining players: ${game.players.length}`);

      // If creator left or no players remain, cancel the game
      if (game.players.length === 0 || game.creator === playerAddress) {
        console.log(`🚫 Game ${gameId} cancelled - ${game.players.length === 0 ? 'no players remain' : 'creator left'}`);

        // Remove from in-memory
        this.games.delete(gameId);
        this.roomCodes.delete(game.roomCode);

        // Update database status
        await this.gameRepository.updateGameStatus(gameId, 'cancelled');

        // Emit game cancelled event
        if (this.socketManager) {
          this.socketManager.io.to(gameId).emit('game_cancelled', {
            gameId,
            reason: game.creator === playerAddress ? 'Creator left the game' : 'All players left'
          });
        }

        return { cancelled: true, remainingPlayers: [] };
      }
    }
    // ACTIVE GAME: Mark as eliminated, forfeit stake
    else {
      console.log(`⚠️ Player ${playerAddress} leaving active game ${gameId} - marking as eliminated`);

      // Add to eliminated list if not already there
      if (!game.eliminated) {
        game.eliminated = [];
      }
      if (!game.eliminated.includes(playerAddress)) {
        game.eliminated.push(playerAddress);
      }

      // Stake is forfeited automatically (goes to winner pool)
      console.log(`💸 Player ${playerAddress} forfeits stake by leaving`);

      // Check if game should end (too few players remaining)
      const alivePlayers = game.players.filter(p => !game.eliminated.includes(p));
      const minPlayers = game.minPlayers || 4;

      if (alivePlayers.length < 2) {
        console.log(`🏁 Game ${gameId} ending - only ${alivePlayers.length} alive players remain`);

        // End game with remaining alive players as winners
        await this.endGame(gameId);
        return { cancelled: false, gameEnded: true, remainingPlayers: alivePlayers };
      }
    }

    // Sync to database
    if (isInLobby) {
      await this.gameRepository.removePlayer(gameId, playerAddress);
    } else {
      await this.gameRepository.removePlayer(gameId, playerAddress);
    }

    // Emit game state update
    if (this.socketManager) {
      try {
        this.socketManager.emitGameStateUpdate(gameId);
      } catch (error) {
        console.error(`❌ Error emitting game state update after player left:`, error);
      }
    }

    return { cancelled: false, remainingPlayers: game.players };
  }

  // Start the game
  async startGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Check if game is ready to start (staking requirements)
    if (!this.isGameReadyToStart(gameId)) {
      throw new Error('Game is not ready to start - staking requirements not met');
    }

    console.log(`🚀 STARTING GAME ${gameId} - DEBUG VERSION DEPLOYED`);
    console.log(`Game has ${game.players.length} players:`, game.players);
    console.log(`💰 Staking status: ${game.stakingStatus}`);

    // Assign roles randomly
    this.phaseManager.assignRoles(game);

    // Generate role commit hash
    game.roleCommit = this.phaseManager.generateRoleCommit(game);

    // Start first night phase
    game.phase = 'night';
    game.status = 'active'; // Mark as active to prevent TTL expiration
    game.startedAt = Date.now();
    game.timeLeft = game.settings?.nightPhaseDuration || parseInt(process.env.GAME_TIMEOUT_SECONDS) || 30;

    // Track game start time for timeout monitoring
    this.gameStartTimes.set(gameId, Date.now());
    this.phaseStartTimes.set(gameId, Date.now());

    console.log(`🎯 Game ${gameId} starting night phase with ${game.timeLeft}s timer`);

    // Update status in database to prevent 15-minute TTL deletion
    await this.gameRepository.updateGameStatus(gameId, 'active');

    // Start timer countdown
    await this.phaseManager.startTimer(gameId);

    console.log(`Game ${gameId} started with ${game.players.length} players`);

    // Emit game state update when game starts
    if (this.socketManager) {
      try {
        this.socketManager.emitGameStateUpdate(gameId);
      } catch (error) {
        console.error(`❌ Error emitting game state update when game starts:`, error);
      }
    }

    return game;
  }

  // Submit night action
  submitNightAction(gameId, data) {
    const game = this.games.get(gameId);

    console.log(`🌙 NIGHT ACTION SUBMISSION - DEBUG VERSION`);
    console.log(`Night action attempt for game ${gameId}:`, {
      gameExists: !!game,
      currentPhase: game?.phase,
      expectedPhase: 'night',
      timeLeft: game?.timeLeft,
      timerReady: game?.timerReady
    });

    if (!game) {
      throw new Error('Game not found');
    }

    if (game.phase !== 'night') {
      throw new Error(`Invalid game phase: expected 'night', got '${game.phase}'`);
    }

    const { playerAddress, action, commit } = data;

    console.log(`Night action submitted by ${playerAddress}:`, action);

    if (!game.players.includes(playerAddress)) {
      throw new Error('Player not in game');
    }

    // Store commit
    if (!game.pendingActions[playerAddress]) {
      game.pendingActions[playerAddress] = {};
    }
    game.pendingActions[playerAddress].commit = commit;
    game.pendingActions[playerAddress].action = action;

    console.log(`Pending actions for game ${gameId}:`, game.pendingActions);

    this.phaseManager.checkAndResolveNightPhase(gameId);
  }

  // Resolve night phase
  async resolveNightPhase(gameId) {
    return this.phaseManager.resolveNightPhase(gameId);
  }

  // Resolve resolution phase
  async resolveResolutionPhase(gameId) {
    return this.phaseManager.resolveResolutionPhase(gameId);
  }

  async resolveTaskPhase(gameId) {
    return this.phaseManager.resolveTaskPhase(gameId);
  }

  async resolveVotingPhase(gameId) {
    return this.phaseManager.resolveVotingPhase(gameId);
  }

  // Generate a task
  generateTask() {
    return this.taskManager.generateTask();
  }

  // Submit task answer
  submitTaskAnswer(gameId, data) {
    return this.taskManager.submitTaskAnswer(gameId, data);
  }

  // Submit vote
  submitVote(gameId, data) {
    return this.phaseManager.submitVote(gameId, data);
  }

  // End game
  async endGame(gameId) {
    console.log(`🎯 endGame called for game ${gameId}`);
    const game = this.games.get(gameId);
    if (!game) {
      console.log(`❌ endGame: Game ${gameId} not found`);
      return;
    }

    console.log(`🎯 Ending game ${gameId} with winners:`, game.winners);
    console.log(`🎯 Game staking required: ${game.stakingRequired}`);
    console.log(`🎯 Game onChainGameId: ${game.onChainGameId}`);

    // Clear any existing timers via PhaseManager
    this.phaseManager.clearGameTimers(gameId);

    game.phase = 'ended';
    game.status = 'completed';

    // Cleanup timeout tracking
    this.gameStartTimes.delete(gameId);
    this.phaseStartTimes.delete(gameId);
    game.timeLeft = 0;

    console.log(`Game ${gameId} ended. Winners:`, game.winners);

    // Update status in database to trigger 24-hour TTL cleanup
    await this.gameRepository.updateGameStatus(gameId, 'completed');

    // Handle reward distribution if staking was required
    if (game.stakingRequired) {
      await this.gameRewardService.handleRewardDistribution(gameId, game);
    } else {
      console.log(`💰 No staking required for game ${gameId}, skipping rewards`);
    }
    // Emit game state update to notify frontend that game has ended
    if (this.socketManager) {
      console.log(`📡 Emitting game state update for ended game ${gameId}`);
      this.socketManager.emitGameStateUpdate(gameId);
    } else {
      console.log(`⚠️ No socketManager available to emit game ended event`);
    }

    return game;
  }
}

module.exports = GameManager;
