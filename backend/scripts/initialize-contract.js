require('dotenv').config();
const { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } = require("@aptos-labs/ts-sdk");

async function initializeContract() {
  try {
    console.log('🔧 Initializing contract...');

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

    // Initialize the account that will become the new admin
    if (!process.env.ADMIN_PRIVATE_KEY) {
      throw new Error('ADMIN_PRIVATE_KEY not found in .env file');
    }

    const adminPrivateKeyHex = process.env.ADMIN_PRIVATE_KEY.replace('ed25519-priv-0x', '').replace('0x', '');
    const adminPrivateKey = new Ed25519PrivateKey(adminPrivateKeyHex);
    const adminAccount = Account.fromPrivateKey({ privateKey: adminPrivateKey });

    console.log('🔑 New admin account address:', adminAccount.accountAddress.toString());

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

    if (currentConfig.initialized) {
      console.log('\n❌ Contract is already initialized!');
      console.log('   You need to use update_server_signer() instead.');
      console.log('   The current admin is:', currentConfig.admin);
      process.exit(1);
    }

    // The fee recipient will be the same as the admin (you can change this later)
    const feeRecipient = adminAccount.accountAddress.toString();

    // Build transaction to initialize contract
    console.log('\n🔨 Building transaction to initialize contract...');
    console.log('   Setting new admin to:', adminAccount.accountAddress.toString());
    console.log('   Setting server signer to:', Buffer.from(serverPublicKey).toString('hex'));
    console.log('   Setting fee recipient to:', feeRecipient);

    const transaction = await aptos.transaction.build.simple({
      sender: adminAccount.accountAddress,
      data: {
        function: `${contractAddress}::pepasur::initialize`,
        functionArguments: [
          Array.from(serverPublicKey),  // server_signer_pubkey
          feeRecipient                   // fee_recipient
        ],
      },
    });

    console.log('✍️ Signing transaction with new admin account...');
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

    if (!executedTransaction.success) {
      console.error('❌ Transaction failed!');
      console.error('VM Status:', executedTransaction.vm_status);
      throw new Error('Initialize transaction failed');
    }

    // Verify the update
    console.log('\n🔍 Verifying initialization...');
    const updatedConfig = await aptos.getAccountResource({
      accountAddress: contractAddress,
      resourceType: `${contractAddress}::pepasur::Config`,
    });
    console.log('  Admin (updated):', updatedConfig.admin);
    console.log('  Server signer (updated):', updatedConfig.server_signer);
    console.log('  Fee recipient (updated):', updatedConfig.fee_recipient);
    console.log('  Initialized:', updatedConfig.initialized);

    // Verify admin
    if (updatedConfig.admin === adminAccount.accountAddress.toString()) {
      console.log('✅ Admin set correctly!');
    } else {
      console.log('❌ Admin mismatch!');
    }

    // Verify server signer
    const updatedPubkeyHex = Array.isArray(updatedConfig.server_signer)
      ? Buffer.from(updatedConfig.server_signer).toString('hex')
      : updatedConfig.server_signer.replace('0x', '');
    const expectedPubkeyHex = Buffer.from(serverPublicKey).toString('hex');

    if (updatedPubkeyHex === expectedPubkeyHex) {
      console.log('✅ Server signer public key set correctly!');
    } else {
      console.log('❌ Server signer public key mismatch!');
      console.log('   Expected:', expectedPubkeyHex);
      console.log('   Got:', updatedPubkeyHex);
    }

    // Verify initialized flag
    if (updatedConfig.initialized) {
      console.log('✅ Contract marked as initialized!');
    } else {
      console.log('❌ Contract not marked as initialized!');
    }

    if (updatedConfig.admin === adminAccount.accountAddress.toString() &&
        updatedPubkeyHex === expectedPubkeyHex &&
        updatedConfig.initialized) {
      console.log('\n🎉 Contract initialized successfully!');
      console.log('✅ The contract can now verify signatures from your server.');
      console.log('✅ You are now the admin and can update settings.');
    }

  } catch (error) {
    console.error('❌ Error initializing contract:', error);
    if (error.transaction) {
      console.error('Transaction details:', JSON.stringify(error.transaction, null, 2));
    }
    process.exit(1);
  }
}

initializeContract();
