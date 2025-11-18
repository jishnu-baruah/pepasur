"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import RetroAnimation from "@/components/common/retro-animation"
import { Player } from "@/hooks/useGame"
import ColoredPlayerName from "@/components/game/colored-player-name"
import FullscreenToggle from "@/components/common/fullscreen-toggle"

interface NightResolutionScreenProps {
  resolution: {
    killedPlayer: Player | null
    savedPlayer: Player | null
    investigatedPlayer: Player | null
    investigationResult: string | null
    mafiaTarget: Player | null
    doctorTarget: Player | null
    detectiveTarget: Player | null
  }
  onContinue: () => void
  game?: any // Add game prop to check phase changes
  currentPlayer?: Player // Add current player to check if they were eliminated
}

export default function NightResolutionScreen({ resolution, onContinue, game, currentPlayer }: NightResolutionScreenProps) {
  const [showResults, setShowResults] = useState(false);
  const [hasTransitioned, setHasTransitioned] = useState(false);
  const [timeLeft, setTimeLeft] = useState(game?.timeLeft || 8);
  const [outcome, setOutcome] = useState<'peaceful' | 'kill' | 'save'>('peaceful');

  // Memoize player data to prevent re-renders and avatar re-fetches
  const killedPlayerMemo = useMemo(() => resolution.killedPlayer, [resolution.killedPlayer?.address]);
  const savedPlayerMemo = useMemo(() => resolution.savedPlayer, [resolution.savedPlayer?.address]);

  // Determine outcome
  useEffect(() => {
    if (killedPlayerMemo && savedPlayerMemo && killedPlayerMemo.address === savedPlayerMemo.address) {
      setOutcome('save');
    } else if (killedPlayerMemo) {
      setOutcome('kill');
    } else {
      setOutcome('peaceful');
    }
  }, [killedPlayerMemo, savedPlayerMemo]);

  // Transition logic
  useEffect(() => {
    if (game?.phase === 'task' && !hasTransitioned) {
      setHasTransitioned(true);
      onContinue();
    }
  }, [game?.phase, onContinue, hasTransitioned]);

  // Show results after a delay
  useEffect(() => {
    const showTimer = setTimeout(() => setShowResults(true), 1000);
    return () => clearTimeout(showTimer);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (showResults && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((prev: number) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [showResults, timeLeft]);

  // Check if current player was killed (using memoized player)
  const wasCurrentPlayerKilled = currentPlayer && killedPlayerMemo &&
    (currentPlayer.address === killedPlayerMemo.address || currentPlayer.id === killedPlayerMemo.id);

  const getHeaderText = () => {
    if (outcome === 'peaceful') return 'PEACEFUL NIGHT';
    if (outcome === 'kill') {
      return wasCurrentPlayerKilled ? 'YOU WERE ELIMINATED!' : 'PLAYER ELIMINATED!';
    }
    if (outcome === 'save') {
      return wasCurrentPlayerKilled ? 'YOU WERE SAVED!' : 'PLAYER SAVED!';
    }
    return 'NIGHT RESOLVED';
  };

  const flavorText = {
    peaceful: 'Everyone survived the night... for now.',
    kill: wasCurrentPlayerKilled ? 'You have been eliminated from the game.' : `${killedPlayerMemo?.name || 'A player'} was eliminated during the night.`,
    save: wasCurrentPlayerKilled ? 'The DEVA has saved your life!' : 'The DEVA has protected the town!',
  };

  const headerColor = {
    peaceful: 'pixel-text-3d-green',
    kill: 'pixel-text-3d-red',
    save: 'pixel-text-3d-green',
  };

  return (
    <div className="min-h-screen flex flex-col gaming-bg scanlines">
      {/* Full-width header with buttons */}
      <div className="w-full bg-black/60 border-b border-white/20 py-2 px-4 flex justify-between items-center z-50">
        <div className="flex gap-2">
          <button
            onClick={() => window.location.reload()}
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
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <div className="text-xs text-gray-400 font-press-start">CONNECTED</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8 bg-black/80 border-2 border-gray-700 text-center">
          {!showResults ? (
            <div className="space-y-4">
              <div className="text-2xl font-press-start pixel-text-3d-white">
                PROCESSING NIGHT ACTIONS...
              </div>
              <div className="flex justify-center">
                <div className="animate-spin text-5xl">🌙</div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Only show content if someone was eliminated */}
              {outcome === 'kill' && killedPlayerMemo && (
                <>
                  {/* Player Avatar - Only show if avatar is already loaded/valid */}
                  {killedPlayerMemo.avatar && killedPlayerMemo.avatar.startsWith('http') && (
                    <div className="flex justify-center">
                      <img
                        src={killedPlayerMemo.avatar}
                        alt={killedPlayerMemo.name}
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-none object-cover border-2 border-gray-600"
                        style={{ imageRendering: 'pixelated' }}
                        loading="eager"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    </div>
                  )}

                  {/* Player Name + Elimination Status */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className="text-2xl md:text-3xl font-press-start">
                      <ColoredPlayerName playerName={killedPlayerMemo.name || 'Unknown Player'} />
                    </div>
                    <div className="text-xl md:text-2xl text-red-400 font-press-start">
                      WAS ELIMINATED
                    </div>
                  </div>
                </>
              )}

              {/* Peaceful night message */}
              {outcome === 'peaceful' && (
                <div className="text-2xl md:text-3xl font-press-start text-green-400">
                  PEACEFUL NIGHT
                </div>
              )}

              {/* Countdown Timer */}
              <div className="space-y-2">
                <div className="text-6xl md:text-8xl font-bold text-white pixel-text-3d-orange">
                  {timeLeft}
                </div>
                <div className="text-lg text-gray-400">
                  DAY PHASE BEGINS
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
