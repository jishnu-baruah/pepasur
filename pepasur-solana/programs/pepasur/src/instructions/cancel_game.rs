use anchor_lang::prelude::*;
use crate::state::{Game, GameStatus};
use crate::events::GameCancelled;
use crate::errors::PepasurError;

#[derive(Accounts)]
#[instruction(game_id: u64)]
pub struct CancelGame<'info> {
    /// Game creator (only creator can cancel)
    #[account(mut)]
    pub creator: Signer<'info>,

    /// Game PDA account
    #[account(
        mut,
        has_one = creator @ PepasurError::NotAuthorized,
        seeds = [b"game", game_id.to_le_bytes().as_ref()],
        bump = game.bump
    )]
    pub game: Account<'info, Game>,

    /// Vault account
    /// CHECK: This is a simple SOL account controlled by vault_authority PDA
    #[account(
        mut,
        seeds = [b"vault"],
        bump
    )]
    pub vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CancelGame>, _game_id: u64) -> Result<()> {
    let game = &mut ctx.accounts.game;

    // Validate game can be cancelled
    require!(
        game.status == GameStatus::Lobby || game.status == GameStatus::InProgress,
        PepasurError::GameAlreadyStarted
    );

    // Note: In a complete implementation, we would need to:
    // 1. Create PendingWithdrawal PDAs for each player
    // 2. Transfer their deposits back
    // This requires remaining_accounts or multiple instructions
    
    // For now, we'll mark the game as cancelled
    // Players can be refunded through a separate refund instruction
    
    let refunded_players = game.players.clone();
    
    // Mark game as cancelled
    game.status = GameStatus::Cancelled;

    // Emit event
    emit!(GameCancelled {
        game_id: game.id,
        refunded_players: refunded_players.clone(),
    });

    msg!("Game {} cancelled by creator", game.id);
    msg!("Players to be refunded: {}", refunded_players.len());

    Ok(())
}
