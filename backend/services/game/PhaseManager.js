const crypto = require('crypto');

class PhaseManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
    }

    async resolveNightPhase(gameId) {
        const game = this.gameManager.getGame(gameId);
        if (!game) {
            console.log(`ERROR: Game not found in resolveNightPhase for gameId ${gameId}`);
            return;
        }

        console.log(`=== RESOLVING NIGHT PHASE FOR GAME ${gameId} ===`);
        console.log(`Game state: phase=${game.phase}, timeLeft=${game.timeLeft}, timerReady=${game.timerReady}`);

        // Process night actions
        const mafiaKill = this.processMafiaAction(game);
        const doctorSave = this.processDoctorAction(game);
        const detectiveInvestigation = this.processDetectiveAction(game);

        // Create detailed resolution data with player objects
        const resolution = {
            mafiaTarget: mafiaKill ? this.getPlayerObject(game, mafiaKill) : null,
            doctorTarget: doctorSave ? this.getPlayerObject(game, doctorSave) : null,
            detectiveTarget: detectiveInvestigation.target ? this.getPlayerObject(game, detectiveInvestigation.target) : null,
            investigationResult: detectiveInvestigation.result,
            killedPlayer: null,
            savedPlayer: null,
            investigationPlayer: detectiveInvestigation.target ? this.getPlayerObject(game, detectiveInvestigation.target) : null
        };

        // Apply results
        if (mafiaKill && mafiaKill !== doctorSave) {
            game.eliminated.push(mafiaKill);
            resolution.killedPlayer = this.getPlayerObject(game, mafiaKill);
            console.log(`Player ${mafiaKill} was eliminated`);
        } else if (mafiaKill && mafiaKill === doctorSave) {
            resolution.savedPlayer = this.getPlayerObject(game, doctorSave);
            console.log(`Player ${mafiaKill} was saved by doctor`);
        } else {
            console.log(`No one was eliminated this night`);
        }

        // Store resolution data
        game.nightResolution = resolution;

        // Check win conditions
        if (this.checkWinConditions(game)) {
            await this.gameManager.endGame(gameId);
            return;
        }

        // Move to resolution phase
        game.phase = 'resolution';
        game.timeLeft = game.settings?.resolutionPhaseDuration || 10;
        this.gameManager.phaseStartTimes.set(gameId, Date.now()); // Track phase start time

        // Reset timer state for resolution phase
        if (game.timerInterval) {
            clearInterval(game.timerInterval);
            game.timerInterval = null;
        }
        if (game.readyTimer) {
            clearTimeout(game.readyTimer);
            game.readyTimer = null;
        }
        game.timerReady = false;

        console.log(`✅ Resolution phase setup complete for game ${gameId}: timerReady=${game.timerReady}, timeLeft=${game.timeLeft}, phase=${game.phase}`);

        // Emit game state update to frontend FIRST
        if (this.gameManager.socketManager) {
            try {
                this.gameManager.socketManager.emitGameStateUpdate(gameId);
                console.log(`📡 Emitted resolution phase state to frontend`);
            } catch (error) {
                console.error(`❌ Error emitting game state update after night phase resolution:`, error);
            }
        }

        // Start timer for resolution phase (same pattern as game start)
        console.log(`⏰ About to start resolution timer for game ${gameId}`);
        try {
            await this.startTimer(gameId, true);
            console.log(`✅ Resolution timer started successfully for game ${gameId}`);
        } catch (error) {
            console.error(`❌ Error starting resolution timer for game ${gameId}:`, error);
        }

        console.log(`🌅 Night phase resolved for game ${gameId}, moved to resolution phase`);
    }

    async resolveResolutionPhase(gameId) {
        const game = this.gameManager.getGame(gameId);
        if (!game) return;

        // Safety check: only resolve if we're actually in resolution phase
        if (game.phase !== 'resolution') {
            console.log(`Skipping resolution phase resolve - current phase is ${game.phase}`);
            return;
        }

        console.log(`Resolving resolution phase for game ${gameId}`);

        // Clear any existing timer
        if (game.timerInterval) {
            clearInterval(game.timerInterval);
            game.timerInterval = null;
        }

        // Clear ready timer if it exists
        if (game.readyTimer) {
            clearTimeout(game.readyTimer);
            game.readyTimer = null;
        }

        // Move to task phase
        game.phase = 'task';
        game.task = this.gameManager.taskManager.generateTask();
        game.pendingActions = {};
        game.timeLeft = game.settings?.taskPhaseDuration || 30;
        this.gameManager.phaseStartTimes.set(gameId, Date.now()); // Track phase start time

        // Start timer for task phase (same pattern as game start)
        console.log(`Starting task phase timer for game ${gameId}`);
        await this.startTimer(gameId, true);

        console.log(`Resolution phase resolved for game ${gameId}, moved to task phase`);

        // Emit game state update to frontend
        if (this.gameManager.socketManager) {
            try {
                this.gameManager.socketManager.emitGameStateUpdate(gameId);
            } catch (error) {
                console.error(`❌ Error emitting game state update after resolution phase resolution:`, error);
            }
        }
    }

    async resolveTaskPhase(gameId) {
        const game = this.gameManager.getGame(gameId);
        if (!game) return;

        // Safety check: only resolve if we're actually in task phase
        if (game.phase !== 'task') {
            console.log(`Skipping task phase resolve - current phase is ${game.phase}`);
            return;
        }

        console.log(`Resolving task phase for game ${gameId}`);

        // Move to voting phase
        game.phase = 'voting';
        game.timeLeft = game.settings?.votingPhaseDuration || 10;
        game.votes = {};
        game.votingResult = null;
        this.gameManager.phaseStartTimes.set(gameId, Date.now()); // Track phase start time

        // Start timer for voting phase (same pattern as game start)
        await this.startTimer(gameId, true);

        console.log(`Task phase resolved for game ${gameId}, moved to voting phase`);

        // Emit game state update to frontend
        if (this.gameManager.socketManager) {
            try {
                this.gameManager.socketManager.emitGameStateUpdate(gameId);
            } catch (error) {
                console.error(`❌ Error emitting game state update after task phase resolution:`, error);
            }
        }
    }

    async resolveVotingPhase(gameId) {
        const game = this.gameManager.getGame(gameId);
        if (!game) return;

        if (game.phase !== 'voting') {
            console.log(`Skipping voting phase resolve - current phase is ${game.phase}`);
            return;
        }

        console.log(`🗳️ Resolving voting phase for game ${gameId}`);
        console.log(`🗳️ Current votes:`, game.votes);

        const voteCounts = {};
        for (const voter in game.votes) {
            const target = game.votes[voter];
            if (!game.eliminated.includes(target)) {
                voteCounts[target] = (voteCounts[target] || 0) + 1;
            }
        }

        console.log(`🗳️ Vote counts:`, voteCounts);

        let maxVotes = 0;
        let eliminatedPlayers = [];

        // First pass: find the maximum vote count
        for (const player in voteCounts) {
            if (voteCounts[player] > maxVotes) {
                maxVotes = voteCounts[player];
            }
        }

        console.log(`🗳️ Max votes: ${maxVotes}`);

        // Second pass: find all players with max votes
        if (maxVotes > 0) {
            for (const player in voteCounts) {
                if (voteCounts[player] === maxVotes) {
                    eliminatedPlayers.push(player);
                }
            }
        }

        console.log(`🗳️ Players with max votes:`, eliminatedPlayers);

        if (eliminatedPlayers.length === 1) {
            const eliminated = eliminatedPlayers[0];
            game.eliminated.push(eliminated);
            console.log(`🗳️ Player ${eliminated} was eliminated by vote with ${maxVotes} vote(s)`);
            console.log(`🗳️ Eliminated player address:`, eliminated);
            console.log(`🗳️ Eliminated player role:`, game.roles[eliminated]);
            console.log(`🗳️ Role type:`, typeof game.roles[eliminated]);
            console.log(`🗳️ Role comparison: "${game.roles[eliminated]}" === "Mafia"?`, game.roles[eliminated] === 'Mafia');
            console.log(`🗳️ All roles:`, JSON.stringify(game.roles, null, 2));

            const eliminatedRole = game.roles[eliminated];

            if (eliminatedRole === 'Mafia') {
                console.log(`✅ MAFIA ELIMINATED - Setting votingResult to ASUR_ELIMINATED`);
                game.votingResult = 'ASUR_ELIMINATED';
            } else if (eliminatedRole === 'Villager' || eliminatedRole === 'Doctor' || eliminatedRole === 'Detective') {
                console.log(`❌ INNOCENT ELIMINATED - Setting votingResult to INNOCENT_ELIMINATED (role was: ${eliminatedRole})`);
                game.votingResult = 'INNOCENT_ELIMINATED';
            } else {
                console.log(`⚠️ UNKNOWN ROLE - Setting votingResult to INNOCENT_ELIMINATED (role was: ${eliminatedRole})`);
                game.votingResult = 'INNOCENT_ELIMINATED';
            }

            console.log(`🗳️ Final votingResult:`, game.votingResult);
        } else if (eliminatedPlayers.length > 1) {
            console.log(`🗳️ Voting tie between ${eliminatedPlayers.length} players with ${maxVotes} vote(s) each:`, eliminatedPlayers);
            game.votingResult = 'TIE';
        } else if (maxVotes === 0) {
            console.log(`🗳️ No votes cast - no elimination`);
            game.votingResult = 'NO_VOTES';
        } else {
            // This shouldn't happen, but just in case
            console.log(`🗳️ Unexpected voting state - no elimination`);
            game.votingResult = 'TIE';
        }

        // Check if the game is over
        game.isGameOver = this.checkWinConditions(game);

        // Set votingResolved to true so frontend can show results
        game.votingResolved = true;
        console.log(`✅ Voting resolved - displaying results to players`);

        // Give players time to see the voting results (5 seconds)
        game.timeLeft = 5;

        // Restart timer to countdown the 5 second display period
        console.log(`🔄 Restarting timer for ${gameId} to show voting results for 5 seconds`);
                            await this.startTimer(gameId, true); // Restart timer to countdown from 5

        // Emit state update so players can see voting resolution
        if (this.gameManager.socketManager) {
            this.gameManager.socketManager.emitGameStateUpdate(gameId);
        }

        // NOTE: Timer will automatically call endGame when timeLeft reaches 0 if isGameOver is true
        // handleTimerExpired will detect votingResolved === true and call endGame
    }

    // Process detective action
    processDetectiveAction(game) {
        const detective = game.players.find(p => game.roles[p] === 'Detective' && !game.eliminated.includes(p));
        if (!detective || !game.pendingActions[detective]) return { target: null, result: null };

        const target = game.pendingActions[detective].action.target;
        const actualRole = game.roles[target]; // Return the actual role instead of just Mafia/Not Mafia

        return {
            target: target,
            result: actualRole // Return actual role: 'Mafia', 'Doctor', 'Detective', 'Villager'
        };
    }

    // Process mafia action
    processMafiaAction(game) {
        const mafia = game.players.find(p => game.roles[p] === 'Mafia' && !game.eliminated.includes(p));
        if (!mafia || !game.pendingActions[mafia]) return null;

        return game.pendingActions[mafia].action.target;
    }

    // Process doctor action
    processDoctorAction(game) {
        const doctor = game.players.find(p => game.roles[p] === 'Doctor' && !game.eliminated.includes(p));
        if (!doctor || !game.pendingActions[doctor]) return null;

        return game.pendingActions[doctor].action.target;
    }

    // Check win conditions
    checkWinConditions(game) {
        const activePlayers = game.players.filter(p => !game.eliminated.includes(p));
        const mafiaCount = activePlayers.filter(p => game.roles[p] === 'Mafia').length;
        const villagerCount = activePlayers.length - mafiaCount;

        console.log(`🎯 Checking win conditions for game ${game.gameId}:`);
        console.log(`   Total players: ${game.players.length}`);
        console.log(`   Eliminated: ${game.eliminated.length} - [${game.eliminated.join(', ')}]`);
        console.log(`   Active players: ${activePlayers.length} - [${activePlayers.join(', ')}]`);
        console.log(`   Mafia count: ${mafiaCount}`);
        console.log(`   Villager count: ${villagerCount}`);
        console.log(`   All roles:`, game.roles);

        // Check task completion win condition (100% tasks = non-asurs win)
        if (game.taskCounts) {
            const totalTaskCount = Object.values(game.taskCounts).reduce((sum, count) => sum + count, 0);
            const maxTaskCount = game.settings?.maxTaskCount || 4; // Use configured value or default to 4
            console.log(`   Task completion: ${totalTaskCount}/${maxTaskCount}`);

            if (totalTaskCount >= maxTaskCount) {
                // Non-asurs (villagers) win by completing all tasks
                game.winners = activePlayers.filter(p => game.roles[p] !== 'Mafia');
                console.log(`🎯 ✅ NON-ASURS WIN - 100% tasks completed (${totalTaskCount}/${maxTaskCount})`);
                console.log(`   Winners:`, game.winners);
                return true;
            }
        }

        if (mafiaCount === 0) {
            // Villagers win - all Mafia eliminated
            game.winners = activePlayers.filter(p => game.roles[p] !== 'Mafia');
            console.log(`🎯 ✅ VILLAGERS WIN - All Mafia eliminated`);
            console.log(`   Winners:`, game.winners);
            return true;
        } else if (mafiaCount >= villagerCount) {
            // Mafia wins - Mafia equals or outnumbers villagers
            game.winners = activePlayers.filter(p => game.roles[p] === 'Mafia');
            console.log(`🎯 ✅ MAFIA WINS - Mafia has parity or majority (${mafiaCount} >= ${villagerCount})`);
            console.log(`   Winners:`, game.winners);
            return true;
        }

        console.log(`🎯 ❌ No win conditions met - game continues`);
        return false;
    }

    // Assign roles to players
    assignRoles(game) {
        const players = [...game.players];
        const numPlayers = players.length;
        const roles = ['Mafia', 'Doctor', 'Detective'];

        // Add villagers to the roles array
        for (let i = 0; i < numPlayers - 3; i++) {
            roles.push('Villager');
        }

        // Shuffle roles
        for (let i = roles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [roles[i], roles[j]] = [roles[j], roles[i]];
        }

        // Assign roles to players
        for (let i = 0; i < numPlayers; i++) {
            game.roles[players[i]] = roles[i];
        }

        console.log(`Roles assigned for game ${game.gameId}:`, game.roles);
    }

    // Generate role commit hash
    generateRoleCommit(game) {
        const roleData = JSON.stringify(game.roles);
        const salt = crypto.randomBytes(32).toString('hex');
        const commit = crypto.createHash('sha256').update(roleData + salt).digest('hex');

        // Store salt for later verification
        game.roleSalt = salt;

        return commit;
    }

    // Check if all players have submitted night actions and resolve if so
    checkAndResolveNightPhase(gameId) {
        const game = this.gameManager.getGame(gameId);
        if (!game) {
            console.log(`ERROR: Game not found in checkAndResolveNightPhase for gameId ${gameId}`);
            return;
        }

        const activePlayers = game.players.filter(p => !game.eliminated.includes(p));
        const submittedCount = Object.keys(game.pendingActions).length;

        console.log(`Active players: ${activePlayers.length}, Submitted actions: ${submittedCount}`);

        if (submittedCount >= activePlayers.length) {
            console.log(`All players submitted actions, resolving night phase`);
            this.resolveNightPhase(gameId);
        }
    }

    // Submit vote
    submitVote(gameId, data) {
        const game = this.gameManager.getGame(gameId);
        if (!game || game.phase !== 'voting') {
            throw new Error('Invalid game phase');
        }

        const { playerAddress, vote } = data;
        game.votes[playerAddress] = vote;

        console.log(`🗳️ Vote submitted: ${playerAddress} voted for ${vote}`);
        console.log(`🗳️ Current votes:`, game.votes);

        // Don't auto-resolve when all players vote - let the timer handle it
        // This allows for strategic voting and time pressure
    }

    // Helper method to get player object with name and address
    getPlayerObject(game, playerAddress) {
        // For now, we'll create a simple player object
        // In a real implementation, you might want to store player names in the game state
        return {
            address: playerAddress,
            name: `Player ${playerAddress.slice(0, 6)}...`, // Shortened address as name
            id: playerAddress,
            role: game.roles[playerAddress] || 'Unknown'
        };
    }

    // Store detective reveal
    storeDetectiveReveal(gameId, reveal) {
        if (!this.gameManager.detectiveReveals.has(gameId)) {
            this.gameManager.detectiveReveals.set(gameId, []);
        }

        this.gameManager.detectiveReveals.get(gameId).push({
            ...reveal,
            timestamp: Date.now()
        });
    }

    // Get detective reveals
    getDetectiveReveals(gameId) {
        return this.gameManager.detectiveReveals.get(gameId) || [];
    }

    // Start monitoring service to prevent stuck games
    startMonitoringService() {
        // Check every 1 minute
        setInterval(() => {
            this.checkForStuckGames();
        }, 60 * 1000);

        console.log('✅ Game timeout monitoring service started');
    }

    // Check for stuck games and handle them
    async checkForStuckGames() {
        const now = Date.now();

        for (const [gameId, game] of this.gameManager.games.entries()) {
            // Skip lobby and ended games
            if (game.phase === 'lobby' || game.phase === 'ended') {
                continue;
            }

            const gameStartTime = this.gameManager.gameStartTimes.get(gameId);
            const phaseStartTime = this.gameManager.phaseStartTimes.get(gameId);

            // Check if game exceeded maximum duration
            if (gameStartTime && (now - gameStartTime) > this.gameManager.MAX_GAME_DURATION) {
                console.log(`⏰ Game ${gameId} exceeded max duration (30 min) - force ending`);

                try {
                    // Determine winners: all alive players
                    const alivePlayers = game.players.filter(p => !game.eliminated || !game.eliminated.includes(p));
                    await this.gameManager.endGame(gameId);

                    // Notify players
                    if (this.gameManager.socketManager) {
                        this.gameManager.socketManager.io.to(`game-${gameId}`).emit('game_update', {
                            type: 'game_timeout',
                            message: 'Game exceeded maximum duration and was ended',
                            timestamp: Date.now()
                        });
                    }
                } catch (error) {
                    console.error(`❌ Error force-ending game ${gameId}:`, error);
                }

                continue;
            }

            // Check if phase is stuck
            if (phaseStartTime && (now - phaseStartTime) > this.gameManager.MAX_PHASE_DURATION) {
                console.log(`⏰ Game ${gameId} stuck in phase ${game.phase} for >5 min - forcing phase advance`);

                try {
                    // Auto-submit pending actions for inactive players
                    if (game.phase === 'night') {
                        // Auto-submit "no action" for players who haven't acted
                        for (const playerAddress of game.players) {
                            if (!game.pendingActions || !game.pendingActions[playerAddress]) {
                                console.log(`🤖 Auto-submitting no action for AFK player ${playerAddress}`);
                                // Player didn't act - they're AFK, treat as no action
                            }
                        }
                        await this.resolveNightPhase(gameId);
                    } else if (game.phase === 'task') {
                        await this.resolveTaskPhase(gameId);
                    } else if (game.phase === 'voting') {
                        await this.resolveVotingPhase(gameId);
                    }

                    // Update phase start time
                    this.gameManager.phaseStartTimes.set(gameId, Date.now());

                    // Notify players
                    if (this.gameManager.socketManager) {
                        this.gameManager.socketManager.io.to(`game-${gameId}`).emit('game_update', {
                            type: 'phase_timeout',
                            message: 'Phase exceeded time limit and was auto-resolved',
                            timestamp: Date.now()
                        });
                    }
                } catch (error) {
                    console.error(`❌ Error auto-resolving phase for game ${gameId}:`, error);
                }
            }
        }
    }
    // Start timer countdown
    async startTimer(gameId, immediate = false) {
        const game = this.gameManager.games.get(gameId);
        if (!game) return;

        // Clear existing timer if any
        if (game.timerInterval) {
            clearInterval(game.timerInterval);
            game.timerInterval = null;
        }

        // Reset timer state for new phase
        game.timerReady = false;
        game.readyPlayers = new Set(); // Track which players are ready
        game.readyTimer = null; // Timer for auto-start after grace period

        if (immediate) {
            // Start timer immediately (for phase transitions)
            console.log(`Starting timer immediately for game ${gameId}, phase: ${game.phase}`);
            await this.startActualTimer(gameId);
        } else {
            // Wait for players to be ready (for game start)
            console.log(`Timer prepared for game ${gameId}, waiting for all players to be ready`);
        }
    }

    // Start timer when frontend is ready
    async startTimerWhenReady(gameId, playerAddress) {
        const game = this.gameManager.games.get(gameId);
        if (!game) return;

        // Add player to ready set
        game.readyPlayers.add(playerAddress);
        console.log(`Player ${playerAddress} is ready. Ready players: ${game.readyPlayers.size}/${game.players.length}`);

        // Check if all active players are ready
        const activePlayers = game.players.filter(p => !game.eliminated.includes(p));

        if (game.readyPlayers.size >= activePlayers.length) {
            console.log(`All players ready, starting timer immediately`);
            await this.startActualTimer(gameId);
        } else if (!game.readyTimer) {
            // Start grace period timer (5 seconds)
            console.log(`Starting 5-second grace period for remaining players`);
            game.readyTimer = setTimeout(async () => {
                console.log(`Grace period expired, starting timer with ${game.readyPlayers.size}/${activePlayers.length} players ready`);
                await this.startActualTimer(gameId);
            }, 5000);
        }
    }

    // Actually start the timer countdown
    async startActualTimer(gameId) {
        const game = this.gameManager.games.get(gameId);
        if (!game) {
            console.log(`ERROR: Game not found for gameId ${gameId}`);
            return;
        }

        console.log(`startActualTimer called for game ${gameId}, timerReady: ${game.timerReady}, phase: ${game.phase}, timeLeft: ${game.timeLeft}`);

        // Clear any existing timers FIRST
        if (game.timerInterval) {
            console.log(`Clearing existing timer interval for game ${gameId}`);
            clearInterval(game.timerInterval);
            game.timerInterval = null;
        }
        if (game.readyTimer) {
            console.log(`Clearing existing ready timer for game ${gameId}`);
            clearTimeout(game.readyTimer);
            game.readyTimer = null;
        }

        // Reset timer state
        game.timerReady = false;
        console.log(`Timer state reset for game ${gameId}`);

        // Now start the new timer
        game.timerReady = true;
        console.log(`Starting timer for game ${gameId} - Phase: ${game.phase}, TimeLeft: ${game.timeLeft}`);

        try {
            game.timerInterval = setInterval(async () => {
                console.log(`Timer tick for game ${gameId}: timeLeft=${game.timeLeft}, phase=${game.phase}`);
                if (game.timeLeft > 0) {
                    game.timeLeft--;
                    console.log(`Game ${gameId} timer: ${game.timeLeft}s (Phase: ${game.phase})`);

                    // Emit game state update every second during countdown
                    if (this.gameManager.socketManager) {
                        try {
                            this.gameManager.socketManager.emitGameStateUpdate(gameId);
                        } catch (error) {
                            console.error(`❌ Error emitting game state update during timer countdown:`, error);
                        }
                    }
                } else {
                    // Timer expired, resolve current phase
                    console.log(`Timer expired for game ${gameId}, resolving phase: ${game.phase}`);
                    await this.handleTimerExpired(gameId);
                }
            }, 1000);

            // Verify timer was started
            console.log(`Timer verification for game ${gameId}: timerInterval=${!!game.timerInterval}, timerReady=${game.timerReady}`);
        } catch (error) {
            console.error(`ERROR starting timer for game ${gameId}:`, error);
        }
    }

    // Handle timer expiration
    async handleTimerExpired(gameId) {
        const game = this.gameManager.games.get(gameId);
        if (!game) {
            console.log(`ERROR: Game not found in handleTimerExpired for gameId ${gameId}`);
            return;
        }

        console.log(`=== TIMER EXPIRED FOR GAME ${gameId} ===`);
        console.log(`Current phase: ${game.phase}, timeLeft: ${game.timeLeft}`);

        // Clear timer
        if (game.timerInterval) {
            clearInterval(game.timerInterval);
            game.timerInterval = null;
        }
        if (game.readyTimer) {
            clearTimeout(game.readyTimer);
            game.readyTimer = null;
        }
        game.timerReady = false;

        // Resolve current phase
        if (game.phase === 'night') {
            console.log(`Calling resolveNightPhase for game ${gameId}`);
            await this.resolveNightPhase(gameId);
        } else if (game.phase === 'resolution') {
            console.log(`Calling resolveResolutionPhase for game ${gameId}`);
            await this.resolveResolutionPhase(gameId);
        } else if (game.phase === 'task') {
            console.log(`Calling resolveTaskPhase for game ${gameId}`);
            await this.resolveTaskPhase(gameId);
        } else if (game.phase === 'voting') {
            if (game.votingResolved) {
                console.log(`Voting already resolved for game ${gameId}`);

                // Check if game is over
                if (game.isGameOver) {
                    console.log(`Game is over, calling endGame for game ${gameId}`);
                    await this.gameManager.endGame(gameId);
                    return;
                } else {
                    console.log(`Game continues, transitioning to night phase for game ${gameId}`);
                    // Transition to night phase
                    game.phase = 'night';
                    game.day++;
                    game.timeLeft = game.settings?.nightPhaseDuration || parseInt(process.env.GAME_TIMEOUT_SECONDS) || 30;
                    game.pendingActions = {};
                    this.gameManager.phaseStartTimes.set(gameId, Date.now());

                    // Store last voting result before clearing (for frontend reference)
                    game.lastVotingResult = game.votingResult;

                    game.votes = {};
                    game.votingResolved = false;
                    game.votingResult = null;
                    game.nightResolution = null; // Clear previous night resolution

                    await this.startTimer(gameId, true);

                    if (this.gameManager.socketManager) {
                        this.gameManager.socketManager.emitGameStateUpdate(gameId);
                    }
                    return;
                }
            } else {
                console.log(`Calling resolveVotingPhase for game ${gameId}`);
                await this.resolveVotingPhase(gameId);
            }
        } else {
            console.log(`Unknown phase ${game.phase} for game ${gameId}`);
        }
    }

    // Clear all timers associated with a specific game
    clearGameTimers(gameId) {
        const game = this.gameManager.games.get(gameId);
        if (!game) {
            console.log(`ERROR: Game not found in clearGameTimers for gameId ${gameId}`);
            return;
        }

        if (game.timerInterval) {
            clearInterval(game.timerInterval);
            game.timerInterval = null;
        }
        if (game.readyTimer) {
            clearTimeout(game.readyTimer);
            game.readyTimer = null;
        }
        game.timerReady = false;
        console.log(`Timers cleared for game ${gameId}`);
    }
}

module.exports = PhaseManager;



