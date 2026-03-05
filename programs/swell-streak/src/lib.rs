use anchor_lang::prelude::*;

// Replace after `anchor build` generates the real program keypair.
declare_id!("StreakProg1111111111111111111111111111111111");

const MAX_DATES: usize = 120;
const SECONDS_PER_DAY: i64 = 86_400;

/// Compute a UTC day number from a Unix timestamp (days since 1970-01-01).
fn utc_day(ts: i64) -> u16 {
    (ts / SECONDS_PER_DAY) as u16
}

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------

#[program]
pub mod swell_streak {
    use super::*;

    /// Create the streak PDA for the calling wallet. Idempotent — if it already
    /// exists Anchor will return an error that the client can treat as no-op.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let acct = &mut ctx.accounts.streak_account;
        acct.owner = ctx.accounts.owner.key();
        acct.bump = ctx.bumps.streak_account;
        Ok(())
    }

    /// Record that the wallet owner used the app today (read, viewed verse, etc.).
    pub fn record_app(ctx: Context<RecordActivity>) -> Result<()> {
        let clock = Clock::get()?;
        let today = utc_day(clock.unix_timestamp);
        let acct = &mut ctx.accounts.streak_account;

        if acct.last_app_day == today {
            return Ok(());
        }

        update_streak(
            today,
            &mut acct.last_app_day,
            &mut acct.app_streak_current,
            &mut acct.app_streak_best,
            &mut acct.app_dates,
            &mut acct.app_dates_len,
        );

        Ok(())
    }

    /// Record that the wallet owner completed guided scripture today.
    /// Also counts as app activity so both streaks are updated.
    pub fn record_guided(ctx: Context<RecordActivity>) -> Result<()> {
        let clock = Clock::get()?;
        let today = utc_day(clock.unix_timestamp);
        let acct = &mut ctx.accounts.streak_account;

        if acct.last_guided_day != today {
            update_streak(
                today,
                &mut acct.last_guided_day,
                &mut acct.guided_streak_current,
                &mut acct.guided_streak_best,
                &mut acct.guided_dates,
                &mut acct.guided_dates_len,
            );
        }

        if acct.last_app_day != today {
            update_streak(
                today,
                &mut acct.last_app_day,
                &mut acct.app_streak_current,
                &mut acct.app_streak_best,
                &mut acct.app_dates,
                &mut acct.app_dates_len,
            );
        }

        Ok(())
    }
}

/// Shared helper: advance a single streak type for `today`.
fn update_streak(
    today: u16,
    last_day: &mut u16,
    current: &mut u16,
    best: &mut u16,
    dates: &mut [u16; MAX_DATES],
    dates_len: &mut u8,
) {
    if *last_day > 0 && today == *last_day + 1 {
        *current += 1;
    } else {
        *current = 1;
    }

    if *current > *best {
        *best = *current;
    }

    *last_day = today;

    let len = *dates_len as usize;
    if len < MAX_DATES {
        dates[len] = today;
        *dates_len += 1;
    } else {
        dates.copy_within(1..MAX_DATES, 0);
        dates[MAX_DATES - 1] = today;
    }
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer  = owner,
        space  = 8 + StreakAccount::INIT_SPACE,
        seeds  = [b"streak", owner.key().as_ref()],
        bump,
    )]
    pub streak_account: Account<'info, StreakAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordActivity<'info> {
    #[account(
        mut,
        seeds = [b"streak", owner.key().as_ref()],
        bump   = streak_account.bump,
        has_one = owner,
    )]
    pub streak_account: Account<'info, StreakAccount>,

    pub owner: Signer<'info>,
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

#[account]
#[derive(InitSpace)]
pub struct StreakAccount {
    /// Wallet that owns this streak record.
    pub owner: Pubkey,
    /// PDA bump seed.
    pub bump: u8,

    pub app_streak_current: u16,
    pub app_streak_best: u16,
    pub guided_streak_current: u16,
    pub guided_streak_best: u16,

    /// UTC day number of the most recent app activity.
    pub last_app_day: u16,
    /// UTC day number of the most recent guided completion.
    pub last_guided_day: u16,

    /// Number of valid entries in `app_dates`.
    pub app_dates_len: u8,
    /// Number of valid entries in `guided_dates`.
    pub guided_dates_len: u8,

    /// Rolling window of the last 120 UTC day numbers with app activity.
    #[max_len(120)]
    pub app_dates: [u16; 120],
    /// Rolling window of the last 120 UTC day numbers with guided completions.
    #[max_len(120)]
    pub guided_dates: [u16; 120],
}
