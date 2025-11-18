"use client"

import React from 'react'
import { motion, Transition } from 'framer-motion'

// Define stepped transition for retro animations
const steppedTransition: Transition = {
  duration: 0.3,
  ease: "easeInOut"
}

interface RetroAnimationProps {
  children: React.ReactNode
  className?: string
  type?: 'pulse' | 'blink' | 'bounce' | 'shake'
}

export function RetroPulse({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{
        duration: 1,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  )
}

export function RetroBlink({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      animate={{ opacity: [1, 0, 1] }}
      transition={{
        duration: 1,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  )
}

export function RetroBounce({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -10, 0] }}
      transition={{
        duration: 0.5,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  )
}

export function RetroShake({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      animate={{ x: [0, -5, 5, -5, 5, 0] }}
      transition={{
        duration: 0.5,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  )
}

export default function RetroAnimation({ children, className, type = 'pulse' }: RetroAnimationProps) {
  switch (type) {
    case 'pulse':
      return <RetroPulse className={className}>{children}</RetroPulse>
    case 'blink':
      return <RetroBlink className={className}>{children}</RetroBlink>
    case 'bounce':
      return <RetroBounce className={className}>{children}</RetroBounce>
    case 'shake':
      return <RetroShake className={className}>{children}</RetroShake>
    default:
      return <RetroPulse className={className}>{children}</RetroPulse>
  }
}