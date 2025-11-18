"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { soundService } from "@/services/SoundService"

export default function SoundToggle() {
  const [isMuted, setIsMuted] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Initialize with saved state
    setIsMuted(soundService.getMuteState())
  }, [])

  const toggleSound = () => {
    const newMuteState = soundService.toggleMute()
    setIsMuted(newMuteState)

    // Play a click sound to confirm unmute (if unmuting)
    if (!newMuteState) {
      soundService.playClick()
    }
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-50 w-12 h-12 bg-[#1a1a1a]/80 backdrop-blur-sm border-2 border-[#4A8C4A] rounded-none flex items-center justify-center transition-all hover:scale-110 hover:border-[#5A9C5A] text-2xl"
        title="Show sound controls"
      >
        🎵
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
      <Button
        onClick={toggleSound}
        variant="pixel"
        size="sm"
        className="relative w-12 h-12 text-2xl hover:scale-110 transition-all"
        title={isMuted ? "Unmute sounds" : "Mute sounds"}
      >
        {isMuted ? "🔇" : "🔊"}
      </Button>

      <button
        onClick={() => setIsVisible(false)}
        className="w-6 h-6 bg-[#1a1a1a]/60 backdrop-blur-sm border border-[#2a2a2a] rounded-none flex items-center justify-center transition-all hover:bg-[#2a2a2a]/80 text-xs text-gray-400"
        title="Hide sound controls"
      >
        ✕
      </button>
    </div>
  )
}
