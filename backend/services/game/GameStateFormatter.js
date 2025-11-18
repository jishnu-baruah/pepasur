class GameStateFormatter {
  /**
   * Get public game state (without role information)
   * @param {string} gameId
   * @param {object} game
   * @returns {object}
   */
  static getPublicGameState(gameId, game) {
    if (!game) return null;

    const publicGame = { ...game };
    // Remove sensitive information
    delete publicGame.roles;
    delete publicGame.roleSalt;
    delete publicGame.pendingActions;
    // Remove timer interval to prevent circular reference in JSON serialization
    delete publicGame.timerInterval;
    // Remove ready timer to prevent circular reference in JSON serialization
    delete publicGame.readyTimer;

    // Convert BigInt values to strings for JSON serialization
    if (publicGame.stakeAmount && typeof publicGame.stakeAmount === 'bigint') {
      publicGame.stakeAmount = publicGame.stakeAmount.toString();
    }

    // Include contract gameId for blockchain operations
    if (game.onChainGameId) {
      publicGame.contractGameId = game.onChainGameId;
    }

    return publicGame;
  }

  /**
   * Get game state with current player's role
   * @param {string} gameId
   * @param {string} playerAddress
   * @param {object} game
   * @returns {object}
   */
  static getGameStateWithPlayerRole(gameId, playerAddress, game) {
    if (!game) return null;

    const gameState = { ...game };

    // If game has ended, reveal ALL roles to ALL players
    if (game.phase === 'ended') {
      gameState.roles = { ...game.roles };
      console.log(`🔍 Game ended - revealing all roles to all players`);
    }
    // For eliminated ASUR players, show all roles (so they can see who was ASUR)
    else if (game.eliminated && game.eliminated.includes(playerAddress) && game.roles[playerAddress] === 'ASUR') {
      gameState.roles = { ...game.roles };
      console.log(`🔍 Showing all roles to eliminated ASUR player: ${playerAddress}`);
    }
    // During game, include only the current player's role
    else {
      if (game.roles && game.roles[playerAddress]) {
        gameState.roles = {
          [playerAddress]: game.roles[playerAddress]
        };

        // If player is Detective and has submitted an investigation, include target's role
        if (game.roles[playerAddress] === 'Detective' &&
          game.phase === 'night' &&
          game.pendingActions &&
          game.pendingActions[playerAddress]) {
          const action = game.pendingActions[playerAddress];
          if (action.action && action.action.target) {
            const targetAddress = action.action.target;
            const targetRole = game.roles[targetAddress];
            gameState.roles[targetAddress] = targetRole;
            console.log(`🔍 Detective ${playerAddress} investigated ${targetAddress}, revealing role: ${targetRole}`);
          }
        }
      } else {
        gameState.roles = {};
      }
    }

    // Remove other sensitive information
    delete gameState.roleSalt;
    delete gameState.pendingActions;
    // Remove timer interval to prevent circular reference in JSON serialization
    delete gameState.timerInterval;
    // Remove ready timer to prevent circular reference in JSON serialization
    delete gameState.readyTimer;

    // Convert BigInt values to strings for JSON serialization
    if (gameState.stakeAmount && typeof gameState.stakeAmount === 'bigint') {
      gameState.stakeAmount = gameState.stakeAmount.toString();
    }

    return gameState;
  }
}

module.exports = GameStateFormatter;
