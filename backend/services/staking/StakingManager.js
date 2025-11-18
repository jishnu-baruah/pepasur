const StakingService = require('./StakingService');

class StakingManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.stakingService = new StakingService();
    }

    async stakeForGame(gameId, playerAddress, roomCode) {
        try {
            const game = this.gameManager.getGame(gameId);
            if (!game) {
                throw new Error('Game not found');
            }

            if (game.roomCode !== roomCode) {
                throw new Error('Invalid room code');
            }

            if (!game.stakingRequired) {
                throw new Error('This game does not require staking');
            }

            // Use staking service to handle the stake with contract gameId
            const contractGameId = game.onChainGameId;
            if (!contractGameId) {
                throw new Error('No contract gameId available for staking');
            }

            const stakeResult = await this.stakingService.stakeForGame(contractGameId, playerAddress, roomCode);

            // Update game staking status
            game.stakingStatus = stakeResult.gameStatus;

            console.log(`💰 Player ${playerAddress} staked for game ${gameId}`);

            return stakeResult;
        } catch (error) {
            console.error('❌ Error staking for game:', error);
            throw error;
        }
    }

    isGameReadyToStart(gameId) {
        const game = this.gameManager.getGame(gameId);
        if (!game) {
            return false;
        }

        if (!game.stakingRequired) {
            return game.players.length >= game.minPlayers;
        }

        // For staking games, check if all players have staked using local game.playerStakes
        const allPlayersStaked = game.players.every(playerAddress => {
            const stakeKey = `${gameId}-${playerAddress}`;
            return game.playerStakes && game.playerStakes.has(stakeKey);
        });

        return game.players.length >= game.minPlayers && allPlayersStaked;
    }

    async recordPlayerStake(gameId, playerAddress, transactionHash) {
        console.log(`💰 recordPlayerStake called with:`, { gameId, playerAddress: typeof playerAddress === 'object' ? JSON.stringify(playerAddress) : playerAddress, transactionHash });

        const game = this.gameManager.getGame(gameId);
        if (!game) {
            throw new Error('Game not found');
        }

        // Ensure playerAddress is a string
        const addressString = typeof playerAddress === 'string' ? playerAddress : playerAddress?.address || String(playerAddress);

        const stakeKey = `${gameId}-${addressString}`;
        game.playerStakes.set(stakeKey, {
            playerAddress: addressString,
            transactionHash,
            stakedAt: Date.now(),
            amount: game.stakeAmount
        });

        // If this is the creator staking, set isReady=true in database
        if (addressString.toLowerCase() === game.creator.toLowerCase()) {
            console.log(`✅ Creator ${addressString} has staked - marking game ${gameId} as ready in database`);
            await this.gameManager.gameRepository.updateGameReady(gameId, true);
        }

        // Add player to game if not already in it
        if (!game.players.includes(addressString)) {
            game.players.push(addressString);
            console.log(`✅ Added player ${addressString} to game ${gameId}`);

            // Update MongoDB
            this.gameManager.gameRepository.syncPlayerToDatabase(gameId, addressString).catch(err => {
                console.error('❌ Error syncing player to database:', err);
            });

            // Notify all players in the game about the update
            if (this.gameManager.socketManager) {
                this.gameManager.socketManager.broadcastGameUpdate(gameId, {
                    type: 'player_staked',
                    playerAddress: addressString,
                    playersCount: game.players.length,
                    minPlayers: game.minPlayers
                });
            }
        }

        console.log(`💰 Recorded stake for player ${addressString} in game ${gameId}`);

        // Also store the game in StakingService if it doesn't exist
        const contractGameId = game.onChainGameId;
        if (contractGameId && !this.stakingService.stakedGames.has(contractGameId)) {
            console.log(`💰 Creating game in StakingService with contract gameId: ${contractGameId}`);
            this.stakingService.stakedGames.set(contractGameId, {
                roomCode: game.roomCode,
                players: [],
                totalStaked: 0,
                status: 'waiting',
                createdAt: game.createdAt || Date.now()
            });
        }

        // Add player to StakingService game if it exists
        if (contractGameId && this.stakingService.stakedGames.has(contractGameId)) {
            const stakingGame = this.stakingService.stakedGames.get(contractGameId);
            if (!stakingGame.players.includes(playerAddress)) {
                stakingGame.players.push(playerAddress);
                stakingGame.totalStaked += game.stakeAmount;
                console.log(`💰 Added player ${playerAddress} to StakingService game ${contractGameId}`);
            }
        }

        // Check if game is ready to start
        this.checkStakingStatus(gameId);
    }

    getGameStakingInfo(gameId) {
        const game = this.gameManager.getGame(gameId);
        if (!game) {
            return null;
        }

        // Use contract gameId for staking service
        const contractGameId = game.onChainGameId;
        if (!contractGameId) {
            return null;
        }

        return this.stakingService.getGameStakingInfo(contractGameId);
    }

    async checkStakingStatus(gameId) {
        console.log(`🔍 checkStakingStatus called for game ${gameId}`);
        const game = this.gameManager.getGame(gameId);
        if (!game || !game.stakingRequired) {
            console.log(`❌ checkStakingStatus: Game ${gameId} not found or staking not required`);
            return;
        }

        // Check if all players have staked using local game.playerStakes
        const allPlayersStaked = game.players.every(playerAddress => {
            const stakeKey = `${gameId}-${playerAddress}`;
            return game.playerStakes && game.playerStakes.has(stakeKey);
        });

        const stakedCount = game.playerStakes ? game.playerStakes.size : 0;
        const isReady = game.players.length >= game.minPlayers && allPlayersStaked;

        console.log(`🔍 checkStakingStatus for game ${gameId}:`, {
            players: game.players.length,
            minPlayers: game.minPlayers,
            stakedPlayers: stakedCount,
            allPlayersStaked: allPlayersStaked,
            isReady: isReady,
            phase: game.phase
        });

        // If staking is complete and game is still in lobby, start the game with a delay
        if (isReady && game.phase === 'lobby') {
            console.log(`🎯 Staking complete for game ${gameId}, starting game in 3 seconds...`);
            // Add a 3-second delay to ensure all players have time to see role assignment
            setTimeout(async () => {
                await this.gameManager.startGame(gameId);
            }, 3000);
        } else {
            console.log(`⏳ Game ${gameId} not ready to start yet:`, {
                isReady: isReady,
                phase: game.phase,
                players: game.players.length,
                staked: stakedCount
            });
        }
    }

    getPlayerStakeInfo(gameId, playerAddress) {
        const game = this.gameManager.getGame(gameId);
        if (!game) {
            return null;
        }

        // Use contract gameId for staking service
        const contractGameId = game.onChainGameId;
        if (!contractGameId) {
            return null;
        }

        return this.stakingService.getPlayerStakeInfo(contractGameId, playerAddress);
    }

    async checkPlayerBalance(playerAddress) {
        return await this.stakingService.checkBalance(playerAddress);
    }
}

module.exports = StakingManager;


