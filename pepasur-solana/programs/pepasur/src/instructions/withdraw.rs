use anchor_lang::prelude::*;
use crate::state::PendingWithdrawal;
use crate::events::Withdrawn;
use crate::errors::PepasurError;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    /// Player withdrawing funds
    #[account(mut)]
    pub player: Signer<'info>,

    /// PendingWithdrawal PDA account
    #[account(
        mut,
        seeds = [b"pending_withdrawal", player.key().as_ref()],
        bump = pending_withdrawal.bump,
        close = player
    )]
    pub pending_withdrawal: Account<'info, PendingWithdrawal>,

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

pub fn handler(ctx: Context<Withdraw>) -> Result<()> {
    // 1. CHECKS
    let pending = &ctx.accounts.pending_withdrawal;
    require!(pending.amount > 0, PepasurError::NoPendingWithdrawal);

    let amount = pending.amount;

    // 2. EFFECTS (update state BEFORE transfer)
    // The close constraint will handle closing the account and returning rent
    // This happens automatically after the instruction completes

    // 3. INTERACTIONS (external calls LAST)
    // Transfer from vault to player
    **ctx.accounts.vault.try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.player.try_borrow_mut_lamports()? += amount;

    // Emit event
    emit!(Withdrawn {
        player: ctx.accounts.player.key(),
        amount,
    });

    msg!("Player {} withdrew {} lamports", ctx.accounts.player.key(), amount);

    Ok(())
}
