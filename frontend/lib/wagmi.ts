import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain, http } from 'viem';

// Define U2U Nebulas Testnet chain
export const u2uTestnet = defineChain({
  id: 2484,
  name: 'U2U Nebulas Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'U2U',
    symbol: 'U2U',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-nebulas-testnet.u2u.xyz'],
    },
    public: {
      http: ['https://rpc-nebulas-testnet.u2u.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'U2U Testnet Explorer',
      url: 'https://testnet.u2uscan.xyz',
    },
  },
  testnet: true,
  // Add gas configuration for U2U testnet
  fees: {
    baseFeeMultiplier: 1,
    priorityFeeMultiplier: 1,
  },
});

// Get project ID from environment or use fallback
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '609f45d188c096567677077f5b0b4175';

// Configure RainbowKit with proper network settings
export const config = getDefaultConfig({
  appName: 'Pepasur Game',
  projectId: projectId,
  chains: [u2uTestnet],
  ssr: true, // Enable SSR support
  // Fix transports configuration - use functions instead of objects
  transports: {
    [u2uTestnet.id]: http('https://rpc-nebulas-testnet.u2u.xyz'),
  },
});
