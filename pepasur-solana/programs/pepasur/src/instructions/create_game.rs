use anchor_lang::prelude::*;
use crate::state::{Game, GameStore, GameStatus};
use crate::events::GameCreated;
use crate::errors::PepasurError;

#[derive(Accounts)]
pub struct CreateGame<'info> {
    /// Game creator
    #[account(mut)]
    pub creator: Signer<'info>,

    /// GameStore PDA to get next game ID
    #[account(
        mut,
        seeds = [b"game_store"],
        bump = game_store.bump
    )]
    pub game_store: Account<'info, GameStore>,

    /// New Game PDA account
    #[account(
        init,
        payer = creator,
        space = Game::base_size(),
        seeds = [b"game", game_store.next_game_id.to_le_bytes().as_ref()],
        bump
    )]
    pub game: Account<'info, Game>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateGame>,
    stake_amount: u64,
    min_players: u8,
) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let game_store = &mut ctx.accounts.game_store;

    // Validate inputs
    require!(stake_amount > 0, PepasurError::InvalidStake);
    require!(min_players >= 2, PepasurError::MinPlayersNotMet);

    // Initialize game
    game.id = game_store.next_game_id;
    game.creator = ctx.accounts.creator.key();
    game.stake_amount = stake_amount;
    game.min_players = min_players;
    game.players = Vec::new();
    game.deposits = Vec::new();
    game.status = GameStatus::Lobby;
    game.total_pool = 0;
    game.created_at = Clock::get()?.unix_timestamp;
    game.bump = ctx.bumps.game;

    // Increment next game ID
    game_store.next_game_id = game_store
        .next_game_id
        .checked_add(1)
        .ok_or(PepasurError::MathOverflow)?;

    // Emit event
    emit!(GameCreated {
        game_id: game.id,
        creator: game.creator,
        stake: stake_amount,
        min_players,
    });

    msg!("Game {} created by {}", game.id, game.creator);

    Ok(())
}
