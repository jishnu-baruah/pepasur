"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  joinGame: (gameId: string, playerAddress: string) => void
  submitAction: (data: any) => void
  submitTask: (data: any) => void
  submitVote: (data: any) => void
  sendChatMessage: (data: any) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

interface SocketProviderProps {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [joinedGames, setJoinedGames] = useState<Set<string>>(new Set())

  const connect = () => {
    if (socket?.connected) return

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
    console.log('🔌 Attempting to connect to:', socketUrl)
    
    const newSocket = io(socketUrl, {
      transports: ['polling', 'websocket'], // Try polling first, then websocket
      timeout: 30000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10, // Increased attempts
      reconnectionDelay: 1000, // Faster reconnection
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 10,
      withCredentials: false,
      autoConnect: true,
      upgrade: true, // Allow transport upgrades
      rememberUpgrade: false // Don't remember failed upgrades
    })

    newSocket.on('connect', () => {
      console.log('🔌 Connected to server:', newSocket.id)
      setIsConnected(true)
      setReconnectAttempts(0)
    })

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason)
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error)
      console.error('🔌 Error details:', {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type,
        transport: error.transport
      })
      setIsConnected(false)
      setReconnectAttempts(prev => prev + 1)
      
      // Show user-friendly error message
      if (reconnectAttempts > 3) {
        console.error('🔌 Multiple connection failures. Please check your network connection.')
        console.error('🔌 Current socket URL:', socketUrl)
        console.error('🔌 Environment variables:', {
          NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
          NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
        })
      }
    })

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔌 Reconnected after', attemptNumber, 'attempts')
      setIsConnected(true)
      setReconnectAttempts(0)
    })

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔌 Reconnection attempt', attemptNumber)
    })

    newSocket.on('reconnect_error', (error) => {
      console.error('🔌 Reconnection error:', error)
    })

    newSocket.on('reconnect_failed', () => {
      console.error('🔌 Reconnection failed after maximum attempts')
      setIsConnected(false)
    })

    newSocket.on('error', (error) => {
      console.error('🔌 Socket error:', error)
    })

    setSocket(newSocket)
  }

  const disconnect = () => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }

  const joinGame = (gameId: string, playerAddress: string) => {
    if (socket && isConnected) {
      const joinKey = `${gameId}-${playerAddress}`
      if (!joinedGames.has(joinKey)) {
        console.log('🎮 Joining game:', { gameId, playerAddress })
        socket.emit('join_game', { gameId, playerAddress })
        setJoinedGames(prev => new Set(prev).add(joinKey))
      } else {
        console.log('🎮 Already joined game, skipping:', { gameId, playerAddress })
      }
    } else {
      console.error('🎮 Cannot join game: Socket not connected')
    }
  }

  const submitAction = (data: any) => {
    if (socket && isConnected) {
      socket.emit('submit_action', data)
    }
  }

  const submitTask = (data: any) => {
    if (socket && isConnected) {
      socket.emit('submit_task', data)
    }
  }

  const submitVote = (data: any) => {
    if (socket && isConnected) {
      socket.emit('submit_vote', data)
    }
  }

  const sendChatMessage = (data: any) => {
    if (socket && isConnected) {
      socket.emit('chat_message', data)
    }
  }

  useEffect(() => {
    // Auto-connect on mount
    connect()

    return () => {
      disconnect()
    }
  }, [])

  // Auto-reconnect when connection is lost
  useEffect(() => {
    if (!isConnected && reconnectAttempts < 3) {
      const timer = setTimeout(() => {
        console.log('🔌 Attempting to reconnect...')
        connect()
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [isConnected, reconnectAttempts])

  const value: SocketContextType = {
    socket,
    isConnected,
    connect,
    disconnect,
    joinGame,
    submitAction,
    submitTask,
    submitVote,
    sendChatMessage
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
