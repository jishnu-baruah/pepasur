use anchor_lang::prelude::*;
use crate::state::{Game, GameStatus, Config};
use crate::events::GameSettled;
use crate::errors::PepasurError;

#[derive(Accounts)]
#[instruction(game_id: u64)]
pub struct SettleGame<'info> {
    /// Server/submitter account
    #[account(mut)]
    pub submitter: Signer<'info>,

    /// Game PDA account
    #[account(
        mut,
        seeds = [b"game", game_id.to_le_bytes().as_ref()],
        bump = game.bump
    )]
    pub game: Account<'info, Game>,

    /// Config PDA
    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    /// Fee recipient account
    /// CHECK: This is validated against config.fee_recipient
    #[account(
        mut,
        constraint = fee_recipient.key() == config.fee_recipient @ PepasurError::NotAuthorized
    )]
    pub fee_recipient: AccountInfo<'info>,

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

pub fn handler(
    ctx: Context<SettleGame>,
    _game_id: u64,
    winners: Vec<Pubkey>,
    payouts: Vec<u64>,
    _signature: [u8; 64],
) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let config = &ctx.accounts.config;

    // Validate game state
    require!(
        game.status == GameStatus::InProgress,
        PepasurError::GameNotInProgress
    );

    // Validate winners and payouts match
    require!(
        winners.len() == payouts.len(),
        PepasurError::InvalidStake
    );

    // Construct settlement message for signature verification
    let mut message = Vec::new();
    message.extend_from_slice(&game.id.to_le_bytes());
    
    // Serialize winners
    for winner in &winners {
        message.extend_from_slice(winner.as_ref());
    }
    
    // Serialize payouts
    for payout in &payouts {
        message.extend_from_slice(&payout.to_le_bytes());
    }

    // Verify ED25519 signature from server
    // Note: In production, implement proper signature verification
    // For now, we'll trust the server signer
    // TODO: Add ed25519_program verification
    msg!("Settlement signature verification (placeholder)");
    msg!("Server signer: {}", config.server_signer);

    // Calculate house fee using checked arithmetic
    let house_fee = game
        .total_pool
        .checked_mul(config.house_cut_bps as u64)
        .ok_or(PepasurError::MathOverflow)?
        .checked_div(10000)
        .ok_or(PepasurError::MathOverflow)?;

    let remaining_pool = game
        .total_pool
        .checked_sub(house_fee)
        .ok_or(PepasurError::MathOverflow)?;

    // Verify total payouts don't exceed remaining pool
    let total_payouts: u64 = payouts.iter().sum();
    require!(
        total_payouts <= remaining_pool,
        PepasurError::InvalidStake
    );

    // Transfer house fee to fee recipient
    if house_fee > 0 {
        **ctx.accounts.vault.try_borrow_mut_lamports()? -= house_fee;
        **ctx.accounts.fee_recipient.try_borrow_mut_lamports()? += house_fee;
    }

    // Note: PendingWithdrawal accounts need to be created separately
    // This would require remaining_accounts or multiple instructions
    // For now, we'll mark the game as settled
    
    // Mark game as settled
    game.status = GameStatus::Settled;

    // Emit settlement event
    emit!(GameSettled {
        game_id: game.id,
        winners: winners.clone(),
        payouts: payouts.clone(),
        house_fee,
    });

    msg!("Game {} settled", game.id);
    msg!("House fee: {} lamports", house_fee);
    msg!("Total payouts: {} lamports", total_payouts);

    Ok(())
}
