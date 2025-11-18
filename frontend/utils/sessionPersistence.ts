/**
 * Session persistence utility for rejoining games after browser close/refresh
 */

const STORAGE_KEY = 'pepasur_game_session';

export interface GameSession {
  gameId: string;
  roomCode: string;
  walletAddress: string;
  timestamp: number;
  hasSeenRole?: boolean; // Track if player has seen role assignment
}

/**
 * Save current game session to localStorage
 */
export function saveGameSession(gameId: string, roomCode: string, walletAddress: string, hasSeenRole?: boolean): void {
  try {
    const session: GameSession = {
      gameId,
      roomCode,
      walletAddress,
      timestamp: Date.now(),
      hasSeenRole
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    console.log('💾 Game session saved:', session);
  } catch (error) {
    console.error('❌ Error saving game session:', error);
  }
}

/**
 * Get saved game session from localStorage
 * Returns null if no session or session is too old (> 15 minutes)
 */
export function getGameSession(): GameSession | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const session: GameSession = JSON.parse(stored);

    // Check if session is not too old (15 minutes = 900000ms)
    const FIFTEEN_MINUTES = 15 * 60 * 1000;
    const age = Date.now() - session.timestamp;

    if (age > FIFTEEN_MINUTES) {
      console.log('⏰ Game session expired (> 15 minutes), clearing...');
      clearGameSession();
      return null;
    }

    console.log('💾 Found saved game session:', session);
    return session;
  } catch (error) {
    console.error('❌ Error reading game session:', error);
    return null;
  }
}

/**
 * Clear game session from localStorage
 */
export function clearGameSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Game session cleared');
  } catch (error) {
    console.error('❌ Error clearing game session:', error);
  }
}

/**
 * Check if the saved session matches the current wallet
 */
export function isSessionValid(walletAddress: string | null): boolean {
  if (!walletAddress) return false;

  const session = getGameSession();
  if (!session) return false;

  return session.walletAddress.toLowerCase() === walletAddress.toLowerCase();
}

/**
 * Update session timestamp to keep it fresh
 */
export function refreshSessionTimestamp(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const session: GameSession = JSON.parse(stored);
    session.timestamp = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('❌ Error refreshing session timestamp:', error);
  }
}
