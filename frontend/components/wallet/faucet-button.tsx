"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { apiService } from "@/services/api"

interface FaucetButtonProps {
  walletAddress: string | null
  onSuccess?: () => void
}

export default function FaucetButton({ walletAddress, onSuccess }: FaucetButtonProps) {
  const [loading, setLoading] = useState(false)
  const [canClaim, setCanClaim] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [message, setMessage] = useState<string>("")
  const [error, setError] = useState<string>("")

  // Check faucet eligibility
  useEffect(() => {
    if (!walletAddress) return

    const checkEligibility = async () => {
      try {
        const response = await apiService.getFaucetInfo(walletAddress)
        if (response.success && response.data) {
          setCanClaim(response.data.canClaim)
          setTimeRemaining(response.data.timeRemaining)
        }
      } catch (err) {
        console.error('Error checking faucet eligibility:', err)
      }
    }

    checkEligibility()

    // Update every 10 seconds
    const interval = setInterval(checkEligibility, 10000)
    return () => clearInterval(interval)
  }, [walletAddress])

  const handleClaim = async () => {
    if (!walletAddress) {
      setError("Please connect your wallet first")
      return
    }

    setLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await apiService.claimFaucet(walletAddress)

      if (response.success && response.data) {
        setMessage(`Success! Sent ${response.data.amount} SOL to your wallet`)
        setCanClaim(false)

        // Show transaction hash
        console.log('Transaction hash:', response.data.transactionHash)

        if (onSuccess) {
          onSuccess()
        }
      } else {
        setError(response.error || "Failed to claim funds")
      }
    } catch (err: any) {
      if (err.message?.includes('Rate limit')) {
        setError("You can only claim once every 24 hours")
      } else {
        setError(err.message || "Failed to claim funds. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (!walletAddress) {
    return null
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 p-2 border border-gray-700 rounded bg-black/40">
      {/* Title and Info */}
      <div className="flex-shrink-0">
        <h3 className="font-press-start text-[10px] text-white">TEST FAUCET</h3>
        <p className="text-[8px] text-gray-400">Get 0.01 SOL</p>
      </div>

      {/* Button */}
      <Button
        onClick={handleClaim}
        disabled={!canClaim || loading}
        className={`
          font-press-start text-[10px] px-3 py-1.5 flex-shrink-0
          ${canClaim && !loading
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {loading ? 'CLAIMING...' : canClaim ? 'CLAIM' : 'CLAIMED'}
      </Button>

      {/* Timer or Status */}
      {!canClaim && timeRemaining && (
        <p className="text-[10px] text-yellow-400 flex-shrink-0">
          Next claim: {timeRemaining}
        </p>
      )}

      {message && (
        <div className="text-[10px] text-green-400 flex-1 truncate">
          {message}
        </div>
      )}

      {error && (
        <div className="text-[10px] text-red-400 flex-1 truncate">
          {error}
        </div>
      )}
    </div>
  )
}
