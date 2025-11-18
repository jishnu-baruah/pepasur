use anchor_lang::prelude::*;

/// Custom error codes for Pepasur program
/// Error codes range: 6000-6999 (Anchor custom error range)
#[error_code]
pub enum PepasurError {
    #[msg("Game not found")]
    GameNotFound = 6000,
    
    #[msg("Game not in lobby state")]
    GameNotInLobby = 6001,
    
    #[msg("Invalid stake amount (must be > 0)")]
    InvalidStake = 6002,
    
    #[msg("Game already settled")]
    AlreadySettled = 6003,
    
    #[msg("Not authorized to perform this action")]
    NotAuthorized = 6004,
    
    #[msg("Invalid settlement signature")]
    InvalidSignature = 6005,
    
    #[msg("Game not in progress")]
    GameNotInProgress = 6006,
    
    #[msg("No pending withdrawal for this player")]
    NoPendingWithdrawal = 6007,
    
    #[msg("Game already started")]
    GameAlreadyStarted = 6008,
    
    #[msg("Minimum players requirement not met")]
    MinPlayersNotMet = 6009,
    
    #[msg("Maximum players reached")]
    GameFull = 6010,
    
    #[msg("Math overflow in calculation")]
    MathOverflow = 6011,
}
