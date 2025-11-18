# Pepasur Frontend

This is the frontend for the Pepasur on-chain Mafia game, built with Next.js and TypeScript. It provides the user interface for players to connect their wallets, join games, and interact with the game in real-time.

## ✨ Features

-   **Wallet Integration**: Connects with popular Solana wallets like Phantom and Solflare using the Solana Wallet Adapter.
-   **Real-time UI**: Uses Socket.IO to receive live game state updates from the backend.
-   **Responsive Design**: A retro, pixel-art inspired UI that works on both desktop and mobile.
-   **Component-Based**: Built with React and shadcn/ui for a modular and maintainable codebase.

## 🛠️ Tech Stack

-   **Framework**: Next.js
-   **Language**: TypeScript
-   **UI**: React, shadcn/ui, Tailwind CSS
-   **State Management**: React Hooks & Context API
-   **Blockchain Interaction**: `@solana/web3.js`, `@coral-xyz/anchor`, `@solana/wallet-adapter-react`.
-   **Real-time Communication**: `socket.io-client`

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
copy .env.solana.example .env.local
```

Then, fill in the variables in your new `.env.local` file.

```env
# The Solana network to connect to (e.g., devnet, mainnet-beta)
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# The RPC URL for the chosen Solana network
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# The deployed Pepasur Solana program ID
NEXT_PUBLIC_PEPASUR_PROGRAM_ID=FihMZFcyftuU7d7YtnZCfKthcQQpSbfBaTfDkDZGJDfd
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
