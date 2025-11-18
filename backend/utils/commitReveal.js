const crypto = require('crypto');

class CommitReveal {
  constructor() {
    this.commits = new Map(); // gameId -> playerAddress -> { commit, timestamp }
  }

  // Generate commit hash for an action
  generateCommit(action, nonce) {
    const data = JSON.stringify({ action, nonce });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Store commit
  storeCommit(gameId, playerAddress, commit, action, nonce) {
    if (!this.commits.has(gameId)) {
      this.commits.set(gameId, new Map());
    }

    const gameCommits = this.commits.get(gameId);
    gameCommits.set(playerAddress, {
      commit,
      action,
      nonce,
      timestamp: Date.now(),
      revealed: false
    });
  }

  // Reveal action and verify against commit
  revealAction(gameId, playerAddress, action, nonce) {
    const gameCommits = this.commits.get(gameId);
    if (!gameCommits) {
      throw new Error('No commits found for this game');
    }

    const storedCommit = gameCommits.get(playerAddress);
    if (!storedCommit) {
      throw new Error('No commit found for this player');
    }

    if (storedCommit.revealed) {
      throw new Error('Action already revealed');
    }

    // Verify commit
    const expectedCommit = this.generateCommit(action, nonce);
    if (storedCommit.commit !== expectedCommit) {
      throw new Error('Commit verification failed');
    }

    // Mark as revealed
    storedCommit.revealed = true;
    storedCommit.revealedAction = action;
    storedCommit.revealedNonce = nonce;

    return {
      valid: true,
      action,
      nonce,
      timestamp: Date.now()
    };
  }

  // Get commit for a player
  getCommit(gameId, playerAddress) {
    const gameCommits = this.commits.get(gameId);
    if (!gameCommits) return null;

    const commit = gameCommits.get(playerAddress);
    if (!commit) return null;

    return {
      commit: commit.commit,
      timestamp: commit.timestamp,
      revealed: commit.revealed
    };
  }

  // Get all commits for a game
  getGameCommits(gameId) {
    const gameCommits = this.commits.get(gameId);
    if (!gameCommits) return {};

    const commits = {};
    for (const [playerAddress, commit] of gameCommits.entries()) {
      commits[playerAddress] = {
        commit: commit.commit,
        timestamp: commit.timestamp,
        revealed: commit.revealed,
        action: commit.revealed ? commit.revealedAction : null
      };
    }

    return commits;
  }

  // Check if all players have revealed
  allRevealed(gameId, playerAddresses) {
    const gameCommits = this.commits.get(gameId);
    if (!gameCommits) return false;

    return playerAddresses.every(address => {
      const commit = gameCommits.get(address);
      return commit && commit.revealed;
    });
  }

  // Get revealed actions for a game
  getRevealedActions(gameId) {
    const gameCommits = this.commits.get(gameId);
    if (!gameCommits) return {};

    const actions = {};
    for (const [playerAddress, commit] of gameCommits.entries()) {
      if (commit.revealed) {
        actions[playerAddress] = commit.revealedAction;
      }
    }

    return actions;
  }

  // Clear commits for a game
  clearGame(gameId) {
    this.commits.delete(gameId);
  }

  // Generate random nonce
  generateNonce() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Validate action based on game phase and player role
  validateAction(game, playerAddress, action) {
    const playerRole = game.roles[playerAddress];
    if (!playerRole) {
      throw new Error('Player role not found');
    }

    switch (game.phase) {
      case 'night':
        return this.validateNightAction(playerRole, action);
      case 'voting':
        return this.validateVoteAction(game, playerAddress, action);
      default:
        throw new Error('Invalid phase for action submission');
    }
  }

  // Validate night action
  validateNightAction(playerRole, action) {
    switch (playerRole) {
      case 'Mafia':
        if (!action.target || !action.type || action.type !== 'kill') {
          throw new Error('Invalid mafia action');
        }
        break;
      case 'Doctor':
        if (!action.target || !action.type || action.type !== 'save') {
          throw new Error('Invalid doctor action');
        }
        break;
      case 'Detective':
        if (!action.target || !action.type || action.type !== 'investigate') {
          throw new Error('Invalid detective action');
        }
        break;
      case 'Villager':
        // Villagers don't have night actions
        throw new Error('Villagers cannot perform night actions');
      default:
        throw new Error('Unknown player role');
    }

    return true;
  }

  // Validate vote action
  validateVoteAction(game, playerAddress, action) {
    if (!action.target || !action.type || action.type !== 'vote') {
      throw new Error('Invalid vote action');
    }

    // Check if target is a valid player
    if (!game.players.includes(action.target)) {
      throw new Error('Invalid vote target');
    }

    // Check if target is not eliminated
    if (game.eliminated.includes(action.target)) {
      throw new Error('Cannot vote for eliminated player');
    }

    // Check if voter is not eliminated
    if (game.eliminated.includes(playerAddress)) {
      throw new Error('Eliminated players cannot vote');
    }

    return true;
  }
}

module.exports = CommitReveal;
