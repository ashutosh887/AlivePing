# AlivePing Solana Contracts - Complete Guide

**End-to-end deployment, debugging, and learning guide for Solana smart contracts**

## Table of Contents

1. [Understanding the Basics](#understanding-the-basics)
2. [Network: Testnet](#network-testnet)
3. [Setup & Installation](#setup--installation)
4. [Complete Deployment Process](#complete-deployment-process)
5. [Current Deployment Status](#current-deployment-status)
5. [Understanding What Happens During Deployment](#understanding-what-happens-during-deployment)
6. [Viewing Your Contract](#viewing-your-contract)
7. [Contract Architecture Explained](#contract-architecture-explained)
8. [Testing & Verification](#testing--verification)
9. [Common Errors & Debugging](#common-errors--debugging)
10. [Key Concepts Explained](#key-concepts-explained)

---

## Current Deployment Status

**Program ID:** `9ykG65VCa5KsbKkc1HdgbZRDr61fYjHYnDGy17LafX1e`

**Status:** ✅ **DEPLOYED ON TESTNET**  
**Location:** `target/deploy/aliveping.so` (191KB optimized build)  
**Network:** Testnet  
**Build Size:** 191KB (optimized from 301KB - 36% reduction)  
**Explorer:** [View on Solana Explorer](https://explorer.solana.com/address/9ykG65VCa5KsbKkc1HdgbZRDr61fYjHYnDGy17LafX1e?cluster=testnet)

**✅ Deployment Complete:**
- Contract successfully deployed to Testnet
- Optimized build (191KB) reduces deployment costs
- All 7 instructions available and functional
- Ready for testing and integration

**Quick Redeploy (If Needed):**
```bash
cd contracts
./DEPLOY_NOW.sh
```

**Manual Deploy Steps:**
1. **Ensure you have at least 2.5 SOL on testnet:**
   ```bash
   solana balance --url testnet
   # Note: Testnet doesn't support airdrop
   # Transfer SOL from your testnet wallet or get from: https://faucet.solana.com/
   ```

2. **Build (if needed):**
   ```bash
   cd contracts/aliveping
   cargo-build-sbf --release
   cd ..
   cp aliveping/target/sbf-solana-solana/release/aliveping.so target/deploy/aliveping.so
   ```

3. **Deploy:**
   ```bash
   cd contracts
   solana program deploy target/deploy/aliveping.so \
     --program-id target/deploy/aliveping-keypair.json \
     --url testnet \
     --commitment confirmed
   ```

**Build Optimizations Applied:**
- Removed debug `msg!` macros (reduces string formatting overhead)
- Release profile with size optimizations (`opt-level = "z"`)
- Link-time optimization (LTO) enabled
- Codegen units set to 1 for better optimization
- Symbol stripping enabled

**Environment Setup:**
- ✅ Program ID set in `lib.rs` and `Anchor.toml`
- ✅ `.env` file should have: `EXPO_PUBLIC_SOLANA_PROGRAM_ID=9ykG65VCa5KsbKkc1HdgbZRDr61fYjHYnDGy17LafX1e`
- ✅ App configured to use testnet by default

---

## Understanding the Basics

### What is a Solana Program?

A **Solana Program** (also called a smart contract) is executable code deployed on the Solana blockchain. Think of it as a serverless function that:
- Lives on-chain permanently
- Can be called by anyone (if public)
- Maintains state in accounts
- Costs SOL to deploy and call

**Why we use it**: For AlivePing, we store safety check-in records on-chain to create **immutable proof** that can't be tampered with. This is crucial for emergency situations where trust and verification matter.

### What is Anchor?

**Anchor** is a framework that makes Solana development easier by:
- Providing a high-level language (Rust) instead of raw Solana code
- Generating TypeScript types automatically (IDL)
- Handling boilerplate code (account validation, error handling)
- Making testing and deployment simpler

**Why we use it**: Without Anchor, you'd write hundreds of lines of low-level code. Anchor reduces this to clean, readable Rust code.

---

## Network: Testnet

**Important**: This contract is deployed on **Solana Testnet**, not mainnet.

### Why Testnet?

- **Free to use**: No real SOL required (test tokens only)
- **Safe for testing**: No financial risk if something goes wrong
- **Fast transactions**: Optimized for development speed
- **Full features**: Everything mainnet has, just with fake money
- **Perfect for demos**: Judges can verify transactions without cost
- **Stable network**: More reliable than devnet for testing

### Testnet vs Mainnet

| Feature | Testnet | Mainnet |
|---------|---------|---------|
| Cost | Free | Real SOL (~$0.00025 per transaction) |
| Speed | Fast | Fast (but can be slower during congestion) |
| Reset | Periodically reset | Permanent |
| Purpose | Development/Testing | Production |
| Risk | None | Real money at stake |
| Airdrop | Not available (use faucet) | Not available |

**For this hackathon**: Testnet is perfect. You can show judges real on-chain transactions without spending money.

**Note**: Testnet doesn't support airdrop. Get testnet SOL from: https://faucet.solana.com/

---

## Setup & Installation

### Prerequisites Check

First, verify what you have:
```bash
# Check Solana CLI
solana --version
# Should show: solana-cli 1.x.x

# Check Anchor
anchor --version
# Should show: anchor-cli 0.x.x

# Check Rust/Cargo
cargo --version
# Should show: cargo 1.x.x

# Check your wallet balance
solana balance
# Should show: X SOL (you need at least 1-2 SOL for deployment)
```

### Install Solana CLI

**Option 1: Standard Installation**
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

**Option 2: If you get SSL errors, try with insecure flag:**
```bash
sh -c "$(curl -k -sSfL https://release.solana.com/stable/install)"
```

**Option 3: Using Homebrew (macOS) - RECOMMENDED if curl fails:**
```bash
brew install solana
```

**Option 4: Manual Download:**
```bash
curl -L -o /tmp/solana_install.sh https://release.solana.com/stable/install
sh /tmp/solana_install.sh
rm /tmp/solana_install.sh
```

After installation, verify:
```bash
solana --version
```

### Install Anchor

**Option 1: Using Cargo (Recommended)**
```bash
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked --force
```

**Option 2: Using Homebrew (macOS):**
```bash
brew install anchor
```

**Option 3: If Cargo install fails:**
```bash
npm install -g @coral-xyz/anchor-cli
```

After installation, verify:
```bash
anchor --version
```

### Create a Keypair

**What is a keypair?**
A keypair is your identity on Solana. It consists of:
- **Public Key**: Your wallet address (like a bank account number) - can be shared
- **Private Key**: Your secret key (like a PIN) - NEVER share this

```bash
solana-keygen new -o ~/.config/solana/id.json
```

**Important**: Save the seed phrase shown! You'll need it to recover your wallet if you lose access.

**Why we need this**: Every transaction on Solana needs to be signed. Your keypair proves you own the wallet and authorizes transactions.

### Configure for Testnet

```bash
solana config set --url testnet
```

**What this does**: Tells Solana CLI to use testnet instead of mainnet. All commands will now target testnet.

Verify your config:
```bash
solana config get
```

You should see:
- RPC URL: `https://api.testnet.solana.com`
- Keypair Path: `~/.config/solana/id.json`

### Get Testnet SOL

**Option A: Solana Faucet (Recommended)**
1. Visit: https://faucet.solana.com/
2. Enter your wallet address:
   ```bash
   solana address
   ```
3. Request testnet SOL (usually 1-2 SOL per request)

**Option B: Transfer from Phantom Wallet**
1. Make sure Phantom is on **Testnet** (Settings → Developer Mode → Testnet)
2. Get your CLI wallet address:
   ```bash
   solana address
   ```
3. Send SOL from Phantom to that address (minimum 0.5 SOL recommended)

**Option C: Use Phantom Wallet Directly**
```bash
# Export from Phantom, then:
solana config set --keypair /path/to/your/phantom-keypair.json
```

Check your balance:
```bash
solana balance --url testnet
```

You need at least **2-3 SOL** for deployment (deployment costs ~1.5-2 SOL on testnet).

**Note**: Testnet doesn't support `solana airdrop` command. Use the faucet or transfer from a testnet wallet.

---

## Complete Deployment Process

### Step 1: Navigate to Contracts Directory

```bash
cd contracts
```

**Why**: Anchor needs to be run from the directory containing `Anchor.toml`.

### Step 2: Generate Program Keypair (First Time Only)

**Before building**, generate a program keypair if it doesn't exist:

```bash
solana-keygen new -o target/deploy/aliveping-keypair.json --no-bip39-passphrase --force
```

**Get the Program ID:**
```bash
solana address -k target/deploy/aliveping-keypair.json
```

**Copy this Program ID** - you'll need it in the next step.

### Step 3: Update Program ID in Code

**Update `lib.rs`:**
Open `contracts/aliveping/src/lib.rs` and replace:
```rust
declare_id!("11111111111111111111111111111111");
```
with:
```rust
declare_id!("YOUR_PROGRAM_ID_HERE");  // From step 2
```

**Update `Anchor.toml`:**
In `contracts/Anchor.toml`, update:
```toml
[programs.devnet]
aliveping = "YOUR_PROGRAM_ID_HERE"  # From step 2
```

### Step 4: Build the Contract

**IMPORTANT: Build in release mode for deployment** (debug builds are too large):

```bash
cd contracts/aliveping
cargo-build-sbf --release
cd ..
```

**Or use Anchor (but it may not generate release builds automatically):**
```bash
anchor build
```

**What happens here:**
1. Compiles your Rust code to BPF bytecode
2. Creates a `.so` file (the actual program binary)
3. For release builds, outputs to `aliveping/target/sbf-solana-solana/release/aliveping.so`

**Copy the release build to deploy directory:**
```bash
cp aliveping/target/sbf-solana-solana/release/aliveping.so target/deploy/aliveping.so
```

**Expected file size:** ~300KB (release) vs ~5.6MB (debug)

**⚠️ CRITICAL: Always use release builds for deployment!**

**⚠️ CRITICAL: Missing `cargo-build-sbf` (Solana Platform Tools)**

**The Problem:**
If `target/deploy/` and `target/idl/` are empty after `anchor build`, you're missing `cargo-build-sbf`. This is the Solana compiler that converts Rust to BPF bytecode.

**Why this happens:**
- Homebrew's Solana CLI doesn't include platform tools
- Anchor needs `cargo-build-sbf` to compile programs
- Without it, build succeeds but produces no output files

**The Solution - Install Platform Tools:**

**Option 1: Official Solana Installer (BEST - includes everything)**
```bash
# Install Solana (includes platform tools)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# If you get SSL errors, try:
sh -c "$(curl -k -sSfL https://release.solana.com/stable/install)"

# Add to PATH (add to ~/.zshrc or ~/.bashrc for permanent)
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify installation
which cargo-build-sbf
cargo-build-sbf --version
solana --version
```

**Option 2: Manual Download (If Option 1 fails due to SSL)**
1. Visit: https://github.com/solana-labs/platform-tools/releases
2. Download: `solana-platform-tools-osx.tar.bz2` (for macOS)
3. Extract:
   ```bash
   tar -xjf solana-platform-tools-osx.tar.bz2
   ```
4. Add to PATH:
   ```bash
   export PATH="/path/to/release/bin:$PATH"
   ```
5. Verify:
   ```bash
   cargo-build-sbf --version
   ```

**Option 3: Use Both (Homebrew Solana + Manual Platform Tools)**
```bash
# Keep Homebrew Solana for CLI
# Install platform tools manually (Option 2)
# Add platform tools to PATH
export PATH="/path/to/platform-tools/bin:$PATH"
```

**After installing platform tools:**
```bash
cd contracts
anchor clean

# Build in release mode (IMPORTANT for deployment)
cd aliveping
cargo-build-sbf --release
cd ..

# Copy release build to deploy directory
cp aliveping/target/sbf-solana-solana/release/aliveping.so target/deploy/aliveping.so

# Verify file was created
ls -la target/deploy/aliveping.so
```

**Troubleshooting:**
- If `cargo-build-sbf --version` fails: Platform tools not in PATH
- If build still produces no files: Check Anchor version compatibility
- If SSL errors persist: Use manual download (Option 2)

**What to look for:**
- Check `target/deploy/aliveping.so` exists (this is your program binary)
- File size should be ~300KB (release build) not ~5.6MB (debug build)
- If still empty, check for `cargo-build-sbf` in PATH
- Note: IDL is already in `lib/solana/idl.ts` and doesn't need to be regenerated unless contract changes

### Step 5: Deploy to Devnet

**Check your balance first:**
```bash
solana balance --url devnet
```

You need at least **2.5 SOL** for deployment. If you need more:
```bash
solana airdrop 2 --url devnet
```

**Deploy using Solana CLI (Recommended):**
```bash
solana program deploy target/deploy/aliveping.so \
  --program-id target/deploy/aliveping-keypair.json \
  --url devnet
```

**Or use Anchor:**
```bash
anchor deploy
```

**What happens here:**
1. Uploads the `.so` file to devnet (may take multiple transactions)
2. Creates a program account on-chain
3. Program is now live at your Program ID

**Expected output:**
```
Deploying cluster: https://api.devnet.solana.com
Program Id: 9ykG65VCa5KsbKkc1HdgbZRDr61fYjHYnDGy17LafX1e
Deploy success
```

**⚠️ Common Issues:**

1. **"Insufficient funds"**: Get more devnet SOL with `solana airdrop`
2. **"Write transactions failed"**: Devnet network congestion - wait 5-10 minutes and retry
3. **"Program not found"**: Deployment didn't complete - check transaction status

**Why deployment costs SOL**: 
- Creating accounts on Solana requires rent (to store data)
- Program accounts are large (~300KB for this program)
- Rent is ~2.15 SOL for a program account

### Step 6: Update Environment Variables

**Create/Update `.env` file in root directory:**
```env
EXPO_PUBLIC_SOLANA_PROGRAM_ID=9ykG65VCa5KsbKkc1HdgbZRDr61fYjHYnDGy17LafX1e
```

**Replace with your actual Program ID from deployment.**

**Why**: Your mobile app needs to know which program to call.

### Step 7: Verify IDL is Up to Date

**The IDL should already be in `lib/solana/idl.ts`**. If you made changes to the contract, regenerate it:

```bash
# IDL is typically auto-generated during build
# If needed, you can extract from the deployed program or rebuild
```

**What is IDL?**
IDL (Interface Definition Language) is a JSON file that describes:
- What instructions your program has
- What accounts each instruction needs
- What data types are used

**Why we need it**: Your TypeScript client uses this to know how to call your program. The IDL is already included in `lib/solana/idl.ts`.

### Step 8: Verify Everything Works

```bash
# Check your program exists on-chain
solana program show YOUR_PROGRAM_ID --url devnet

# Should show:
# Program Id: YOUR_PROGRAM_ID
# Owner: BPFLoaderUpgradeab1e11111111111111111111111
# Authority: YOUR_WALLET_ADDRESS
# Data Length: ~300KB
```

**View on Solana Explorer:**
```
https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet
```

---

## Understanding What Happens During Deployment

### The Deployment Flow

1. **Compilation** (`anchor build`)
   - Rust code → WebAssembly (BPF bytecode)
   - Creates optimized binary for Solana runtime
   - Generates IDL for client integration

2. **Upload** (`anchor deploy`)
   - Binary uploaded to devnet
   - Stored in a Program Account
   - Account is owned by BPF Loader (Solana's program loader)

3. **Program Account Creation**
   - New account created on-chain
   - Stores your program code
   - Has a unique address (Program ID)

4. **Upgrade Authority**
   - Your wallet becomes the "upgrade authority"
   - Only you can update the program
   - Can be transferred to a multisig for production

### Program Account vs Regular Account

| Type | Purpose | Size | Cost |
|------|---------|------|------|
| Program Account | Stores executable code | ~200KB | ~1.5 SOL |
| Regular Account | Stores data (like SafetySession) | Variable | ~0.001 SOL |

**Why programs are expensive**: They're large and permanent. Regular accounts are small and can be closed to get rent back.

---

## Viewing Your Contract

### Solana Explorer (Devnet)

**What is Solana Explorer?**
Think of it as "Etherscan for Solana" - a block explorer where you can view:
- All transactions
- Account data
- Program code
- Transaction history

**How to view your program:**

1. Get your Program ID:
   ```bash
   # From .env or deploy output
   echo $EXPO_PUBLIC_SOLANA_PROGRAM_ID
   ```

2. Open Explorer:
   - Go to: https://explorer.solana.com/?cluster=devnet
   - Paste your Program ID in search
   - Press Enter

3. What you'll see:
   - **Program Info**: Owner, upgrade authority, data size
   - **Transactions**: All calls to your program
   - **Accounts**: All accounts owned by your program (SafetySession accounts)
   - **Instructions**: What functions were called

### Direct Link Format

```
https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet
```

### Viewing SafetySession Accounts

**What are SafetySession accounts?**
These are PDAs (Program Derived Addresses) that store individual user check-in data.

**How to find them:**

1. **Method 1: From Explorer**
   - Go to your program page
   - Click "Accounts" tab
   - See all SafetySession accounts

2. **Method 2: Calculate PDA**
   ```bash
   # In your app, when a user starts a check-in, a PDA is created
   # PDA = derive(["safety_session", user_public_key], program_id)
   ```

3. **Method 3: From Transaction**
   - Find a transaction that called `start_check_in`
   - Look at "Account Changes"
   - Find the new account created (that's the SafetySession)

### Viewing Transactions

**What to look for in a transaction:**
- **Instruction**: Which function was called (`start_check_in`, `confirm_safe`, etc.)
- **Accounts**: Which accounts were involved
- **Logs**: Program logs (our `msg!()` statements)
- **Status**: Success or failure
- **Fee**: How much SOL it cost

**Example transaction flow:**
1. User calls `start_check_in` from app
2. Transaction created with instruction
3. Program executes, creates SafetySession account
4. Transaction confirmed on-chain
5. View on Explorer with all details

---

## Contract Architecture Explained

### SafetySession Account Structure

**What is an Account?**
In Solana, accounts are like database rows. They store data on-chain.

**Why PDAs (Program Derived Addresses)?**
- **Deterministic**: Same inputs = same address
- **No private key needed**: Program can sign for them
- **One per user**: Each user gets one SafetySession account

**Account Layout:**
```rust
pub struct SafetySession {
    pub user: Pubkey,           // 32 bytes - Who owns this session
    pub start_time: i64,        // 8 bytes - When check-in started
    pub deadline: i64,          // 8 bytes - When check-in expires
    pub last_ping: i64,        // 8 bytes - Last activity time
    pub status: u8,             // 1 byte - Current status (0-4)
    pub event_type: u8,         // 1 byte - Event type (0-1)
    pub context_hash: [u8; 32], // 32 bytes - Location hash
    pub bump: u8,               // 1 byte - PDA bump seed
}
// Total: ~91 bytes + 8 bytes overhead = ~99 bytes
```

**Why this structure?**
- **user**: Identifies who this session belongs to
- **timestamps**: Immutable proof of when things happened
- **status**: Current state (Active, Confirmed, Expired, etc.)
- **context_hash**: Privacy-preserving location data (hash, not coordinates)
- **bump**: Required for PDA derivation

### Instructions Explained

**1. `start_check_in`**
```rust
pub fn start_check_in(ctx: Context<StartCheckIn>, deadline: i64, context_hash: [u8; 32])
```

**What it does:**
- Creates a new SafetySession account (PDA)
- Sets deadline (when check-in expires)
- Stores location hash
- Marks status as Active

**Why we need it**: This is called when user taps "Start Check-In" in the app.

**Accounts required:**
- `user`: The person starting check-in (signer)
- `session`: The SafetySession PDA (created)
- `system_program`: For account creation

**2. `confirm_safe`**
```rust
pub fn confirm_safe(ctx: Context<ConfirmSafe>)
```

**What it does:**
- Changes status from Active → Confirmed
- Updates last_ping timestamp
- Keeps account on-chain (for history)

**Why we need it**: Called when user taps "I'm Safe" before deadline.

**3. `trigger_panic`**
```rust
pub fn trigger_panic(ctx: Context<TriggerPanic>, context_hash: [u8; 32])
```

**What it does:**
- Creates immediate panic alert
- Sets status to Panic
- Stores location hash

**Why we need it**: Emergency button - no countdown, immediate alert.

**4. `expire_check_in`**
```rust
pub fn expire_check_in(ctx: Context<ExpireCheckIn>)
```

**What it does:**
- Changes status from Active → Expired
- Called when deadline passes

**Why we need it**: Backend can call this to mark expired check-ins.

**5. `cancel_check_in`**
```rust
pub fn cancel_check_in(ctx: Context<CancelCheckIn>)
```

**What it does:**
- Cancels active check-in
- Sets status to Closed

**Why we need it**: User can cancel before deadline.

### Error Codes Explained

**Why custom errors?**
Solana programs return error codes. Custom errors make debugging easier.

**Our error codes:**
- `NotActive (6000)`: Tried to confirm/expire a session that's not active
- `DeadlineNotReached (6001)`: Tried to expire before deadline
- `Unauthorized (6002)`: Someone else tried to modify your session
- `InvalidDeadline (6003)`: Deadline is in the past
- `DeadlineTooFar (6004)`: Deadline > 24 hours (safety limit)
- `SessionExists (6005)`: Tried to create session when one already exists
- `InvalidState (6006)`: Session is in wrong state for this operation

**How to debug errors:**
1. Check transaction on Explorer
2. Look at "Program Log" section
3. Find error code (e.g., `6000`)
4. Match to error enum in `lib.rs`

---

## Testing & Verification

### Local Testing (Before Deploying)

```bash
anchor test
```

**What this does:**
- Spins up local validator (mini Solana network)
- Deploys your program
- Runs test suite
- Cleans up

**Why test locally first:**
- Faster iteration (no network delays)
- Free (no SOL needed)
- Can test edge cases easily

### Manual Testing on Devnet

**Step-by-step verification:**

1. **Deploy the contract** (if not already done)
   ```bash
   cd contracts
   anchor deploy
   ```

2. **Start the mobile app**
   ```bash
   cd ..
   npm start
   ```

3. **Start a check-in**
   - Open app
   - Tap "Start Check-In"
   - Wait for transaction to confirm

4. **Verify on Explorer**
   - Get transaction signature from app logs
   - Paste in Explorer: `https://explorer.solana.com/tx/SIGNATURE?cluster=devnet`
   - Verify:
     - ✅ Transaction succeeded
     - ✅ `start_check_in` instruction called
     - ✅ SafetySession account created
     - ✅ Status is Active

5. **Confirm check-in**
   - Tap "I'm Safe" in app
   - Verify on Explorer:
     - ✅ `confirm_safe` instruction called
     - ✅ Status changed to Confirmed

6. **Test panic button**
   - Tap "Panic" button
   - Verify:
     - ✅ `trigger_panic` instruction called
     - ✅ Status is Panic
     - ✅ New SafetySession created

### Verifying Account Data

**Method 1: Using Solana CLI**
```bash
# Get PDA address (you'll need to calculate this)
# Then:
solana account PDA_ADDRESS

# Should show account data in hex
```

**Method 2: Using Explorer**
- Go to your program page
- Click "Accounts" tab
- Click on a SafetySession account
- View decoded data

**Method 3: From your app**
- Check `lib/solana/program.ts` → `getSession()`
- This fetches account data
- Log it to see structure

---

## Common Errors & Debugging

### Error: "Program account not found"

**What it means**: The program ID in your `.env` doesn't exist on-chain.

**How to fix:**
1. Check if program is deployed:
   ```bash
   solana program show YOUR_PROGRAM_ID
   ```
2. If not found, redeploy:
   ```bash
   cd contracts
   anchor deploy
   ```
3. Update `.env` with correct Program ID

### Error: "Insufficient funds"

**What it means**: Not enough SOL to pay for transaction.

**How to fix:**
```bash
# Check balance
solana balance

# Get more SOL
solana airdrop 2

# Or transfer from Phantom
```

### Error: "Account not found" when calling getSession()

**What it means**: No SafetySession account exists for this user yet.

**Why this happens**: User hasn't started a check-in, or account was closed.

**How to fix:**
- This is normal! User needs to call `start_check_in` first
- Check if user has started a check-in in the app

### Error: "Invalid program ID" in mobile app

**What it means**: Program ID in `.env` is wrong or not deployed.

**How to debug:**
1. Check `.env` file:
   ```bash
   grep EXPO_PUBLIC_SOLANA_PROGRAM_ID .env
   ```
2. Verify it exists on-chain:
   ```bash
   solana program show $EXPO_PUBLIC_SOLANA_PROGRAM_ID
   ```
3. If wrong, update `.env` and restart app

### Error: "Write transactions failed" or "X write transactions failed"

**What it means**: Devnet network congestion preventing deployment (very common in January 2025).

**Solutions (in order of effectiveness):**
1. **Wait and retry** (most reliable):
   - Wait 10-15 minutes between attempts
   - Try during off-peak hours (late night/early morning UTC)
   - Network congestion is usually temporary

2. **Use deployment script:**
   ```bash
   cd contracts
   ./DEPLOY_NOW.sh
   ```
   The script will retry and provide better error messages.

3. **Use custom RPC endpoint:**
   - Sign up for free RPC at Helius (https://helius.dev) or QuickNode
   - Use their devnet endpoint instead of public devnet
   - Often more reliable during congestion

4. **Check network status:**
   - https://status.solana.com
   - Solana Discord: #devnet-status channel

5. **Try buffer method:**
   ```bash
   # Write buffer first (may succeed where deploy fails)
   solana program write-buffer target/deploy/aliveping.so --url devnet
   # Then deploy from buffer
   solana program deploy-buffer BUFFER_ADDRESS --program-id target/deploy/aliveping-keypair.json --url devnet
   ```

**Note:** This is a network issue, not a problem with your code or setup. Your contract is ready to deploy.

### Error: "Transaction simulation failed"

**What it means**: Transaction would fail if sent (dry-run failed).

**How to debug:**
1. Check transaction on Explorer (if signature available)
2. Look at "Program Log" for error messages
3. Check account requirements (maybe missing account)
4. Verify program ID is correct

### Error: "Account already in use"

**What it means**: Tried to create account that already exists.

**Why this happens**: User already has an active SafetySession.

**How to fix:**
- Close existing session first
- Or handle in app logic (check if session exists)

### Error: "Anchor IDL mismatch"

**What it means**: IDL in `lib/solana/idl.ts` doesn't match deployed program.

**How to fix:**
1. Rebuild contract:
   ```bash
   cd contracts
   anchor build
   ```
2. Copy new IDL:
   ```bash
   cp target/idl/aliveping.json ../lib/solana/idl.ts
   ```
3. Restart app

### Debugging Tips

**1. Enable verbose logging:**
```bash
# In your app, check console logs
# Solana errors are usually descriptive
```

**2. Use Solana Explorer:**
- Every transaction has a signature
- Paste signature in Explorer to see full details
- Check "Program Log" for `msg!()` output

**3. Check account state:**
```bash
# See all accounts owned by your program
solana program show YOUR_PROGRAM_ID --accounts
```

**4. Test with Solana CLI:**
```bash
# You can call instructions directly from CLI
# (though Anchor makes this harder - use app instead)
```

**5. Common issues checklist:**
- ✅ Program ID matches in `.env` and `lib.rs`
- ✅ IDL is up to date
- ✅ Wallet has enough SOL
- ✅ Network is devnet (not mainnet)
- ✅ Program is actually deployed

---

## Key Concepts Explained

### PDAs (Program Derived Addresses)

**What are they?**
PDAs are addresses that:
- Have no private key (can't sign transactions normally)
- Are deterministically derived from seeds
- Can be "signed" by the program that owns them

**Why we use them:**
- Each user needs one SafetySession account
- PDA = `derive(["safety_session", user_pubkey], program_id)`
- Same user always gets same PDA
- Program can modify it (because program "owns" it)

**How they work:**
```rust
// In Rust (program side):
let (pda, bump) = Pubkey::find_program_address(
    &[b"safety_session", user.key().as_ref()],
    program_id
);

// In TypeScript (client side):
const [pda, bump] = await PublicKey.findProgramAddress(
    [Buffer.from("safety_session"), userPublicKey.toBuffer()],
    programId
);
```

### Accounts & Rent

**What is rent?**
Solana charges "rent" to store data on-chain. This prevents spam.

**How it works:**
- Accounts must maintain minimum balance (rent-exempt)
- If balance drops below minimum, account can be closed
- Rent is paid upfront when creating account

**For our program:**
- Program account: ~1.5 SOL (one-time, large)
- SafetySession accounts: ~0.001 SOL each (small, per user)

**Why this matters:**
- Creating accounts costs SOL
- Users need SOL to create SafetySession
- Can close accounts to get rent back (future feature)

### Transactions & Instructions

**What's the difference?**

- **Transaction**: A bundle of instructions sent together
- **Instruction**: A single operation (like `start_check_in`)

**Example:**
```
Transaction {
  Instruction 1: start_check_in
  Instruction 2: (maybe update something else)
}
```

**Why transactions can have multiple instructions:**
- Atomic: All succeed or all fail
- Efficient: Pay fees once for multiple operations
- Complex operations can be split into steps

### Signers & Authorities

**What is a signer?**
Someone who signs (authorizes) a transaction.

**In our program:**
- `user` is always a signer (they authorize their own actions)
- Program can sign for PDAs (using `invoke_signed`)

**What is an authority?**
Someone who has permission to do something.

**In our program:**
- User is authority over their SafetySession
- Program validates: `has_one = user` ensures only owner can modify

### Error Handling

**How errors work:**
1. Program returns `Err(AlivePingError::NotActive)`
2. Solana converts to error code (6000)
3. Transaction fails
4. Client receives error

**Best practices:**
- Use descriptive error messages
- Check conditions early (fail fast)
- Log errors for debugging (`msg!()`)

### Program Upgradability

**Can we update the program?**
Yes! As upgrade authority, you can:
```bash
anchor upgrade target/deploy/aliveping.so --program-id YOUR_PROGRAM_ID
```

**What gets preserved:**
- Program ID (same address)
- Existing accounts (data stays)
- Can add new instructions

**What breaks:**
- If you change account structure, old accounts become invalid
- Need migration logic for breaking changes

**For production:**
- Transfer upgrade authority to multisig
- Or disable upgrades (make immutable)

---

## Quick Reference

### Essential Commands

```bash
# Check everything
solana --version
anchor --version
solana balance --url devnet
solana config get

# Build & Deploy
cd contracts
solana-keygen new -o target/deploy/aliveping-keypair.json --no-bip39-passphrase --force
solana address -k target/deploy/aliveping-keypair.json  # Copy this Program ID
# Update lib.rs and Anchor.toml with Program ID
cd aliveping && cargo-build-sbf --release && cd ..
cp aliveping/target/sbf-solana-solana/release/aliveping.so target/deploy/aliveping.so
solana program deploy target/deploy/aliveping.so --program-id target/deploy/aliveping-keypair.json --url devnet

# View on Explorer
# https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet

# Check program
solana program show YOUR_PROGRAM_ID --url devnet

# Get more SOL
solana airdrop 2 --url devnet
```

### File Locations

- **Contract code**: `contracts/aliveping/src/lib.rs`
- **Config**: `contracts/Anchor.toml`
- **IDL**: `target/idl/aliveping.json` → `lib/solana/idl.ts`
- **Program binary**: `target/deploy/aliveping.so`
- **Environment**: `.env` (root directory)

### Important Addresses

- **Your wallet**: `solana address`
- **Program ID**: From deploy output or `.env`
- **SafetySession PDA**: Calculated per user

---

## Production Checklist

When ready for mainnet:

- [ ] Test thoroughly on devnet
- [ ] Audit contract code
- [ ] Set up multisig for upgrade authority
- [ ] Get real SOL for deployment
- [ ] Update all environment variables
- [ ] Deploy to mainnet
- [ ] Update program ID everywhere
- [ ] Monitor transactions
- [ ] Set up alerts for errors

**Current Status**: ✅ Devnet only - Safe for testing and demos

---

## Additional Resources

- **Solana Docs**: https://docs.solana.com/
- **Anchor Book**: https://www.anchor-lang.com/
- **Solana Explorer**: https://explorer.solana.com/
- **Solana Cookbook**: https://solanacookbook.com/

---

**Happy Deploying! 🚀**

If you get stuck, check the troubleshooting section or look at transaction details on Solana Explorer - it's your best debugging tool!
