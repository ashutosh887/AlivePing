# AlivePing Solana Contracts

## Current Deployment Status

**Program ID:** `9ykG65VCa5KsbKkc1HdgbZRDr61fYjHYnDGy17LafX1e`

**Status:** ✅ **DEPLOYED ON TESTNET**  
**Network:** Testnet  
**Build Size:** 191KB (optimized)  
**Explorer:** [View on Solana Explorer](https://explorer.solana.com/address/9ykG65VCa5KsbKkc1HdgbZRDr61fYjHYnDGy17LafX1e?cluster=testnet)

## Quick Deploy

```bash
cd contracts
./DEPLOY_NOW.sh
```

## Manual Deploy

1. **Build:**
   ```bash
   cd contracts/aliveping
   cargo-build-sbf --release
   cd ..
   cp aliveping/target/sbf-solana-solana/release/aliveping.so target/deploy/aliveping.so
   ```

2. **Deploy:**
   ```bash
   cd contracts
   solana program deploy target/deploy/aliveping.so \
     --program-id target/deploy/aliveping-keypair.json \
     --url testnet \
     --commitment confirmed
   ```

## Contract Overview

### Instructions
- `start_check_in` - Create a new safety check-in session
- `confirm_safe` - Mark check-in as confirmed (user is safe)
- `trigger_panic` - Create immediate panic alert
- `expire_check_in` - Mark check-in as expired (deadline passed)
- `cancel_check_in` - Cancel an active check-in
- `close_session` - Close a session
- `update_last_ping` - Update last activity timestamp

### SafetySession Account
Stores user safety check-in data as a PDA (Program Derived Address):
- `user` - Owner of the session
- `start_time` - When check-in started
- `deadline` - When check-in expires
- `last_ping` - Last activity timestamp
- `status` - Current status (Active, Confirmed, Expired, Panic, Closed)
- `event_type` - Type of event (CheckIn, Panic)
- `context_hash` - Location hash (privacy-preserving)

### Status Types
- `Active` - Check-in is active, waiting for confirmation
- `Confirmed` - User confirmed they're safe
- `Expired` - Deadline passed without confirmation
- `Panic` - Emergency panic triggered
- `Closed` - Session closed/cancelled

## Environment

Set in `.env`:
```
EXPO_PUBLIC_SOLANA_PROGRAM_ID=9ykG65VCa5KsbKkc1HdgbZRDr61fYjHYnDGy17LafX1e
```
