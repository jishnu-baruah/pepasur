/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/pepasur.json`.
 */
export type Pepasur = {
  "address": "si51vWabnM6VdoHv6LS48wYGqgTejoqcMqy18DyUuTY",
  "metadata": {
    "name": "pepasur",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Pepasur - On-chain Mafia game on Solana"
  },
  "docs": [
    "Pepasur - On-chain Mafia game on Solana",
    "",
    "This program implements a multiplayer social deduction game where players:",
    "- Stake SOL tokens to join games",
    "- Receive cryptographically-assigned roles (ASUR/Mafia, DEVA/Doctor, RISHI/Detective, MANAV/Villager)",
    "- Compete through night actions, voting, and task phases",
    "- Winners receive rewards distributed automatically through smart contracts"
  ],
  "instructions": [
    {
      "name": "cancelGame",
      "docs": [
        "Cancel a game",
        "Only the creator can cancel a game in lobby or in-progress state"
      ],
      "discriminator": [
        121,
        194,
        154,
        118,
        103,
        235,
        149,
        52
      ],
      "accounts": [
        {
          "name": "creator",
          "docs": [
            "Game creator (only creator can cancel)"
          ],
          "writable": true,
          "signer": true,
          "relations": [
            "game"
          ]
        },
        {
          "name": "game",
          "docs": [
            "Game PDA account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "gameId"
              }
            ]
          }
        },
        {
          "name": "vault",
          "docs": [
            "Vault account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "gameId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createGame",
      "docs": [
        "Create a new game",
        "Players can create games with custom stake amounts and minimum player requirements"
      ],
      "discriminator": [
        124,
        69,
        75,
        66,
        184,
        220,
        72,
        206
      ],
      "accounts": [
        {
          "name": "creator",
          "docs": [
            "Game creator"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "gameStore",
          "docs": [
            "GameStore PDA to get next game ID"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  116,
                  111,
                  114,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "game",
          "docs": [
            "New Game PDA account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "game_store.next_game_id",
                "account": "gameStore"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "stakeAmount",
          "type": "u64"
        },
        {
          "name": "minPlayers",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initialize",
      "docs": [
        "Initialize the Pepasur program",
        "Creates Config and GameStore PDAs"
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "admin",
          "docs": [
            "Admin account that will control the program"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "docs": [
            "Config PDA account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "gameStore",
          "docs": [
            "GameStore PDA account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  116,
                  111,
                  114,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "serverSigner",
          "type": "pubkey"
        },
        {
          "name": "feeRecipient",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "joinGame",
      "docs": [
        "Join an existing game",
        "Players stake SOL to join, game starts when minimum players reached"
      ],
      "discriminator": [
        107,
        112,
        18,
        38,
        56,
        173,
        60,
        128
      ],
      "accounts": [
        {
          "name": "player",
          "docs": [
            "Player joining the game"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "game",
          "docs": [
            "Game PDA account (will be reallocated)"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "gameId"
              }
            ]
          }
        },
        {
          "name": "vault",
          "docs": [
            "Vault account to hold staked SOL"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "gameId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "settleGame",
      "docs": [
        "Settle a completed game",
        "Server submits signed settlement with winners and payouts"
      ],
      "discriminator": [
        96,
        54,
        24,
        189,
        239,
        198,
        86,
        29
      ],
      "accounts": [
        {
          "name": "submitter",
          "docs": [
            "Server/submitter account"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "game",
          "docs": [
            "Game PDA account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "gameId"
              }
            ]
          }
        },
        {
          "name": "config",
          "docs": [
            "Config PDA"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "feeRecipient",
          "docs": [
            "Fee recipient account"
          ],
          "writable": true
        },
        {
          "name": "vault",
          "docs": [
            "Vault account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "gameId",
          "type": "u64"
        },
        {
          "name": "winners",
          "type": {
            "vec": "pubkey"
          }
        },
        {
          "name": "payouts",
          "type": {
            "vec": "u64"
          }
        },
        {
          "name": "signature",
          "type": {
            "array": [
              "u8",
              64
            ]
          }
        }
      ]
    },
    {
      "name": "withdraw",
      "docs": [
        "Withdraw pending winnings",
        "Players can withdraw their accumulated winnings"
      ],
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "player",
          "docs": [
            "Player withdrawing funds"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "pendingWithdrawal",
          "docs": [
            "PendingWithdrawal PDA account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  101,
                  110,
                  100,
                  105,
                  110,
                  103,
                  95,
                  119,
                  105,
                  116,
                  104,
                  100,
                  114,
                  97,
                  119,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "vault",
          "docs": [
            "Vault account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "game",
      "discriminator": [
        27,
        90,
        166,
        125,
        74,
        100,
        121,
        18
      ]
    },
    {
      "name": "gameStore",
      "discriminator": [
        167,
        97,
        19,
        164,
        146,
        88,
        238,
        197
      ]
    },
    {
      "name": "pendingWithdrawal",
      "discriminator": [
        61,
        103,
        179,
        177,
        148,
        199,
        63,
        171
      ]
    }
  ],
  "events": [
    {
      "name": "gameCancelled",
      "discriminator": [
        113,
        20,
        200,
        104,
        76,
        35,
        9,
        241
      ]
    },
    {
      "name": "gameCreated",
      "discriminator": [
        218,
        25,
        150,
        94,
        177,
        112,
        96,
        2
      ]
    },
    {
      "name": "gameSettled",
      "discriminator": [
        63,
        109,
        128,
        85,
        229,
        63,
        167,
        176
      ]
    },
    {
      "name": "gameStarted",
      "discriminator": [
        222,
        247,
        78,
        255,
        61,
        184,
        156,
        41
      ]
    },
    {
      "name": "playerJoined",
      "discriminator": [
        39,
        144,
        49,
        106,
        108,
        210,
        183,
        38
      ]
    },
    {
      "name": "withdrawn",
      "discriminator": [
        20,
        89,
        223,
        198,
        194,
        124,
        219,
        13
      ]
    }
  ],
  "errors": [
    {
      "code": 12000,
      "name": "gameNotFound",
      "msg": "Game not found"
    },
    {
      "code": 12001,
      "name": "gameNotInLobby",
      "msg": "Game not in lobby state"
    },
    {
      "code": 12002,
      "name": "invalidStake",
      "msg": "Invalid stake amount (must be > 0)"
    },
    {
      "code": 12003,
      "name": "alreadySettled",
      "msg": "Game already settled"
    },
    {
      "code": 12004,
      "name": "notAuthorized",
      "msg": "Not authorized to perform this action"
    },
    {
      "code": 12005,
      "name": "invalidSignature",
      "msg": "Invalid settlement signature"
    },
    {
      "code": 12006,
      "name": "gameNotInProgress",
      "msg": "Game not in progress"
    },
    {
      "code": 12007,
      "name": "noPendingWithdrawal",
      "msg": "No pending withdrawal for this player"
    },
    {
      "code": 12008,
      "name": "gameAlreadyStarted",
      "msg": "Game already started"
    },
    {
      "code": 12009,
      "name": "minPlayersNotMet",
      "msg": "Minimum players requirement not met"
    },
    {
      "code": 12010,
      "name": "gameFull",
      "msg": "Maximum players reached"
    },
    {
      "code": 12011,
      "name": "mathOverflow",
      "msg": "Math overflow in calculation"
    }
  ],
  "types": [
    {
      "name": "config",
      "docs": [
        "Config account (PDA)",
        "Stores global configuration for the Pepasur program"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "docs": [
              "Program admin public key"
            ],
            "type": "pubkey"
          },
          {
            "name": "serverSigner",
            "docs": [
              "Server signer public key for settlement verification"
            ],
            "type": "pubkey"
          },
          {
            "name": "feeRecipient",
            "docs": [
              "Fee recipient public key"
            ],
            "type": "pubkey"
          },
          {
            "name": "houseCutBps",
            "docs": [
              "House cut in basis points (200 = 2%)"
            ],
            "type": "u16"
          },
          {
            "name": "initialized",
            "docs": [
              "Whether the program has been initialized"
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "game",
      "docs": [
        "Game account (PDA)",
        "Stores all information about a single game"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "docs": [
              "Unique game ID"
            ],
            "type": "u64"
          },
          {
            "name": "creator",
            "docs": [
              "Game creator public key"
            ],
            "type": "pubkey"
          },
          {
            "name": "stakeAmount",
            "docs": [
              "Stake amount in lamports"
            ],
            "type": "u64"
          },
          {
            "name": "minPlayers",
            "docs": [
              "Minimum players required to start"
            ],
            "type": "u8"
          },
          {
            "name": "players",
            "docs": [
              "List of player public keys"
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "deposits",
            "docs": [
              "List of deposit amounts (parallel to players)"
            ],
            "type": {
              "vec": "u64"
            }
          },
          {
            "name": "status",
            "docs": [
              "Current game status"
            ],
            "type": {
              "defined": {
                "name": "gameStatus"
              }
            }
          },
          {
            "name": "totalPool",
            "docs": [
              "Total pool in lamports"
            ],
            "type": "u64"
          },
          {
            "name": "createdAt",
            "docs": [
              "Game creation timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "gameCancelled",
      "docs": [
        "Event emitted when a game is cancelled"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameId",
            "type": "u64"
          },
          {
            "name": "refundedPlayers",
            "type": {
              "vec": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "gameCreated",
      "docs": [
        "Event emitted when a new game is created"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameId",
            "type": "u64"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "stake",
            "type": "u64"
          },
          {
            "name": "minPlayers",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "gameSettled",
      "docs": [
        "Event emitted when a game is settled",
        "Uses emit_cpi!() for more reliable storage (requires event-cpi feature)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameId",
            "type": "u64"
          },
          {
            "name": "winners",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "payouts",
            "type": {
              "vec": "u64"
            }
          },
          {
            "name": "houseFee",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "gameStarted",
      "docs": [
        "Event emitted when a game starts (min players reached)"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameId",
            "type": "u64"
          },
          {
            "name": "playerCount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "gameStatus",
      "docs": [
        "Game status enum"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "lobby"
          },
          {
            "name": "inProgress"
          },
          {
            "name": "settled"
          },
          {
            "name": "cancelled"
          }
        ]
      }
    },
    {
      "name": "gameStore",
      "docs": [
        "GameStore account (PDA)",
        "Stores the next game ID counter"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nextGameId",
            "docs": [
              "Next game ID to be assigned"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "pendingWithdrawal",
      "docs": [
        "PendingWithdrawal account (PDA per player)",
        "Stores pending withdrawal amount for a player"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "docs": [
              "Player public key"
            ],
            "type": "pubkey"
          },
          {
            "name": "amount",
            "docs": [
              "Amount pending withdrawal in lamports"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump seed"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "playerJoined",
      "docs": [
        "Event emitted when a player joins a game"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameId",
            "type": "u64"
          },
          {
            "name": "player",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "withdrawn",
      "docs": [
        "Event emitted when a player withdraws winnings"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
