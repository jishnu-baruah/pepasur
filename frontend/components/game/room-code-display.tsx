"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useGame } from "@/hooks/useGame"

interface RoomCodeDisplayProps {
  roomCode: string
}

export default function RoomCodeDisplay({ roomCode }: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  // Debug: Log the room code to see what we're receiving
  console.log('RoomCodeDisplay received roomCode:', roomCode, 'Type:', typeof roomCode)

  const handleCopy = async () => {
    try {
      // Clean the room code to ensure only the actual code is copied
      const cleanRoomCode = roomCode.trim().replace(/\s+/g, '')
      console.log('Copying room code:', cleanRoomCode)
      await navigator.clipboard.writeText(cleanRoomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy room code:', error)
    }
  }

  return (
    <Card className="p-2 sm:p-3 lg:p-4 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a] text-center">
      <div className="space-y-1 sm:space-y-2 lg:space-y-3">
        <div className="text-xs sm:text-sm font-press-start text-white pixel-text-3d-glow">
          ROOM CODE
        </div>
        
        <div className="text-xl sm:text-2xl lg:text-3xl font-press-start text-blue-400 pixel-text-3d-glow tracking-widest">
          {roomCode}
        </div>
        
        <Button
          onClick={handleCopy}
          variant="pixelOutline"
          size="sm"
          className="text-xs"
        >
          {copied ? '✓ COPIED' : 'COPY CODE'}
        </Button>
        
        <div className="text-xs text-gray-500">
          Share this code with other players
        </div>
      </div>
    </Card>
  )
}







