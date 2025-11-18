require('dotenv').config();
const { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } = require("@aptos-labs/ts-sdk");

async function updateServerSigner() {
  try {
    console.log('🔧 Updating server signer on contract...');

    // Determine network
    const network = process.env.NETWORK === 'mainnet' ? Network.MAINNET :
                    process.env.NETWORK === 'testnet' ? Network.TESTNET :
                    Network.DEVNET;

    // Initialize Aptos client
    const config = new AptosConfig({
      network,
      fullnode: process.env.APTOS_NODE_URL
    });
    const aptos = new Aptos(config);

    // Initialize ADMIN account (not server account!)
    if (!process.env.ADMIN_PRIVATE_KEY) {
      throw new Error('ADMIN_PRIVATE_KEY not found in .env file');
    }

    const adminPrivateKeyHex = process.env.ADMIN_PRIVATE_KEY.replace('ed25519-priv-0x', '').replace('0x', '');
    const adminPrivateKey = new Ed25519PrivateKey(adminPrivateKeyHex);
    const adminAccount = Account.fromPrivateKey({ privateKey: adminPrivateKey });

    console.log('🔑 Admin account address:', adminAccount.accountAddress.toString());

    // Initialize SERVER account to get its public key
    if (!process.env.SERVER_PRIVATE_KEY) {
      throw new Error('SERVER_PRIVATE_KEY not found in .env file');
    }

    const serverPrivateKeyHex = process.env.SERVER_PRIVATE_KEY.replace('ed25519-priv-0x', '').replace('0x', '');
    const serverPrivateKey = new Ed25519PrivateKey(serverPrivateKeyHex);
    const serverAccount = Account.fromPrivateKey({ privateKey: serverPrivateKey });

    console.log('🔑 Server account address:', serverAccount.accountAddress.toString());

    const serverPublicKey = serverAccount.publicKey.toUint8Array();
    console.log('🔑 Server public key (hex):', Buffer.from(serverPublicKey).toString('hex'));
    console.log('🔑 Server public key (array):', Array.from(serverPublicKey));

    const contractAddress = process.env.PEPASUR_APTOS_CONTRACT_ADDRESS;
    console.log('📋 Contract address:', contractAddress);

    // Get current config
    console.log('\n📋 Current contract config:');
    const currentConfig = await aptos.getAccountResource({
      accountAddress: contractAddress,
      resourceType: `${contractAddress}::pepasur::Config`,
    });
    console.log('  Admin:', currentConfig.admin);
    console.log('  Server signer:', currentConfig.server_signer);
    console.log('  Fee recipient:', currentConfig.fee_recipient);
    console.log('  House cut bps:', currentConfig.house_cut_bps);
    console.log('  Initialized:', currentConfig.initialized);

    // Build transaction to update server signer
    console.log('\n🔨 Building transaction to update server signer...');
    const transaction = await aptos.transaction.build.simple({
      sender: adminAccount.accountAddress,
      data: {
        function: `${contractAddress}::pepasur::update_server_signer`,
        functionArguments: [Array.from(serverPublicKey)],
      },
    });

    console.log('✍️ Signing transaction with admin account...');
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: adminAccount,
      transaction,
    });

    console.log('⏳ Waiting for transaction confirmation...');
    console.log('📝 Transaction hash:', committedTxn.hash);

    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    console.log('✅ Transaction confirmed!');
    console.log('🔍 Transaction details:', executedTransaction);

    // Verify the update
    console.log('\n🔍 Verifying update...');
    const updatedConfig = await aptos.getAccountResource({
      accountAddress: contractAddress,
      resourceType: `${contractAddress}::pepasur::Config`,
    });
    console.log('  Server signer (updated):', updatedConfig.server_signer);

    // Compare
    const updatedPubkeyHex = Array.isArray(updatedConfig.server_signer)
      ? Buffer.from(updatedConfig.server_signer).toString('hex')
      : updatedConfig.server_signer.replace('0x', '');
    const expectedPubkeyHex = Buffer.from(serverPublicKey).toString('hex');

    if (updatedPubkeyHex === expectedPubkeyHex) {
      console.log('✅ Server signer updated successfully!');
      console.log('✅ The contract can now verify signatures from your server.');
    } else {
      console.log('❌ Public key mismatch!');
      console.log('   Expected:', expectedPubkeyHex);
      console.log('   Got:', updatedPubkeyHex);
    }

  } catch (error) {
    console.error('❌ Error updating server signer:', error);
    if (error.transaction) {
      console.error('Transaction details:', error.transaction);
    }
    process.exit(1);
  }
}

updateServerSigner();
