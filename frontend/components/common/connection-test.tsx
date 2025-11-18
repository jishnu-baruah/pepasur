"use client"

import { useSocket } from "@/contexts/SocketContext"
import { useGame } from "@/hooks/useGame"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ConnectionTest() {
  const { isConnected, connect, disconnect } = useSocket()
  const { isLoading, error } = useGame()

  return (
    <Card className="p-4 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a]">
      <div className="space-y-4">
        <h3 className="font-press-start text-white text-lg">Connection Status</h3>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-white">
              Socket.IO: {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <span className="text-sm text-white">
              API: {isLoading ? 'Loading...' : 'Ready'}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 p-2 rounded border border-red-500">
            <div className="text-red-200 text-sm">{error}</div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={connect}
            variant="pixel"
            size="sm"
            disabled={isConnected}
          >
            Connect
          </Button>
          <Button
            onClick={disconnect}
            variant="pixelOutline"
            size="sm"
            disabled={!isConnected}
          >
            Disconnect
          </Button>
        </div>
      </div>
    </Card>
  )
}
