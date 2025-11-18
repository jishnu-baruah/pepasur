const mongoose = require('mongoose');

const faucetRequestSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  transactionHash: {
    type: String,
    required: true
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  ipAddress: {
    type: String,
    required: false
  }
});

// Index for efficient queries
faucetRequestSchema.index({ address: 1, requestedAt: -1 });

// Static method to check if address can request funds
faucetRequestSchema.statics.canRequest = async function(address) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentRequest = await this.findOne({
    address,
    requestedAt: { $gte: oneDayAgo }
  }).sort({ requestedAt: -1 });

  if (!recentRequest) {
    return { canRequest: true, nextRequestTime: null };
  }

  const nextRequestTime = new Date(recentRequest.requestedAt.getTime() + 24 * 60 * 60 * 1000);
  const canRequest = Date.now() >= nextRequestTime.getTime();

  return {
    canRequest,
    nextRequestTime: canRequest ? null : nextRequestTime,
    lastRequestTime: recentRequest.requestedAt,
    timeRemaining: canRequest ? 0 : nextRequestTime.getTime() - Date.now()
  };
};

// Static method to get request history for an address
faucetRequestSchema.statics.getHistory = async function(address, limit = 10) {
  return this.find({ address })
    .sort({ requestedAt: -1 })
    .limit(limit)
    .select('amount transactionHash requestedAt');
};

const FaucetRequest = mongoose.model('FaucetRequest', faucetRequestSchema);

module.exports = FaucetRequest;
