"use client"

import { useEffect, useState } from "react"
import GifLoader from "@/components/common/gif-loader"
import RetroAnimation from "@/components/common/retro-animation"
import { soundService } from "@/services/SoundService"

interface LoaderScreenProps {
  message?: string
  subMessage?: string
}

export default function LoaderScreen({ message, subMessage }: LoaderScreenProps = {}) {
  const [dots, setDots] = useState("")
  const [messageIndex, setMessageIndex] = useState(0)

  // Play loading sound when component mounts
  useEffect(() => {
    soundService.playLoading()
  }, [])

  const dynamicMessages = [
    "WAKING THE ASURS",
    "GATHERING THE MANAV",
    "CONSULTING THE RISHI",
    "LOADING ON-CHAIN"
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % dynamicMessages.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  // --- Render ---

  return (
    <div className="min-h-screen flex items-center justify-center gaming-bg scanlines relative overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(74, 140, 74, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74, 140, 74, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="text-center relative z-10 px-4 flex flex-col items-center justify-center h-full">
        <RetroAnimation type="pulse" className="mb-8">
          <div className="relative">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold font-press-start tracking-wider">
              <span className="pixel-text-3d-green pixel-text-3d-float">P</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.1s' }}>E</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.2s' }}>P</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.3s' }}>A</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.4s' }}>S</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.5s' }}>U</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.6s' }}>R</span>
            </div>
          </div>
        </RetroAnimation>

        <div className="flex justify-center mb-6">
          <GifLoader size="xxl" />
        </div>

        <div className="mt-4">
          <div className="text-sm sm:text-base lg:text-lg font-press-start text-[#5FA85F] opacity-90 transition-opacity duration-500 text-center px-4" style={{
            textShadow: '0 0 10px rgba(74, 140, 74, 0.8), 0 0 20px rgba(74, 140, 74, 0.4)'
          }}>
            {message || dynamicMessages[messageIndex]}{dots}
          </div>
          {subMessage && (
            <div className="text-xs sm:text-sm font-press-start text-[#5FA85F]/70 mt-2 text-center px-4">
              {subMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}