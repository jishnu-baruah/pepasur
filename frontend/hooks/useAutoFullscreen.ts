"use client"

import { useEffect, useState } from "react"
import {
    createFullscreenMonitor,
    requestFullscreen,
    isFullscreenSupported,
    FullscreenState
} from "@/utils/fullscreenManager"

interface UseAutoFullscreenOptions {
    enabled?: boolean
    gamePhases?: string[]
    currentPhase?: string
    delay?: number
}

export function useAutoFullscreen({
    enabled = true,
    gamePhases = ['night', 'task', 'voting'],
    currentPhase,
    delay = 1000
}: UseAutoFullscreenOptions = {}) {
    const [fullscreenState, setFullscreenState] = useState<FullscreenState>({
        isFullscreen: false,
        isSupported: false
    })
    const [hasAutoTriggered, setHasAutoTriggered] = useState(false)

    // Monitor fullscreen state
    useEffect(() => {
        if (!isFullscreenSupported()) {
            return
        }

        const cleanup = createFullscreenMonitor((state) => {
            setFullscreenState(state)
        })

        return cleanup
    }, [])

    // Auto-trigger fullscreen when entering gameplay phases
    useEffect(() => {
        if (!enabled ||
            !fullscreenState.isSupported ||
            fullscreenState.isFullscreen ||
            hasAutoTriggered ||
            !currentPhase ||
            !gamePhases.includes(currentPhase)) {
            return
        }

        console.log(`🖥️ Entering gameplay phase: ${currentPhase}, preparing auto-fullscreen`)

        // Wait for user interaction before requesting fullscreen
        let cleanup: (() => void) | null = null
        let timeoutId: NodeJS.Timeout | null = null

        const handleUserInteraction = async (event: Event) => {
            // Only trigger on meaningful interactions
            if (event.type === 'click' ||
                (event.type === 'keydown' && (event as KeyboardEvent).key !== 'Tab')) {

                console.log('🖥️ User interaction detected, requesting fullscreen')

                // Small delay to ensure the interaction is processed
                timeoutId = setTimeout(async () => {
                    const success = await requestFullscreen()
                    if (success) {
                        setHasAutoTriggered(true)
                        console.log('🖥️ Auto-fullscreen activated')
                    }
                }, delay)
            }
        }

        // Listen for user interactions
        const events = ['click', 'keydown', 'touchstart']
        events.forEach(event => {
            document.addEventListener(event, handleUserInteraction, { once: true })
        })

        cleanup = () => {
            events.forEach(event => {
                document.removeEventListener(event, handleUserInteraction)
            })
            if (timeoutId) {
                clearTimeout(timeoutId)
            }
        }

        return cleanup
    }, [enabled, fullscreenState.isSupported, fullscreenState.isFullscreen, hasAutoTriggered, currentPhase, gamePhases, delay])

    // Reset auto-trigger when leaving gameplay phases
    useEffect(() => {
        if (currentPhase && !gamePhases.includes(currentPhase)) {
            setHasAutoTriggered(false)
        }
    }, [currentPhase, gamePhases])

    return {
        fullscreenState,
        hasAutoTriggered,
        resetAutoTrigger: () => setHasAutoTriggered(false)
    }
}