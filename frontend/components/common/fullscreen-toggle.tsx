"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    FullscreenState,
    createFullscreenMonitor,
    toggleFullscreen,
    isFullscreenSupported
} from "@/utils/fullscreenManager"

interface FullscreenToggleProps {
    className?: string
    variant?: "button" | "icon"
    autoTrigger?: boolean
    gamePhases?: string[]
}

export default function FullscreenToggle({
    className = "",
    variant = "button",
    autoTrigger = false,
    gamePhases = []
}: FullscreenToggleProps) {
    const [fullscreenState, setFullscreenState] = useState<FullscreenState>({
        isFullscreen: false,
        isSupported: false
    })
    const [hasAutoTriggered, setHasAutoTriggered] = useState(false)

    useEffect(() => {
        if (!isFullscreenSupported()) {
            return
        }

        const cleanup = createFullscreenMonitor((state) => {
            setFullscreenState(state)
            console.log('🖥️ Fullscreen state changed:', state)
        })

        return cleanup
    }, [])

    // Auto-trigger fullscreen on first user interaction during gameplay
    useEffect(() => {
        if (!autoTrigger || hasAutoTriggered || !fullscreenState.isSupported) {
            return
        }

        let cleanup: (() => void) | null = null

        const handleUserInteraction = async (event: Event) => {
            // Only trigger on significant interactions during gameplay
            if (event.type === 'click' || event.type === 'keydown') {
                if (!fullscreenState.isFullscreen) {
                    console.log('🖥️ Auto-triggering fullscreen on user interaction')
                    const success = await toggleFullscreen()
                    if (success) {
                        setHasAutoTriggered(true)
                    }
                }
            }
        }

        // Add listeners for user interactions
        const events = ['click', 'keydown']
        events.forEach(event => {
            document.addEventListener(event, handleUserInteraction, { once: true })
        })

        cleanup = () => {
            events.forEach(event => {
                document.removeEventListener(event, handleUserInteraction)
            })
        }

        return cleanup
    }, [autoTrigger, hasAutoTriggered, fullscreenState.isSupported, fullscreenState.isFullscreen])

    const handleToggle = async () => {
        const success = await toggleFullscreen()
        if (!success) {
            console.log('🖥️ Fullscreen toggle failed')
        }
    }

    // Don't render if fullscreen is not supported
    if (!fullscreenState.isSupported) {
        return null
    }

    if (variant === "icon") {
        return (
            <button
                onClick={handleToggle}
                className={`text-lg hover:text-yellow-400 transition-colors ${className}`}
                title={fullscreenState.isFullscreen ? "Exit Fullscreen (ESC)" : "Enter Fullscreen (F11)"}
            >
                {fullscreenState.isFullscreen ? "🗗" : "🗖"}
            </button>
        )
    }

    return (
        <Button
            onClick={handleToggle}
            variant="outline"
            size="pixel"
            className={`text-xs font-press-start ${className}`}
            title={fullscreenState.isFullscreen ? "Exit Fullscreen (ESC)" : "Enter Fullscreen (F11)"}
        >
            {fullscreenState.isFullscreen ? "🗗 EXIT FULLSCREEN" : "🗖 FULLSCREEN"}
        </Button>
    )
}