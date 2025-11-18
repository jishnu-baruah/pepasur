"use client"

import React, { useState, useEffect } from 'react'

interface PixelatedVideoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function PixelatedVideo({ 
  size = 'md',
  className = ''
}: PixelatedVideoProps) {
  const [activePixel, setActivePixel] = useState<number | null>(null)
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }
  
  // Simulate the pixelated video effect by animating pixels
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly activate a pixel
      const row = Math.floor(Math.random() * 3)
      const col = Math.floor(Math.random() * 3)
      const pixelIndex = row * 3 + col
      setActivePixel(pixelIndex)
      
      // Clear the active pixel after a short delay
      setTimeout(() => {
        setActivePixel(null)
      }, 200)
    }, 300)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className={`${sizeClasses[size]} ${className} relative bg-black border-2 border-[#4A8C4A] pixelated`}>
      {/* Pixel grid container */}
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-full h-full p-1">
        {/* Generate 9 pixels in a 3x3 grid */}
        {Array.from({ length: 9 }).map((_, index) => {
          const row = Math.floor(index / 3)
          const col = index % 3
          
          // Determine pixel color based on position
          let bgColor = 'bg-black'
          if (row === 0 && col === 1) bgColor = 'bg-[#4A8C4A]' // Top center
          if (row === 1 && col === 0) bgColor = 'bg-[#8B0000]' // Middle left
          if (row === 1 && col === 1) bgColor = 'bg-[#CCCC00]' // Center
          if (row === 1 && col === 2) bgColor = 'bg-[#8B0000]' // Middle right
          if (row === 2 && col === 1) bgColor = 'bg-[#4A8C4A]' // Bottom center
          
          return (
            <div 
              key={index}
              className={`pixelated ${bgColor} ${activePixel === index ? 'brightness-150' : ''} transition-all duration-200`}
            />
          )
        })}
      </div>
      
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="h-1/3 w-full bg-gradient-to-b from-transparent to-black opacity-30 animate-pulse"></div>
      </div>
    </div>
  )
}