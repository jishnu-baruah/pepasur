"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface PixelCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outline' | 'glow'
}

export default function PixelCard({ 
  children, 
  className,
  variant = 'default'
}: PixelCardProps) {
  const variantClasses = {
    default: 'bg-[#365E33] border-2 border-[#6ECF68]',
    outline: 'bg-transparent border-2 border-[#6ECF68]',
    glow: 'bg-[#365E33]/90 border-2 border-[#6ECF68] glow-green'
  }
  
  return (
    <div className={cn(
      "pixelated rounded-none p-6 backdrop-blur-sm",
      variantClasses[variant],
      className
    )}>
      {children}
    </div>
  )
}