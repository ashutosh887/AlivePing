# AlivePing

**Silent. Automatic. Trusted.**

Your last-mile personal safety system.

## Overview

AlivePing automatically alerts trusted contacts if you fail to check in, providing immutable proof on the Solana blockchain.

## Features

- **Safety Check-In**: Automatic check-in sessions with deadline alerts
- **Panic Button**: Instant emergency alerts with location sharing
- **Trusted Contacts**: Manage emergency contacts
- **Blockchain Verification**: Immutable on-chain proof of safety sessions
- **Location Tracking**: Privacy-first location sharing
- **Event History**: View past safety events

## Tech Stack

- React Native (Expo)
- TypeScript
- Solana (Anchor) - **Deployed on Testnet**
- NativeWind
- Datadog (Monitoring)
- Confluent Cloud (Event Streaming)

## Solana Contract

**Status**: ✅ **Deployed on Testnet**

- **Program ID**: `9ykG65VCa5KsbKkc1HdgbZRDr61fYjHYnDGy17LafX1e`
- **Network**: Testnet
- **Build Size**: 191KB (optimized)
- **Explorer**: [View on Solana Explorer](https://explorer.solana.com/address/9ykG65VCa5KsbKkc1HdgbZRDr61fYjHYnDGy17LafX1e?cluster=testnet)

**Contract Instructions:**
- `startCheckIn` - Start a safety check-in session
- `triggerPanic` - Trigger emergency panic alert
- `confirmSafe` - Confirm safety check-in
- `cancelCheckIn` - Cancel active check-in
- `expireCheckIn` - Mark check-in as expired
- `closeSession` - Close a session
- `updateLastPing` - Update last ping timestamp

For detailed contract documentation, see [contracts/README.md](./contracts/README.md)

## Getting Started

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Solana Configuration (Already configured for testnet)
EXPO_PUBLIC_SOLANA_PROGRAM_ID=9ykG65VCa5KsbKkc1HdgbZRDr61fYjHYnDGy17LafX1e

# Datadog Monitoring
EXPO_PUBLIC_DATADOG_API_KEY=your_datadog_key
EXPO_PUBLIC_DATADOG_SITE=datadoghq.com
EXPO_PUBLIC_DATADOG_SERVICE=aliveping-mobile
EXPO_PUBLIC_DATADOG_SOURCE=react-native

# Confluent Cloud (Kafka)
EXPO_PUBLIC_CONFLUENT_API_KEY=your_confluent_key
EXPO_PUBLIC_CONFLUENT_API_SECRET=your_confluent_secret
EXPO_PUBLIC_CONFLUENT_CLUSTER_ID=your_cluster_id
EXPO_PUBLIC_CONFLUENT_REST_ENDPOINT=your_rest_endpoint
EXPO_PUBLIC_CONFLUENT_TOPIC=AlivePing

# Google Gemini AI
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key

# Web3Auth (Optional)
EXPO_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
```

### Run

```bash
npm start
```

## Team

**DevSapiens**

- GitHub: [ashutosh887](https://github.com/ashutosh887)

## License

MIT
