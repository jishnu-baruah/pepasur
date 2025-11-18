# Pepasur Solana Program

This directory contains the Solana smart contract (program) for the Pepasur on-chain Mafia game, built using the Anchor framework.

## 🚀 Features

The program supports the entire game lifecycle on the Solana blockchain:

-   **`initialize`**: Sets up the program's global configuration, including the server's signing key and house fee parameters.
-   **`create_game`**: Allows any player to create a new game with a custom stake amount.
-   **`join_game`**: Allows players to join an existing game lobby by staking SOL. The game account size is dynamically increased as more players join.
-   **`settle_game`**: Executed by the server to end a game, verify winners, and distribute the prize pool. This instruction uses ED25519 signature verification to ensure only the authorized server can settle a game.
-   **`withdraw`**: Allows players to withdraw their winnings from settled games.
-   **`cancel_game`**: Allows the game creator to cancel a game and refund all players their stake.

## 🏗️ Account Structures

The program uses several Program Derived Addresses (PDAs) to manage state:

-   **`Config`**: A singleton account holding global settings like admin keys and fees.
-   **`GameStore`**: A singleton account that tracks the total number of games created to assign unique IDs.
-   **`Game`**: An account created for each game, storing its state, players, stake amount, and total prize pool.
-   **`PendingWithdrawal`**: An account created for each winner of a game, holding their winnings until they are withdrawn.

## 🛠️ How to Build & Deploy

All program development and deployment must be done from a WSL (Windows Subsystem for Linux) environment with the Solana CLI and Anchor framework installed.

### Build

To build the program and generate the IDL (Interface Definition Language):

```bash
# Navigate to the program directory inside WSL
cd /mnt/c/Users/apbar/codeFiles/PepasurSolana/pepasur-solana

# Build the program
anchor build
```

### Deploy

To deploy the program to Solana Devnet:

```bash
# Deploy the program
anchor deploy --provider.cluster devnet
```

After deployment, the program ID will be displayed. This ID must be updated in the backend and frontend `.env` files.

### Program ID

-   **Devnet Program ID**: `FihMZFcyftuU7d7YtnZCfKthcQQpSbfBaTfDkDZGJDfd`

You can view the program on the Solana Explorer:
[https://explorer.solana.com/address/FihMZFcyftuU7d7YtnZCfKthcQQpSbfBaTfDkDZGJDfd?cluster=devnet](https://explorer.solana.com/address/FihMZFcyftuU7d7YtnZCfKthcQQpSbfBaTfDkDZGJDfd?cluster=devnet)
