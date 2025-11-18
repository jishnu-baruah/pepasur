"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { canLeaveGame } from "@/utils/connectivityChecker"
import { clearGameSession } from "@/utils/sessionPersistence"

interface EmergencyLeaveButtonProps {
    onLeave: () => void
    gameId?: string
    playerAddress?: string
    className?: string
    variant?: "button" | "text"
}

export default function EmergencyLeaveButton({
    onLeave,
    gameId,
    playerAddress,
    className = "",
    variant = "button"
}: EmergencyLeaveButtonProps) {
    const [showDialog, setShowDialog] = useState(false)
    const [isLeaving, setIsLeaving] = useState(false)
    const [leaveMethod, setLeaveMethod] = useState<'normal' | 'force_local' | null>(null)

    const handleEmergencyLeaveClick = async () => {
        try {
            const leaveOptions = await canLeaveGame()
            console.log('🚨 Emergency leave options:', leaveOptions)

            if (leaveOptions.forceLocal) {
                setLeaveMethod('force_local')
            } else {
                setLeaveMethod('normal')
            }

            setShowDialog(true)
        } catch (error) {
            console.error('❌ Error checking emergency leave options:', error)
            // Default to force local if check fails
            setLeaveMethod('force_local')
            setShowDialog(true)
        }
    }

    const handleConfirmLeave = async () => {
        try {
            setIsLeaving(true)

            if (leaveMethod === 'force_local') {
                // Force local leave - don't contact server
                console.log('🚨 Performing emergency local leave')
                clearGameSession()
                setShowDialog(false)
                onLeave()
                return
            }

            // Try normal server leave first
            if (gameId && playerAddress) {
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/leave`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ gameId, playerAddress })
                    })

                    const data = await response.json()

                    if (data.success) {
                        console.log('✅ Emergency server leave successful')
                        clearGameSession()
                        setShowDialog(false)
                        onLeave()
                        return
                    }
                } catch (error) {
                    console.log('🚨 Server leave failed, falling back to local leave')
                }
            }

            // Fallback to local leave
            clearGameSession()
            setShowDialog(false)
            onLeave()
        } catch (error) {
            console.error('❌ Emergency leave error:', error)
            // Always clear session as last resort
            clearGameSession()
            setShowDialog(false)
            onLeave()
        } finally {
            setIsLeaving(false)
        }
    }

    if (variant === "text") {
        return (
            <>
                <button
                    onClick={handleEmergencyLeaveClick}
                    className={`text-xs font-press-start text-red-400 hover:text-red-300 underline ${className}`}
                >
                    🚨 Emergency Leave
                </button>

                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent className="bg-card border-2 border-red-500">
                        <DialogHeader>
                            <DialogTitle className="font-press-start text-lg pixel-text-3d-red text-center">
                                🚨 EMERGENCY LEAVE
                            </DialogTitle>
                        </DialogHeader>
                        <div className="text-center space-y-2 pt-4">
                            <div className="text-sm text-gray-300">
                                {leaveMethod === 'force_local' ? (
                                    "This will clear your local session immediately. The server may not be notified."
                                ) : (
                                    "This will attempt to leave the game normally, with local fallback if needed."
                                )}
                            </div>
                            <div className="text-xs text-red-400 font-press-start">
                                ⚠️ USE ONLY IF STUCK OR SERVER IS DOWN
                            </div>
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button
                                onClick={() => setShowDialog(false)}
                                variant="outline"
                                size="pixel"
                                disabled={isLeaving}
                                className="w-full sm:w-auto"
                            >
                                ↩️ CANCEL
                            </Button>
                            <Button
                                onClick={handleConfirmLeave}
                                variant="outline"
                                size="pixel"
                                disabled={isLeaving}
                                className="w-full sm:w-auto border-red-500 text-red-400 hover:bg-red-900/50"
                            >
                                {isLeaving ? '⏳ LEAVING...' : '🚨 EMERGENCY LEAVE'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        )
    }

    return (
        <>
            <Button
                onClick={handleEmergencyLeaveClick}
                variant="outline"
                size="pixel"
                className={`border-red-500/50 text-red-400 hover:bg-red-900/20 ${className}`}
            >
                🚨 Emergency Leave
            </Button>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="bg-card border-2 border-red-500">
                    <DialogHeader>
                        <DialogTitle className="font-press-start text-lg pixel-text-3d-red text-center">
                            🚨 EMERGENCY LEAVE
                        </DialogTitle>
                    </DialogHeader>
                    <div className="text-center space-y-2 pt-4">
                        <div className="text-sm text-gray-300">
                            {leaveMethod === 'force_local' ? (
                                "This will clear your local session immediately. The server may not be notified."
                            ) : (
                                "This will attempt to leave the game normally, with local fallback if needed."
                            )}
                        </div>
                        <div className="text-xs text-red-400 font-press-start">
                            ⚠️ USE ONLY IF STUCK OR SERVER IS DOWN
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            onClick={() => setShowDialog(false)}
                            variant="outline"
                            size="pixel"
                            disabled={isLeaving}
                            className="w-full sm:w-auto"
                        >
                            ↩️ CANCEL
                        </Button>
                        <Button
                            onClick={handleConfirmLeave}
                            variant="outline"
                            size="pixel"
                            disabled={isLeaving}
                            className="w-full sm:w-auto border-red-500 text-red-400 hover:bg-red-900/50"
                        >
                            {isLeaving ? '⏳ LEAVING...' : '🚨 EMERGENCY LEAVE'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}