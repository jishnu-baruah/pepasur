"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSocket } from "@/contexts/SocketContext"
import { Player } from "@/hooks/useGame"

interface ChatMessage {
  id: string
  playerAddress: string
  message: string
  timestamp: number
  playerName?: string
  type?: string
  taskPlayerAddress?: string
  avatarUrl?: string
  playerAlias?: string
}

interface ChatComponentProps {
  gameId: string
  currentPlayerAddress: string
  players: Player[]
}

export default function ChatComponent({ gameId, currentPlayerAddress, players }: ChatComponentProps) {
  const { socket, sendChatMessage } = useSocket()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle chat messages with useCallback to maintain stable function reference
  const handleChatMessage = useCallback((data: any) => {
    console.log('💬 CHAT MESSAGE RECEIVED:', {
      raw: data,
      playerAddress: data.playerAddress,
      type: data.type,
      message: data.message,
      avatarUrl: data.avatarUrl,
      playerAlias: data.playerAlias,
      taskPlayerAddress: data.taskPlayerAddress
    })

    const player = players.find(p => p.address === data.playerAddress)

    // For system task announcements, USE BACKEND DATA DIRECTLY
    let avatarUrl = data.avatarUrl
    let playerAlias = data.playerAlias

    if (data.taskPlayerAddress) {
      console.log('📢 Task announcement - Backend provided:', {
        avatarUrl: data.avatarUrl,
        playerAlias: data.playerAlias,
        taskPlayerAddress: data.taskPlayerAddress
      })

      // Only use fallback if backend didn't provide the data
      if (!avatarUrl || !playerAlias) {
        const taskPlayer = players.find(p => p.address === data.taskPlayerAddress)
        console.log('⚠️ FALLBACK: Backend missing data, using local player:', {
          foundPlayer: !!taskPlayer,
          playerName: taskPlayer?.name,
          playerAvatar: taskPlayer?.avatar
        })
        if (taskPlayer) {
          avatarUrl = avatarUrl || taskPlayer.avatar
          playerAlias = playerAlias || taskPlayer.name
        }
      }
    }

    const newChatMessage: ChatMessage = {
      id: `${data.playerAddress}-${data.timestamp}`,
      playerAddress: data.playerAddress,
      message: data.message,
      timestamp: data.timestamp,
      playerName: player?.name || `Player ${data.playerAddress.slice(0, 6)}`,
      type: data.type,
      taskPlayerAddress: data.taskPlayerAddress,
      avatarUrl: avatarUrl,
      playerAlias: playerAlias
    }

    console.log('💾 Storing chat message:', newChatMessage)
    setMessages(prev => [...prev, newChatMessage])
    // soundService.playMessage(); // Muted for now
  }, [players]) // Only depend on players

  // Listen for chat messages
  useEffect(() => {
    if (!socket) return

    socket.on('chat_message', handleChatMessage)

    return () => {
      socket.off('chat_message', handleChatMessage)
    }
  }, [socket, handleChatMessage]) // Only depend on socket and the stable callback

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !gameId) return

    try {
      await sendChatMessage({
        gameId,
        playerAddress: currentPlayerAddress,
        message: newMessage.trim()
      })
      
      setNewMessage("")
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="pixel"
        size="sm"
        className="fixed bottom-4 right-4 z-40"
      >
        💬 CHAT
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 h-96 bg-[#111111]/95 backdrop-blur-sm border border-[#2a2a2a] z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-[#2a2a2a]">
        <h3 className="font-press-start text-white text-sm">GAME CHAT</h3>
        <Button
          onClick={() => setIsOpen(false)}
          variant="pixelOutline"
          size="sm"
          className="text-xs"
        >
          ✕
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-sm text-center">No messages yet</div>
        ) : (
          messages.map((message) => {
            const messagePlayer = players.find(p => p.address === message.playerAddress)
            const isCurrentPlayer = message.playerAddress === currentPlayerAddress
            const isSystemMessage = message.playerAddress === 'SYSTEM'
            const isTaskAnnouncement = isSystemMessage && (message.type === 'task_success' || message.type === 'task_failure')

            // For system task announcements, get the task player's info
            let taskPlayer = null
            let taskPlayerName = message.playerAlias || 'Unknown' // Use alias from backend first
            let taskPlayerAvatar = message.avatarUrl || null // Use avatar from backend first

            if (isTaskAnnouncement) {
              console.log('🎨 RENDERING task announcement:', {
                messageId: message.id,
                hasAvatarUrl: !!message.avatarUrl,
                avatarUrl: message.avatarUrl,
                hasPlayerAlias: !!message.playerAlias,
                playerAlias: message.playerAlias,
                taskPlayerAddress: message.taskPlayerAddress,
                willUseFallback: !taskPlayerAvatar
              })
            }

            if (message.taskPlayerAddress && !taskPlayerAvatar) {
              // Fallback: try to find player in current players array
              taskPlayer = players.find(p => p.address === message.taskPlayerAddress)
              console.log('🔄 Using fallback for task announcement:', {
                taskPlayerAddress: message.taskPlayerAddress,
                foundPlayer: !!taskPlayer,
                playerName: taskPlayer?.name,
                playerAvatar: taskPlayer?.avatar
              })
              if (taskPlayer) {
                taskPlayerName = taskPlayer.name
                taskPlayerAvatar = taskPlayer.avatar
              }
            }

            // Determine message styling
            let messageColor = 'text-gray-300'
            if (isCurrentPlayer) messageColor = 'text-blue-300'
            if (message.type === 'task_success') messageColor = 'text-green-300'
            if (message.type === 'task_failure') messageColor = 'text-red-300'

            return (
              <div
                key={message.id}
                className={`text-sm ${messageColor}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    {/* For system task messages, show the task player's avatar */}
                    {isTaskAnnouncement && taskPlayerAvatar ? (
                      <>
                        <img
                          src={taskPlayerAvatar}
                          alt={taskPlayerName}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-none object-cover flex-shrink-0"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        <span className="font-press-start text-xs">
                          {taskPlayerName} {message.type === 'task_success' ? 'succeeded' : 'failed'}
                        </span>
                      </>
                    ) : isTaskAnnouncement ? (
                      <>
                        {/* Fallback for task announcements without avatar */}
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-700 flex items-center justify-center text-xs flex-shrink-0">
                          {message.type === 'task_success' ? '✓' : '✗'}
                        </div>
                        <span className="font-press-start text-xs">
                          {taskPlayerName} {message.type === 'task_success' ? 'succeeded' : 'failed'}
                        </span>
                      </>
                    ) : isSystemMessage ? (
                      <>
                        {/* Other system messages (non-task) */}
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-600 flex items-center justify-center text-xs flex-shrink-0">
                          ℹ️
                        </div>
                        <span className="font-press-start text-xs text-gray-400">
                          SYSTEM
                        </span>
                      </>
                    ) : (
                      <>
                        {/* Regular message - show player avatar */}
                        {messagePlayer?.avatar && messagePlayer.avatar.startsWith('http') ? (
                          <img
                            src={messagePlayer.avatar}
                            alt={messagePlayer.name}
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-none object-cover flex-shrink-0"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        ) : (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-700 flex items-center justify-center text-xs flex-shrink-0">?</div>
                        )}
                        <span className="font-press-start text-xs">
                          {isCurrentPlayer ? 'You' : message.playerName}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                {/* Only show message text if not empty (task announcements are shown in the player name) */}
                {message.message && message.message.trim() !== '' && (
                  <div className="mt-1 break-words ml-7">{message.message}</div>
                )}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-[#2a2a2a]">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-2 py-1 bg-[#1a1a1a] border border-[#333] text-white text-sm rounded-none focus:outline-none focus:border-blue-500"
            maxLength={200}
          />
          <Button
            type="submit"
            variant="pixel"
            size="sm"
            disabled={!newMessage.trim()}
          >
            Send
          </Button>
        </div>
      </form>
    </Card>
  )
}
