"use client"

import { useState, useEffect } from "react"
import { ConnectivityStatus, createConnectivityMonitor } from "@/utils/connectivityChecker"

interface ConnectivityIndicatorProps {
    isSocketConnected?: boolean
    className?: string
}

export default function ConnectivityIndicator({ isSocketConnected = true, className = "" }: ConnectivityIndicatorProps) {
    const [connectivityStatus, setConnectivityStatus] = useState<ConnectivityStatus | null>(null)

    useEffect(() => {
        const cleanup = createConnectivityMonitor((status) => {
            setConnectivityStatus(status)
        })

        return cleanup
    }, [])

    if (!connectivityStatus) {
        return (
            <div className={`text-xs font-press-start text-gray-400 ${className}`}>
                🔍 CHECKING...
            </div>
        )
    }

    // Determine status and message
    const getStatus = () => {
        if (!connectivityStatus.isOnline) {
            return {
                icon: "📡",
                text: "OFFLINE",
                color: "text-red-400",
                description: "No internet connection"
            }
        }

        if (!connectivityStatus.serverReachable) {
            return {
                icon: "🔌",
                text: "SERVER DOWN",
                color: "text-orange-400",
                description: "Game server unreachable"
            }
        }

        if (!isSocketConnected) {
            return {
                icon: "⚠️",
                text: "SOCKET DISCONNECTED",
                color: "text-yellow-400",
                description: "Real-time connection lost"
            }
        }

        return {
            icon: "✅",
            text: "CONNECTED",
            color: "text-green-400",
            description: "All systems operational"
        }
    }

    const status = getStatus()

    return (
        <div className={`text-xs font-press-start ${status.color} ${className}`} title={status.description}>
            {status.icon} {status.text}
        </div>
    )
}