use anchor_lang::prelude::*;

declare_id!("9ykG65VCa5KsbKkc1HdgbZRDr61fYjHYnDGy17LafX1e");

#[program]
pub mod aliveping {
    use super::*;

    pub fn start_check_in(
        ctx: Context<StartCheckIn>,
        deadline: i64,
        context_hash: [u8; 32],
    ) -> Result<()> {
        let session = &mut ctx.accounts.session;
        let clock = Clock::get()?;

        require!(
            deadline > clock.unix_timestamp,
            AlivePingError::InvalidDeadline
        );

        require!(
            deadline <= clock.unix_timestamp + 86400,
            AlivePingError::DeadlineTooFar
        );

        session.user = ctx.accounts.user.key();
        session.start_time = clock.unix_timestamp;
        session.deadline = deadline;
        session.last_ping = clock.unix_timestamp;
        session.status = SafetyStatus::Active as u8;
        session.event_type = EventType::CheckIn as u8;
        session.context_hash = context_hash;
        session.bump = ctx.bumps.session;

        Ok(())
    }

    pub fn trigger_panic(
        ctx: Context<TriggerPanic>,
        context_hash: [u8; 32],
    ) -> Result<()> {
        let session = &mut ctx.accounts.session;
        let clock = Clock::get()?;

        session.user = ctx.accounts.user.key();
        session.start_time = clock.unix_timestamp;
        session.deadline = clock.unix_timestamp;
        session.last_ping = clock.unix_timestamp;
        session.status = SafetyStatus::Panic as u8;
        session.event_type = EventType::Panic as u8;
        session.context_hash = context_hash;
        session.bump = ctx.bumps.session;

        Ok(())
    }

    pub fn close_session(ctx: Context<CloseSession>) -> Result<()> {
        let session = &mut ctx.accounts.session;
        let clock = Clock::get()?;

        require!(
            session.status == SafetyStatus::Active as u8
                || session.status == SafetyStatus::Confirmed as u8
                || session.status == SafetyStatus::Expired as u8
                || session.status == SafetyStatus::Panic as u8,
            AlivePingError::NotActive
        );

        session.status = SafetyStatus::Closed as u8;
        session.last_ping = clock.unix_timestamp;

        Ok(())
    }

    pub fn confirm_safe(ctx: Context<ConfirmSafe>) -> Result<()> {
        let session = &mut ctx.accounts.session;
        let clock = Clock::get()?;

        require!(
            session.status == SafetyStatus::Active as u8,
            AlivePingError::NotActive
        );

        session.status = SafetyStatus::Confirmed as u8;
        session.last_ping = clock.unix_timestamp;

        Ok(())
    }

    pub fn cancel_check_in(ctx: Context<CancelCheckIn>) -> Result<()> {
        let session = &mut ctx.accounts.session;
        let clock = Clock::get()?;

        require!(
            session.status == SafetyStatus::Active as u8,
            AlivePingError::NotActive
        );

        session.status = SafetyStatus::Closed as u8;
        session.last_ping = clock.unix_timestamp;

        Ok(())
    }

    pub fn expire_check_in(ctx: Context<ExpireCheckIn>) -> Result<()> {
        let session = &mut ctx.accounts.session;
        let clock = Clock::get()?;

        require!(
            session.status == SafetyStatus::Active as u8,
            AlivePingError::NotActive
        );

        require!(
            clock.unix_timestamp >= session.deadline,
            AlivePingError::DeadlineNotReached
        );

        session.status = SafetyStatus::Expired as u8;
        session.last_ping = clock.unix_timestamp;

        Ok(())
    }

    pub fn update_last_ping(ctx: Context<UpdateLastPing>) -> Result<()> {
        let session = &mut ctx.accounts.session;
        let clock = Clock::get()?;

        require!(
            session.status == SafetyStatus::Active as u8,
            AlivePingError::NotActive
        );

        session.last_ping = clock.unix_timestamp;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(deadline: i64, context_hash: [u8; 32])]
pub struct StartCheckIn<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + SafetySession::LEN,
        seeds = [b"safety_session", user.key().as_ref()],
        bump
    )]
    pub session: Account<'info, SafetySession>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConfirmSafe<'info> {
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"safety_session", user.key().as_ref()],
        bump = session.bump,
        has_one = user @ AlivePingError::Unauthorized
    )]
    pub session: Account<'info, SafetySession>,
}

#[derive(Accounts)]
pub struct ExpireCheckIn<'info> {
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"safety_session", user.key().as_ref()],
        bump = session.bump,
        has_one = user @ AlivePingError::Unauthorized
    )]
    pub session: Account<'info, SafetySession>,
}

#[derive(Accounts)]
pub struct UpdateLastPing<'info> {
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"safety_session", user.key().as_ref()],
        bump = session.bump,
        has_one = user @ AlivePingError::Unauthorized
    )]
    pub session: Account<'info, SafetySession>,
}

#[derive(Accounts)]
#[instruction(context_hash: [u8; 32])]
pub struct TriggerPanic<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + SafetySession::LEN,
        seeds = [b"safety_session", user.key().as_ref()],
        bump
    )]
    pub session: Account<'info, SafetySession>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseSession<'info> {
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"safety_session", user.key().as_ref()],
        bump = session.bump,
        has_one = user @ AlivePingError::Unauthorized
    )]
    pub session: Account<'info, SafetySession>,
}

#[derive(Accounts)]
pub struct CancelCheckIn<'info> {
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"safety_session", user.key().as_ref()],
        bump = session.bump,
        has_one = user @ AlivePingError::Unauthorized
    )]
    pub session: Account<'info, SafetySession>,
}

#[account]
pub struct SafetySession {
    pub user: Pubkey,
    pub start_time: i64,
    pub deadline: i64,
    pub last_ping: i64,
    pub status: u8,
    pub event_type: u8,
    pub context_hash: [u8; 32],
    pub bump: u8,
}

impl SafetySession {
    pub const LEN: usize = 32 + 8 + 8 + 8 + 1 + 1 + 32 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum SafetyStatus {
    Active = 0,
    Confirmed = 1,
    Expired = 2,
    Panic = 3,
    Closed = 4,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum EventType {
    CheckIn = 0,
    Panic = 1,
}

#[error_code]
pub enum AlivePingError {
    #[msg("Session is not active")]
    NotActive,
    #[msg("Deadline has not been reached")]
    DeadlineNotReached,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid deadline")]
    InvalidDeadline,
    #[msg("Deadline too far in the future (max 24 hours)")]
    DeadlineTooFar,
    #[msg("Session already exists")]
    SessionExists,
    #[msg("Invalid session state")]
    InvalidState,
}
