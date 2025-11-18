const express = require('express');
const GameStateFormatter = require('../services/game/GameStateFormatter');

module.exports = (gameManagerInstance, aptosService) => {
  const router = express.Router();
  const gameManager = gameManagerInstance; // Use the passed instance

  /**
   * @swagger
   * /api/game/create:
   *   post:
   *     summary: Create a new game
   *     description: Creates a new game instance, optionally on-chain if a stake amount is provided.
   *     tags:
   *       - Game
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - creatorAddress
   *             properties:
   *               creatorAddress:
   *                 type: string
   *                 description: The Aptos address of the game creator.
   *               stakeAmount:
   *                 type: number
   *                 description: The amount of APT to stake for the game (in Octas). If provided, the game is created on-chain.
   *               minPlayers:
   *                 type: number
   *                 description: The minimum number of players required to start the game.
   *               isPublic:
   *                 type: boolean
   *                 description: Whether the game is public and discoverable.
   *               settings:
   *                 type: object
   *                 description: Optional custom game settings (e.g., nightPhaseDuration).
   *     responses:
   *       200:
   *         description: Game created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 gameId:
   *                   type: string
   *                   example: "game_12345"
   *                 roomCode:
   *                   type: string
   *                   example: "ABCDEF"
   *                 contractGameId:
   *                   type: string
   *                   example: "0x1::game::Game<0x1::aptos_coin::AptosCoin>"
   *                 createTxHash:
   *                   type: string
   *                   example: "0xabcdef1234567890..."
   *                 isPublic:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Game created successfully"
   *       400:
   *         description: Bad request, e.g., missing creator address.
   *       500:
   *         description: Internal server error.
   */
  router.post('/create', async (req, res) => {
    try {
      const { creatorAddress, stakeAmount, minPlayers, isPublic, settings } = req.body;

      if (!creatorAddress) {
        return res.status(400).json({ error: 'Creator address is required' });
      }

      // For staking games, create the contract game first
      if (stakeAmount) {
        console.log(`🎮 Creating game and contract for creator: ${creatorAddress}`);
        console.log(`💰 Stake amount: ${stakeAmount} APT`);
        console.log(`🌐 Public: ${isPublic ? 'YES' : 'NO'}`);
        if (settings) {
          console.log(`⚙️ Custom settings:`, settings);
        }

        // Step 1: Create the game on-chain (use settings.minPlayers if provided)
        const effectiveMinPlayers = settings?.minPlayers || minPlayers || 4;
        const createTxHash = await aptosService.createGame(stakeAmount, effectiveMinPlayers);
        console.log(`✅ Game created, transaction: ${createTxHash}`);

        // Step 2: Extract gameId from the create transaction
        const contractGameId = await aptosService.extractGameIdFromTransaction(createTxHash);
        console.log(`🎮 Extracted contract gameId: ${contractGameId}`);

        // Step 3: Create room in game manager with contract gameId and public flag
        const { gameId, roomCode } = await gameManager.createGame(
          creatorAddress,
          stakeAmount,
          minPlayers,
          contractGameId,
          isPublic || false,
          settings // Pass custom settings
        );

        res.json({
          success: true,
          gameId,
          roomCode,
          contractGameId,
          createTxHash,
          isPublic: isPublic || false,
          message: 'Game created successfully'
        });
      } else {
        // Non-staking game
        const { gameId, roomCode } = await gameManager.createGame(
          creatorAddress,
          stakeAmount,
          minPlayers,
          null,
          isPublic || false,
          settings // Pass custom settings
        );

        res.json({
          success: true,
          gameId,
          roomCode,
          isPublic: isPublic || false,
          message: 'Game created successfully'
        });
      }
    } catch (error) {
      console.error('Error creating game:', error);
      res.status(500).json({ error: error.message });
    }
  });



  /**
   * @swagger
   * /api/game/create-and-join:
   *   post:
   *     summary: Create a new game and join it as the creator
   *     description: Creates a new game instance on-chain and registers the creator as a player.
   *     tags:
   *       - Game
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - creatorAddress
   *               - stakeAmount
   *             properties:
   *               creatorAddress:
   *                 type: string
   *                 description: The Aptos address of the game creator.
   *               stakeAmount:
   *                 type: number
   *                 description: The amount of APT to stake for the game (in Octas).
   *               minPlayers:
   *                 type: number
   *                 description: The minimum number of players required to start the game.
   *               isPublic:
   *                 type: boolean
   *                 description: Whether the game is public and discoverable.
   *               settings:
   *                 type: object
   *                 description: Optional custom game settings (e.g., nightPhaseDuration).
   *     responses:
   *       200:
   *         description: Game created and creator joined successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 gameId:
   *                   type: string
   *                   example: "game_12345"
   *                 contractGameId:
   *                   type: string
   *                   example: "0x1::game::Game<0x1::aptos_coin::AptosCoin>"
   *                 roomCode:
   *                   type: string
   *                   example: "ABCDEF"
   *                 isPublic:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Game created successfully. Creator can now stake to join."
   *       400:
   *         description: Bad request, e.g., missing creator address or invalid stake amount.
   *       500:
   *         description: Internal server error.
   */
  router.post('/create-and-join', async (req, res) => {
    try {
      const { creatorAddress, stakeAmount, minPlayers, isPublic, settings } = req.body;

      if (!creatorAddress || !stakeAmount) {
        return res.status(400).json({ error: 'Creator address and stake amount are required' });
      }

      const MIN_STAKE_AMOUNT_OCTAS = 100000; // 0.001 APT
      if (typeof stakeAmount !== 'number' || stakeAmount < MIN_STAKE_AMOUNT_OCTAS) {
        return res.status(400).json({ error: `Stake amount must be at least ${MIN_STAKE_AMOUNT_OCTAS / 100000000} APT` });
      }

      console.log(`🎮 Creating game and joining for creator: ${creatorAddress}`);
      console.log(`💰 Stake amount: ${stakeAmount} Octas (${stakeAmount / 100000000} APT)`);
      console.log(`🌐 Public: ${isPublic ? 'YES' : 'NO'}`);
      if (settings) {
        console.log(`⚙️ Custom settings:`, settings);
      }

      // Step 1: Create the game on-chain with custom stake amount (use settings.minPlayers if provided)
      const effectiveMinPlayers = settings?.minPlayers || minPlayers || 4;
      const contractGameId = await aptosService.createGame(stakeAmount, effectiveMinPlayers);
      console.log(`✅ Game created on-chain, contract gameId: ${contractGameId}`);

      // Step 2: Create room in game manager (user will stake from frontend)
      const { gameId: managerGameId, roomCode } = await gameManager.createGame(
        creatorAddress,
        stakeAmount,
        minPlayers || 4,
        contractGameId,
        isPublic || false,
        settings // Pass custom settings to game manager
      );

      res.json({
        success: true,
        gameId: managerGameId, // Use game manager's gameId for socket communication
        contractGameId: contractGameId, // Keep contract gameId for staking transaction
        roomCode,
        isPublic: isPublic || false,
        message: 'Game created successfully. Creator can now stake to join.'
      });
    } catch (error) {
      console.error('Error creating and joining game:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/game/{gameId}:
   *   get:
   *     summary: Get game state
   *     description: Retrieves the current state of a specific game. Can include player-specific roles if `playerAddress` is provided.
   *     tags:
   *       - Game
   *     parameters:
   *       - in: path
   *         name: gameId
   *         schema:
   *           type: string
   *         required: true
   *         description: The ID of the game to retrieve.
   *       - in: query
   *         name: playerAddress
   *         schema:
   *           type: string
   *         description: Optional. The Aptos address of the player requesting the game state. If provided, player-specific roles will be included.
   *     responses:
   *       200:
   *         description: Game state retrieved successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 game:
   *                   type: object
   *                   description: The game object, potentially with player-specific roles.
   *       404:
   *         description: Game not found.
   *       500:
   *         description: Internal server error.
   */
  router.get('/:gameId', (req, res) => {
    try {
      const { gameId } = req.params;
      const { playerAddress } = req.query; // Get player address from query params

      let gameData = gameManager.getGame(gameId); // Get the raw game object
      if (!gameData) {
        return res.status(404).json({ error: 'Game not found' });
      }

      let game;
      if (playerAddress) {
        // Include player's role if address provided
        game = GameStateFormatter.getGameStateWithPlayerRole(gameId, playerAddress, gameData);
      } else {
        // Public game state without roles
        game = GameStateFormatter.getPublicGameState(gameId, gameData);
      }

      res.json({
        success: true,
        game
      });
    } catch (error) {
      console.error('Error getting game:', error);
      res.status(500).json({ error: error.message });
    }
  });



  /**
   * @swagger
   * /api/game/join-by-code:
   *   post:
   *     summary: Join a game using a room code
   *     description: Allows a player to join an existing game by providing a valid room code.
   *     tags:
   *       - Game
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - roomCode
   *               - playerAddress
   *             properties:
   *               roomCode:
   *                 type: string
   *                 description: The 6-character alphanumeric room code of the game.
   *               playerAddress:
   *                 type: string
   *                 description: The Aptos address of the player joining the game.
   *     responses:
   *       200:
   *         description: Player joined successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 game:
   *                   type: object
   *                   description: The public state of the game after the player has joined.
   *                 message:
   *                   type: string
   *                   example: "Player joined successfully"
   *       400:
   *         description: Bad request, e.g., invalid room code or missing player address.
   *       500:
   *         description: Internal server error.
   */
  router.post('/join-by-code', async (req, res) => {
    try {
      const { roomCode, playerAddress } = req.body;

      if (!roomCode || !playerAddress) {
        return res.status(400).json({ error: 'Room code and player address are required' });
      }

      if (typeof roomCode !== 'string' || !/^[A-Z0-9]{6}$/.test(roomCode)) {
        return res.status(400).json({ error: 'Invalid room code format. Must be a 6-character alphanumeric string.' });
      }

      const game = gameManager.joinGameByRoomCode(roomCode, playerAddress);

      res.json({
        success: true,
        game: GameStateFormatter.getPublicGameState(game.gameId, game),
        message: 'Player joined successfully'
      });
    } catch (error) {
      console.error('Error joining game by room code:', error);
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/game/leave:
   *   post:
   *     summary: Leave a game
   *     description: Allows a player to leave a game, typically during the lobby phase. If the creator leaves, the game might be cancelled.
   *     tags:
   *       - Game
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - gameId
   *               - playerAddress
   *             properties:
   *               gameId:
   *                 type: string
   *                 description: The ID of the game the player is leaving.
   *               playerAddress:
   *                 type: string
   *                 description: The Aptos address of the player leaving the game.
   *     responses:
   *       200:
   *         description: Player left successfully, or game cancelled.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 cancelled:
   *                   type: boolean
   *                   example: false
   *                 remainingPlayers:
   *                   type: array
   *                   items:
   *                     type: string
   *                   example: ["0xplayer2", "0xplayer3"]
   *                 message:
   *                   type: string
   *                   example: "Player left successfully"
   *       400:
   *         description: Bad request, e.g., missing game ID or player address.
   *       500:
   *         description: Internal server error.
   */
  router.post('/leave', async (req, res) => {
    try {
      const { gameId, playerAddress } = req.body;

      if (!gameId || !playerAddress) {
        return res.status(400).json({ error: 'Game ID and player address are required' });
      }

      console.log(`👋 Leave game request: Player ${playerAddress} leaving game ${gameId}`);

      const result = await gameManager.leaveGame(gameId, playerAddress);

      res.json({
        success: true,
        cancelled: result.cancelled,
        remainingPlayers: result.remainingPlayers,
        message: result.cancelled
          ? 'Game cancelled'
          : 'Player left successfully'
      });
    } catch (error) {
      console.error('Error leaving game:', error);
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/game/record-stake:
   *   post:
   *     summary: Record player stake
   *     description: Records a player's stake in a game after a successful on-chain staking transaction.
   *     tags:
   *       - Game
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - gameId
   *               - playerAddress
   *               - transactionHash
   *             properties:
   *               gameId:
   *                 type: string
   *                 description: The ID of the game.
   *               playerAddress:
   *                 type: string
   *                 description: The Aptos address of the player who staked.
   *               transactionHash:
   *                 type: string
   *                 description: The hash of the on-chain staking transaction.
   *     responses:
   *       200:
   *         description: Stake recorded successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Stake recorded successfully"
   *       400:
   *         description: Bad request, e.g., missing parameters.
   *       500:
   *         description: Internal server error.
   */
  router.post('/record-stake', async (req, res) => {
    try {
      const { gameId, playerAddress, transactionHash } = req.body;

      console.log('📥 record-stake request received:', {
        gameId,
        playerAddress,
        playerAddressType: typeof playerAddress,
        transactionHash
      });

      if (!gameId || !playerAddress || !transactionHash) {
        return res.status(400).json({ error: 'Game ID, player address, and transaction hash are required' });
      }

      await gameManager.recordPlayerStake(gameId, playerAddress, transactionHash);

      const game = gameManager.getGame(gameId);
      console.log('✅ Stake recorded. Game now has players:', game?.players);

      res.json({
        success: true,
        message: 'Stake recorded successfully'
      });
    } catch (error) {
      console.error('Error recording stake:', error);
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/game/room/{roomCode}:
   *   get:
   *     summary: Get game by room code
   *     description: Retrieves the public state of a game using its room code.
   *     tags:
   *       - Game
   *     parameters:
   *       - in: path
   *         name: roomCode
   *         schema:
   *           type: string
   *         required: true
   *         description: The 6-character alphanumeric room code.
   *     responses:
   *       200:
   *         description: Game state retrieved successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 game:
   *                   type: object
   *                   description: The public game object.
   *       400:
   *         description: Bad request, e.g., invalid room code format.
   *       404:
   *         description: Room code not found.
   *       500:
   *         description: Internal server error.
   */
  router.get('/room/:roomCode', (req, res) => {
    try {
      const { roomCode } = req.params;

      if (typeof roomCode !== 'string' || !/^[A-Z0-9]{6}$/.test(roomCode)) {
        return res.status(400).json({ error: 'Invalid room code format. Must be a 6-character alphanumeric string.' });
      }

      const game = gameManager.getGameByRoomCode(roomCode);

      if (!game) {
        return res.status(404).json({ error: 'Room code not found' });
      }

      res.json({
        success: true,
        game: GameStateFormatter.getPublicGameState(game.gameId, game)
      });
    } catch (error) {
      console.error('Error getting game by room code:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/game/{gameId}/player/eliminate:
   *   post:
   *     summary: Eliminate a player from the game
   *     description: Marks a player as eliminated in the specified game. Checks win conditions after elimination.
   *     tags:
   *       - Game
   *     parameters:
   *       - in: path
   *         name: gameId
   *         schema:
   *           type: string
   *         required: true
   *         description: The ID of the game.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - playerAddress
   *             properties:
   *               playerAddress:
   *                 type: string
   *                 description: The Aptos address of the player to eliminate.
   *     responses:
   *       200:
   *         description: Player eliminated successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Player eliminated successfully"
   *       400:
   *         description: Bad request, e.g., player not in game or already eliminated.
   *       404:
   *         description: Game not found.
   *       500:
   *         description: Internal server error.
   */
  router.post('/:gameId/player/eliminate', (req, res) => {
    try {
      const { gameId } = req.params;
      const { playerAddress } = req.body;

      const game = gameManager.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      if (!game.players.includes(playerAddress)) {
        return res.status(400).json({ error: 'Player not in game' });
      }

      if (game.eliminated.includes(playerAddress)) {
        return res.status(400).json({ error: 'Player already eliminated' });
      }

      game.eliminated.push(playerAddress);

      // Check win conditions
      if (gameManager.phaseManager.checkWinConditions(game)) {
        gameManager.endGame(gameId);
      }

      res.json({
        success: true,
        message: 'Player eliminated successfully'
      });
    } catch (error) {
      console.error('Error eliminating player:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/game/{gameId}/ready:
   *   post:
   *     summary: Signal player readiness for game timer
   *     description: Allows a player to signal their readiness, which can trigger the game timer if all players are ready.
   *     tags:
   *       - Game
   *     parameters:
   *       - in: path
   *         name: gameId
   *         schema:
   *           type: string
   *         required: true
   *         description: The ID of the game.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - playerAddress
   *             properties:
   *               playerAddress:
   *                 type: string
   *                 description: The Aptos address of the player signaling readiness.
   *     responses:
   *       200:
   *         description: Player ready signal received.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Player ready signal received"
   *       400:
   *         description: Bad request, e.g., missing game ID or player address.
   *       500:
   *         description: Internal server error.
   */
  router.post('/:gameId/ready', (req, res) => {
    try {
      const { gameId } = req.params;
      const { playerAddress } = req.body;

      if (!gameId) {
        return res.status(400).json({ error: 'Game ID is required' });
      }

      if (!playerAddress) {
        return res.status(400).json({ error: 'Player address is required' });
      }

      gameManager.phaseManager.startTimerWhenReady(gameId, playerAddress);

      res.json({
        success: true,
        message: 'Player ready signal received'
      });
    } catch (error) {
      console.error('Error processing ready signal:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/game/{gameId}/action/night:
   *   post:
   *     summary: Submit a night action for a player
   *     description: Allows a player to submit their action during the night phase of the game.
   *     tags:
   *       - Game
   *     parameters:
   *       - in: path
   *         name: gameId
   *         schema:
   *           type: string
   *         required: true
   *         description: The ID of the game.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - playerAddress
   *               - action
   *             properties:
   *               playerAddress:
   *                 type: string
   *                 description: The Aptos address of the player submitting the action.
   *               action:
   *                 type: object
   *                 description: The specific action data (e.g., target, ability).
   *               commit:
   *                 type: string
   *                 description: Optional. A commit hash for the action, if using commit-reveal.
   *     responses:
   *       200:
   *         description: Night action submitted successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Night action submitted successfully"
   *       400:
   *         description: Bad request, e.g., invalid action or game state.
   *       500:
   *         description: Internal server error.
   */
  router.post('/:gameId/action/night', (req, res) => {
    try {
      const { gameId } = req.params;
      const { playerAddress, action, commit } = req.body;

      gameManager.submitNightAction(gameId, { playerAddress, action, commit });

      res.json({
        success: true,
        message: 'Night action submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting night action:', error);
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/game/{gameId}/task/submit:
   *   post:
   *     summary: Submit a task answer for a player
   *     description: Allows a player to submit their answer to a task during the task phase.
   *     tags:
   *       - Game
   *     parameters:
   *       - in: path
   *         name: gameId
   *         schema:
   *           type: string
   *         required: true
   *         description: The ID of the game.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - playerAddress
   *               - answer
   *             properties:
   *               playerAddress:
   *                 type: string
   *                 description: The Aptos address of the player submitting the answer.
   *               answer:
   *                 type: string
   *                 description: The player's answer to the task.
   *     responses:
   *       200:
   *         description: Task answer submitted successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 correct:
   *                   type: boolean
   *                   example: true
   *                 gameComplete:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Task answer submitted successfully"
   *       400:
   *         description: Bad request, e.g., invalid answer or game state.
   *       500:
   *         description: Internal server error.
   */
  router.post('/:gameId/task/submit', (req, res) => {
    try {
      const { gameId } = req.params;
      const { playerAddress, answer } = req.body;

      const result = gameManager.submitTaskAnswer(gameId, { playerAddress, answer });

      res.json({
        success: true,
        correct: result.correct,
        gameComplete: result.gameComplete,
        message: 'Task answer submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting task answer:', error);
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/game/{gameId}/vote/submit:
   *   post:
   *     summary: Submit a vote for a player
   *     description: Allows a player to cast their vote during the voting phase.
   *     tags:
   *       - Game
   *     parameters:
   *       - in: path
   *         name: gameId
   *         schema:
   *           type: string
   *         required: true
   *         description: The ID of the game.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - playerAddress
   *               - vote
   *             properties:
   *               playerAddress:
   *                 type: string
   *                 description: The Aptos address of the player submitting the vote.
   *               vote:
   *                 type: string
   *                 description: The Aptos address of the player being voted for.
   *     responses:
   *       200:
   *         description: Vote submitted successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Vote submitted successfully"
   *       400:
   *         description: Bad request, e.g., invalid vote or game state.
   *       500:
   *         description: Internal server error.
   */
  router.post('/:gameId/vote/submit', (req, res) => {
    try {
      const { gameId } = req.params;
      const { playerAddress, vote } = req.body;

      gameManager.submitVote(gameId, { playerAddress, vote });

      res.json({
        success: true,
        message: 'Vote submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting vote:', error);
      res.status(400).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/game/{gameId}/history:
   *   get:
   *     summary: Get game history
   *     description: Retrieves the historical data for a completed game.
   *     tags:
   *       - Game
   *     parameters:
   *       - in: path
   *         name: gameId
   *         schema:
   *           type: string
   *         required: true
   *         description: The ID of the game to retrieve history for.
   *     responses:
   *       200:
   *         description: Game history retrieved successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 history:
   *                   type: object
   *                   description: The game history object.
   *       404:
   *         description: Game not found.
   *       500:
   *         description: Internal server error.
   */
  router.get('/:gameId/history', (req, res) => {
    try {
      const { gameId } = req.params;
      const game = gameManager.getGame(gameId);

      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const history = {
        gameId,
        creator: game.creator,
        players: game.players,
        eliminated: game.eliminated,
        winners: game.winners,
        day: game.day,
        phase: game.phase,
        startedAt: game.startedAt,
        status: game.status
      };

      res.json({
        success: true,
        history
      });
    } catch (error) {
      console.error('Error getting game history:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/game/active:
   *   get:
   *     summary: Get all active games
   *     description: Retrieves a list of all currently active games.
   *     tags:
   *       - Game
   *     responses:
   *       200:
   *         description: List of active games retrieved successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 games:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       gameId:
   *                         type: string
   *                       creator:
   *                         type: string
   *                       players:
   *                         type: number
   *                       maxPlayers:
   *                         type: number
   *                       stakeAmount:
   *                         type: string
   *                       phase:
   *                         type: string
   *                       day:
   *                         type: number
   *                       startedAt:
   *                         type: number
   *       500:
   *         description: Internal server error.
   */
  router.get('/active', (req, res) => {
    try {
      const games = [];

      for (const [gameId, game] of gameManager.games.entries()) {
        if (game.status === 'active') {
          games.push({
            gameId,
            creator: game.creator,
            players: game.players.length,
            maxPlayers: game.maxPlayers,
            stakeAmount: game.stakeAmount,
            phase: game.phase,
            day: game.day,
            startedAt: game.startedAt
          });
        }
      }

      res.json({
        success: true,
        games
      });
    } catch (error) {
      console.error('Error getting active games:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/game/public/lobbies:
   *   get:
   *     summary: Get all public lobbies
   *     description: Retrieves a list of all public game lobbies, including calculated win probabilities.
   *     tags:
   *       - Game
   *     responses:
   *       200:
   *         description: List of public lobbies retrieved successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 lobbies:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       gameId:
   *                         type: string
   *                       creator:
   *                         type: string
   *                       playerCount:
   *                         type: number
   *                       maxPlayers:
   *                         type: number
   *                       stakeAmount:
   *                         type: string
   *                       phase:
   *                         type: string
   *                       day:
   *                         type: number
   *                       startedAt:
   *                         type: number
   *                       mafiaWinPercent:
   *                         type: number
   *                       nonMafiaWinPercent:
   *                         type: number
   *       500:
   *         description: Internal server error.
   */
  router.get('/public/lobbies', async (req, res) => {
    try {
      const lobbies = await gameManager.gameRepository.getPublicLobbies();

      // Calculate win probabilities for each lobby
      const lobbiesWithProbabilities = lobbies.map(lobby => {
        const totalPot = lobby.stakeAmount * lobby.playerCount;
        const netPot = totalPot * 0.98; // After 2% house cut

        // Assuming 1 mafia, rest are non-mafia
        const mafiaCount = 1;
        const nonMafiaCount = lobby.minPlayers - mafiaCount;

        const mafiaWinPercent = lobby.playerCount > 0
          ? Math.round(((netPot / mafiaCount) / lobby.stakeAmount - 1) * 100)
          : 0;
        const nonMafiaWinPercent = lobby.playerCount > 0
          ? Math.round(((netPot / nonMafiaCount) / lobby.stakeAmount - 1) * 100)
          : 0;

        return {
          ...lobby,
          playerCount: lobby.currentPlayers.length,
          mafiaWinPercent,
          nonMafiaWinPercent
        };
      });

      res.json({
        success: true,
        lobbies: lobbiesWithProbabilities
      });
    } catch (error) {
      console.error('Error getting public lobbies:', error);
      res.status(500).json({ error: error.message });
    }
  });



  /**
   * @swagger
   * /api/game/{gameId}/settings:
   *   patch:
   *     summary: Update game settings
   *     description: Allows the game creator to update specific settings for a game, typically during the lobby phase.
   *     tags:
   *       - Game
   *     parameters:
   *       - in: path
   *         name: gameId
   *         schema:
   *           type: string
   *         required: true
   *         description: The ID of the game whose settings are to be updated.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - creatorAddress
   *               - settings
   *             properties:
   *               creatorAddress:
   *                 type: string
   *                 description: The Aptos address of the game creator.
   *               settings:
   *                 type: object
   *                 description: An object containing the settings to update (e.g., nightPhaseDuration, maxTaskCount).
   *     responses:
   *       200:
   *         description: Game settings updated successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 settings:
   *                   type: object
   *                   description: The updated game settings.
   *       400:
   *         description: Bad request, e.g., missing creator address or settings, or not the creator.
   *       500:
   *         description: Internal server error.
   */
  router.patch('/:gameId/settings', async (req, res) => {
    try {
      const { gameId } = req.params;
      const { creatorAddress, settings } = req.body;

      console.log('⚙️ Update settings request:', { gameId, creatorAddress, settings });

      if (!creatorAddress) {
        return res.status(400).json({ error: 'Creator address is required' });
      }

      if (!settings) {
        return res.status(400).json({ error: 'Settings are required' });
      }

      // Update database
      const result = await gameManager.gameRepository.updateGameSettings(gameId, creatorAddress, settings);

      // Update in-memory game as well
      const game = gameManager.getGame(gameId);
      if (game) {
        // Extract isPublic if present
        const { isPublic, ...actualSettings } = settings;

        // Update settings
        game.settings = {
          ...game.settings,
          ...actualSettings
        };

        // Update isPublic if provided
        if (typeof isPublic === 'boolean') {
          game.isPublic = isPublic;
        }

        console.log('💾 In-memory game also updated');
      }

      console.log('✅ Settings updated successfully:', result);

      res.json({
        success: true,
        settings: result.settings,
        isPublic: result.isPublic  // Include isPublic in response
      });
    } catch (error) {
      console.error('❌ Error updating game settings:', error.message);
      console.error('❌ Full error:', error);
      res.status(400).json({ error: error.message });
    }
  });



  return router;
};
