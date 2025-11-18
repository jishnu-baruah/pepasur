use anchor_lang::prelude::*;

/// Maximum players per game to prevent unbounded growth
pub const MAX_PLAYERS: usize = 10;

/// Game status enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum GameStatus {
    Lobby,
    InProgress,
    Settled,
    Cancelled,
}

/// Config account (PDA)
/// Stores global configuration for the Pepasur program
#[account]
pub struct Config {
    /// Program admin public key
    pub admin: Pubkey,
    /// Server signer public key for settlement verification
    pub server_signer: Pubkey,
    /// Fee recipient public key
    pub fee_recipient: Pubkey,
    /// House cut in basis points (200 = 2%)
    pub house_cut_bps: u16,
    /// Whether the program has been initialized
    pub initialized: bool,
    /// PDA bump seed
    pub bump: u8,
}

impl Config {
    pub const LEN: usize = 8 + // discriminator
        32 + // admin
        32 + // server_signer
        32 + // fee_recipient
        2 +  // house_cut_bps
        1 +  // initialized
        1;   // bump
}

/// Game account (PDA)
/// Stores all information about a single game
#[account]
pub struct Game {
    /// Unique game ID
    pub id: u64,
    /// Game creator public key
    pub creator: Pubkey,
    /// Stake amount in lamports
    pub stake_amount: u64,
    /// Minimum players required to start
    pub min_players: u8,
    /// List of player public keys
    pub players: Vec<Pubkey>,
    /// List of deposit amounts (parallel to players)
    pub deposits: Vec<u64>,
    /// Current game status
    pub status: GameStatus,
    /// Total pool in lamports
    pub total_pool: u64,
    /// Game creation timestamp
    pub created_at: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl Game {
    /// Calculate the size needed for a game account with a given number of players
    pub fn calculate_size(num_players: usize) -> usize {
        8 +  // discriminator
        8 +  // id
        32 + // creator
        8 +  // stake_amount
        1 +  // min_players
        4 + (num_players * 32) + // players vec
        4 + (num_players * 8) +  // deposits vec
        1 +  // status
        8 +  // total_pool
        8 +  // created_at
        1    // bump
    }

    /// Get the base size for an empty game
    pub const fn base_size() -> usize {
        8 +  // discriminator
        8 +  // id
        32 + // creator
        8 +  // stake_amount
        1 +  // min_players
        4 +  // players vec (empty)
        4 +  // deposits vec (empty)
        1 +  // status
        8 +  // total_pool
        8 +  // created_at
        1    // bump
    }
}

/// GameStore account (PDA)
/// Stores the next game ID counter
#[account]
pub struct GameStore {
    /// Next game ID to be assigned
    pub next_game_id: u64,
    /// PDA bump seed
    pub bump: u8,
}

impl GameStore {
    pub const LEN: usize = 8 + // discriminator
        8 + // next_game_id
        1;  // bump
}

/// PendingWithdrawal account (PDA per player)
/// Stores pending withdrawal amount for a player
#[account]
pub struct PendingWithdrawal {
    /// Player public key
    pub player: Pubkey,
    /// Amount pending withdrawal in lamports
    pub amount: u64,
    /// PDA bump seed
    pub bump: u8,
}

impl PendingWithdrawal {
    pub const LEN: usize = 8 + // discriminator
        32 + // player
        8 +  // amount
        1;   // bump
}
