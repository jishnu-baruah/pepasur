const Game = require('../../models/Game');
const { withDbTimeout } = require('../../utils/dbUtils');

class GameRepository {
    constructor() {
    }

    async createGame(gameData) {
        try {
            const dbGame = new Game(gameData);

            // Use withDbTimeout to add a timeout
            await withDbTimeout(dbGame.save());
            console.log(`💾 Game saved to database: ${gameData.gameId}`);
            return dbGame;
        } catch (error) {
            console.warn('⚠️ Could not save game to database:', error.message);
            // Continue even if database save fails - game is already in memory
            return null;
        }
    }

    async syncPlayerToDatabase(gameId, playerAddress) {
        try {
            const dbGame = await withDbTimeout(Game.findOne({ gameId }));

            if (dbGame && !dbGame.currentPlayers.includes(playerAddress)) {
                dbGame.currentPlayers.push(playerAddress);
                await withDbTimeout(dbGame.save());
                console.log(`💾 Synced player ${playerAddress} to database for game ${gameId}`);
            }
        } catch (error) {
            console.warn('⚠️ Could not sync player to database:', error.message);
            // Continue - player is already in memory
        }
    }

    async updateGameStatus(gameId, status) {
        try {
            const dbGame = await withDbTimeout(Game.findOne({ gameId }));

            if (dbGame) {
                dbGame.status = status;
                await withDbTimeout(dbGame.save());
                console.log(`💾 Updated game ${gameId} status to ${status} in database`);
            }
        } catch (error) {
            console.warn('⚠️ Could not update game status in database:', error.message);
            // Continue - status is already tracked in memory
        }
    }

    async getPublicLobbies() {
        try {
            // Try to get from database first (with 2-second timeout)
            const dbLobbies = await withDbTimeout(Game.getPublicLobbies());
            return dbLobbies;
        } catch (error) {
            console.warn('⚠️ Database not available, fetching from in-memory games:', error.message);
            return [];
        }
    }

    async removePlayer(gameId, playerAddress) {
        try {
            const dbGame = await Game.findOne({ gameId });
            if (dbGame) {
                const playerIdx = dbGame.currentPlayers.indexOf(playerAddress);
                if (playerIdx !== -1) {
                    dbGame.currentPlayers.splice(playerIdx, 1);
                    await dbGame.save();
                    console.log(`💾 Removed player ${playerAddress} from database for game ${gameId}`);
                }
            }
        } catch (error) {
            console.error('❌ Error removing player from database:', error);
        }
    }

    async toggleVisibility(gameId, isPublic) {
        try {
            const dbGame = await withDbTimeout(Game.findOne({ gameId }));

            if (dbGame) {
                dbGame.isPublic = isPublic;
                await withDbTimeout(dbGame.save());
                console.log(`💾 Toggled visibility for game ${gameId} to ${isPublic ? 'PUBLIC' : 'PRIVATE'}`);
            }
        } catch (dbError) {
            console.warn(`⚠️ Could not update database, but in-memory game updated:`, dbError.message);
            // Continue even if database update fails
        }
    }

    async updateSettings(gameId, settings) {
        try {
            const dbGame = await withDbTimeout(Game.findOne({ gameId }));

            if (dbGame) {
                dbGame.settings = settings;
                await withDbTimeout(dbGame.save());
                console.log(`💾 Updated settings in database for game ${gameId}`);
            }
        } catch (dbError) {
            console.warn(`⚠️ Could not update database, but in-memory game updated:`, dbError.message);
            // Continue even if database update fails
        }
    }

    async updateGameReady(gameId, isReady) {
        try {
            const dbGame = await Game.findOne({ gameId });
            if (dbGame) {
                dbGame.isReady = isReady;
                await dbGame.save();
                console.log(`💾 Game ${gameId} marked as ready (isReady=${isReady}) in database`);
            }
        } catch (error) {
            console.error('❌ Error setting isReady flag in database:', error);
        }
    }

    // Toggle game visibility (public/private)
    async toggleGameVisibility(gameId, creatorAddress) {
        try {
            const dbGame = await withDbTimeout(Game.findOne({ gameId }));
            if (!dbGame) {
                throw new Error('Game not found');
            }

            // Normalize addresses for comparison (case-insensitive)
            const normalizeAddress = (addr) => {
                if (!addr) return '';
                return addr.toLowerCase().replace(/^0x/, '');
            };

            if (normalizeAddress(dbGame.creator) !== normalizeAddress(creatorAddress)) {
                console.error(`❌ Creator mismatch: dbGame.creator=${dbGame.creator}, creatorAddress=${creatorAddress}`);
                throw new Error('Only the creator can change visibility');
            }

            if (dbGame.phase !== 'lobby') {
                throw new Error('Cannot change visibility after game has started');
            }

            dbGame.isPublic = !dbGame.isPublic;
            await withDbTimeout(dbGame.save());

            return { success: true, isPublic: dbGame.isPublic };
        } catch (error) {
            console.error('❌ Error toggling game visibility:', error);
            throw error;
        }
    }

    // Validate game settings
    validateGameSettings(settings) {
        const validationRules = {
            nightPhaseDuration: { min: 1, max: 120, name: 'Night Phase Duration' },
            resolutionPhaseDuration: { min: 1, max: 60, name: 'Resolution Phase Duration' },
            taskPhaseDuration: { min: 1, max: 180, name: 'Task Phase Duration' },
            votingPhaseDuration: { min: 1, max: 60, name: 'Voting Phase Duration' },
            maxTaskCount: { min: 2, max: 20, name: 'Max Task Count' }
        };

        const errors = [];

        for (const [key, value] of Object.entries(settings)) {
            if (validationRules[key]) {
                const rule = validationRules[key];

                // Check if value is a number
                if (typeof value !== 'number' || isNaN(value)) {
                    errors.push(`${rule.name} must be a valid number`);
                    continue;
                }

                // Check min/max bounds
                if (value < rule.min) {
                    errors.push(`${rule.name} must be at least ${rule.min} seconds`);
                }
                if (value > rule.max) {
                    errors.push(`${rule.name} cannot exceed ${rule.max} seconds`);
                }
            }
        }

        if (errors.length > 0) {
            throw new Error(`Invalid settings: ${errors.join(', ')}`);
        }
    }

    // Update game settings (creator only, lobby phase only)
    async updateGameSettings(gameId, creatorAddress, settings) {
        try {
            const dbGame = await withDbTimeout(Game.findOne({ gameId }));
            if (!dbGame) {
                throw new Error('Game not found');
            }

            // Normalize addresses for comparison (case-insensitive)
            const normalizeAddress = (addr) => {
                if (!addr) return '';
                return addr.toLowerCase().replace(/^0x/, '');
            };

            if (normalizeAddress(dbGame.creator) !== normalizeAddress(creatorAddress)) {
                console.error(`❌ Creator mismatch: dbGame.creator=${dbGame.creator}, creatorAddress=${creatorAddress}`);
                throw new Error('Only the creator can update settings');
            }

            if (dbGame.phase !== 'lobby') {
                throw new Error('Cannot update settings after game has started');
            }

            // Extract isPublic if present (it's a game property, not a setting)
            const { isPublic, ...actualSettings } = settings;

            // Validate settings before updating (only the actual settings, not isPublic)
            this.validateGameSettings(actualSettings);

            // Update settings (merge with existing settings)
            // Note: minPlayers is NOT part of settings - it's a separate game property
            dbGame.settings = {
                ...dbGame.settings,
                ...actualSettings
            };

            // Update isPublic if provided (as a separate game property)
            if (typeof isPublic === 'boolean') {
                dbGame.isPublic = isPublic;
                console.log(`🌐 Updated game visibility for ${gameId}: ${isPublic ? 'PUBLIC' : 'PRIVATE'}`);
            }

            console.log(`⚙️ Updated settings for game ${gameId}:`, dbGame.settings);
            await withDbTimeout(dbGame.save());

            return {
                success: true,
                settings: dbGame.settings,
                isPublic: dbGame.isPublic  // Return isPublic separately
            };
        } catch (error) {
            console.error('❌ Error updating game settings:', error);
            throw error;
        }
    }

    // Get game
    getGame(gameId) {
        // In a real scenario, this would fetch from DB, but for now, we assume in-memory is the source of truth for active games
        // For persistence, we'd fetch from MongoDB here.
        // For this refactoring, we'll assume the game object is passed from GameManager
        throw new Error('getGame should be called on GameManager for in-memory games');
    }



    // Generate a human-readable room code
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let roomCode = '';

        // Generate 6-character room code
        for (let i = 0; i < 6; i++) {
            roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Ensure uniqueness (this will need access to GameManager's roomCodes map)
        // For now, we'll assume uniqueness is handled at a higher level or by the caller
        // or we'll need to pass the roomCodes map to the GameRepository
        // For this refactoring, we'll keep it simple and assume it's unique
        return roomCode;
    }

    // Get game by room code
    getGameByRoomCode(roomCode, gamesMap) {
        const gameId = gamesMap.get(roomCode);
        if (!gameId) {
            return null;
        }

        return gamesMap.get(gameId);
    }
}

module.exports = GameRepository;








