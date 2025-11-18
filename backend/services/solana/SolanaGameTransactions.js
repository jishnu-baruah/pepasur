const { PublicKey, SystemProgram } = require('@solana/web3.js');
const { BN } = require('@coral-xyz/anchor');
const solanaClientManager = require('./SolanaClientManager');
const solanaGameQueries = require('./SolanaGameQueries');
const crypto = require('crypto');

class SolanaGameTransactions {
    /**
     * Create a new game
     */
    async createGame(stakeAmount, minPlayers) {
        try {
            const program = solanaClientManager.getProgram();
            const serverKeypair = solanaClientManager.getServerKeypair();

            // Get next game ID
            const nextGameId = await solanaGameQueries.getNextGameId();
            const gameId = new BN(nextGameId);

            // Derive PDAs
            const { pda: gameStorePda } = solanaGameQueries.deriveGameStorePda();
            const { pda: gamePda } = solanaGameQueries.deriveGamePda(nextGameId);

            // Convert stake amount to BN (lamports)
            const stakeAmountBN = new BN(stakeAmount);

            console.log(`Creating game ${nextGameId} with stake ${stakeAmount} lamports`);

            // Send transaction
            const tx = await program.methods
                .createGame(stakeAmountBN, minPlayers)
                .accounts({
                    creator: serverKeypair.publicKey,
                    gameStore: gameStorePda,
                    game: gamePda,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log(`✅ Game ${nextGameId} created. TX: ${tx}`);

            return {
                gameId: nextGameId,
                transactionSignature: tx,
            };
        } catch (error) {
            console.error('Error creating game:', error);
            throw error;
        }
    }

    /**
     * Join a game (returns unsigned transaction for player to sign)
     */
    async joinGame(gameId, playerAddress) {
        try {
            const program = solanaClientManager.getProgram();
            const playerPubkey = new PublicKey(playerAddress);

            // Derive PDAs
            const { pda: gamePda } = solanaGameQueries.deriveGamePda(gameId);
            const { pda: vaultPda } = solanaGameQueries.deriveVaultPda();

            // Build transaction
            const tx = await program.methods
                .joinGame(new BN(gameId))
                .accounts({
                    player: playerPubkey,
                    game: gamePda,
                    vault: vaultPda,
                    systemProgram: SystemProgram.programId,
                })
                .transaction();

            // Get recent blockhash
            const connection = solanaClientManager.getConnection();
            const { blockhash } = await connection.getLatestBlockhash();
            tx.recentBlockhash = blockhash;
            tx.feePayer = playerPubkey;

            // Serialize transaction for client to sign
            const serializedTx = tx.serialize({
                requireAllSignatures: false,
                verifySignatures: false,
            });

            return {
                transaction: serializedTx.toString('base64'),
                message: 'Transaction ready for player signature',
            };
        } catch (error) {
            console.error(`Error building join transaction for game ${gameId}:`, error);
            throw error;
        }
    }

    /**
     * Submit settlement for a game
     */
    async submitSettlement(gameId, winners, payoutAmounts) {
        try {
            const program = solanaClientManager.getProgram();
            const serverKeypair = solanaClientManager.getServerKeypair();

            // Derive PDAs
            const { pda: gamePda } = solanaGameQueries.deriveGamePda(gameId);
            const { pda: configPda } = solanaGameQueries.deriveConfigPda();
            const { pda: vaultPda } = solanaGameQueries.deriveVaultPda();

            // Get config to get fee recipient
            const config = await solanaGameQueries.getContractInfo();
            const feeRecipient = new PublicKey(config.feeRecipient);

            // Convert winners to PublicKeys
            const winnerPubkeys = winners.map(w => new PublicKey(w));

            // Convert payouts to BN
            const payoutBNs = payoutAmounts.map(p => new BN(p));

            // Generate settlement signature
            const signature = this.generateSettlementSignature(gameId, winners, payoutAmounts);

            console.log(`Settling game ${gameId} with ${winners.length} winners`);

            // Send transaction
            const tx = await program.methods
                .settleGame(
                    new BN(gameId),
                    winnerPubkeys,
                    payoutBNs,
                    Array.from(signature)
                )
                .accounts({
                    submitter: serverKeypair.publicKey,
                    game: gamePda,
                    config: configPda,
                    feeRecipient: feeRecipient,
                    vault: vaultPda,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log(`✅ Game ${gameId} settled. TX: ${tx}`);

            return {
                transactionSignature: tx,
                winners,
                payouts: payoutAmounts,
            };
        } catch (error) {
            console.error(`Error settling game ${gameId}:`, error);
            throw error;
        }
    }

    /**
     * Cancel a game (emergency function)
     */
    async emergencyCancel(gameId) {
        try {
            const program = solanaClientManager.getProgram();
            const serverKeypair = solanaClientManager.getServerKeypair();

            // Derive PDAs
            const { pda: gamePda } = solanaGameQueries.deriveGamePda(gameId);
            const { pda: vaultPda } = solanaGameQueries.deriveVaultPda();

            console.log(`Cancelling game ${gameId}`);

            // Send transaction
            const tx = await program.methods
                .cancelGame(new BN(gameId))
                .accounts({
                    creator: serverKeypair.publicKey,
                    game: gamePda,
                    vault: vaultPda,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log(`✅ Game ${gameId} cancelled. TX: ${tx}`);

            return {
                transactionSignature: tx,
            };
        } catch (error) {
            console.error(`Error cancelling game ${gameId}:`, error);
            throw error;
        }
    }

    /**
     * Generate settlement signature (placeholder - implement proper ED25519 signing)
     */
    generateSettlementSignature(gameId, winners, payouts) {
        // TODO: Implement proper ED25519 signature generation
        // For now, return a dummy signature
        // In production, this should sign: game_id || winners || payouts

        const serverKeypair = solanaClientManager.getServerKeypair();

        // Create message buffer
        const message = Buffer.alloc(8 + winners.length * 32 + payouts.length * 8);
        let offset = 0;

        // Add game ID
        message.writeBigUInt64LE(BigInt(gameId), offset);
        offset += 8;

        // Add winners
        winners.forEach(winner => {
            const pubkey = new PublicKey(winner);
            pubkey.toBuffer().copy(message, offset);
            offset += 32;
        });

        // Add payouts
        payouts.forEach(payout => {
            message.writeBigUInt64LE(BigInt(payout), offset);
            offset += 8;
        });

        // Sign with server keypair (this is a placeholder)
        // TODO: Use proper ED25519 signing
        const hash = crypto.createHash('sha256').update(message).digest();

        // Return 64-byte signature (placeholder)
        return Buffer.concat([hash, hash]);
    }

    /**
     * Send SOL from server account (faucet functionality)
     */
    async sendSOL(recipientAddress, amountInLamports) {
        try {
            const connection = solanaClientManager.getConnection();
            const serverKeypair = solanaClientManager.getServerKeypair();
            const recipient = new PublicKey(recipientAddress);

            const { Transaction } = require('@solana/web3.js');
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: serverKeypair.publicKey,
                    toPubkey: recipient,
                    lamports: amountInLamports,
                })
            );

            const signature = await connection.sendTransaction(transaction, [serverKeypair]);
            await connection.confirmTransaction(signature, 'confirmed');

            console.log(`✅ Sent ${amountInLamports} lamports to ${recipientAddress}. TX: ${signature}`);

            return signature;
        } catch (error) {
            console.error('Error sending SOL:', error);
            throw error;
        }
    }
}

module.exports = new SolanaGameTransactions();
