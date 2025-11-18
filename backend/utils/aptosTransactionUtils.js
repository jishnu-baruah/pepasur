/**
 * Builds, signs, and submits a simple Aptos transaction.
 * @param {Aptos} aptosClient - The Aptos client instance.
 * @param {Account} senderAccount - The account to sign and send the transaction.
 * @param {object} transactionPayload - The payload for the transaction (function, functionArguments).
 * @returns {Promise<string>} The transaction hash.
 */
async function buildSignAndSubmitTransaction(aptosClient, senderAccount, transactionPayload) {
  const transaction = await aptosClient.transaction.build.simple({
    sender: senderAccount.accountAddress,
    data: transactionPayload,
  });

  const committedTxn = await aptosClient.signAndSubmitTransaction({
    signer: senderAccount,
    transaction,
  });

  await aptosClient.waitForTransaction({
    transactionHash: committedTxn.hash,
  });

  return committedTxn.hash;
}

module.exports = {
  buildSignAndSubmitTransaction,
};
