"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import RetroAnimation from "@/components/common/retro-animation"
import WithdrawRewards from "@/components/wallet/withdraw-rewards"

import { Player } from "@/hooks/useGame"
import ColoredPlayerName from "@/components/game/colored-player-name"

interface GameResultsScreenProps {
  game?: any
  players: Player[]
  currentPlayer?: Player
  onNewGame?: () => void
  onBrowsePublicLobbies?: () => void
}

const PlayerResultRow = ({ player, isWinner, isEliminated, reward, game }: {
  player: Player
  isWinner: boolean
  isEliminated: boolean
  reward: any
  game: any
}) => {
  // Map backend roles to frontend display names
  const roleMapping: Record<string, string> = {
    'Mafia': 'ASUR',
    'Doctor': 'DEVA',
    'Detective': 'RISHI',
    'Villager': 'MANAV'
  }

  // Get role from player object, game.roles (backend format), or reward
  let playerRole = player.role || (reward?.role)
  if (!playerRole && game.roles && game.roles[player.address]) {
    // Map backend role to frontend format
    playerRole = roleMapping[game.roles[player.address]] || game.roles[player.address]
  }

  // Calculate SOL reward/penalty
  const solAmount = parseFloat(reward?.rewardInSOL || 0)
  const solDisplay = solAmount > 0 ? `+${solAmount.toFixed(4)}` : solAmount < 0 ? `${solAmount.toFixed(4)}` : '+0.0000'

  return (
    <div className={`p-3 sm:p-4 rounded-none border-2 font-press-start ${isWinner
      ? 'bg-green-900/20 border-green-500/50'
      : 'bg-red-900/20 border-red-500/50'
      }`}>
      <div className="flex items-center justify-between">
        {/* Left: Avatar + 0xColor Name + Role */}
        <div className="flex items-center space-x-3">
          {player?.avatar && player.avatar.startsWith('http') ? (
            <img
              src={player.avatar}
              alt={player?.name || 'Player'}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-none object-cover border border-gray-600"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-800 border border-gray-600 flex items-center justify-center">
              <span className="text-xl">👤</span>
            </div>
          )}
          <div className="space-y-1">
            <div className="text-sm sm:text-base font-bold">
              <ColoredPlayerName playerName={player?.name || 'Unknown'} />
            </div>
            <div className="text-xs sm:text-sm text-gray-300">
              {playerRole}
            </div>
          </div>
        </div>

        {/* Center: Winner/Loser Status */}
        <div className="flex-1 flex items-center justify-center">
          <div className={`text-sm sm:text-base font-bold ${isWinner ? 'text-green-400' : 'text-red-400'
            }`}>
            {isWinner ? '✓ WINNER' : '✗ LOSER'}
          </div>
        </div>

        {/* Right: SOL Amount + Status */}
        <div className="text-right space-y-1">
          <div className={`text-sm sm:text-base font-bold ${solAmount > 0 ? 'text-yellow-400' : solAmount < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
            {solDisplay} SOL
          </div>
          <div className={`px-2 py-1 rounded-none text-xs border ${isEliminated
            ? 'bg-red-900/50 border-red-500/50 text-red-300'
            : 'bg-green-900/50 border-green-500/50 text-green-300'
            }`}>
            {isEliminated ? '☠️ ELIMINATED' : '❤️ ALIVE'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function GameResultsScreen({ game, players, currentPlayer, onNewGame, onBrowsePublicLobbies }: GameResultsScreenProps) {
  const [showResults, setShowResults] = useState(false)

  // Show results after a brief delay
  useEffect(() => {
    const showTimer = setTimeout(() => setShowResults(true), 1000)
    return () => clearTimeout(showTimer)
  }, [])

  if (!game || !showResults) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-8 p-4 gaming-bg scanlines">
        <RetroAnimation>
          <div className="text-white text-xl">Loading results...</div>
        </RetroAnimation>
      </div>
    )
  }

  // Use authoritative winners from backend (don't calculate locally)
  // This ensures all players see the same result
  const winnerAddresses = game.winners || []
  const eliminatedPlayers = players.filter(p => game.eliminated?.includes(p.address))

  // Determine if Mafia won by checking the winners' roles
  // First check game.roles (always available), then fall back to rewards distributions
  const mafiaWon = winnerAddresses.some((winnerAddr: string) => {
    // Check game.roles first (backend format: 'Mafia')
    if (game.roles && game.roles[winnerAddr] === 'Mafia') {
      return true
    }
    // Fall back to checking player objects
    const winnerPlayer = players.find(p => p.address === winnerAddr)
    if (winnerPlayer?.role === 'ASUR') {
      return true
    }
    // Finally check rewards if available
    return game.rewards?.distributions?.some((d: any) =>
      d.playerAddress === winnerAddr && d.role === 'ASUR'
    )
  })

  const getResultMessage = () => {
    if (mafiaWon) {
      return {
        title: "ASUR VICTORY!",
        message: "The ASUR have taken control!",
        color: "#8B0000",
        emoji: "🎭",
        bgColor: "from-red-900 to-red-800"
      }
    } else {
      return {
        title: "VILLAGER VICTORY!",
        message: "The villagers have prevailed!",
        color: "#4A8C4A",
        emoji: "🛡️",
        bgColor: "from-green-900 to-green-800"
      }
    }
  }

  const result = getResultMessage()

  // Debug logging for rewards
  console.log('Game Results Debug:', {
    gameId: game.gameId,
    phase: game.phase,
    status: game.status,
    rewards: game.rewards,
    stakingRequired: game.stakingRequired,
    winners: game.winners
  })

  return (
    <div className="min-h-screen flex items-center justify-center py-6 px-4 sm:py-8 sm:px-6 gaming-bg scanlines">
      <Card className="w-full max-w-4xl p-3 sm:p-4 lg:p-6 bg-black/80 border-2 sm:border-4 border-white/20 text-white backdrop-blur-sm">
        <div className="space-y-3 sm:space-y-4 lg:space-y-6 text-center">
          {/* Title Section */}
          <div className="space-y-2 sm:space-y-3 lg:space-y-4 pt-4 sm:pt-6">
            <div className="text-3xl sm:text-5xl lg:text-6xl">{result.emoji}</div>
            <h1
              className="text-xl sm:text-2xl lg:text-4xl font-bold tracking-wider"
              style={{ color: result.color }}
            >
              {result.title}
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300">
              {result.message}
            </p>
          </div>

          {/* Player Results - Show for all games (staked and non-staked) */}
          <Card className="p-2 sm:p-3 lg:p-4 bg-gray-900/50 border-gray-500/50 backdrop-blur-sm">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-300 mb-2 sm:mb-3 lg:mb-4 flex items-center justify-center gap-2">
              📊 PLAYER RESULTS
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {players.map((player, index) => {
                const reward = game.rewards?.distributions?.find((d: any) => d.playerAddress === player.address);
                const isEliminated = eliminatedPlayers.some(p => p.address === player.address);

                // Determine if player is ASUR
                let isAsur = false;
                if (game.roles && game.roles[player.address] === 'Mafia') {
                  isAsur = true;
                } else if (player.role === 'ASUR') {
                  isAsur = true;
                }

                // Winner logic:
                // - If villagers won (!mafiaWon): All non-ASUR players are winners (even if eliminated)
                // - If ASUR won (mafiaWon): Only ASUR players are winners
                const isWinner = mafiaWon ? isAsur : !isAsur;

                return (
                  <PlayerResultRow
                    key={index}
                    player={player}
                    isWinner={isWinner}
                    isEliminated={isEliminated}
                    reward={reward}
                    game={game}
                  />
                );
              })}
            </div>
          </Card>


          {/* Unified Transaction Details & Withdraw */}
          {game.rewards?.settlementTxHash && currentPlayer?.address && (() => {
            const normalizeAddress = (addr: string) => addr?.toLowerCase().replace(/^0x/, '') || '';
            const currentPlayerReward = game.rewards?.distributions?.find(
              (reward: any) => normalizeAddress(reward.playerAddress) === normalizeAddress(currentPlayer.address!)
            );

            if (!currentPlayerReward) return null;

            // Only show withdraw for players with rewards > 0
            const hasRewards = parseFloat(currentPlayerReward.rewardInSOL) > 0;

            if (!hasRewards) return null;

            return (
              <div className="my-6">
                <WithdrawRewards
                  gameId={game.gameId}
                  playerAddress={currentPlayer.address}
                  rewardAmount={currentPlayerReward.rewardAmount}
                  rewardInSOL={currentPlayerReward.rewardInSOL}
                  settlementTxHash={game.rewards.settlementTxHash}
                />
              </div>
            );
          })()}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 justify-center pt-1 sm:pt-2 lg:pt-3">
            {onNewGame && (
              <Button
                onClick={onNewGame}
                className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-sm sm:text-base lg:text-lg bg-blue-600 hover:bg-blue-700 text-white font-press-start rounded-none shadow-lg border-2 border-blue-400 hover:border-blue-300 transition-all"
              >
                🎮 NEW GAME
              </Button>
            )}
            {onBrowsePublicLobbies && (
              <Button
                onClick={onBrowsePublicLobbies}
                className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-sm sm:text-base lg:text-lg bg-green-600 hover:bg-green-700 text-white font-press-start rounded-none shadow-lg border-2 border-green-400 hover:border-green-300 transition-all"
              >
                🌐 PUBLIC LOBBIES
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}