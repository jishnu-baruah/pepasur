use anchor_lang::prelude::*;

// Note: Events use program logs which may be truncated by some RPC providers.
// For production, consider using:
// 1. emit_cpi!() for more reliable event storage (higher compute cost)
// 2. Triton/Helius Geyser gRPC for guaranteed event capture
// 3. Custom indexing solution

/// Event emitted when a new game is created
#[event]
pub struct GameCreated {
    pub game_id: u64,
    pub creator: Pubkey,
    pub stake: u64,
    pub min_players: u8,
}

/// Event emitted when a player joins a game
#[event]
pub struct PlayerJoined {
    pub game_id: u64,
    pub player: Pubkey,
}

/// Event emitted when a game starts (min players reached)
#[event]
pub struct GameStarted {
    pub game_id: u64,
    pub player_count: u64,
}

/// Event emitted when a game is settled
/// Uses emit_cpi!() for more reliable storage (requires event-cpi feature)
#[event]
pub struct GameSettled {
    pub game_id: u64,
    pub winners: Vec<Pubkey>,
    pub payouts: Vec<u64>,
    pub house_fee: u64,
}

/// Event emitted when a player withdraws winnings
#[event]
pub struct Withdrawn {
    pub player: Pubkey,
    pub amount: u64,
}

/// Event emitted when a game is cancelled
#[event]
pub struct GameCancelled {
    pub game_id: u64,
    pub refunded_players: Vec<Pubkey>,
}
