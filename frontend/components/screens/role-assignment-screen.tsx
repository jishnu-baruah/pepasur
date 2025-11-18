"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import GifLoader from "@/components/common/gif-loader"
import RetroAnimation from "@/components/common/retro-animation"
import type { Role } from "@/app/page"

interface RoleAssignmentScreenProps {
  role: Role
  avatar: string | undefined
  onAcknowledge: () => void
}

const roleConfig = {
  ASUR: {
    name: "ASUR (MAFIA)",
    color: "#8B0000",
    bgColor: "bg-[#8B0000]/20",
    borderColor: "border-[#8B0000]",
    description: "Eliminate villagers during the night phase. Work with other mafia members to take over the village.",
    emoji: "👹",
  },
  DEVA: {
    name: "DEVA (DOCTOR)",
    color: "#4A8C4A",
    bgColor: "bg-[#4A8C4A]/20",
    borderColor: "border-[#4A8C4A]",
    description: "Save players from elimination during the night phase. Protect the innocent villagers.",
    emoji: "👨‍⚕️",
  },
  RISHI: {
    name: "RISHI (DETECTIVE)",
    color: "#FF8800",
    bgColor: "bg-[#FF8800]/20",
    borderColor: "border-[#FF8800]",
    description: "Investigate players to find clues about their roles. Help the villagers identify the mafia.",
    emoji: "🔍",
  },
  MANAV: {
    name: "MANAV (VILLAGER)",
    color: "#A259FF",
    bgColor: "bg-[#A259FF]/20",
    borderColor: "border-[#A259FF]",
    description: "Find and eliminate the mafia through voting. Work together with other villagers to survive.",
    emoji: "👨‍🌾",
  },
}

export default function RoleAssignmentScreen({ role, avatar, onAcknowledge }: RoleAssignmentScreenProps) {
  const [showRole, setShowRole] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const config = roleConfig[role]

  // Debug logging
  console.log('🎭 RoleAssignmentScreen - role:', role, 'avatar:', avatar)
  console.log('🎭 Avatar starts with http:', avatar?.startsWith('http'))
  console.log('🎭 Avatar type:', typeof avatar)

  useEffect(() => {
    const timer = setTimeout(() => setShowRole(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Countdown timer - starts after role is shown
  useEffect(() => {
    if (!showRole) return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          // Use setTimeout to defer the state update to next tick
          setTimeout(() => {
            onAcknowledge()
          }, 0)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [showRole, onAcknowledge])

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 md:p-6 gaming-bg scanlines">
      <Card className={`w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl p-4 sm:p-6 md:p-8 ${config.bgColor} border ${config.borderColor}`}>
        <div className="text-center space-y-4 sm:space-y-6 md:space-y-8">
          {!showRole ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="text-lg sm:text-xl md:text-2xl font-press-start pixel-text-3d-white">ASSIGNING ROLE...</div>
              <div className="flex justify-center">
                <GifLoader size="xl" />
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <RetroAnimation type="bounce">
                <div className="text-4xl sm:text-5xl md:text-6xl">
                  {avatar && avatar.startsWith('http') ? (
                    <img 
                      src={avatar} 
                      alt={`${role} avatar`}
                      className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-cover rounded-none mx-auto"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : (
                    config.emoji
                  )}
                </div>
              </RetroAnimation>

              <div className="space-y-2">
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-press-start pixel-text-3d-white">
                  YOUR ROLE IS
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold font-press-start pixel-text-3d-float" style={{ color: config.color }}>
                  {config.name}
                </div>
              </div>

              <Card className="text-sm sm:text-base md:text-lg font-press-start pixel-text-3d-white bg-[#111111]/50 p-3 sm:p-4 border border-[#2a2a2a]">
                {config.description}
              </Card>

              <div className="text-center space-y-2 py-4">
                <div className="text-base sm:text-lg font-press-start pixel-text-3d-white">
                  STARTING IN
                </div>
                <div className="text-4xl sm:text-5xl md:text-6xl font-bold font-press-start pixel-text-3d-green animate-pulse">
                  {countdown}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}