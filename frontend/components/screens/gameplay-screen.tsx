"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Player } from "@/hooks/useGame"
import { Game, apiService } from "@/services/api"
import FullscreenToggle from "@/components/common/fullscreen-toggle"
import ColoredPlayerName from "@/components/game/colored-player-name"
import TipBar from "@/components/common/tip-bar"

interface GameplayScreenProps {
  currentPlayer: Player
  players: Player[]
  game: Game | null // Game state from parent component
  submitNightAction: (action: any, commit?: string) => Promise<void>
  isConnected: boolean
  refreshGame: () => Promise<void>
  onComplete: (killedPlayer?: Player) => void
}

export default function GameplayScreen({ currentPlayer, players, game, submitNightAction, isConnected, refreshGame, onComplete }: GameplayScreenProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [actionTaken, setActionTaken] = useState(false)
  const [showDeathAnnouncement, setShowDeathAnnouncement] = useState(false)
  const [killedPlayer, setKilledPlayer] = useState<Player | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [showTimeUp, setShowTimeUp] = useState(false)
  const [lastShownElimination, setLastShownElimination] = useState<string | null>(null)
  const [lastShownDay, setLastShownDay] = useState<number>(0) // Track which day we showed elimination for
  const [announcementShown, setAnnouncementShown] = useState(false)
  const [investigationResult, setInvestigationResult] = useState<{ player: string, role: string, color: string, emoji: string, avatar?: string } | null>(null)
  const [keyboardFocusIndex, setKeyboardFocusIndex] = useState<number>(0)

  // Check if current player is eliminated
  const isCurrentPlayerEliminated = game?.eliminated?.includes(currentPlayer?.address || currentPlayer?.id) || !currentPlayer?.isAlive

  // Debug game state
  useEffect(() => {
    console.log('GameplayScreen debug:', {
      gamePhase: game?.phase,
      timeLeft: game?.timeLeft,
      currentPlayerRole: currentPlayer?.role,
      currentPlayerAddress: currentPlayer?.address,
      currentPlayerId: currentPlayer?.id,
      playersCount: players.length,
      isConnected
    })
  }, [game, currentPlayer, players, isConnected])

  // Auto-refresh when timer is 0 or every 3 seconds for state sync
  useEffect(() => {
    if (game?.timeLeft === 0) {
      // When timer expires, refresh every 3 seconds until phase changes
      const interval = setInterval(() => {
        console.log("Auto-refreshing game state (timer expired)")
        refreshGame()
      }, 3000)

      return () => clearInterval(interval)
    } else if (game?.timeLeft !== undefined && game.timeLeft > 0) {
      // When timer is running, refresh every 3 seconds (reduced frequency)
      const interval = setInterval(() => {
        refreshGame()
      }, 3000) // Consolidated to single 3-second interval

      return () => clearInterval(interval)
    }
  }, [game?.timeLeft])

  // Signal backend that frontend is ready for timer
  useEffect(() => {
    if (game?.gameId && game.phase === 'night' && !game.timerReady && currentPlayer?.address) {
      console.log('Frontend ready for night phase timer')
      // Send ready signal to backend with player address
      apiService.signalReady(game.gameId, currentPlayer.address)
        .then(data => {
          console.log('Player ready signal sent:', data)
        })
        .catch(error => {
          console.error('Error sending ready signal:', error)
        })
    }
  }, [game?.gameId, game?.phase, game?.timerReady, currentPlayer?.address])

  // Real-time timer sync with backend
  useEffect(() => {
    if (game?.timeLeft !== undefined) {
      setTimeLeft(game.timeLeft)

      // Start local countdown to match backend
      if (game.timeLeft > 0) {
        const timer = setTimeout(() => {
          setTimeLeft(prev => Math.max(0, prev - 1))
        }, 1000)
        return () => clearTimeout(timer)
      }

      // Show time up popup when timer reaches zero
      if (game.timeLeft === 0) {
        setShowTimeUp(true)
        // Hide popup after 3 seconds
        setTimeout(() => setShowTimeUp(false), 3000)
      }
    }
  }, [game?.timeLeft])

  // Handle game phase changes
  useEffect(() => {
    if (game?.phase === 'task') {
      // Night phase ended, move to task phase
      setTimeout(() => {
        onComplete()
      }, 1000)
    } else if (game?.phase === 'voting') {
      // Task phase ended, move to voting
      setTimeout(() => {
        onComplete()
      }, 1000)
    }
  }, [game?.phase, onComplete])

  // Reset elimination tracking when phase changes away from night
  useEffect(() => {
    if (game?.phase && game.phase !== 'night') {
      setLastShownElimination(null)
      // Don't reset announcementShown here - keep it to prevent re-showing
    }
  }, [game?.phase])

  // Reset announcement flag only when entering night phase for a new round
  useEffect(() => {
    if (game?.phase === 'night') {
      setAnnouncementShown(false)
    }
  }, [game?.phase])

  // Handle player eliminations - only during night phase
  useEffect(() => {
    // Only show death announcement during night phase and if not already shown
    if (game?.phase !== 'night' || announcementShown) {
      return
    }

    if (game?.eliminated && game.eliminated.length > 0 && game?.day) {
      const lastEliminated = game.eliminated[game.eliminated.length - 1]
      const currentDay = game.day

      // Only show if we haven't already shown this elimination for this day
      if (lastEliminated !== lastShownElimination || currentDay !== lastShownDay) {
        const eliminatedPlayer = players.find(p => p.address === lastEliminated)
        if (eliminatedPlayer) {
          console.log('🔔 Showing death announcement for:', eliminatedPlayer.name, 'on day', currentDay)
          setKilledPlayer(eliminatedPlayer)
          setShowDeathAnnouncement(true)
          setLastShownElimination(lastEliminated)
          setLastShownDay(currentDay) // Track which day we showed this for
          setAnnouncementShown(true) // Mark that we've shown the announcement

          setTimeout(() => {
            setShowDeathAnnouncement(false)
            onComplete(eliminatedPlayer)
          }, 3000)
        }
      }
    }
  }, [game?.eliminated, game?.phase, game?.day, players, onComplete, lastShownElimination, lastShownDay, announcementShown])

  const canSelectPlayers = !isCurrentPlayerEliminated && (currentPlayer.role === "ASUR" || currentPlayer.role === "DEVA" || currentPlayer.role === "RISHI")

  // Keyboard navigation (arrow keys + Enter) - hidden feature
  useEffect(() => {
    if (actionTaken || isCurrentPlayerEliminated || game?.phase !== 'night') return

    const selectablePlayers = players.filter(p => {
      if (!p.isAlive) return false

      // ASUR and RISHI cannot target themselves
      if ((currentPlayer.role === "ASUR" || currentPlayer.role === "RISHI") && p.id === currentPlayer.id) {
        return false
      }

      // DEVA can save anyone including themselves
      if (currentPlayer.role === "DEVA") {
        return true
      }

      return p.id !== currentPlayer.id
    })

    if (selectablePlayers.length === 0 || !canSelectPlayers) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow keys for navigation
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        setKeyboardFocusIndex(prev => (prev + 1) % selectablePlayers.length)
        const nextPlayer = selectablePlayers[(keyboardFocusIndex + 1) % selectablePlayers.length]
        setSelectedPlayer(nextPlayer.id)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setKeyboardFocusIndex(prev => (prev - 1 + selectablePlayers.length) % selectablePlayers.length)
        const prevPlayer = selectablePlayers[(keyboardFocusIndex - 1 + selectablePlayers.length) % selectablePlayers.length]
        setSelectedPlayer(prevPlayer.id)
      }
      // Enter to confirm
      else if (e.key === 'Enter' && selectedPlayer) {
        e.preventDefault()
        handlePlayerSelect(selectedPlayer)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [actionTaken, isCurrentPlayerEliminated, game?.phase, players, selectedPlayer, keyboardFocusIndex, currentPlayer.role, currentPlayer.id, canSelectPlayers])

  const handlePlayerSelect = async (playerId: string) => {
    console.log('🎯 handlePlayerSelect called:', {
      playerId,
      timeLeft,
      actionTaken,
      gamePhase: game?.phase,
      currentPlayerRole: currentPlayer?.role,
      currentPlayerAddress: currentPlayer?.address,
      isEliminated: isCurrentPlayerEliminated
    })

    // Eliminated players cannot take actions
    if (isCurrentPlayerEliminated) {
      console.log('❌ Eliminated player cannot take actions')
      return
    }

    if (timeLeft > 0 && !actionTaken && game?.phase === 'night') {
      // If clicking the same player that's already selected, confirm and submit
      if (selectedPlayer === playerId) {
        setActionTaken(true)

        try {
          // Map frontend roles to backend roles
          const roleMapping: Record<string, string> = {
            'ASUR': 'Mafia',
            'DEVA': 'Doctor',
            'RISHI': 'Detective',
            'MANAV': 'Villager'
          }

          const backendRole = roleMapping[currentPlayer.role || '']
          if (!backendRole) {
            console.error('Unknown role:', currentPlayer.role)
            return
          }

          console.log(`🎯 Submitting action: ${backendRole} targeting ${playerId}`)
          console.log(`📊 Game state before action:`, {
            gamePhase: game?.phase,
            timeLeft: game?.timeLeft,
            timerReady: game?.timerReady,
            gameId: game?.gameId
          })

          // Double-check phase hasn't changed (race condition protection)
          if (game?.phase !== 'night') {
            console.log('⚠️ Game phase changed, action cancelled')
            setActionTaken(false)
            return
          }

          // Submit action to backend
          await submitNightAction({
            type: backendRole.toLowerCase(),
            target: playerId
          })

          console.log(`✅ Action submitted successfully: ${backendRole} targeting ${playerId}`)

          // If detective and not eliminated, immediately fetch investigation result
          if (currentPlayer.role === 'RISHI' && game?.gameId && !isCurrentPlayerEliminated) {
            console.log('🔍 Detective investigation - fetching result')

            // Wait a moment for backend to process, then fetch game state
            setTimeout(async () => {
              try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/${game.gameId}?playerAddress=${currentPlayer.address}`)
                const data = await response.json()

                if (data.success && data.game?.roles) {
                  const targetPlayer = players.find(p => p.id === playerId)
                  const targetRole = data.game.roles[playerId]

                  console.log('🔍 Investigation result:', { targetPlayer: targetPlayer?.name, targetRole })

                  // Map backend role to frontend display
                  const roleInfo: Record<string, { name: string, emoji: string, color: string }> = {
                    'Mafia': { name: 'ASUR', emoji: '🔴', color: '#FF4444' },
                    'Doctor': { name: 'DEVA', emoji: '🛡️', color: '#44AA44' },
                    'Detective': { name: 'RISHI', emoji: '🔍', color: '#4444FF' },
                    'Villager': { name: 'MANAV', emoji: '👤', color: '#AAAAAA' }
                  }

                  const info = roleInfo[targetRole] || { name: 'UNKNOWN', emoji: '❓', color: '#AAAAAA' }

                  setInvestigationResult({
                    player: targetPlayer?.name || 'Unknown',
                    role: info.name,
                    color: info.color,
                    emoji: info.emoji,
                    avatar: targetPlayer?.avatar
                  })
                }
              } catch (err) {
                console.error('❌ Failed to fetch investigation result:', err)
              }
            }, 500)
          }

          console.log(`📊 Game state after action:`, {
            gamePhase: game?.phase,
            timeLeft: game?.timeLeft,
            timerReady: game?.timerReady
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)

          // Check if it's a phase-related error (game ended/transitioned)
          if (errorMessage.includes('phase') || errorMessage.includes('ended')) {
            console.log('⚠️ Game phase changed during action submission:', errorMessage)
          } else {
            console.error('❌ Failed to submit action:', error)
          }

          setActionTaken(false)
          setSelectedPlayer(null)
        }
      } else {
        // Select this player
        setSelectedPlayer(playerId)
        console.log('👉 Selected player:', playerId)
      }
    } else {
      console.log('❌ Cannot submit action:', {
        timeLeft,
        actionTaken,
        gamePhase: game?.phase,
        reason: timeLeft <= 0 ? 'Timer expired' : actionTaken ? 'Action already taken' : 'Not in night phase'
      })
    }
  }


  const getActionColor = () => {
    switch (currentPlayer.role) {
      case "ASUR":
        return "#8B0000"
      case "DEVA":
        return "#4A8C4A"
      case "RISHI":
        return "#FF8800"
      case "MANAV":
        return "#A259FF"
      default:
        return "#4A8C4A"
    }
  }

  const getActionText = () => {
    switch (currentPlayer.role) {
      case "ASUR":
        return "SELECT TARGET TO ELIMINATE"
      case "DEVA":
        return "SELECT PLAYER TO SAVE"
      case "RISHI":
        return "SELECT PLAYER TO INVESTIGATE"
      case "MANAV":
        return "OBSERVE AND WAIT"
      default:
        return "WAITING..."
    }
  }



  // Get role-specific instruction and color
  const getRoleInstruction = () => {
    // If player is eliminated, show observer message
    if (isCurrentPlayerEliminated) {
      return { text: "YOU ARE ELIMINATED - OBSERVING ONLY", color: "#666666", bgColor: "bg-gray-900/50", borderColor: "border-gray-700" }
    }

    switch (currentPlayer.role) {
      case "ASUR":
        return { text: "ASUR: CHOOSE YOUR TARGET", color: "#EF4444", bgColor: "bg-red-900/30", borderColor: "border-red-600" }
      case "DEVA":
        return { text: "DEVA: CHOOSE A PLAYER TO SAVE", color: "#22C55E", bgColor: "bg-green-900/30", borderColor: "border-green-600" }
      case "RISHI":
        return { text: "RISHI: CHOOSE A PLAYER TO INVESTIGATE", color: "#F97316", bgColor: "bg-orange-900/30", borderColor: "border-orange-600" }
      case "MANAV":
        return { text: "MANAV: OBSERVE AND WAIT", color: "#9333EA", bgColor: "bg-purple-900/30", borderColor: "border-purple-600" }
      default:
        return { text: "WAITING...", color: "#888888", bgColor: "bg-gray-900/30", borderColor: "border-gray-600" }
    }
  }

  const roleInstruction = getRoleInstruction()

  // Get role-specific header color
  const getRoleHeaderColor = () => {
    return "pixel-text-3d-white" // Neutral color for all roles
  }

  const roleHeaderColor = getRoleHeaderColor()

  return (
    <div className="min-h-screen flex flex-col items-center justify-between pt-16 p-4 gaming-bg text-white font-press-start">
      {/* Top Section: Title, Timer, and Instruction Bar */}
      <div className="w-full max-w-7xl text-center space-y-4">
        {/* Debug Refresh Button (top right) */}
        {!isConnected && (
          <div className="absolute top-4 right-4 text-xs text-yellow-400">⚠️ DISCONNECTED</div>
        )}
        {/* Full-width header with buttons */}
        <div className="absolute top-0 left-0 right-0 w-full bg-black/60 border-b border-white/20 py-2 px-4 flex justify-between items-center z-50">
          <div className="flex gap-2">
            <button
              onClick={() => refreshGame()}
              className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded flex items-center justify-center"
              title="Refresh Game State"
            >
              🔄
            </button>
            <div className="w-8 h-8 bg-black/60 rounded flex items-center justify-center border border-white/20">
              <FullscreenToggle variant="icon" className="text-white text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <div className="text-xs text-gray-400 font-press-start">{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</div>
          </div>
        </div>

        <h1 className={`text-4xl md:text-5xl font-bold ${roleHeaderColor} pixel-text-3d-float-long mt-12`}>NIGHT PHASE</h1>
        <div className="text-5xl md:text-7xl font-bold pixel-text-3d-red my-2">{timeLeft}</div>
        <div
          className={`w-full bg-black/50 border-2 p-3 text-lg md:text-xl ${selectedPlayer && !actionTaken ? 'border-yellow-400 text-yellow-400 animate-pulse' : 'border-gray-500 text-gray-300'
            }`}
          style={{ color: selectedPlayer && !actionTaken ? roleInstruction.color : undefined }}
        >
          {actionTaken
            ? "Action confirmed. Waiting for others..."
            : selectedPlayer
              ? `You selected ${players.find(p => p.id === selectedPlayer)?.name}. Click again to confirm.`
              : roleInstruction.text
          }
        </div>

        {/* Night Phase Tips */}
        <TipBar
          phase="night"
          tips={[
            "Click a player to select, <strong>double-click to confirm</strong>.",
            "ASUR: Eliminate a player",
            "DEVA: Save a player (including yourself)",
            "RISHI: Investigate a player's role",
            "MANAV: Wait and observe"
          ]}
          className="mt-4"
        />
      </div>

      {/* Main Content Area - Same as Voting Screen */}
      <div className="flex-grow flex items-center justify-center w-full max-w-7xl">
        {/* Player Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-12">
          {players
            .map((player) => {
              const isCurrentPlayer = player.id === currentPlayer.id
              const isSelected = selectedPlayer === player.id
              const cardColor = isSelected ? getActionColor() : "transparent"
              const isEliminated = !player.isAlive

              // Check if any action has been performed on this player
              const hasActionPerformed = game?.pendingActions && Object.values(game.pendingActions).some((action: any) =>
                action?.action?.target === player.id
              )

              // Determine if this player can be selected based on role
              const canSelectThisPlayer = (() => {
                if (!canSelectPlayers || timeLeft <= 0 || actionTaken || isEliminated) return false

                // ASUR and RISHI cannot target themselves
                if ((currentPlayer.role === "ASUR" || currentPlayer.role === "RISHI") && isCurrentPlayer) {
                  return false
                }

                // DEVA can save anyone including themselves (but not eliminated players)
                if (currentPlayer.role === "DEVA") {
                  return true
                }

                return !isCurrentPlayer
              })()

              const isDisabled = !canSelectThisPlayer && canSelectPlayers

              return (
                <Card
                  key={player.id}
                  className={`
                      relative p-6 bg-black/20 rounded-none text-center transition-all duration-200 ease-in-out transform outline-4 outline-offset-[-4px] border-4 border-gray-600
                      ${canSelectThisPlayer ? "cursor-pointer hover:-translate-y-1" : ""}
                      ${isDisabled || isEliminated ? "cursor-not-allowed opacity-40" : ""}
                      ${!canSelectPlayers ? "opacity-100" : ""}
                      ${isSelected ? "scale-110" : ""}
                      ${isEliminated ? "opacity-60 outline-red-500/50 bg-red-900/20" : ""}
                      ${isSelected ? `outline-yellow-400 bg-yellow-400/20 animate-pulse` : "outline-transparent"}
                      group
                    `}
                  onClick={() => canSelectThisPlayer && handlePlayerSelect(player.id)}
                >
                  {/* Player Avatar - Same as Voting Screen */}
                  <div className="mb-3 relative">
                    {player.avatar && player.avatar.startsWith('http') ? (
                      <img
                        src={player.avatar}
                        alt={player.name}
                        className={`w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-none object-cover mx-auto ${isEliminated ? 'grayscale' : ''}`}
                        style={{ imageRendering: 'pixelated' }}
                        onError={(e) => {
                          console.error('Failed to load avatar for player:', player.name);
                        }}
                      />
                    ) : (
                      <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-[#333] border-2 border-[#666] mx-auto flex items-center justify-center">
                        <span className="text-4xl">?</span>
                      </div>
                    )}
                    {isEliminated && (
                      <div className="absolute inset-0 bg-black/60 rounded-none"></div>
                    )}
                  </div>

                  {/* Player Name - Colored Font with YOU indicator inline */}
                  <div className="font-press-start text-sm sm:text-base lg:text-lg mb-1">
                    <ColoredPlayerName
                      playerName={player.name}
                      isCurrentPlayer={isCurrentPlayer}
                      showYouIndicator={true}
                    />
                  </div>

                  {/* Role for Current Player */}
                  {isCurrentPlayer && (
                    <div className="space-y-1">
                      {isCurrentPlayerEliminated && (
                        <div className="font-press-start text-xs sm:text-sm text-red-400">
                          ELIMINATED
                        </div>
                      )}
                      <div
                        className="font-press-start text-xs sm:text-sm font-bold"
                        style={{ color: roleInstruction.color, textShadow: `0 0 5px ${roleInstruction.color}` }}
                      >
                        {currentPlayer.role}
                      </div>
                    </div>
                  )}

                  {/* Eliminated Tag for Other Players */}
                  {!isCurrentPlayer && isEliminated && (
                    <div className="mt-1 px-1 py-1 bg-red-900/50 border border-red-500/50 text-red-300 text-xs font-press-start rounded-none">
                      ☠️ ELIMINATED
                    </div>
                  )}



                  {/* Selection Indicator */}
                  {isSelected && !isCurrentPlayer && (
                    <div
                      className="mt-2 text-xs sm:text-sm font-press-start font-bold"
                      style={{ color: cardColor }}
                    >
                      {currentPlayer.role === "ASUR" ? "⚔️ TARGETED" :
                        currentPlayer.role === "DEVA" ? "🛡️ PROTECTED" :
                          currentPlayer.role === "RISHI" ? "🔍 INVESTIGATING" : "✓ SELECTED"}
                    </div>
                  )}


                </Card>
              )
            })}
        </div>
      </div>

      {/* Time Up Popup */}
      {
        showTimeUp && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <Card className="p-8 bg-card border-4 border-destructive rounded-none text-center">
              <div className="text-4xl font-bold font-press-start text-destructive pixel-text-3d-red pixel-text-3d-float">⏰ TIME'S UP!</div>
            </Card>
          </div>
        )
      }

      {/* Detective Investigation Result - Minimal */}
      {investigationResult && currentPlayer.role === 'RISHI' && !isCurrentPlayerEliminated && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setInvestigationResult(null)}>
          <Card className="w-full max-w-md p-6 bg-card border-2 border-border text-center space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-press-start text-gray-400">INVESTIGATION</div>

            {investigationResult.avatar && (
              <img
                src={investigationResult.avatar}
                alt={investigationResult.player}
                className="w-24 h-24 mx-auto object-cover border-2 border-border"
                style={{ imageRendering: 'pixelated' }}
              />
            )}

            <div className="text-xl font-press-start pixel-text-3d-white">
              {investigationResult.player}
            </div>

            <div
              style={{ color: investigationResult.color }}
              className="text-2xl font-press-start"
            >
              {investigationResult.role}
            </div>

            <Button
              onClick={() => setInvestigationResult(null)}
              variant="pixel"
              size="pixel"
              className="w-full"
            >
              OK
            </Button>
          </Card>
        </div>
      )}

    </div >
  )
}
