"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import GifLoader from "@/components/gif-loader"

interface WalletConnectScreenProps {
  onConnect: () => void
  onJoinGame: () => void
  onCreateLobby: () => void
  walletConnected: boolean
}

export default function WalletConnectScreen({
  onConnect,
  onJoinGame,
  onCreateLobby,
  walletConnected,
}: WalletConnectScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 gaming-bg scanlines">
      <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-lg">
        <Card className="w-full p-3 sm:p-4 lg:p-6 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a]">
          <div className="text-center space-y-2 sm:space-y-3 lg:space-y-4">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold font-press-start tracking-wider">
              <span className="pixel-text-3d-green pixel-text-3d-float">P</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.1s' }}>E</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.2s' }}>P</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.3s' }}>A</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.4s' }}>S</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.5s' }}>U</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.6s' }}>R</span>
            </div>

            {!walletConnected ? (
              <div className="space-y-2 sm:space-y-3">
                <Button
                  onClick={onConnect}
                  variant="pixel"
                  size="pixelLarge"
                  className="w-full text-xs sm:text-sm"
                >
                  CONNECT WALLET
                </Button>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                <div className="flex justify-center">
                  <GifLoader size="xl" />
                </div>
                <div className="text-sm sm:text-base lg:text-lg font-press-start pixel-text-3d-green pixel-text-3d-glow">WALLET CONNECTED</div>

                <div className="space-y-2 sm:space-y-3">
                  <Button
                    onClick={onJoinGame}
                    variant="pixel"
                    size="pixelLarge"
                    className="w-full text-xs sm:text-sm"
                  >
                    JOIN GAME
                  </Button>

                  <Button
                    onClick={onCreateLobby}
                    variant="pixelRed"
                    size="pixelLarge"
                    className="w-full text-xs sm:text-sm"
                  >
                    CREATE PRIVATE LOBBY
                  </Button>

                  <Button
                    variant="pixelOutline"
                    size="pixelLarge"
                    className="w-full text-xs sm:text-sm"
                  >
                    ADD PLAYER
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}