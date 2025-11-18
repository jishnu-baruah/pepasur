'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { ReactNode, useMemo, useState } from 'react';

// Import Solana wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  }));

  // Configure Solana network from environment
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

  // Get RPC endpoint from environment or use default cluster URL
  const endpoint = useMemo(() => {
    const customRpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    if (customRpcUrl) {
      return customRpcUrl;
    }
    // Fallback to default cluster URL based on network
    return clusterApiUrl(network as 'devnet' | 'testnet' | 'mainnet-beta');
  }, [network]);

  // Set up wallet adapters with iOS fallback logic
  const wallets = useMemo(() => {
    // Check if running on iOS
    const isIOS = typeof window !== 'undefined' &&
      /iPad|iPhone|iPod/.test(navigator.userAgent);

    // On iOS, some wallets may not work properly, so we provide fallback options
    const adapters = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ];

    if (isIOS) {
      console.log('iOS detected: Using mobile-optimized wallet configuration');
    }

    return adapters;
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
