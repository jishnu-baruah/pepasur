"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import GifLoader from "@/components/common/gif-loader"
import RetroAnimation from "@/components/common/retro-animation"
import { Player } from "@/hooks/useGame"
import { Game } from "@/services/api"
import { clearGameSession } from "@/utils/sessionPersistence"
import { canLeaveGame } from "@/utils/connectivityChecker"
import FullscreenToggle from "@/components/common/fullscreen-toggle"
import ColoredPlayerName from "@/components/game/colored-player-name"
import LobbySettingsDialog, { FullGameSettings, DEFAULT_GAME_SETTINGS } from "@/components/game/lobby-settings-dialog"
import FaucetButton from "@/components/wallet/faucet-button"
import { GameSettings } from "@/services/api"

interface LobbyScreenProps {
  players: Player[]
  game: Game | null
  isConnected: boolean
  onStartGame: () => void
  playerAddress?: string
  onLeaveGame?: () => void
  refreshGame?: () => Promise<void>
}

export default function LobbyScreen({ players, game, isConnected, onStartGame, playerAddress, onLeaveGame, refreshGame }: LobbyScreenProps) {
  const [timeLeft, setTimeLeft] = useState(0)
  const [isPublic, setIsPublic] = useState(false)
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [isLeavingGame, setIsLeavingGame] = useState(false)
  const [copied, setCopied] = useState(false)
  const [leaveMethod, setLeaveMethod] = useState<'normal' | 'force_local' | null>(null)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [gameSettings, setGameSettings] = useState<FullGameSettings>(DEFAULT_GAME_SETTINGS)

  // Debug player updates
  useEffect(() => {
    console.log('Lobby players updated:', {
      propPlayers: players.length,
      gamePlayers: game?.players?.length || 0,
      isConnected
    })
  }, [players, game?.players, isConnected])

  // Poll for updates when in lobby (as backup to socket updates)
  useEffect(() => {
    if (!game?.gameId || game.phase !== 'lobby' || !refreshGame) return

    console.log('🔄 Setting up lobby polling for game:', game.gameId)

    // Poll every 2 seconds to check for new players
    const pollInterval = setInterval(async () => {
      try {
        console.log('🔄 Polling for lobby updates...')
        await refreshGame()
      } catch (error) {
        console.error('❌ Lobby polling error:', error)
      }
    }, 2000) // Poll every 2 seconds

    return () => {
      console.log('🧹 Cleaning up lobby polling')
      clearInterval(pollInterval)
    }
  }, [game?.gameId, game?.phase, refreshGame])

  // Get real-time countdown from backend
  useEffect(() => {
    if (game?.timeLeft !== undefined) {
      setTimeLeft(game.timeLeft)
    }
  }, [game?.timeLeft])

  // Initialize isPublic and settings from game data
  useEffect(() => {
    if (game) {
      setIsPublic(game.isPublic || false)
      if (game.settings) {
        setGameSettings({
          nightPhaseDuration: game.settings.nightPhaseDuration || 30,
          resolutionPhaseDuration: game.settings.resolutionPhaseDuration || 10,
          taskPhaseDuration: game.settings.taskPhaseDuration || 30,
          votingPhaseDuration: game.settings.votingPhaseDuration || 10,
          maxTaskCount: game.settings.maxTaskCount || 4,
        })
      }
    }
  }, [game])



  // Check if current player is the creator
  const isCreator = playerAddress && game?.creator === playerAddress

  // Toggle room visibility
  const handleToggleVisibility = async () => {
    if (!game?.gameId || !playerAddress || !isCreator) return

    setIsTogglingVisibility(true)
    try {
      // Call handleUpdateSettings with the new isPublic value
      await handleUpdateSettings({ ...gameSettings, isPublic: !isPublic })
      setIsPublic(!isPublic) // Optimistically update UI
    } catch (error) {
      console.error('Error toggling visibility:', error)
      // Revert optimistic update if error
      setIsPublic(isPublic)
    } finally {
      setIsTogglingVisibility(false)
    }
  }

  // Update game settings
  const handleUpdateSettings = async (newSettings: FullGameSettings) => {
    if (!game?.gameId || !playerAddress || !isCreator) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/${game.gameId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress: playerAddress,
          settings: newSettings
        })
      })

      const data = await response.json()
      if (data.success) {
        setGameSettings(newSettings)
        console.log('✅ Game settings updated successfully')
      } else {
        console.error('❌ Failed to update settings:', data.error)
        alert(`Failed to update settings: ${data.error}`)
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      alert('Failed to update settings. Please try again.')
    }
  }

  // Copy room code to clipboard
  const copyRoomCode = async () => {
    if (!game?.roomCode) {
      console.error('No room code available to copy')
      return
    }

    try {
      // Clean the room code to ensure only the actual code is copied
      const cleanRoomCode = game.roomCode.trim().replace(/\s+/g, '')
      console.log('Copying room code:', cleanRoomCode)

      await navigator.clipboard.writeText(cleanRoomCode)

      console.log('✅ Room code copied successfully')
      setCopied(true)

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error('❌ Failed to copy room code:', error)
      alert('Failed to copy room code. Please copy manually: ' + game.roomCode)
    }
  }

  // Check leave game options
  const handleLeaveGameClick = async () => {
    if (!game?.gameId || !playerAddress) return

    try {
      const leaveOptions = await canLeaveGame()
      console.log('🚪 Leave game options:', leaveOptions)

      if (leaveOptions.forceLocal) {
        setLeaveMethod('force_local')
      } else {
        setLeaveMethod('normal')
      }

      setShowLeaveDialog(true)
    } catch (error) {
      console.error('❌ Error checking leave options:', error)
      // Default to normal leave if check fails
      setLeaveMethod('normal')
      setShowLeaveDialog(true)
    }
  }

  // Handle leave game
  const handleLeaveGame = async () => {
    if (!game?.gameId || !playerAddress) return

    try {
      setIsLeavingGame(true)

      if (leaveMethod === 'force_local') {
        // Force local leave - don't contact server
        console.log('🔌 Server unreachable, performing local leave')

        // Clear session immediately
        clearGameSession()

        // Close dialog
        setShowLeaveDialog(false)

        // Call parent callback
        if (onLeaveGame) {
          onLeaveGame()
        }

        console.log('✅ Local leave completed')
        return
      }

      // Normal server leave
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.gameId,
          playerAddress
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ Successfully left game via server')

        // Clear session
        clearGameSession()

        // Close dialog
        setShowLeaveDialog(false)

        // Call parent callback if provided
        if (onLeaveGame) {
          onLeaveGame()
        }
      } else {
        console.error('❌ Failed to leave game:', data.error)

        // If server error, offer local leave as fallback
        const fallbackConfirm = confirm(
          `Server error: ${data.error}\n\nWould you like to leave locally instead? (Your session will be cleared but the server won't be notified)`
        )

        if (fallbackConfirm) {
          clearGameSession()
          setShowLeaveDialog(false)
          if (onLeaveGame) {
            onLeaveGame()
          }
        }
      }
    } catch (error) {
      console.error('❌ Error leaving game:', error)

      // If network error, offer local leave as fallback
      const fallbackConfirm = confirm(
        `Network error: ${error}\n\nWould you like to leave locally instead? (Your session will be cleared but the server won't be notified)`
      )

      if (fallbackConfirm) {
        clearGameSession()
        setShowLeaveDialog(false)
        if (onLeaveGame) {
          onLeaveGame()
        }
      }
    } finally {
      setIsLeavingGame(false)
    }
  }

  const getPlayerDisplayName = (player: Player, index: number) => {
    if (player.isCurrentPlayer) {
      return `${player.name} (YOU)` // Show the actual generated name
    }
    return player.name || `Player ${index + 1}` // Show actual name for other players too
  }

  const getPlayerAvatar = (player: Player) => {
    // Always return the player's avatar (colored shirt)
    // Should never be undefined for actual players since we generate avatars
    return player.avatar
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-8 p-2 sm:p-4 gaming-bg scanlines">
      <div className="w-full max-w-4xl space-y-2 sm:space-y-3 lg:space-y-4">
        {/* Header */}
        <div className="text-center">
          <RetroAnimation type="bounce">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-press-start pixel-text-3d-white pixel-text-3d-float">
              LOBBY
            </h1>
          </RetroAnimation>

          {!isConnected && (
            <div className="text-xs text-yellow-400 mt-1 font-press-start">⚠️ DISCONNECTED</div>
          )}
        </div>

        {/* Room Code Card */}
        <Card className="p-2 sm:p-3 lg:p-4 bg-card border-2 border-border">
          <div className="space-y-2">
            {/* Room Code Display */}
            <div className="text-center space-y-2">
              <div className="text-xs sm:text-sm font-press-start text-white pixel-text-3d-glow">
                ROOM CODE
              </div>

              <div className="text-2xl sm:text-3xl lg:text-4xl font-press-start text-blue-400 pixel-text-3d-glow tracking-widest">
                {game?.roomCode || 'LOADING...'}
              </div>

              <Button
                onClick={copyRoomCode}
                variant={copied ? "pixel" : "pixelOutline"}
                size="sm"
                className="text-xs"
                disabled={!game?.roomCode}
              >
                {copied ? '✅ COPIED!' : '📋 COPY CODE'}
              </Button>

              <div className="text-xs text-gray-400 font-press-start">
                SHARE WITH FRIENDS
              </div>
            </div>

            {/* Visibility Toggle - Only for Creator */}
            {isCreator && (
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-[#2a2a2a]">
                <span className="text-xs font-press-start text-gray-300">VISIBILITY:</span>
                <Button
                  onClick={handleToggleVisibility}
                  variant={isPublic ? 'pixel' : 'outline'}
                  size="pixel"
                  className="text-xs"
                  disabled={isTogglingVisibility}
                >
                  {isTogglingVisibility ? '...' : isPublic ? '🌐 PUBLIC' : '🔒 PRIVATE'}
                </Button>
              </div>
            )}

            {/* Visibility Status - For Non-Creators */}
            {!isCreator && (
              <div className="text-center pt-2 border-t border-[#2a2a2a]">
                <span className="text-xs font-press-start text-gray-400">
                  {isPublic ? '🌐 PUBLIC LOBBY' : '🔒 PRIVATE LOBBY'}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Faucet Button */}
        <div className="flex justify-center">
          <FaucetButton
            walletAddress={playerAddress || null}
            onSuccess={() => {
              console.log('✅ Faucet claim successful!')
            }}
          />
        </div>

        {/* Game Status */}
        <Card className="p-2 sm:p-3 lg:p-4 bg-card border-2 border-border text-center">
          <div className="space-y-1 sm:space-y-2">
            <div className="text-sm sm:text-base lg:text-lg font-press-start pixel-text-3d-white">
              WAITING FOR PLAYERS...
            </div>
            <div className="text-xs sm:text-sm font-press-start pixel-text-3d-white">
              {players.length}/{game?.minPlayers || 4} players joined
            </div>
            {timeLeft > 0 && (
              <div className="text-xs sm:text-sm font-press-start pixel-text-3d-red">
                Game starting in {timeLeft}s
              </div>
            )}
          </div>
        </Card>

        {/* Players Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {Array.from({ length: 4 }, (_, index) => {
            const player = players[index]
            const isEmpty = !player

            return (
              <Card
                key={index}
                className={`p-2 sm:p-3 text-center transition-all duration-300 ${isEmpty
                  ? 'bg-[#111111]/50 border border-[#2a2a2a] opacity-50'
                  : 'bg-card border-2 border-border hover:border-primary/50'
                  }`}
              >
                <div className="space-y-1 sm:space-y-2">
                  <div className="text-lg sm:text-xl lg:text-2xl">
                    {isEmpty ? (
                      <div className="text-gray-500">👤</div>
                    ) : (
                      <RetroAnimation type="pulse">
                        {getPlayerAvatar(player) && getPlayerAvatar(player)!.startsWith('http') ? (
                          <img
                            src={getPlayerAvatar(player)!}
                            alt={`${player.name} avatar`}
                            className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-none object-cover mx-auto"
                            style={{ imageRendering: 'pixelated' }}
                            onError={(e) => {
                              console.error('Failed to load avatar image for player:', player.name);
                            }}
                          />
                        ) : (
                          <div className="text-red-500 text-xs">⚠️ No Avatar</div>
                        )}
                      </RetroAnimation>
                    )}
                  </div>

                  <div className="text-xs font-press-start">
                    {isEmpty ? (
                      <span className="pixel-text-3d-white">EMPTY SLOT</span>
                    ) : (
                      <ColoredPlayerName
                        playerName={player.name}
                        isCurrentPlayer={player.isCurrentPlayer}
                        showYouIndicator={true}
                      />
                    )}
                  </div>

                  {player && (
                    <div className="text-xs text-green-400 font-press-start">
                      ✅ READY
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Loading Animation */}
        {players.length < 4 && (
          <div className="flex justify-center">
            <GifLoader size="lg" />
          </div>
        )}

        {/* Fullscreen, Settings & Leave Game */}
        <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
          <FullscreenToggle
            variant="button"
            className="text-xs sm:text-sm"
          />
          {isCreator && (
            <Button
              onClick={() => setShowSettingsDialog(true)}
              variant="pixel"
              size="pixel"
              className="text-xs sm:text-sm"
            >
              ⚙️ SETTINGS
            </Button>
          )}
          <Button
            onClick={handleLeaveGameClick}
            variant="outline"
            size="pixel"
            className="text-xs sm:text-sm border-red-500/50 text-red-400 hover:bg-red-900/20"
          >
            🚪 LEAVE GAME
          </Button>
        </div>

        {/* Leave Game Confirmation Dialog */}
        <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
          <DialogContent className="bg-card border-2 border-border">
            <DialogHeader>
              <DialogTitle className="font-press-start text-lg pixel-text-3d-white text-center">
                ⚠️ LEAVE GAME?
              </DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-2 pt-4">
              {/* Connectivity Status */}
              {leaveMethod === 'force_local' && (
                <div className="text-sm font-press-start text-yellow-400 mb-2">
                  🔌 SERVER UNREACHABLE
                </div>
              )}

              {game?.stakingRequired && (
                <div className="text-base font-press-start text-red-400">
                  YOUR STAKE WILL BE LOST!
                </div>
              )}

              <div className="text-sm text-gray-300">
                {leaveMethod === 'force_local' ? (
                  'Server is unreachable. Leaving will clear your local session, but the server won\'t be notified until it\'s back online.'
                ) : (
                  game?.stakingRequired
                    ? 'Are you sure you want to leave the lobby? Your staked SOL will not be returned.'
                    : 'Are you sure you want to leave this lobby?'
                )}
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                onClick={() => setShowLeaveDialog(false)}
                variant="pixel"
                size="pixel"
                disabled={isLeavingGame}
                className="w-full sm:w-auto"
              >
                ↩️ STAY
              </Button>
              <Button
                onClick={handleLeaveGame}
                variant="outline"
                size="pixel"
                disabled={isLeavingGame}
                className="w-full sm:w-auto border-red-500 text-red-400 hover:bg-red-900/50"
              >
                {isLeavingGame ? '⏳ LEAVING...' :
                  leaveMethod === 'force_local' ? '🔌 LEAVE LOCALLY' :
                    game?.stakingRequired ? '🚪 LEAVE & LOSE STAKE' : '🚪 LEAVE'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Instructions */}
        <Card className="p-3 sm:p-4 bg-[#111111]/50 border border-[#2a2a2a]">
          <div className="text-xs sm:text-sm font-press-start pixel-text-3d-white text-center space-y-1">
            <div>🎮 Share the room code with friends to join</div>
            <div>⚡ Game starts automatically when {game?.minPlayers || 4} players join</div>
            <div>🔍 Each player gets a unique role (ASUR, DEVA, RISHI, MANAV)</div>
          </div>
        </Card>

        {/* Settings Dialog (Creator Only) */}
        {isCreator && (
          <LobbySettingsDialog
            open={showSettingsDialog}
            onOpenChange={setShowSettingsDialog}
            settings={gameSettings}
            onSettingsChange={handleUpdateSettings}
            onSave={() => {
              console.log('Settings saved from lobby:', gameSettings);
            }}
          />
        )}
      </div>
    </div>
  )
}