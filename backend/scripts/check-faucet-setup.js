/**
 * Faucet Setup Checker
 *
 * This script helps verify that the faucet system is properly configured.
 * Run this script to check:
 * 1. Server wallet is initialized
 * 2. Server wallet has sufficient APT balance
 * 3. Environment variables are set correctly
 */

require('dotenv').config();
const AptosService = require('../services/aptos/AptosService');

async function checkFaucetSetup() {
  console.log('🔍 Checking Faucet Setup...\n');

  // Check environment variables
  console.log('1. Environment Variables:');
  const requiredVars = ['SERVER_PRIVATE_KEY', 'NETWORK', 'APTOS_NODE_URL'];
  let envVarsOk = true;

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName}: Set`);
    } else {
      console.log(`   ❌ ${varName}: Missing`);
      envVarsOk = false;
    }
  }

  if (!envVarsOk) {
    console.log('\n❌ Missing environment variables. Please check your .env file.');
    return;
  }

  console.log(`\n2. Network Configuration:`);
  console.log(`   Network: ${process.env.NETWORK}`);
  console.log(`   Node URL: ${process.env.APTOS_NODE_URL}`);

  // Initialize Aptos service
  console.log('\n3. Server Wallet:');
  try {
    const aptosService = new AptosService();

    if (!aptosService.account) {
      console.log('   ❌ Failed to initialize server account');
      return;
    }

    const address = aptosService.account.accountAddress.toString();
    console.log(`   ✅ Address: ${address}`);

    // Get balance
    try {
      const resources = await aptosService.aptos.getAccountResources({
        accountAddress: address
      });

      const coinResource = resources.find(
        r => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
      );

      if (coinResource) {
        const balance = parseInt(coinResource.data.coin.value) / 100000000;
        console.log(`   ✅ Balance: ${balance} APT`);

        // Check if balance is sufficient
        const minimumBalance = 1; // At least 1 APT recommended
        if (balance < minimumBalance) {
          console.log(`\n   ⚠️  Warning: Balance is low! Recommended minimum: ${minimumBalance} APT`);
          console.log(`\n   To fund your server wallet, run one of these commands:`);
          console.log(`   - Using Aptos CLI: aptos account fund-with-faucet --account ${address}`);
          const faucetUrl = process.env.NETWORK === 'mainnet'
            ? 'https://faucet.mainnet.aptoslabs.com'
            : process.env.NETWORK === 'testnet'
            ? 'https://faucet.testnet.aptoslabs.com'
            : 'https://faucet.devnet.aptoslabs.com';
          console.log(`   - Using web faucet: ${faucetUrl} (paste address above)`);
        } else {
          console.log(`   ✅ Balance is sufficient for faucet operation`);
        }

        // Calculate how many claims can be made
        const claimsAvailable = Math.floor(balance / 0.01);
        console.log(`   📊 Can serve approximately ${claimsAvailable} faucet claims`);
      } else {
        console.log('   ❌ No APT balance found. Account may not be funded.');
        console.log(`\n   To fund your server wallet, run one of these commands:`);
        console.log(`   - Using Aptos CLI: aptos account fund-with-faucet --account ${address}`);
        const faucetUrl = process.env.NETWORK === 'mainnet'
          ? 'https://faucet.mainnet.aptoslabs.com'
          : process.env.NETWORK === 'testnet'
          ? 'https://faucet.testnet.aptoslabs.com'
          : 'https://faucet.devnet.aptoslabs.com';
        console.log(`   - Using web faucet: ${faucetUrl} (paste address above)`);
      }
    } catch (error) {
      console.log(`   ❌ Error checking balance: ${error.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Error initializing Aptos service: ${error.message}`);
    return;
  }

  console.log('\n4. Faucet Configuration:');
  console.log('   Amount per claim: 0.01 APT');
  console.log('   Cooldown period: 24 hours');
  console.log('   Rate limiting: MongoDB-based');

  console.log('\n✅ Faucet setup check complete!\n');
}

checkFaucetSetup().catch(error => {
  console.error('❌ Setup check failed:', error);
  process.exit(1);
});
