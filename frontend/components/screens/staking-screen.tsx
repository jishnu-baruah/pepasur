"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import GifLoader from "@/components/common/gif-loader"
import RetroAnimation from "@/components/common/retro-animation"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { solToLamports, formatSol, lamportsToSol } from "@/utils/lamports"
import { handleSolanaError, isUserRejection } from "@/utils/errors"
import LobbySettingsDialog, { FullGameSettings, DEFAULT_GAME_SETTINGS } from "@/components/game/lobby-settings-dialog"
import FaucetButton from "@/components/wallet/faucet-button"

interface StakingScreenProps {
  gameId?: string
  playerAddress: string
  onStakeSuccess: (gameId?: string, roomCode?: string) => void
  onCancel: () => void
  mode: 'create' | 'join'
  onBrowsePublicLobbies?: () => void
  initialRoomCode?: string
}

interface StakingInfo {
  gameId: string
  roomCode: string
  players: string[]
  playersCount: number
  minPlayers: number
  totalStaked: string
  totalStakedInSOL: string
  status: string
  isReady: boolean
}

interface BalanceInfo {
  balance: string
  balanceInSOL: string
  sufficient: boolean
}

export default function StakingScreen({
  gameId,
  playerAddress,
  onStakeSuccess,
  onCancel,
  mode,
  onBrowsePublicLobbies,
  initialRoomCode
}: StakingScreenProps) {
  // State management
  const [roomCode, setRoomCode] = useState(initialRoomCode || '')
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null)
  const [isStaking, setIsStaking] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null)
  const [createdGameId, setCreatedGameId] = useState<string | null>(null)
  const [joinGameId, setJoinGameId] = useState<string | null>(null)
  const [hasProcessedSuccess, setHasProcessedSuccess] = useState(false)
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(true)
  const [stakeAmountInput, setStakeAmountInput] = useState('0.001')
  const [isPublic, setIsPublic] = useState(false)
  const [gameSettings, setGameSettings] = useState<FullGameSettings>(DEFAULT_GAME_SETTINGS)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)

  // Solana wallet hooks
  const { publicKey, connected, sendTransaction } = useWallet()
  const { connection } = useConnection()

  // Update room code when initialRoomCode changes
  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode)
    }
  }, [initialRoomCode])

  // Validate and convert stake amount to Lamports
  const getValidatedStakeAmount = () => {
    const parsed = parseFloat(stakeAmountInput)
    if (isNaN(parsed) || parsed < 0.001) {
      return solToLamports(0.001)
    }
    return solToLamports(parsed)
  }

  const stakeAmount = getValidatedStakeAmount()
  const stakeAmountInSOL = lamportsToSol(stakeAmount).toFixed(4)

  // Fetch SOL balance
  const fetchBalance = async () => {
    if (!publicKey) {
      setBalanceLoading(false)
      return
    }

    try {
      setBalanceLoading(true)
      const balance = await connection.getBalance(publicKey)
      const balanceInSOL = lamportsToSol(balance).toFixed(4)

      console.log('💰 SOL Balance:', balance, 'Lamports =', balanceInSOL, 'SOL')

      setBalanceInfo({
        balance: balance.toString(),
        balanceInSOL,
        sufficient: balance >= stakeAmount
      })
    } catch (error) {
      console.error('Error fetching balance:', error)
      setBalanceInfo({
        balance: "0",
        balanceInSOL: "0.0000",
        sufficient: false
      })
    } finally {
      setBalanceLoading(false)
    }
  }

  useEffect(() => {
    fetchBalance()
  }, [publicKey, stakeAmount])

  // Handle successful stake
  const handleStakeSuccess = async (transactionHash: string, gameId?: string, roomCodeParam?: string) => {
    try {
      console.log('🎯 handleStakeSuccess called:', { transactionHash, mode, gameId, roomCodeParam })
      console.log('✅ Contract staking successful!')
      console.log('Transaction hash:', transactionHash)

      const gameIdToRecord = gameId || (mode === 'create' ? createdGameId : joinGameId)
      if (gameIdToRecord) {
        try {
          const requestBody = {
            gameId: gameIdToRecord,
            playerAddress: playerAddress,
            transactionHash: transactionHash
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/record-stake`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          })

          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }))
            throw new Error(`Backend error: ${errorBody.error || errorBody.message || 'Failed to record stake'}`)
          }

          const result = await response.json()

          if (result.success) {
            console.log('✅ Stake recorded in backend:', result)

            if (mode === 'create') {
              const finalGameId = gameId || createdGameId
              const finalRoomCode = roomCodeParam || createdRoomCode
              onStakeSuccess(finalGameId || undefined, finalRoomCode || undefined)
            } else {
              const finalGameId = gameId || joinGameId
              const finalRoomCode = roomCodeParam || roomCode
              onStakeSuccess(finalGameId || undefined, finalRoomCode)
            }
          } else {
            setError('Stake successful but failed to join game. Please contact support.')
            setIsStaking(false)
          }
        } catch (error) {
          console.error('❌ Error recording stake:', error)
          setError('Stake successful but failed to join game. Please contact support.')
          setIsStaking(false)
        }
      } else {
        setError('Failed to join game. Please try again.')
        setIsStaking(false)
      }
    } catch (error) {
      console.error('❌ Error handling stake success:', error)
      setError('Staking successful but failed to proceed. Please try again.')
      setIsStaking(false)
    }
  }

  const handleStakeSuccess = async (transactionHash: string, gameId?: string, roomCodeParam?: string) => {
    try {
      console.log('🎯 handleStakeSuccess called:', { transactionHash, mode, gameId, roomCodeParam })
      console.log('✅ Contract staking successful!')
      console.log('Transaction hash:', transactionHash)

      const gameIdToRecord = gameId || (mode === 'create' ? createdGameId : joinGameId)
      if (gameIdToRecord) {
        try {
          const requestBody = {
            gameId: gameIdToRecord,
            playerAddress: playerAddress,
            transactionHash: transactionHash
          }
          console.log('📤 Sending record-stake request:', requestBody)

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/record-stake`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          })

          console.log('📥 Record-stake response status:', response.status)
          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }))
            throw new Error(`Backend error: ${errorBody.error || errorBody.message || 'Failed to record stake'}`)
          }
          const result = await response.json()
          console.log('📥 Record-stake response body:', result)

          if (result.success) {
            console.log('✅ Stake recorded in backend:', result)

            if (mode === 'create') {
              const finalGameId = gameId || createdGameId
              const finalRoomCode = roomCodeParam || createdRoomCode
              console.log('🎯 Create mode - calling onStakeSuccess with:', { finalGameId, finalRoomCode })
              onStakeSuccess(finalGameId || undefined, finalRoomCode || undefined)
            } else {
              const finalGameId = gameId || joinGameId
              const finalRoomCode = roomCodeParam || roomCode
              console.log('🎯 Join mode - calling onStakeSuccess with:', { finalGameId, finalRoomCode })
              onStakeSuccess(finalGameId || undefined, finalRoomCode)
            }
          } else {
            console.error('❌ Failed to record stake:', result)
            setError('Stake successful but failed to join game. Please contact support.')
            setIsStaking(false)
          }
        } catch (error) {
          console.error('❌ Error recording stake:', error)
          setError('Stake successful but failed to join game. Please contact support.')
          setIsStaking(false)
        }
      } else {
        console.error('❌ No gameId available to record stake')
        setError('Failed to join game. Please try again.')
        setIsStaking(false)
      }
    } catch (error) {
      console.error('❌ Error handling stake success:', error)
      setError('Staking successful but failed to proceed. Please try again.')
      setIsStaking(false)
    }
  }

  const handleStake = async () => {
    if (mode === 'create' && parseFloat(stakeAmountInput) < 0.001) {
      setError('Stake amount must be at least 0.001 SOL')
      return
    }

    if (mode === 'join' && !roomCode.trim()) {
      setError('Please enter a room code')
      return
    }

    if (!balanceInfo?.sufficient) {
      setError('Insufficient balance. You need at least 0.001 SOL to stake.')
      return
    }

    if (!publicKey) {
      setError('Wallet not connected')
      return
    }

    try {
      setIsStaking(true)
      setError('')

      if (mode === 'create') {
        console.log('🎮 Creating room with staking...')
        console.log('Program ID:', process.env.NEXT_PUBLIC_PEPASUR_PROGRAM_ID)
        console.log('Stake Amount:', stakeAmount)

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/create-and-join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creatorAddress: playerAddress,
              stakeAmount: stakeAmount,
              minPlayers: 4,
              isPublic: isPublic,
              settings: gameSettings
            }),
          })

          const result = await response.json()
          if (result.success) {
            console.log('✅ Backend created room:', result)
            setCreatedRoomCode(result.roomCode)
            setCreatedGameId(result.gameId)

            console.log('💰 User staking to join created game:', result.contractGameId)

            // Build transaction from backend
            const txResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/build-join-transaction`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gameId: result.contractGameId,
                playerAddress: publicKey.toBase58()
              }),
            })

            const txData = await txResponse.json()
            if (!txData.success) {
              throw new Error(txData.error || 'Failed to build transaction')
            }

            // Send transaction using Solana wallet
            const signature = await sendTransaction(
              Transaction.from(Buffer.from(txData.transaction, 'base64')),
              connection
            )

            console.log('✅ Transaction sent:', signature)

            // Wait for confirmation
            await connection.confirmTransaction(signature, 'confirmed')
            console.log('✅ Transaction confirmed:', signature)

            setHasProcessedSuccess(true)
            handleStakeSuccess(signature, result.gameId, result.roomCode)
          } else {
            console.error('❌ Backend create failed:', result.error)
            setError(`Failed to create room: ${result.error}`)
            setIsStaking(false)
          }
        } catch (error) {
          console.error('❌ Error calling backend:', error)
          const errorMessage = handleSolanaError(error)
          setError(`Failed to create room: ${errorMessage}`)
          setIsStaking(false)
        }
      } else {
        console.log('🎮 Joining room with staking...')
        console.log('Room Code:', roomCode)
        console.log('Stake Amount:', stakeAmount)

        if (!gameId) {
          console.log('🔍 Getting gameId from room code...')
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/room/${roomCode}`)
          const result = await response.json()

          if (!result.success) {
            throw new Error('Room code not found')
          }

          const gameData = result.game
          console.log('✅ Found game:', gameData)
          setJoinGameId(gameData.gameId)

          console.log('💰 Staking to join game:', gameData.contractGameId)

          // Build transaction from backend
          const txResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/build-join-transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameId: gameData.contractGameId,
              playerAddress: publicKey.toBase58()
            }),
          })

          const txData = await txResponse.json()
          if (!txData.success) {
            throw new Error(txData.error || 'Failed to build transaction')
          }

          // Send transaction using Solana wallet
          const signature = await sendTransaction(
            Transaction.from(Buffer.from(txData.transaction, 'base64')),
            connection
          )

          console.log('✅ Transaction sent:', signature)

          // Wait for confirmation
          await connection.confirmTransaction(signature, 'confirmed')
          console.log('✅ Transaction confirmed:', signature)

          setHasProcessedSuccess(true)
          handleStakeSuccess(signature, gameData.gameId, gameData.roomCode)
        } else {
          console.log('💰 Staking to join game:', gameId)

          // Build transaction from backend
          const txResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/build-join-transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameId: gameId,
              playerAddress: publicKey.toBase58()
            }),
          })

          const txData = await txResponse.json()
          if (!txData.success) {
            throw new Error(txData.error || 'Failed to build transaction')
          }

          // Send transaction using Solana wallet
          const signature = await sendTransaction(
            Transaction.from(Buffer.from(txData.transaction, 'base64')),
            connection
          )

          console.log('✅ Transaction sent:', signature)

          // Wait for confirmation
          await connection.confirmTransaction(signature, 'confirmed')
          console.log('✅ Transaction confirmed:', signature)

          setHasProcessedSuccess(true)
          handleStakeSuccess(signature, gameId)
        }
      }
    } catch (error) {
      console.error('Error staking:', error)
      if (!isUserRejection(error)) {
        const errorMessage = handleSolanaError(error)
        setError(`Failed to stake: ${errorMessage}`)
      } else {
        setError('Transaction was rejected')
      }
      setIsStaking(false)
    }
  }

  const getStakingStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'text-yellow-400'
      case 'full': return 'text-green-400'
      case 'started': return 'text-blue-400'
      case 'completed': return 'text-purple-400'
      default: return 'text-gray-400'
    }
  }

  const getStakingStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'WAITING FOR PLAYERS'
      case 'full': return 'READY TO START'
      case 'started': return 'GAME STARTED'
      case 'completed': return 'GAME COMPLETED'
      default: return 'UNKNOWN'
    }
  }

  if (balanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gaming-bg scanlines">
        <Card className="w-full max-w-md p-8 bg-[#111111]/80 border border-[#2a2a2a] text-center">
          <div className="space-y-4">
            <div className="text-lg font-press-start pixel-text-3d-white">CHECKING BALANCE...</div>
            <div className="flex justify-center">
              <GifLoader size="lg" />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 gaming-bg scanlines">
      <Card className="w-[90vw] max-w-[480px] p-3 sm:p-4 lg:p-6 bg-[#111111]/80 border border-[#2a2a2a]">
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Header */}
          <div className="text-center space-y-1 sm:space-y-2">
            <RetroAnimation type="bounce">
              <div className="text-2xl sm:text-3xl lg:text-4xl">💰</div>
            </RetroAnimation>
            <div className="text-lg sm:text-xl font-bold font-press-start pixel-text-3d-white">
              STAKE TO PLAY
            </div>
          </div>

          {/* Balance and Network Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            {balanceInfo && (
              <div className="p-2 sm:p-3 lg:p-4 bg-[#1a1a1a]/50 border border-[#333333] rounded-lg">
                <div className="space-y-1 sm:space-y-2">
                  <div className="text-xs sm:text-sm font-press-start text-gray-300">YOUR BALANCE</div>
                  <div className="text-base sm:text-lg font-bold text-white break-all">
                    {balanceInfo.balanceInSOL} SOL
                  </div>
                  <div className={`text-xs sm:text-sm font-press-start ${balanceInfo.sufficient ? 'text-green-400' : 'text-red-400'}`}>
                    {balanceInfo.sufficient ? '✅ SUFFICIENT' : '❌ INSUFFICIENT'}
                  </div>
                </div>
              </div>
            )}

            <div className="p-2 sm:p-3 lg:p-4 bg-[#1a1a1a]/50 border border-[#333333] rounded-lg">
              <div className="space-y-1 sm:space-y-2">
                <div className="text-xs sm:text-sm font-press-start text-gray-300">NETWORK</div>
                <div className="text-base sm:text-lg font-bold text-white break-words">
                  {connected ? '✅ Solana Devnet' : '❌ Not Connected'}
                </div>
                {!connected && (
                  <div className="text-xs sm:text-sm text-yellow-400 break-words">
                    Please connect your Solana wallet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Faucet Button */}
          <div className="flex justify-center">
            <FaucetButton
              walletAddress={playerAddress || null}
              onSuccess={async () => {
                console.log('✅ Faucet claim successful! Refreshing balance...')
                setTimeout(() => {
                  fetchBalance()
                }, 2000)
              }}
            />
          </div>

          <div className="border-t border-border my-4"></div>

          {/* Public/Private Toggle and Settings - Only show for create mode */}
          {mode === 'create' && (
            <>
              <Card className="p-2 sm:p-3 bg-[#1a1a1a]/50 border border-[#333333]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs sm:text-sm font-press-start text-gray-300">ROOM VISIBILITY</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {isPublic ? 'Anyone can see and join' : 'Only with room code'}
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsPublic(!isPublic)}
                    variant={isPublic ? 'pixel' : 'outline'}
                    size="pixel"
                    className="text-xs"
                  >
                    {isPublic ? '🌐 PUBLIC' : '🔒 PRIVATE'}
                  </Button>
                </div>
              </Card>

              <Card className="p-2 sm:p-3 bg-[#1a1a1a]/50 border border-[#333333]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs sm:text-sm font-press-start text-gray-300">GAME SETTINGS</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Configure phase times and player count
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowSettingsDialog(true)}
                    variant="outline"
                    size="pixel"
                    className="text-xs"
                  >
                    ⚙️ CONFIGURE
                  </Button>
                </div>
              </Card>
            </>
          )}

          {/* Stake Amount Input - Only show for create mode */}
          {mode === 'create' && (
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="stakeAmount" className="text-xs sm:text-sm font-press-start text-gray-300">
                STAKE AMOUNT (SOL)
              </Label>
              <Input
                id="stakeAmount"
                type="number"
                value={stakeAmountInput}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '') {
                    setStakeAmountInput('')
                    return
                  }
                  const num = parseFloat(value)
                  if (num < 0) {
                    setStakeAmountInput('0.001')
                    return
                  }
                  setStakeAmountInput(value)
                }}
                onBlur={() => {
                  const num = parseFloat(stakeAmountInput)
                  if (isNaN(num) || num < 0.001) {
                    setStakeAmountInput('0.001')
                  }
                }}
                placeholder="Enter stake amount"
                min="0.001"
                step="0.001"
                className="font-press-start text-center text-sm sm:text-lg tracking-widest"
              />
            </div>
          )}

          {/* Join mode UI */}
          {mode === 'join' && (
            <>
              <div className="space-y-2 p-4 border border-border rounded-lg">
                <Input
                  id="roomCode"
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-char room code"
                  maxLength={6}
                  className="w-full font-press-start text-left text-lg tracking-widest p-4 bg-black/50 border-2 border-border focus:border-primary focus:ring-primary"
                />
                <Button
                  onClick={handleStake}
                  disabled={isStaking || !connected || !balanceInfo?.sufficient || roomCode.length !== 6}
                  variant="pixel"
                  size="pixelLarge"
                  className="w-full"
                >
                  {isStaking ? (
                    <div className="flex items-center justify-center gap-2">
                      <GifLoader size="sm" />
                      <span>STAKING...</span>
                    </div>
                  ) : (
                    `💰 Stake to join`
                  )}
                </Button>
              </div>

              <div className="flex items-center">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-4 text-xs text-gray-500">OR</span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              {onBrowsePublicLobbies && (
                <div>
                  <Button
                    onClick={onBrowsePublicLobbies}
                    variant="outline"
                    size="pixelLarge"
                    className="w-full"
                  >
                    🌐 BROWSE PUBLIC LOBBIES
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Error Message */}
          {error && (
            <Card className="p-2 sm:p-3 bg-red-900/20 border border-red-500/50">
              <div className="text-xs sm:text-sm text-red-400 font-press-start">
                ❌ {error}
              </div>
            </Card>
          )}

          {/* Staking Info */}
          {stakingInfo && (
            <Card className="p-2 sm:p-3 lg:p-4 bg-[#1a1a1a]/50 border border-[#333333]">
              <div className="space-y-1 sm:space-y-2">
                <div className="text-xs sm:text-sm font-press-start text-gray-300">GAME STATUS</div>
                <div className={`text-base sm:text-lg font-bold font-press-start ${getStakingStatusColor(stakingInfo.status)}`}>
                  {getStakingStatusText(stakingInfo.status)}
                </div>
                <div className="text-xs sm:text-sm text-gray-400">
                  Players: {stakingInfo.playersCount}/{stakingInfo.minPlayers}
                </div>
                <div className="text-xs sm:text-sm text-gray-400">
                  Total Staked: {stakingInfo.totalStakedInSOL} SOL
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 sm:space-y-3">
            {mode === 'create' && (
              <Button
                onClick={handleStake}
                disabled={isStaking || !connected || !balanceInfo?.sufficient}
                variant="pixel"
                size="pixelLarge"
                className="w-full"
              >
                {isStaking ? (
                  <div className="flex items-center justify-center gap-2">
                    <GifLoader size="sm" />
                    <span>STAKING...</span>
                  </div>
                ) : (
                  `🎮 STAKE ${stakeAmountInSOL} SOL`
                )}
              </Button>
            )}

            <Button
              onClick={onCancel}
              variant="outline"
              size="pixelLarge"
              className="w-full"
            >
              CANCEL
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 text-center space-y-0.5 sm:space-y-1">
            <div>• Minimum stake: 0.001 SOL</div>
            <div>• Winners get 98% of total pool</div>
            <div>• Losers get 0% of total pool</div>
            <div>• 2% house cut applies</div>
          </div>
        </div>

        {/* Settings Dialog */}
        <LobbySettingsDialog
          open={showSettingsDialog}
          onOpenChange={setShowSettingsDialog}
          settings={gameSettings}
          onSettingsChange={setGameSettings}
          onSave={() => {
            console.log('Game settings updated:', gameSettings)
          }}
        />
      </Card>
    </div>
  )
}
