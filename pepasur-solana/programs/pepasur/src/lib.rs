use anchor_lang::prelude::*;

// Declare program ID
declare_id!("FihMZFcyftuU7d7YtnZCfKthcQQpSbfBaTfDkDZGJDfd");

// Module declarations
pub mod state;
pub mod errors;
pub mod events;
pub mod instructions;

// Imports
use instructions::*;

/// Pepasur - On-chain Mafia game on Solana
///
/// This program implements a multiplayer social deduction game where players:
/// - Stake SOL tokens to join games
/// - Receive cryptographically-assigned roles (ASUR/Mafia, DEVA/Doctor, RISHI/Detective, MANAV/Villager)
/// - Compete through night actions, voting, and task phases
/// - Winners receive rewards distributed automatically through smart contracts
#[program]
pub mod pepasur {
    use super::*;

    /// Initialize the Pepasur program
    /// Creates Config and GameStore PDAs
    pub fn initialize(
        ctx: Context<Initialize>,
        server_signer: Pubkey,
        fee_recipient: Pubkey,
    ) -> Result<()> {
        crate::instructions::initialize::handler(ctx, server_signer, fee_recipient)
    }

    /// Create a new game
    /// Players can create games with custom stake amounts and minimum player requirements
    pub fn create_game(
        ctx: Context<CreateGame>,
        stake_amount: u64,
        min_players: u8,
    ) -> Result<()> {
        crate::instructions::create_game::handler(ctx, stake_amount, min_players)
    }

    /// Join an existing game
    /// Players stake SOL to join, game starts when minimum players reached
    pub fn join_game(
        ctx: Context<JoinGame>,
        game_id: u64,
    ) -> Result<()> {
        crate::instructions::join_game::handler(ctx, game_id)
    }

    /// Settle a completed game
    /// Server submits signed settlement with winners and payouts
    pub fn settle_game(
        ctx: Context<SettleGame>,
        game_id: u64,
        winners: Vec<Pubkey>,
        payouts: Vec<u64>,
        signature: [u8; 64],
    ) -> Result<()> {
        crate::instructions::settle_game::handler(ctx, game_id, winners, payouts, signature)
    }

    /// Withdraw pending winnings
    /// Players can withdraw their accumulated winnings
    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        crate::instructions::withdraw::handler(ctx)
    }

    /// Cancel a game
    /// Only the creator can cancel a game in lobby or in-progress state
    pub fn cancel_game(
        ctx: Context<CancelGame>,
        game_id: u64,
    ) -> Result<()> {
        crate::instructions::cancel_game::handler(ctx, game_id)
    }
}
