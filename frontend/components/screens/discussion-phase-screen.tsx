"use client"

import { useState, useEffect, useMemo, memo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PixelInput } from "@/components/ui/pixel-input"
import { useSocket } from "@/contexts/SocketContext"
import { Player } from "@/hooks/useGame" // Add this line
import TaskComponent from "@/components/game/task-component"
import ColoredPlayerName from "@/components/game/colored-player-name"
import TipBar from "@/components/common/tip-bar"
import FullscreenToggle from "@/components/common/fullscreen-toggle"

interface DiscussionPhaseScreenProps {
  onComplete: () => void
  game?: any // Add game prop to get timer from backend
  gameId?: string // Add gameId for chat
  currentPlayerAddress?: string // Add current player address
  submitTaskAnswer?: (answer: any) => Promise<void> // Add task submission function
  players?: Player[] // Add players prop
}

// Helper function to get color for player names
const getPlayerColor = (playerName: string): string => {
  if (playerName.includes('Red')) return 'text-red-400'
  if (playerName.includes('Blue')) return 'text-blue-400'
  if (playerName.includes('Purple')) return 'text-purple-400'
  if (playerName.includes('Yellow')) return 'text-yellow-400'
  return 'text-gray-300'
}

// Helper function to colorize player names in message text (including @ mentions)
const colorizePlayerNames = (text: string): JSX.Element => {
  // Match player aliases like 0xRed, 0xBlue, etc. AND @mentions like @0xRed, @0xBlue
  const parts = text.split(/(@?0x(?:Red|Blue|Purple|Yellow))/g)

  return (
    <>
      {parts.map((part, index) => {
        const color = getPlayerColor(part.replace('@', ''))
        return (
          <span key={index} className={color}>
            {part}
          </span>
        )
      })}
    </>
  )
}



function DiscussionPhaseScreen({ onComplete, game, gameId, currentPlayerAddress, submitTaskAnswer, players }: DiscussionPhaseScreenProps) {
  const [timeLeft, setTimeLeft] = useState(30) // 30 seconds for discussion
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks'>('chat')
  const announcementSent = useRef(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { socket, sendChatMessage } = useSocket()

  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteOptions, setAutocompleteOptions] = useState<Player[]>([])
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0)
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null)

  const [messages, setMessages] = useState<Array<{
    id: string
    playerAddress: string
    message: string
    timestamp: number
    type?: string
    taskPlayerAddress?: string
    avatarUrl?: string
    playerAlias?: string
    playerName?: string
  }>>([])

  // Listen for chat messages
  useEffect(() => {
    if (socket && gameId) {
      const handleChatMessage = (data: any) => {
        console.log('💬 CHAT MESSAGE RECEIVED (discussion-phase):', {
          raw: data,
          type: data.type,
          message: data.message,
          hasMessage: !!data.message,
          messageLength: data.message?.length || 0,
          avatarUrl: data.avatarUrl,
          playerAlias: data.playerAlias,
          taskPlayerAddress: data.taskPlayerAddress
        })

        if (data.gameId === gameId) {
          const storedMessage = {
            id: `${data.playerAddress}-${data.timestamp}`,
            playerAddress: data.playerAddress,
            message: data.message,
            timestamp: data.timestamp,
            type: data.type,
            taskPlayerAddress: data.taskPlayerAddress,
            avatarUrl: data.avatarUrl,
            playerAlias: data.playerAlias,
            playerName: data.playerName
          }
          console.log('✅ Message for this game, storing with ALL fields:', storedMessage)
          setMessages(prev => [...prev, storedMessage])
        } else {
          console.log('📨 Message gameId mismatch:', data.gameId, 'vs', gameId)
        }
      }

      socket.on('chat_message', handleChatMessage)

      return () => {
        socket.off('chat_message', handleChatMessage)
      }
    }
  }, [socket, gameId])

  // Add automatic announcement when phase starts (only once)
  useEffect(() => {
    if (gameId && !announcementSent.current) {
      // Add system announcement to chat
      const announcement = {
        id: `system-${Date.now()}`,
        playerAddress: 'SYSTEM',
        message: '💡 NON-ASUR PLAYERS: Complete tasks to win! Discuss and share information to identify the ASUR.',
        timestamp: Date.now(),
        type: 'system',
        playerName: 'ANNOUNCEMENT'
      }
      setMessages(prev => [...prev, announcement])
      announcementSent.current = true
    }
  }, [gameId])

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
    }
  }, [game?.timeLeft])

  // Handle @ mention autocomplete
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMessage(value)

    const cursorPos = e.target.selectionStart || 0
    const textBeforeCursor = value.slice(0, cursorPos)
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@')

    if (lastAtSymbol !== -1 && (lastAtSymbol === 0 || value[lastAtSymbol - 1] === ' ')) {
      const searchText = textBeforeCursor.slice(lastAtSymbol + 1).toLowerCase()

      if (players && players.length > 0) {
        const filtered = players.filter(p =>
          p.name && p.name.toLowerCase().includes(searchText) && p.address !== currentPlayerAddress
        )

        if (filtered.length > 0) {
          setAutocompleteOptions(filtered)
          setShowAutocomplete(true)
          setMentionStartPos(lastAtSymbol)
          setSelectedOptionIndex(0)
        } else {
          setShowAutocomplete(false)
        }
      }
    } else {
      setShowAutocomplete(false)
    }
  }

  // Handle autocomplete selection
  const selectMention = (player: Player) => {
    if (mentionStartPos === null) return

    const beforeMention = message.slice(0, mentionStartPos)
    const afterMention = message.slice(inputRef.current?.selectionStart || message.length)
    const newMessage = `${beforeMention}@${player.name} ${afterMention}`

    setMessage(newMessage)
    setShowAutocomplete(false)
    setMentionStartPos(null)

    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  // Handle keyboard navigation in autocomplete
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showAutocomplete && autocompleteOptions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedOptionIndex(prev =>
          prev < autocompleteOptions.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedOptionIndex(prev => prev > 0 ? prev - 1 : prev)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        // Always select the first option (index 0) or the currently selected one
        const optionToSelect = autocompleteOptions[selectedOptionIndex] || autocompleteOptions[0]
        if (optionToSelect) {
          selectMention(optionToSelect)
        }
        return
      } else if (e.key === 'Escape') {
        setShowAutocomplete(false)
      }
    } else if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  const handleSendMessage = () => {
    if (message.trim() && gameId && currentPlayerAddress && sendChatMessage) {
      try {
        sendChatMessage({
          gameId,
          playerAddress: currentPlayerAddress,
          message: message.trim(),
          timestamp: Date.now()
        })
        setMessage("")
        setShowAutocomplete(false)
        console.log('Chat message sent:', message.trim())
      } catch (error) {
        console.error('Failed to send chat message:', error)
      }
    }
  }



  // Get current player's task count from game state (memoized to prevent re-renders)
  const currentPlayerTaskCount = useMemo(() => {
    return game?.taskCounts?.[currentPlayerAddress || ''] || 0
  }, [game?.taskCounts, currentPlayerAddress])

  // Use configured max task count or default to 4
  const maxTaskCount = game?.settings?.maxTaskCount || 4

  // SIMPLE SOLUTION: Use refs to store stable values that only update when data actually changes
  const lastTaskCountsString = useRef<string>('')
  const stableCollectiveCount = useRef<number>(0)
  const stableTaskCountsDisplay = useRef<any>(null)

  // Update stable values only when stringified data actually changes
  useEffect(() => {
    if (!game?.taskCounts) return

    const currentString = JSON.stringify(game.taskCounts)

    // Only update if the stringified value is different
    if (currentString !== lastTaskCountsString.current) {
      lastTaskCountsString.current = currentString

      // Calculate collective count
      const total = Object.values(game.taskCounts).reduce((sum: number, count) => {
        const numCount = typeof count === 'number' ? count : 0
        return sum + numCount
      }, 0)

      stableCollectiveCount.current = total

      // Calculate display data
      if (players && players.length > 0) {
        stableTaskCountsDisplay.current = {
          totalTasks: total,
          maxTasks: maxTaskCount,
          progress: Math.min(total / maxTaskCount, 1),
          players: players.map(player => {
            const taskCount = game.taskCounts?.[player.address!] || 0
            return {
              address: player.address,
              name: player.name,
              avatar: player.avatar,
              taskCount,
              hasContributed: taskCount > 0
            }
          })
        }
      }
    }
  }, [game?.taskCounts, players, maxTaskCount])

  // Use the stable ref values instead of computed ones
  const collectiveTaskCount = stableCollectiveCount.current
  const taskCountsDisplay = stableTaskCountsDisplay.current

  // Memoize task tab styling to prevent flickering (use collective count)
  const taskTabStyling = useMemo(() => {
    if (activeTab === 'tasks') {
      return 'bg-[#4A8C4A] border-[#4A8C4A] pixel-text-3d-white tab-active'
    } else if (collectiveTaskCount >= maxTaskCount) {
      return 'bg-green-600/30 border-green-400 text-green-300 hover:bg-green-600/40'
    } else if (collectiveTaskCount > 0) {
      return 'bg-yellow-600/30 border-yellow-400 text-yellow-300 hover:bg-yellow-600/40'
    } else {
      return 'bg-[#A259FF]/20 border-[#A259FF] pixel-text-3d-white hover:bg-[#A259FF]/30'
    }
  }, [activeTab, collectiveTaskCount, maxTaskCount])

  // Memoize task count text to prevent re-renders (use collective count)
  const taskCountText = useMemo(() => {
    return `🎯 TASKS (${collectiveTaskCount}/${maxTaskCount})`
  }, [collectiveTaskCount, maxTaskCount])

  return (
    <div className="h-screen gaming-bg flex flex-col overflow-hidden">
      {/* Full-width header with buttons */}
      <div className="flex-shrink-0 w-full bg-black/60 border-b border-white/20 py-2 px-4 flex justify-between items-center z-50">
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
          <div className={`w-2 h-2 rounded-full ${socket ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <div className="text-xs text-gray-400 font-press-start">{socket ? 'CONNECTED' : 'DISCONNECTED'}</div>
        </div>
      </div>

      {/* Tips */}
      <div className="flex-shrink-0">
        <TipBar
          phase="night"
          tips={[
            "<strong>Complete tasks</strong> to help non-ASUR players win",
            "Use <strong>chat</strong> to discuss and share information",
            "Pay attention to who completes tasks",
            "ASURs may pretend to help"
          ]}
        />
      </div>

      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-2 sm:p-4 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 p-2 sm:p-3 lg:p-4 border-b-2 border-[#4A8C4A] bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A] relative">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-1 sm:space-y-0">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="text-lg sm:text-xl lg:text-2xl">💬</div>
              <h1 className="text-sm sm:text-base lg:text-lg font-press-start pixel-text-3d-white pixel-text-3d-float">DISCUSSION PHASE</h1>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="text-sm sm:text-base lg:text-lg font-press-start pixel-text-3d-green timer-pulse">
                ⏰ {timeLeft}s
              </div>
              <div className="w-2 h-2 bg-[#4A8C4A] animate-pulse rounded-none"></div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-3 mt-3 sm:mt-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 sm:px-4 py-2 font-press-start text-xs sm:text-sm border-2 transition-all ${activeTab === 'chat'
                  ? 'bg-[#4A8C4A] border-[#4A8C4A] pixel-text-3d-white tab-active'
                  : 'bg-[#A259FF]/20 border-[#A259FF] pixel-text-3d-white hover:bg-[#A259FF]/30'
                  }`}
              >
                💬 CHAT
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-3 sm:px-4 py-2 font-press-start text-xs sm:text-sm border-2 transition-all ${taskTabStyling}`}
              >
                {taskCountText}
              </button>
            </div>

            {/* Hint text */}
            <div className="text-xs text-yellow-300 font-bold hidden sm:block animate-bounce">
              {activeTab === 'chat' ? (
                <span>← Switch to TASKS to complete challenges</span>
              ) : (
                <span>← Switch to CHAT to discuss with others</span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {activeTab === 'chat' ? (
            <>
              {/* Chat Messages */}
              <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto space-y-2 sm:space-y-3 bg-[#111111]/50 min-h-0">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 font-press-start text-sm">
                    No messages yet. Start the discussion!
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isTaskAnnouncement = msg.type === 'task_success' || msg.type === 'task_failure'
                    const isSystemMessage = msg.playerAddress === 'SYSTEM'

                    // For task announcements, use backend-provided data first, fallback to finding player
                    const taskPlayerName = isTaskAnnouncement ? (msg.playerAlias || msg.playerName) : null
                    const taskPlayerAvatar = isTaskAnnouncement ? msg.avatarUrl : null

                    // For regular messages, find the player
                    const messagePlayer = !isTaskAnnouncement ? players?.find(p => p.address === msg.playerAddress) : null
                    const isCurrentPlayer = msg.playerAddress === currentPlayerAddress && msg.playerAddress !== 'SYSTEM'

                    // Determine display name
                    let displayName = ''
                    if (isTaskAnnouncement) {
                      displayName = `${taskPlayerName} ${msg.type === 'task_success' ? 'succeeded' : 'failed'}`
                    } else if (msg.playerAddress === 'SYSTEM') {
                      displayName = msg.playerName || 'SYSTEM'
                    } else if (isCurrentPlayer) {
                      // Show "0xColor (you)" instead of just "You"
                      displayName = `${messagePlayer?.name || 'Player'} (you)`
                    } else {
                      displayName = messagePlayer?.name || msg.playerName || 'Player'
                    }

                    // DEBUG: Comprehensive message rendering logging
                    if (isTaskAnnouncement) {
                      console.log('🎨 RENDERING TASK ANNOUNCEMENT:', {
                        messageId: msg.id,
                        type: msg.type,
                        hasMessage: !!msg.message,
                        messageLength: msg.message?.length || 0,
                        messageContent: msg.message,
                        messageTrimmed: msg.message?.trim(),
                        willRenderMessage: msg.message && msg.message.trim() !== '',
                        taskPlayerName,
                        taskPlayerAvatar,
                        displayName,
                        rawMsg: msg
                      })
                    }

                    return (
                      <div key={`${msg.id}-${index}`} className={`font-press-start pixel-text-3d-white border ${isTaskAnnouncement
                        ? msg.type === 'task_success'
                          ? 'task-announcement-epic task-announcement-glow bg-green-900/60 border-green-400 border-2 shadow-lg shadow-green-500/50 p-4 sm:p-5 md:p-6 text-sm sm:text-base md:text-lg'
                          : 'task-announcement-epic task-announcement-glow-red bg-red-900/60 border-red-400 border-2 shadow-lg shadow-red-500/50 p-4 sm:p-5 md:p-6 text-sm sm:text-base md:text-lg'
                        : isSystemMessage
                          ? 'chat-message-enter chat-message-glow bg-blue-900/40 border-blue-500/50 p-2 sm:p-3 md:p-4 text-xs sm:text-sm md:text-base'
                          : 'chat-message-enter chat-message-glow bg-[#1A1A1A]/80 border-[#2A2A2A] p-2 sm:p-3 md:p-4 text-xs sm:text-sm md:text-base'
                        }`}>
                        <div className={`flex items-center space-x-2 ${isTaskAnnouncement ? 'sm:space-x-3' : ''}`}>
                          {/* Player avatar - BIGGER for announcements */}
                          {!isSystemMessage && (
                            <>
                              {(isTaskAnnouncement ? taskPlayerAvatar : messagePlayer?.avatar) ? (
                                <img
                                  src={isTaskAnnouncement ? taskPlayerAvatar! : messagePlayer!.avatar}
                                  alt={displayName}
                                  className={`rounded-none object-cover border ${isTaskAnnouncement
                                    ? 'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 border-2 border-yellow-400 shadow-lg'
                                    : 'w-6 h-6 sm:w-8 sm:h-8 border-gray-600'
                                    }`}
                                  style={{ imageRendering: 'pixelated' }}
                                />
                              ) : (
                                <div className={`bg-gray-700 flex items-center justify-center ${isTaskAnnouncement
                                  ? 'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-xl sm:text-2xl'
                                  : 'w-6 h-6 sm:w-8 sm:h-8 text-xs'
                                  }`}>
                                  {isTaskAnnouncement ? (msg.type === 'task_success' ? '✓' : '✗') : '?'}
                                </div>
                              )}
                            </>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className={`font-bold ${isCurrentPlayer ? getPlayerColor(displayName) : isTaskAnnouncement ? (msg.type === 'task_success' ? 'text-green-300 drop-shadow-[0_2px_4px_rgba(34,197,94,0.5)]' : 'text-red-300 drop-shadow-[0_2px_4px_rgba(239,68,68,0.5)]') : ''}`}>
                                {isTaskAnnouncement ? (
                                  <span className="uppercase tracking-wide">🎮 TASK RESULT 🎮</span>
                                ) : msg.playerAddress === 'SYSTEM' ? (
                                  <span className="text-yellow-400">{displayName}</span>
                                ) : (
                                  <span className={getPlayerColor(displayName)}>
                                    {displayName}
                                  </span>
                                )}
                              </span>
                              <span className={`text-xs ${isTaskAnnouncement ? 'text-gray-300' : 'text-gray-400'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        {msg.message && msg.message.trim() !== '' && (
                          <div className={`mt-2 leading-relaxed ${isTaskAnnouncement
                            ? msg.type === 'task_success'
                              ? 'text-green-200 font-semibold text-sm sm:text-base md:text-lg drop-shadow-lg'
                              : 'text-red-200 font-semibold text-sm sm:text-base md:text-lg drop-shadow-lg'
                            : ''
                            }`}>
                            {colorizePlayerNames(msg.message)}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
                <div ref={chatEndRef} />
              </div>
            </>
          ) : (
            /* Tasks Tab - Real Task Component */
            <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto min-h-0">
              {/* Collective Task Progress Display */}
              {taskCountsDisplay && (
                <div className="mb-4 p-3 bg-gray-900/50 border border-gray-600 rounded-none">
                  <h4 className="text-sm font-press-start text-yellow-400 mb-3">📊 COLLECTIVE PROGRESS</h4>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-300">Tasks Completed</span>
                      <span className={`text-sm font-press-start ${taskCountsDisplay.totalTasks >= taskCountsDisplay.maxTasks ? 'text-green-400' : 'text-yellow-400'}`}>
                        {taskCountsDisplay.totalTasks}/{taskCountsDisplay.maxTasks}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-none">
                      <div
                        className={`h-2 rounded-none transition-all duration-300 ${taskCountsDisplay.totalTasks >= taskCountsDisplay.maxTasks ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${taskCountsDisplay.progress * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Player Contributions */}
                  <div className="grid grid-cols-2 gap-2">
                    {taskCountsDisplay?.players?.map((player: any) => (
                      <div key={player.address} className="flex items-center space-x-2 text-xs h-6">
                        <img
                          src={player.avatar}
                          alt={player.name}
                          className="w-4 h-4 rounded-none object-cover flex-shrink-0"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        <ColoredPlayerName playerName={player.name} />
                        <span className={`ml-auto flex-shrink-0 ${player.hasContributed ? 'text-green-400' : 'text-gray-400'}`}>
                          {player.hasContributed ? '✓' : '○'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {gameId && currentPlayerAddress && submitTaskAnswer ? (
                <TaskComponent
                  gameId={gameId}
                  currentPlayerAddress={currentPlayerAddress}
                  game={game}
                  submitTaskAnswer={submitTaskAnswer}
                  showHeader={false}
                />
              ) : (
                <div className="text-center text-gray-500 font-press-start text-sm">
                  Task system not available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-4 md:p-6 border-t-2 border-[#4A8C4A] bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A] flex-shrink-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 md:space-x-4">
            <div className="flex-1 relative">
              {/* Autocomplete Dropdown */}
              {showAutocomplete && autocompleteOptions.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-full max-w-xs bg-[#1A1A1A] border-2 border-[#4A8C4A] rounded-none shadow-lg z-50 max-h-48 overflow-y-auto">
                  {autocompleteOptions.map((player, index) => (
                    <button
                      key={player.address}
                      onClick={() => selectMention(player)}
                      className={`w-full px-3 py-2 text-left flex items-center space-x-2 transition-colors ${index === selectedOptionIndex
                        ? 'bg-[#4A8C4A] text-white'
                        : 'hover:bg-[#2A2A2A] text-gray-300'
                        }`}
                    >
                      <img
                        src={player.avatar}
                        alt={player.name}
                        className="w-6 h-6 rounded-none object-cover"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <span className={`font-press-start text-xs ${getPlayerColor(player.name)}`}>
                        {player.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <PixelInput
                ref={inputRef}
                value={message}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (use @ to mention)"
                className="w-full bg-[#1A1A1A] border-2 border-[#4A8C4A] text-white placeholder-[#666666] pixel-input-focus text-xs sm:text-sm md:text-base"
              />
              <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-[#4A8C4A] text-xs font-press-start">
                {message.length}/100
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              variant="pixel"
              size="pixelLarge"
              className="px-4 sm:px-6 md:px-8 text-xs sm:text-sm md:text-base"
            >
              🚀 SEND
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// SIMPLIFIED: No complex memo - let React handle re-renders
// The ref-based approach above ensures flickering won't happen regardless of re-renders
export default DiscussionPhaseScreen