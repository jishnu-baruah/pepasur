"use client"

import { useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Connection, Transaction } from "@solana/web3.js"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// Initialize Solana connection
const connection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
);

interface WithdrawRewardsProps {
  gameId: string
  playerAddress: string
  rewardAmount: string
  rewardInSOL: string
  onWithdrawSuccess?: (transactionHash: string) => void
  renderButton?: boolean
  settlementTxHash?: string
}

export default function WithdrawRewards({ gameId, playerAddress, rewardAmount, rewardInSOL, onWithdrawSuccess, renderButton = true, settlementTxHash }: WithdrawRewardsProps) {
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [transactionHash, setTransactionHash] = useState<string>('')
  const [error, setError] = useState<string>('')

  const { publicKey, sendTransaction } = useWallet()

  // Normalize addresses for comparison
  const normalizeAddress = (addr: string | undefined | null | any): string => {
    if (!addr) return ''
    const addrStr = typeof addr === 'string' ? addr : addr.toString()
    return addrStr.toLowerCase()
  }

  const isCorrectWallet = publicKey && playerAddress &&
    normalizeAddress(publicKey.toBase58()) === normalizeAddress(playerAddress)

  console.log('Withdraw wallet check:', {
    publicKey: publicKey?.toBase58(),
    playerAddress,
    normalizedPublicKey: normalizeAddress(publicKey?.toBase58()),
    normalizedPlayer: normalizeAddress(playerAddress),
    isCorrectWallet
  })

  const handleWithdraw = async () => {
    if (!publicKey || !isCorrectWallet) {
      alert("Please connect the correct wallet")
      return
    }

    setIsWithdrawing(true)
    setError('')

    try {
      console.log('💰 [Solana] Building withdraw transaction...')

      // TODO: Build actual Solana program transaction
      // For now, this is a placeholder that will be replaced with actual program interaction
      const transaction = new Transaction()

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      console.log('💰 [Solana] Sending transaction...')

      // Send transaction
      const signature = await sendTransaction(transaction, connection)

      console.log('💰 [Solana] Confirming transaction...')

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed')

      console.log('✅ Withdrawal transaction confirmed:', signature)
      setTransactionHash(signature)
      setIsSuccess(true)
      if (onWithdrawSuccess) {
        onWithdrawSuccess(signature)
      }
    } catch (error) {
      console.error('❌ Error withdrawing rewards:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      setIsWithdrawing(false)
    }
  }

  // Handle successful withdrawal
  if (isSuccess && transactionHash) {
    return (
      <Card className="p-4 bg-green-900/50 border-green-500/50 rounded-none backdrop-blur-sm">
        <div className="text-center space-y-1">
          <div className="text-green-400 text-2xl mb-2">✅</div>
          <div className="text-green-300 font-bold font-press-start mb-3">Rewards Withdrawn!</div>

          {/* Settlement Hash */}
          {settlementTxHash && (
            <div className="text-xs font-press-start">
              <span className="text-yellow-300">Settlement: </span>
              <span className="font-mono text-gray-300 break-all">{settlementTxHash}</span>
            </div>
          )}

          {/* Withdrawal Transaction */}
          <div className="text-xs font-press-start">
            <span className="text-green-300">Transaction: </span>
            <span className="font-mono text-gray-300 break-all">{transactionHash}</span>
          </div>

          {/* Amount */}
          <div className="text-xs font-press-start">
            <span className="text-blue-300">Amount: </span>
            <span className="text-white font-bold">{rewardInSOL} SOL</span>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 bg-gray-900/50 border-gray-500/50 rounded-none backdrop-blur-sm">
      <div className="text-center space-y-3">
        <h3 className="text-sm font-bold text-yellow-400 font-press-start mb-3">💰 TRANSACTION DETAILS</h3>

        {/* Settlement Hash */}
        {settlementTxHash && (
          <div className="text-xs font-press-start mb-2">
            <span className="text-yellow-300">Settlement: </span>
            <span className="font-mono text-gray-300 break-all">{settlementTxHash}</span>
          </div>
        )}

        {/* Amount */}
        <div className="text-xs font-press-start mb-4">
          <span className="text-blue-300">Amount: </span>
          <span className="text-white font-bold">{rewardInSOL} SOL</span>
        </div>

        <Button
          onClick={handleWithdraw}
          disabled={isWithdrawing || !isCorrectWallet}
          variant="pixel"
          size="pixelLarge"
          className="w-full"
        >
          {isWithdrawing ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin">⏳</div>
              <span>WITHDRAWING...</span>
            </div>
          ) : (
            `💰 WITHDRAW ${rewardInSOL} SOL`
          )}
        </Button>
        {error && (
          <div className="text-red-400 text-sm">
            Error: {error}
          </div>
        )}
        {publicKey && playerAddress && !isCorrectWallet && (
          <div className="text-yellow-400 text-sm">
            Please connect the wallet that played this game
            <div className="text-xs text-gray-400 mt-1">
              Connected: {normalizeAddress(publicKey.toBase58()).slice(0, 8)}...
              <br />
              Expected: {normalizeAddress(playerAddress).slice(0, 8)}...
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
