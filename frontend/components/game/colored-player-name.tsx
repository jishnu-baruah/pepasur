"use client"

import { getPlayerNameStyle, hasPlayerColor } from "@/utils/playerColors"

interface ColoredPlayerNameProps {
    playerName: string
    className?: string
    showYouIndicator?: boolean
    isCurrentPlayer?: boolean
}

export default function ColoredPlayerName({
    playerName,
    className = "",
    showYouIndicator = false,
    isCurrentPlayer = false
}: ColoredPlayerNameProps) {
    const hasColor = hasPlayerColor(playerName)
    const style = hasColor ? getPlayerNameStyle(playerName) : undefined

    return (
        <span
            className={`${hasColor ? 'font-bold' : ''} ${className} inline-flex items-center gap-1`}
            style={style}
        >
            <span>{playerName}</span>
            {showYouIndicator && isCurrentPlayer && (
                <span className="text-green-400">(YOU)</span>
            )}
        </span>
    )
}