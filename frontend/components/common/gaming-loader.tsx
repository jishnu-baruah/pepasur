"use client"

import React from 'react'
import RetroAnimation from '@/components/retro-animation'

interface GamingLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function GamingLoader({ 
  size = 'md',
  className = ''
}: GamingLoaderProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }
  
  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Outer square */}
      <div className="absolute inset-0 border-2 border-[#4A8C4A] animate-pulse"></div>
      
      {/* Inner square */}
      <div className="absolute inset-2 border border-[#8B0000] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
      
      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-[#CCCC00] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
      </div>
      
      {/* Pixel corners */}
      <div className="absolute top-0 left-0 w-2 h-2 bg-[#4A8C4A]"></div>
      <div className="absolute top-0 right-0 w-2 h-2 bg-[#4A8C4A]"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#4A8C4A]"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#4A8C4A]"></div>
      
      {/* Scanning line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#A259FF] animate-ping" style={{ animationDuration: '1.5s' }}></div>
    </div>
  )
}