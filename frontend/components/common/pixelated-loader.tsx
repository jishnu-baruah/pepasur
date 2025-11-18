"use client"

import React from 'react'

interface PixelatedLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function PixelatedLoader({ 
  size = 'md',
  className = ''
}: PixelatedLoaderProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }
  
  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      {/* Pixel grid container */}
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-full h-full">
        {/* Row 1 */}
        <div className="bg-[#4A8C4A] pixelated animate-pulse" style={{ animationDelay: '0ms' }}></div>
        <div className="bg-[#8B0000] pixelated animate-pulse" style={{ animationDelay: '100ms' }}></div>
        <div className="bg-[#4A8C4A] pixelated animate-pulse" style={{ animationDelay: '200ms' }}></div>
        
        {/* Row 2 */}
        <div className="bg-[#8B0000] pixelated animate-pulse" style={{ animationDelay: '300ms' }}></div>
        <div className="bg-[#CCCC00] pixelated animate-pulse" style={{ animationDelay: '400ms' }}></div>
        <div className="bg-[#8B0000] pixelated animate-pulse" style={{ animationDelay: '500ms' }}></div>
        
        {/* Row 3 */}
        <div className="bg-[#4A8C4A] pixelated animate-pulse" style={{ animationDelay: '600ms' }}></div>
        <div className="bg-[#8B0000] pixelated animate-pulse" style={{ animationDelay: '700ms' }}></div>
        <div className="bg-[#4A8C4A] pixelated animate-pulse" style={{ animationDelay: '800ms' }}></div>
      </div>
      
      {/* Center pixel */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#A259FF] pixelated animate-pulse" style={{ animationDelay: '900ms' }}></div>
    </div>
  )
}