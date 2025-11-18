use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{Game, GameStatus, MAX_PLAYERS};
use crate::events::{PlayerJoined, GameStarted};
use crate::errors::PepasurError;

#[derive(Accounts)]
#[instruction(game_id: u64)]
pub struct JoinGame<'info> {
    /// Player joining the game
    #[account(mut)]
    pub player: Signer<'info>,

    /// Game PDA account (will be reallocated)
    #[account(
        mut,
        realloc = Game::calculate_size(game.players.len() + 1),
        realloc::payer = player,
        realloc::zero = false,
        seeds = [b"game", game_id.to_le_bytes().as_ref()],
        bump = game.bump
    )]
    pub game: Account<'info, Game>,

    /// Vault account to hold staked SOL
    /// CHECK: This is a simple SOL account controlled by vault_authority PDA
    #[account(
        mut,
        seeds = [b"vault"],
        bump
    )]
    pub vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<JoinGame>, _game_id: u64) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let player = &ctx.accounts.player;

    // Validate game state
    require!(game.status == GameStatus::Lobby, PepasurError::GameNotInLobby);
    
    // Enforce maximum players
    require!(
        game.players.len() < MAX_PLAYERS,
        PepasurError::GameFull
    );

    // Transfer stake to vault
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: player.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        game.stake_amount,
    )?;

    // Add player to game
    let stake_amount = game.stake_amount; // Store value before mutable borrow
    game.players.push(player.key());
    game.deposits.push(stake_amount);

    // Update total pool using checked arithmetic
    game.total_pool = game
        .total_pool
        .checked_add(game.stake_amount)
        .ok_or(PepasurError::MathOverflow)?;

    // Emit player joined event
    emit!(PlayerJoined {
        game_id: game.id,
        player: player.key(),
    });

    msg!("Player {} joined game {}", player.key(), game.id);

    // Start game if minimum players reached
    if game.players.len() >= game.min_players as usize {
        game.status = GameStatus::InProgress;
        
        emit!(GameStarted {
            game_id: game.id,
            player_count: game.players.len() as u64,
        });

        msg!("Game {} started with {} players", game.id, game.players.len());
    }

    Ok(())
}
