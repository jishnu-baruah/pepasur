"use client"

import { useState } from "react"

interface TipBarProps {
    tips: string[]
    phase: "night" | "voting"
    className?: string
}

export default function TipBar({ tips, className = "" }: TipBarProps) {
    const [showTooltip, setShowTooltip] = useState(false)

    // Add color highlighting to tips
    const coloredTips = tips.map(tip => {
        return tip
            .replace(/<strong>/g, '<strong class="text-yellow-300 font-bold">')
            .replace(/ASUR/g, '<span class="text-red-400">ASUR</span>')
            .replace(/DEVA/g, '<span class="text-blue-400">DEVA</span>')
            .replace(/RISHI/g, '<span class="text-purple-400">RISHI</span>')
            .replace(/MANAV/g, '<span class="text-green-400">MANAV</span>')
    })

    return (
        <div className={`fixed top-16 right-4 z-30 ${className}`}>
            {/* Help button with ? icon and text */}
            <div
                className="flex items-center gap-2 px-3 py-2 bg-black/60 hover:bg-black/80 border-2 border-white/30 whitespace-nowrap cursor-pointer transition-colors"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <span className="text-xl font-bold text-white">?</span>
                <span className="font-press-start text-xs text-white">HOW TO PLAY</span>
            </div>

            {/* Tooltip content - shown on hover */}
            {showTooltip && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-black/95 border-2 border-white/30 backdrop-blur-sm">
                    <div className="p-4 text-white">
                        <div className="space-y-2">
                            {coloredTips.map((tip, index) => (
                                <div key={index}>
                                    <div
                                        className="text-xs leading-relaxed text-left"
                                        dangerouslySetInnerHTML={{ __html: tip }}
                                    />
                                    {index < coloredTips.length - 1 && (
                                        <div className="border-t border-white/20 mt-2" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
