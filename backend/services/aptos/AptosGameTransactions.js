const aptosClientManager = require('./AptosClientManager');
const AptosSerializationUtils = require('./AptosSerializationUtils');
const { buildSignAndSubmitTransaction } = require('../../utils/aptosTransactionUtils');

class AptosGameTransactions {
  constructor(aptosService) {
    this.aptosClientManager = aptosClientManager;
    this.aptosService = aptosService; // Store AptosService instance
  }

  async createGame(stakeAmount, minPlayers) {
    try {
      const aptos = this.aptosClientManager.getAptosClient();
      const account = this.aptosClientManager.getServerAccount();

      const transactionHash = await buildSignAndSubmitTransaction(
        aptos,
        account,
        {
          function: `${process.env.PEPASUR_APTOS_CONTRACT_ADDRESS}::pepasur::create_game`,
          functionArguments: [stakeAmount, minPlayers],
        }
      );

      const executedTransaction = await aptos.waitForTransaction({
        transactionHash: transactionHash,
      });

      console.log(`🎮 Game created on-chain. Transaction: ${transactionHash}`);

      // Extract game_id from events
      const gameCreatedEvent = executedTransaction.events?.find(
        (e) => e.type === `${process.env.PEPASUR_APTOS_CONTRACT_ADDRESS}::pepasur::GameCreated`
      );

      if (!gameCreatedEvent) {
        throw new Error('Game creation event not found');
      }

      const gameId = gameCreatedEvent.data.game_id;
      console.log(`🎮 Game ID: ${gameId}`);
      return gameId;
    } catch (error) {
      console.error('❌ Error creating game on-chain:', error);
      throw error;
    }
  }

  async joinGame(gameId, playerAddress) {
    try {
      const aptos = this.aptosClientManager.getAptosClient();
      const account = this.aptosClientManager.getServerAccount();

      const transactionHash = await buildSignAndSubmitTransaction(
        aptos,
        account,
        {
          function: `${process.env.PEPASUR_APTOS_CONTRACT_ADDRESS}::pepasur::join_game`,
          functionArguments: [gameId],
        }
      );

      console.log(`✅ Join game transaction confirmed: ${transactionHash}`);
      return transactionHash;
    } catch (error) {
      console.error('❌ Error joining game on-chain:', error);
      throw error;
    }
  }

  async storeRoleCommit(gameId, commit) {
    try {
      const aptos = this.aptosClientManager.getAptosClient();
      const account = this.aptosClientManager.getServerAccount();

      const transactionHash = await buildSignAndSubmitTransaction(
        aptos,
        account,
        {
          function: `${process.env.PEPASUR_APTOS_CONTRACT_ADDRESS}::pepasur::store_role_commit`,
          functionArguments: [gameId, commit],
        }
      );

      console.log(`✅ Role commit transaction confirmed: ${transactionHash}`);
      return transactionHash;
    } catch (error) {
      console.error('❌ Error storing role commit on-chain:', error);
      throw error;
    }
  }

  async submitSettlement(gameId, winners, payoutAmounts) {
    try {
      const aptos = this.aptosClientManager.getAptosClient();
      const account = this.aptosClientManager.getServerAccount();

      console.log('💰 Submitting settlement for game:', gameId);
      console.log('💰 Winners:', winners);
      console.log('💰 Payout amounts:', payoutAmounts.map(a => a.toString()));
      console.log('💰 Server account address:', account.accountAddress.toString());

      // First verify the server signer public key matches
      try {
        const contractInfo = await this.aptosService.getContractInfo(); // Use the passed AptosService instance
        const contractPubkey = contractInfo.serverSignerPubkey;
        const ourPubkey = account.publicKey.toUint8Array();

        console.log('💰 Contract public key (vector<u8>):', contractPubkey);
        console.log('💰 Our public key (bytes):', Array.from(ourPubkey));
        console.log('💰 Our public key (hex):', Buffer.from(ourPubkey).toString('hex'));
        console.log('💰 Contract initialized:', contractInfo.initialized);

        // Compare public keys
        if (contractInfo.initialized && contractPubkey && contractPubkey.length > 0) {
          // Convert contract pubkey (which might be hex string or array) to comparable format
          const contractPubkeyHex = Array.isArray(contractPubkey)
            ? Buffer.from(contractPubkey).toString('hex')
            : contractPubkey;
          const ourPubkeyHex = Buffer.from(ourPubkey).toString('hex');

          console.log('💰 Comparing pubkeys:', { contractPubkeyHex, ourPubkeyHex });

          if (contractPubkeyHex !== ourPubkeyHex) {
            throw new Error(`Public key mismatch! Contract expects: ${contractPubkeyHex}, but we have: ${ourPubkeyHex}`);
          }
          console.log('✅ Public key verification passed!');
        } else {
          console.warn('⚠️ Contract not initialized or server_signer not set! You need to call initialize() or update_server_signer() on the contract.');
          console.warn(`⚠️ To fix this, call: update_server_signer(admin, 0x${Buffer.from(ourPubkey).toString('hex')})`);
        }
      } catch (error) {
        console.error('⚠️ Could not verify server signer:', error.message);
      }

      // Create signature message using the utility
      const message = AptosSerializationUtils.serializeSettlementMessage(gameId, winners, payoutAmounts);

      // Sign the message with server's private key
      const signature = account.sign(message);
      const signatureBytes = signature.toUint8Array();

      console.log('💰 Message hex:', Buffer.from(message).toString('hex'));
      console.log('💰 Message length:', message.length);
      console.log('💰 Signature hex:', Buffer.from(signatureBytes).toString('hex'));
      console.log('💰 Signature length:', signatureBytes.length);
      console.log('💰 Public key:', account.publicKey.toString());

      const transactionHash = await buildSignAndSubmitTransaction(
        aptos,
        account,
        {
          function: `${process.env.PEPASUR_APTOS_CONTRACT_ADDRESS}::pepasur::settle_game`,
          functionArguments: [gameId, winners, payoutAmounts, Array.from(signatureBytes)],
        }
      );

      console.log(`✅ Settlement transaction confirmed: ${transactionHash}`);
      return transactionHash;
    } catch (error) {
      console.error('❌ Error submitting settlement on-chain:', error);
      throw error;
    }
  }

  async emergencyCancel(gameId) {
    try {
      const aptos = this.aptosClientManager.getAptosClient();
      const account = this.aptosClientManager.getServerAccount();

      const transactionHash = await buildSignAndSubmitTransaction(
        aptos,
        account,
        {
          function: `${process.env.PEPASUR_APTOS_CONTRACT_ADDRESS}::pepasur::emergency_cancel`,
          functionArguments: [gameId],
        }
      );

      console.log(`✅ Emergency cancel transaction confirmed: ${transactionHash}`);
      return transactionHash;
    } catch (error) {
      console.error('❌ Error emergency canceling game:', error);
      throw error;
    }
  }
}

module.exports = (aptosService) => new AptosGameTransactions(aptosService); // Export as a factory function to pass AptosService
