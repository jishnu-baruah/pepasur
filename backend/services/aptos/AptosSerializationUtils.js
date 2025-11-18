const { Serializer, AccountAddress } = require("@aptos-labs/ts-sdk");

class AptosSerializationUtils {
  /**
   * Serializes game ID, winners, and payout amounts into a single message for signing.
   * @param {string} gameId
   * @param {string[]} winners
   * @param {number[]} payoutAmounts
   * @returns {Uint8Array}
   */
  static serializeSettlementMessage(gameId, winners, payoutAmounts) {
    // Serialize game_id (u64)
    const gameIdSerializer = new Serializer();
    gameIdSerializer.serializeU64(BigInt(gameId));
    const gameIdBytes = gameIdSerializer.toUint8Array();

    // Serialize winners vector (vector<address>)
    const winnersSerializer = new Serializer();
    winnersSerializer.serializeU32AsUleb128(winners.length);
    winners.forEach(addr => {
      const accountAddr = AccountAddress.from(addr);
      accountAddr.serialize(winnersSerializer);
    });
    const winnersBytes = winnersSerializer.toUint8Array();

    // Serialize payouts vector (vector<u64>)
    const payoutsSerializer = new Serializer();
    payoutsSerializer.serializeU32AsUleb128(payoutAmounts.length);
    payoutAmounts.forEach(amount => {
      payoutsSerializer.serializeU64(BigInt(amount));
    });
    const payoutsBytes = payoutsSerializer.toUint8Array();

    // Concatenate all serialized bytes
    const message = new Uint8Array(gameIdBytes.length + winnersBytes.length + payoutsBytes.length);
    message.set(gameIdBytes, 0);
    message.set(winnersBytes, gameIdBytes.length);
    message.set(payoutsBytes, gameIdBytes.length + winnersBytes.length);

    return message;
  }
}

module.exports = AptosSerializationUtils;
