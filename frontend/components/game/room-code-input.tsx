"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useGame } from "@/hooks/useGame"

interface RoomCodeInputProps {
  onJoin: (roomCode: string) => void
  onCancel: () => void
}

export default function RoomCodeInput({ onJoin, onCancel }: RoomCodeInputProps) {
  const [roomCode, setRoomCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomCode.trim()) return

    setIsJoining(true)
    try {
      await onJoin(roomCode.trim().toUpperCase())
    } catch (error) {
      console.error('Failed to join game:', error)
    } finally {
      setIsJoining(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setRoomCode(value)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 gaming-bg">
      <Card className="w-full max-w-md p-3 sm:p-4 lg:p-6 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a]">
        <div className="text-center space-y-3 sm:space-y-4 lg:space-y-6">
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-press-start text-white mb-1 sm:mb-2 pixel-text-3d-glow">JOIN GAME</h2>
            <p className="text-gray-400 text-xs sm:text-sm">Enter the 6-character room code</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3 lg:space-y-4">
            <div>
              <input
                type="text"
                value={roomCode}
                onChange={handleInputChange}
                placeholder="ABC123"
                className="w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-center text-lg sm:text-xl lg:text-2xl font-press-start bg-[#1a1a1a] border border-[#333] text-white rounded-none focus:outline-none focus:border-blue-500 tracking-widest"
                maxLength={6}
                autoFocus
              />
              <div className="text-xs text-gray-500 mt-1 text-center">
                {roomCode.length}/6 characters
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <Button
                type="button"
                onClick={onCancel}
                variant="pixelOutline"
                size="pixelLarge"
                className="flex-1 text-xs sm:text-sm"
              >
                CANCEL
              </Button>
              <Button
                type="submit"
                variant="pixel"
                size="pixelLarge"
                className="flex-1 text-xs sm:text-sm"
                disabled={roomCode.length !== 6 || isJoining}
              >
                {isJoining ? 'JOINING...' : 'JOIN'}
              </Button>
            </div>
          </form>

          <div className="text-xs text-gray-500 text-center">
            Room codes are 6 characters long and contain letters and numbers
          </div>
        </div>
      </Card>
    </div>
  )
}





