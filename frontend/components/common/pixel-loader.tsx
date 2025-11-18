"use client"

import React from 'react'
import RetroAnimation from '@/components/retro-animation'

interface PixelLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'green' | 'red' | 'purple' | 'yellow'
  className?: string
}

export default function PixelLoader({ 
  size = 'md', 
  color = 'green',
  className = ''
}: PixelLoaderProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4'
  }
  
  const colorClasses = {
    green: 'border-t-[#6ECF68] border-r-transparent border-b-[#FF3B3B] border-l-transparent',
    red: 'border-t-[#FF3B3B] border-r-transparent border-b-[#FFEA00] border-l-transparent',
    purple: 'border-t-[#A259FF] border-r-transparent border-b-[#6ECF68] border-l-transparent',
    yellow: 'border-t-[#FFEA00] border-r-transparent border-b-[#6ECF68] border-l-transparent'
  }
  
  return (
    <RetroAnimation type="pulse">
      <div className={`
        pixel-loader 
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        border-solid 
        rounded-none
        ${className}
      `} />
    </RetroAnimation>
  )
}