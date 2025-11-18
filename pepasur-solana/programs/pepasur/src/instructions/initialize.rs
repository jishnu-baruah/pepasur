use anchor_lang::prelude::*;
use crate::state::{Config, GameStore};

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// Admin account that will control the program
    #[account(mut)]
    pub admin: Signer<'info>,

    /// Config PDA account
    #[account(
        init,
        payer = admin,
        space = Config::LEN,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,

    /// GameStore PDA account
    #[account(
        init,
        payer = admin,
        space = GameStore::LEN,
        seeds = [b"game_store"],
        bump
    )]
    pub game_store: Account<'info, GameStore>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<Initialize>,
    server_signer: Pubkey,
    fee_recipient: Pubkey,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let game_store = &mut ctx.accounts.game_store;

    // Initialize Config
    config.admin = ctx.accounts.admin.key();
    config.server_signer = server_signer;
    config.fee_recipient = fee_recipient;
    config.house_cut_bps = 200; // 2%
    config.initialized = true;
    config.bump = ctx.bumps.config;

    // Initialize GameStore
    game_store.next_game_id = 1;
    game_store.bump = ctx.bumps.game_store;

    msg!("Pepasur program initialized");
    msg!("Admin: {}", config.admin);
    msg!("Server signer: {}", config.server_signer);
    msg!("Fee recipient: {}", config.fee_recipient);

    Ok(())
}
