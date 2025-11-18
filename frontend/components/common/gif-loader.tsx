"use client"

import React from 'react'

interface GifLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'huge' | 'massive'
  className?: string
}

export default function GifLoader({ 
  size = 'md',
  className = ''
}: GifLoaderProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
    xxl: 'w-40 h-40',
    huge: 'w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72',
    massive: 'w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 xl:w-96 xl:h-96'
  }
  
  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <img 
        src="/video/Pixelated-Video-Generation-Req-unscreen.gif" 
        alt="Loading animation"
        className="w-full h-full object-contain pixelated drop-shadow-[0_0_8px_rgba(74,140,74,0.5)]"
      />
      {/* Glowing border effect */}
      <div className="absolute inset-0 border-2 border-[#4A8C4A] opacity-30 animate-pulse rounded-sm"></div>
    </div>
  )
}