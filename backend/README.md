# Pepasur Backend

This is the real-time backend for the Pepasur on-chain Mafia game. It manages game logic, facilitates real-time communication between players via WebSockets, and interacts with the Solana blockchain for all on-chain activities like creating games, staking, and settling prize pools.

## ✨ Features

-   **Real-time Gameplay**: Uses Socket.IO for live game state updates and chat functionality.
-   **Solana Integration**: Connects to the Solana network to call instructions on the Pepasur smart contract.
-   **Game Logic Management**: Manages the flow of the game, from lobby to final settlement.
-   **Secure Settlements**: The server is the sole authority for settling games, which it does by signing settlement transactions with its private key.

## 🛠️ Tech Stack

-   **Framework**: Node.js, Express
-   **Real-time Communication**: Socket.IO
-   **Blockchain Interaction**: `@solana/web3.js`, `@coral-xyz/anchor`
-   **Database**: In-memory game state management (can be extended for persistence).

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
copy .env.solana.example .env
```

Then, fill in the variables in your new `.env` file.

```env
# The Solana network to connect to (e.g., devnet, mainnet-beta)
SOLANA_NETWORK=devnet

# The RPC URL for the chosen Solana network
SOLANA_RPC_URL=https://api.devnet.solana.com

# The deployed Pepasur Solana program ID
PEPASUR_PROGRAM_ID=FihMZFcyftuU7d7YtnZCfKthcQQpSbfBaTfDkDZGJDfd

# The server's private key (as a JSON array of 64 bytes) used to sign settlement transactions
SOLANA_SERVER_PRIVATE_KEY=[...]
```

### 3. Start the Server

```bash
npm run dev
```

The server will start, typically on port 3001.

## Project Structure

```
backend/
├── config/
│   └── database.js       # Database configuration
├── idl/
│   └── pepasur.json      # Anchor IDL for the Solana program
├── models/               # Data models
├── routes/               # API routes
├── scripts/              # Scripts for contract interaction (e.g., initialization)
├── services/             # Business logic
│   ├── solana/           # Solana-specific services
│   │   ├── SolanaClientManager.js
│   │   ├── SolanaGameQueries.js
│   │   ├── SolanaGameTransactions.js
│   │   └── SolanaService.js
│   ├── core/             # Core services like SocketManager
│   └── game/             # Game logic management
├── .env                  # Environment variables
├── package.json          # Project dependencies
└── server.js             # Main server entry point
```
