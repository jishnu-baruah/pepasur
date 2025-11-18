// API Service Layer for Backend Integration

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface GameSettings {
  nightPhaseDuration?: number
  resolutionPhaseDuration?: number
  taskPhaseDuration?: number
  votingPhaseDuration?: number
  maxTaskCount?: number
}

export interface Game {
  gameId: string
  roomCode?: string
  creator: string
  players: string[]
  roles: Record<string, string>
  phase: 'lobby' | 'night' | 'resolution' | 'task' | 'voting' | 'ended'
  day: number
  timeLeft: number
  startedAt: number | null
  stakeAmount: string
  minPlayers: number
  maxPlayers: number
  pendingActions: Record<string, any>
  task: any
  taskCounts: Record<string, number>
  votes: Record<string, string>
  eliminated: string[]
  winners: string[]
  roleCommit: string | null
  status: 'active' | 'completed'
  settings?: GameSettings
  isPublic?: boolean
  stakingRequired?: boolean
  timerReady?: boolean
  votingResolved?: boolean
  votingResult?: any
  lastVotingResult?: any
  isGameOver?: boolean
  onChainGameId?: string | number
  nightResolution?: {
    mafiaTarget: { address: string; name: string; id: string; role: string } | null
    doctorTarget: { address: string; name: string; id: string; role: string } | null
    detectiveTarget: { address: string; name: string; id: string; role: string } | null
    investigationResult: string | null
    killedPlayer: { address: string; name: string; id: string; role: string } | null
    savedPlayer: { address: string; name: string; id: string; role: string } | null
    investigationPlayer: { address: string; name: string; id: string; role: string } | null
  }
  rewards?: {
    settlementTxHash: string
    distributions: Array<{
      playerAddress: string
      role: string
      stakeAmount: string
      rewardAmount: string
      rewardInAPT: string
      totalReceived: string
      totalReceivedInAPT: string
    }>
  }
}

export interface CreateGameRequest {
  creatorAddress: string
  stakeAmount?: number
  minPlayers?: number
  settings?: GameSettings
}



export interface JoinByRoomCodeRequest {
  roomCode: string
  playerAddress: string
}

export interface GameAction {
  playerAddress: string
  action: any
  commit?: string
}

export interface TaskSubmission {
  playerAddress: string
  answer: any
}

export interface VoteSubmission {
  playerAddress: string
  vote: string
}

class ApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)

      // Handle network errors gracefully
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('Network error - backend server may be down')
        throw new Error('Unable to connect to game server. Please check your connection and try again.')
      }

      throw error
    }
  }

  // Game Management
  async createGame(data: CreateGameRequest) {
    return this.request<{
      success: boolean
      gameId: string
      roomCode: string
      message: string
    }>('/api/game/create', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async joinGameByRoomCode(data: JoinByRoomCodeRequest) {
    return this.request<{
      success: boolean
      game: Game
      message: string
    }>('/api/game/join-by-code', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getGameByRoomCode(roomCode: string) {
    return this.request<{
      success: boolean
      game: Game
    }>(`/api/game/room/${roomCode}`)
  }

  async getGame(gameId: string, playerAddress?: string) {
    const url = playerAddress
      ? `/api/game/${gameId}?playerAddress=${encodeURIComponent(playerAddress)}`
      : `/api/game/${gameId}`

    return this.request<{
      success: boolean
      game: Game
    }>(url)
  }



  async getActiveGames() {
    return this.request<{
      success: boolean
      games: Array<{
        gameId: string
        creator: string
        players: number
        maxPlayers: number
        stakeAmount: string
        phase: string
        day: number
        startedAt: number | null
      }>
    }>('/api/game/active')
  }



  // Signal that frontend is ready for timer
  async signalReady(gameId: string, playerAddress: string) {
    return this.request<{
      success: boolean
      message: string
    }>(`/api/game/${gameId}/ready`, {
      method: 'POST',
      body: JSON.stringify({ playerAddress }),
    })
  }

  // Game Actions
  async submitNightAction(gameId: string, data: GameAction) {
    return this.request<{
      success: boolean
      message: string
    }>(`/api/game/${gameId}/action/night`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async submitTaskAnswer(gameId: string, data: TaskSubmission) {
    return this.request<{
      success: boolean
      correct: boolean
      message: string
    }>(`/api/game/${gameId}/task/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async submitVote(gameId: string, data: VoteSubmission) {
    return this.request<{
      success: boolean
      message: string
    }>(`/api/game/${gameId}/vote/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async eliminatePlayer(gameId: string, playerAddress: string) {
    return this.request<{
      success: boolean
      message: string
    }>(`/api/game/${gameId}/player/eliminate`, {
      method: 'POST',
      body: JSON.stringify({ playerAddress }),
    })
  }

  // Game History
  async getGameHistory(gameId: string) {
    return this.request<{
      success: boolean
      history: {
        gameId: string
        creator: string
        players: string[]
        eliminated: string[]
        winners: string[]
        day: number
        phase: string
        startedAt: number | null
        status: string
      }
    }>(`/api/game/${gameId}/history`)
  }

  // Health Check
  async healthCheck() {
    return this.request<{
      status: string
      timestamp: string
    }>('/api/health')
  }

  // Faucet Methods
  async claimFaucet(userAddress: string) {
    return this.request<{
      success: boolean
      data?: {
        transactionHash: string
        amount: number
        amountOctas: number
        recipient: string
        nextClaimTime: string
        message: string
      }
      error?: string
      nextRequestTime?: string
      timeRemaining?: number
    }>('/api/faucet/claim', {
      method: 'POST',
      body: JSON.stringify({ userAddress }),
    })
  }

  async getFaucetInfo(userAddress: string) {
    return this.request<{
      success: boolean
      data: {
        faucetAmount: number
        cooldownHours: number
        canClaim: boolean
        lastClaimTime: string | null
        nextClaimTime: string | null
        timeRemaining: string
      }
    }>(`/api/faucet/info/${userAddress}`)
  }

  async getFaucetStats() {
    return this.request<{
      success: boolean
      data: {
        totalRequests: number
        last24Hours: number
        last7Days: number
        totalDistributed: number
        faucetAmount: number
        cooldownHours: number
        server: {
          address: string
          balance: number | null
          balanceAPT: number | null
          status: string
        }
      }
    }>('/api/faucet/stats')
  }
}

export const apiService = new ApiService()
export default apiService
