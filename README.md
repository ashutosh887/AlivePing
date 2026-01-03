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
- Solana (Anchor)
- NativeWind
- Datadog (Monitoring)
- Confluent Cloud (Event Streaming)

## Getting Started

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file with required environment variables:

```env
EXPO_PUBLIC_SOLANA_PROGRAM_ID=your_program_id
EXPO_PUBLIC_DATADOG_API_KEY=your_datadog_key
EXPO_PUBLIC_CONFLUENT_API_KEY=your_confluent_key
EXPO_PUBLIC_CONFLUENT_API_SECRET=your_confluent_secret
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
