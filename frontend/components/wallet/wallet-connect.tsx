'use client';

import { useEffect, useRef, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import GifLoader from "@/components/common/gif-loader"

interface WalletConnectProps {
  onAddressChange: (address: string | null) => void;
  onJoinGame?: () => void;
  onCreateLobby?: () => void;
  onPublicLobby?: () => void;
}

export default function WalletConnect({ onAddressChange, onJoinGame, onCreateLobby, onPublicLobby }: WalletConnectProps) {
  const { publicKey, connected, disconnect } = useWallet();
  const { connection } = useConnection();
  const previousAddressRef = useRef<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  // Handle address changes
  useEffect(() => {
    // Convert publicKey to base58 string
    const currentAddress = connected && publicKey ? publicKey.toBase58() : null;

    // Only call onAddressChange if the address actually changed
    if (currentAddress !== previousAddressRef.current) {
      console.log('Wallet address changed:', currentAddress);
      previousAddressRef.current = currentAddress;
      onAddressChange(currentAddress);
    }
  }, [connected, publicKey, onAddressChange]);

  // Fetch SOL balance when connected
  useEffect(() => {
    if (connected && publicKey) {
      const fetchBalance = async () => {
        try {
          const lamports = await connection.getBalance(publicKey);
          const sol = lamports / LAMPORTS_PER_SOL;
          setBalance(sol);
        } catch (error) {
          console.error('Error fetching balance:', error);
          setBalance(null);
        }
      };

      fetchBalance();

      // Refresh balance every 10 seconds
      const interval = setInterval(fetchBalance, 10000);
      return () => clearInterval(interval);
    } else {
      setBalance(null);
    }
  }, [connected, publicKey, connection]);

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 gaming-bg scanlines">
      <div className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
        <Card className="w-full p-4 sm:p-6 md:p-8 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a]">
          <div className="text-center space-y-4 sm:space-y-6 md:space-y-8">
            <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-press-start tracking-wider">
              <span className="pixel-text-3d-green pixel-text-3d-float">P</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.1s' }}>E</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.2s' }}>P</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.3s' }}>A</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.4s' }}>S</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.5s' }}>U</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.6s' }}>R</span>
            </div>

            {!connected ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-center">
                  <WalletMultiButton className="!bg-[#00ff00] !text-black hover:!bg-[#00cc00] !font-press-start !text-xs sm:!text-sm !px-4 !py-2 !rounded-none !border-2 !border-black" />
                </div>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex justify-center">
                  <GifLoader size="xl" />
                </div>
                <div className="text-base sm:text-lg md:text-xl font-press-start pixel-text-3d-green pixel-text-3d-glow">WALLET CONNECTED</div>

                {balance !== null && (
                  <div className="text-sm sm:text-base font-press-start text-[#00ff00] text-center">
                    Balance: {balance.toFixed(4)} SOL
                  </div>
                )}

                <div className="space-y-3 sm:space-y-4">
                  {onJoinGame && (
                    <Button
                      onClick={onJoinGame}
                      variant="pixel"
                      size="pixelLarge"
                      className="w-full text-sm sm:text-base"
                    >
                      JOIN GAME
                    </Button>
                  )}

                  {onPublicLobby && (
                    <Button
                      onClick={onPublicLobby}
                      variant="pixel"
                      size="pixelLarge"
                      className="w-full text-sm sm:text-base"
                    >
                      PUBLIC LOBBY
                    </Button>
                  )}

                  {onCreateLobby && (
                    <Button
                      onClick={onCreateLobby}
                      variant="pixelRed"
                      size="pixelLarge"
                      className="w-full text-sm sm:text-base"
                    >
                      Create Lobby
                    </Button>
                  )}

                  <Button
                    variant="pixelOutline"
                    size="pixelLarge"
                    className="w-full text-sm sm:text-base"
                    onClick={() => disconnect()}
                  >
                    DISCONNECT WALLET
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
