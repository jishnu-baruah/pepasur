const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  roomCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
    minlength: 6,
    maxlength: 6
  },
  creator: {
    type: String,
    required: true
  },
  creatorName: {
    type: String,
    default: null
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true
  },
  isReady: {
    type: Boolean,
    default: false,
    index: true
  },
  stakeAmount: {
    type: Number,
    required: true,
    min: 0
  },
  minPlayers: {
    type: Number,
    default: 4,
    min: 2
  },
  maxPlayers: {
    type: Number,
    default: 4,
    min: 2
  },
  currentPlayers: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['lobby', 'active', 'completed', 'cancelled'],
    default: 'lobby',
    index: true
  },
  phase: {
    type: String,
    enum: ['lobby', 'night', 'day', 'voting', 'results'],
    default: 'lobby'
  },
  onChainGameId: {
    type: String,
    default: null
  },
  stakingRequired: {
    type: Boolean,
    default: true
  },
  playerStakes: {
    type: Map,
    of: String, // transaction hash
    default: new Map()
  },
  settings: {
    type: {
      nightPhaseDuration: {
        type: Number,
        default: () => parseInt(process.env.DEFAULT_NIGHT_PHASE_DURATION) || 30,
        min: 1,
        max: 120
      },
      resolutionPhaseDuration: {
        type: Number,
        default: () => parseInt(process.env.DEFAULT_RESOLUTION_PHASE_DURATION) || 10,
        min: 1,
        max: 60
      },
      taskPhaseDuration: {
        type: Number,
        default: () => parseInt(process.env.DEFAULT_TASK_PHASE_DURATION) || 30,
        min: 1,
        max: 180
      },
      votingPhaseDuration: {
        type: Number,
        default: () => parseInt(process.env.DEFAULT_VOTING_PHASE_DURATION) || 10,
        min: 1,
        max: 60
      },
      maxTaskCount: {
        type: Number,
        default: () => parseInt(process.env.DEFAULT_MAX_TASK_COUNT) || 4,
        min: 2,
        max: 20
      }
    },
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for player count
gameSchema.virtual('playerCount').get(function () {
  return this.currentPlayers ? this.currentPlayers.length : 0;
});

// Index for querying public lobbies efficiently
gameSchema.index({ isPublic: 1, status: 1, createdAt: -1 });

// TTL index to auto-remove lobby rooms after 15 minutes
gameSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900, partialFilterExpression: { status: 'lobby' } });

// TTL index to auto-remove old completed games after 24 hours
gameSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400, partialFilterExpression: { status: 'completed' } });

// Static method to get public lobbies (excluding full rooms)
gameSchema.statics.getPublicLobbies = function () {
  return this.find({
    isPublic: true,
    isReady: true,
    status: 'lobby',
    // Only return lobbies that aren't full
    $expr: { $lt: [{ $size: '$currentPlayers' }, '$minPlayers'] }
  })
    .select('gameId roomCode creator creatorName stakeAmount minPlayers maxPlayers currentPlayers playerCount createdAt')
    .sort({ createdAt: -1 })
    .lean();
};

// Static method to toggle visibility
gameSchema.statics.toggleVisibility = async function (gameId, creatorAddress) {
  const game = await this.findOne({ gameId });

  if (!game) {
    throw new Error('Game not found');
  }

  if (game.creator !== creatorAddress) {
    throw new Error('Only the creator can change visibility');
  }

  if (game.status !== 'lobby') {
    throw new Error('Cannot change visibility after game has started');
  }

  game.isPublic = !game.isPublic;
  await game.save();

  return game;
};

// Instance method to add player
gameSchema.methods.addPlayer = function (playerAddress) {
  if (this.currentPlayers.includes(playerAddress)) {
    throw new Error('Player already in game');
  }

  if (this.currentPlayers.length >= this.maxPlayers) {
    throw new Error('Game is full');
  }

  this.currentPlayers.push(playerAddress);
  return this.save();
};

// Instance method to remove player
gameSchema.methods.removePlayer = function (playerAddress) {
  const index = this.currentPlayers.indexOf(playerAddress);
  if (index > -1) {
    this.currentPlayers.splice(index, 1);
    return this.save();
  }
  return Promise.resolve(this);
};

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
