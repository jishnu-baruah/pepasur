"use client"

import React from 'react'

interface PixelProgressProps {
  value: number
  max?: number
  color?: 'green' | 'red' | 'purple' | 'yellow'
  className?: string
}

export default function PixelProgress({ 
  value, 
  max = 100, 
  color = 'green',
  className = ''
}: PixelProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  const colorClasses = {
    green: 'bg-[#6ECF68]',
    red: 'bg-[#FF3B3B]',
    purple: 'bg-[#A259FF]',
    yellow: 'bg-[#FFEA00]'
  }
  
  return (
    <div className={`pixel-progress border-[#6ECF68] ${className}`}>
      <div 
        className={`h-full ${colorClasses[color]} pixelated`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}