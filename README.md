# Pepasur - An On-Chain Mafia Game on Solana

Pepasur is a multiplayer Mafia-style social deduction game built on the Solana blockchain. Players take on mythological roles, stake SOL to join games, and compete through strategic gameplay to win rewards from the prize pool.

The entire game logic, from staking to settlement, is handled by an on-chain Solana program written in Rust with the Anchor framework, ensuring transparency and security.

## 🏛️ Architecture

The Pepasur system is composed of three main components:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                   │
│  ┌──────────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │ Solana Wallet    │  │  Game UI        │  │ Socket.io  │  │
│  │ Adapter          │  │  Components     │  │ Client     │  │
│  └──────────────────┘  └─────────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js + Express)              │
│  ┌──────────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │ Solana Service   │  │  Game Logic     │  │ Socket.io  │  │
│  │ (Anchor Client)  │  │  Manager        │  │ Server     │  │
│  └──────────────────┘  └─────────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Solana Blockchain                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Pepasur Program (Rust/Anchor)                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

1.  **Frontend**: A Next.js application that provides the user interface.
2.  **Backend**: A Node.js server that manages game state and real-time communication.
3.  **Solana Program**: An Anchor program that handles all on-chain logic.

## 📂 Repository Structure

This repository is a monorepo containing the three main components of the application:

-   `./pepasur-solana/`: Contains the Anchor program for the on-chain game logic.
    -   [**Program README**](./pepasur-solana/README.md)
-   `./frontend/`: Contains the Next.js frontend application.
    -   [**Frontend README**](./frontend/README.md)
-   `./backend/`: Contains the Node.js backend server.
    -   [**Backend README**](./backend/README.md)

## 🛠️ Tech Stack

-   **Blockchain**: Solana
-   **Smart Contracts**: Rust, Anchor Framework
-   **Backend**: Node.js, Express, Socket.IO
-   **Frontend**: Next.js, React, TypeScript, Solana Wallet Adapter
-   **UI**: shadcn/ui, Tailwind CSS

## 🚀 Quick Start

To get the full application running, you will need to set up and run each component separately. Please refer to the `README.md` file in each subdirectory for detailed instructions:

1.  [**`pepasur-solana/README.md`**](./pepasur-solana/README.md) - For building and deploying the Solana program.
2.  [**`backend/README.md`**](./backend/README.md) - For running the backend server.
3.  [**`frontend/README.md`**](./frontend/README.md) - For running the frontend application.

You must deploy the Solana program first, as its Program ID is required to configure the backend and frontend.
