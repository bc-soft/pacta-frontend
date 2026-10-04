/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/pacta.json`.
 */
export type Pacta = {
  "address": "AgSfAvkXWBugaYg768AAZdpUT3oNYkx7JQGmZTrUwHWK",
  "metadata": {
    "name": "pacta",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Pacta: on-chain escrow with automatic milestone payout splits"
  },
  "docs": [
    "Pacta: escrow for ad-hoc freelance teams.",
    "Lifecycle: CREATE -> AGREE -> FUND -> WORK -> ACCEPT -> SPLIT.",
    "There is no admin instruction: funds leave the vault only through",
    "`accept_milestone`, `resolve_dispute` and `cancel_unstarted_milestone`."
  ],
  "instructions": [
    {
      "name": "acceptContract",
      "discriminator": [
        217,
        254,
        164,
        16,
        244,
        59,
        30,
        81
      ],
      "accounts": [
        {
          "name": "member",
          "signer": true
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project.client",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "project.seed",
                "account": "project"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "acceptMilestone",
      "discriminator": [
        67,
        203,
        235,
        220,
        254,
        79,
        251,
        205
      ],
      "accounts": [
        {
          "name": "client",
          "signer": true,
          "relations": [
            "project"
          ]
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project.client",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "project.seed",
                "account": "project"
              }
            ]
          },
          "relations": [
            "milestone"
          ]
        },
        {
          "name": "milestone",
          "writable": true
        },
        {
          "name": "mint",
          "relations": [
            "project"
          ]
        },
        {
          "name": "vault",
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
              },
              {
                "kind": "account",
                "path": "project"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u8"
        }
      ]
    },
    {
      "name": "cancelUnstartedMilestone",
      "discriminator": [
        172,
        188,
        86,
        238,
        160,
        221,
        72,
        100
      ],
      "accounts": [
        {
          "name": "client",
          "signer": true,
          "relations": [
            "project"
          ]
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project.client",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "project.seed",
                "account": "project"
              }
            ]
          },
          "relations": [
            "milestone"
          ]
        },
        {
          "name": "milestone",
          "writable": true
        },
        {
          "name": "mint",
          "relations": [
            "project"
          ]
        },
        {
          "name": "vault",
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
              },
              {
                "kind": "account",
                "path": "project"
              }
            ]
          }
        },
        {
          "name": "clientAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "client"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createMilestone",
      "discriminator": [
        239,
        58,
        201,
        28,
        40,
        186,
        173,
        48
      ],
      "accounts": [
        {
          "name": "client",
          "writable": true,
          "signer": true,
          "relations": [
            "project"
          ]
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project.client",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "project.seed",
                "account": "project"
              }
            ]
          }
        },
        {
          "name": "milestone",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "allocations",
          "type": {
            "vec": {
              "defined": {
                "name": "allocation"
              }
            }
          }
        }
      ]
    },
    {
      "name": "createProject",
      "discriminator": [
        148,
        219,
        181,
        42,
        221,
        114,
        145,
        190
      ],
      "accounts": [
        {
          "name": "client",
          "writable": true,
          "signer": true
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "client"
              },
              {
                "kind": "arg",
                "path": "seed"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "vault",
          "docs": [
            "Escrow for the whole project. Its only authority is the project PDA,",
            "so no wallet (including the client and the program author) can move funds directly."
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
              },
              {
                "kind": "account",
                "path": "project"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "seed",
          "type": "u64"
        },
        {
          "name": "mint",
          "type": "pubkey"
        },
        {
          "name": "arbiter",
          "type": {
            "option": "pubkey"
          }
        },
        {
          "name": "members",
          "type": {
            "vec": {
              "defined": {
                "name": "memberInput"
              }
            }
          }
        }
      ]
    },
    {
      "name": "fundMilestone",
      "discriminator": [
        104,
        130,
        72,
        76,
        84,
        58,
        37,
        181
      ],
      "accounts": [
        {
          "name": "client",
          "signer": true,
          "relations": [
            "project"
          ]
        },
        {
          "name": "project",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project.client",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "project.seed",
                "account": "project"
              }
            ]
          },
          "relations": [
            "milestone"
          ]
        },
        {
          "name": "milestone",
          "writable": true
        },
        {
          "name": "mint",
          "relations": [
            "project"
          ]
        },
        {
          "name": "clientAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "client"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "vault",
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
              },
              {
                "kind": "account",
                "path": "project"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u8"
        }
      ]
    },
    {
      "name": "openDispute",
      "discriminator": [
        137,
        25,
        99,
        119,
        23,
        223,
        161,
        42
      ],
      "accounts": [
        {
          "name": "signer",
          "signer": true
        },
        {
          "name": "project",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project.client",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "project.seed",
                "account": "project"
              }
            ]
          },
          "relations": [
            "milestone"
          ]
        },
        {
          "name": "milestone",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u8"
        }
      ]
    },
    {
      "name": "requestChanges",
      "discriminator": [
        136,
        84,
        241,
        1,
        189,
        89,
        226,
        187
      ],
      "accounts": [
        {
          "name": "signer",
          "signer": true
        },
        {
          "name": "project",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project.client",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "project.seed",
                "account": "project"
              }
            ]
          },
          "relations": [
            "milestone"
          ]
        },
        {
          "name": "milestone",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u8"
        }
      ]
    },
    {
      "name": "resolveDispute",
      "discriminator": [
        231,
        6,
        202,
        6,
        96,
        103,
        12,
        230
      ],
      "accounts": [
        {
          "name": "arbiter",
          "signer": true
        },
        {
          "name": "project",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project.client",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "project.seed",
                "account": "project"
              }
            ]
          },
          "relations": [
            "milestone"
          ]
        },
        {
          "name": "milestone",
          "writable": true
        },
        {
          "name": "mint",
          "relations": [
            "project"
          ]
        },
        {
          "name": "vault",
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
              },
              {
                "kind": "account",
                "path": "project"
              }
            ]
          }
        },
        {
          "name": "client"
        },
        {
          "name": "clientAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "client"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u8"
        },
        {
          "name": "resolution",
          "type": {
            "defined": {
              "name": "resolution"
            }
          }
        }
      ]
    },
    {
      "name": "startMilestone",
      "discriminator": [
        63,
        104,
        131,
        234,
        168,
        124,
        236,
        168
      ],
      "accounts": [
        {
          "name": "signer",
          "signer": true
        },
        {
          "name": "project",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project.client",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "project.seed",
                "account": "project"
              }
            ]
          },
          "relations": [
            "milestone"
          ]
        },
        {
          "name": "milestone",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u8"
        }
      ]
    },
    {
      "name": "submitMilestone",
      "discriminator": [
        35,
        96,
        220,
        215,
        102,
        83,
        139,
        52
      ],
      "accounts": [
        {
          "name": "signer",
          "signer": true
        },
        {
          "name": "project",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  106,
                  101,
                  99,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "project.client",
                "account": "project"
              },
              {
                "kind": "account",
                "path": "project.seed",
                "account": "project"
              }
            ]
          },
          "relations": [
            "milestone"
          ]
        },
        {
          "name": "milestone",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "index",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "milestone",
      "discriminator": [
        38,
        210,
        239,
        177,
        85,
        184,
        10,
        44
      ]
    },
    {
      "name": "project",
      "discriminator": [
        205,
        168,
        189,
        202,
        181,
        247,
        142,
        19
      ]
    }
  ],
  "events": [
    {
      "name": "changesRequested",
      "discriminator": [
        134,
        181,
        141,
        117,
        63,
        228,
        52,
        168
      ]
    },
    {
      "name": "contractAccepted",
      "discriminator": [
        44,
        209,
        126,
        23,
        190,
        99,
        31,
        196
      ]
    },
    {
      "name": "disputeOpened",
      "discriminator": [
        239,
        222,
        102,
        235,
        193,
        85,
        1,
        214
      ]
    },
    {
      "name": "disputeResolved",
      "discriminator": [
        121,
        64,
        249,
        153,
        139,
        128,
        236,
        187
      ]
    },
    {
      "name": "milestoneAccepted",
      "discriminator": [
        101,
        69,
        82,
        199,
        19,
        111,
        187,
        148
      ]
    },
    {
      "name": "milestoneCancelled",
      "discriminator": [
        141,
        250,
        228,
        100,
        119,
        156,
        95,
        240
      ]
    },
    {
      "name": "milestoneCreated",
      "discriminator": [
        151,
        154,
        159,
        254,
        50,
        174,
        22,
        209
      ]
    },
    {
      "name": "milestoneFunded",
      "discriminator": [
        133,
        223,
        85,
        235,
        56,
        36,
        238,
        240
      ]
    },
    {
      "name": "milestoneStarted",
      "discriminator": [
        155,
        163,
        210,
        193,
        99,
        102,
        242,
        26
      ]
    },
    {
      "name": "milestoneSubmitted",
      "discriminator": [
        242,
        19,
        75,
        99,
        12,
        28,
        19,
        33
      ]
    },
    {
      "name": "paymentDistributed",
      "discriminator": [
        37,
        229,
        184,
        133,
        74,
        128,
        225,
        84
      ]
    },
    {
      "name": "projectCreated",
      "discriminator": [
        192,
        10,
        163,
        29,
        185,
        31,
        67,
        168
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Signer is not allowed to perform this operation"
    },
    {
      "code": 6001,
      "name": "invalidStatus",
      "msg": "Account is not in a status that allows this operation"
    },
    {
      "code": 6002,
      "name": "arbiterRequired",
      "msg": "An arbiter is required"
    },
    {
      "code": 6003,
      "name": "arbiterIsParty",
      "msg": "Arbiter cannot be the client or a team member"
    },
    {
      "code": 6004,
      "name": "invalidMemberCount",
      "msg": "Team must have between 1 and 8 members"
    },
    {
      "code": 6005,
      "name": "duplicateMember",
      "msg": "Duplicate member wallet"
    },
    {
      "code": 6006,
      "name": "clientIsMember",
      "msg": "Client cannot be a team member"
    },
    {
      "code": 6007,
      "name": "invalidRole",
      "msg": "Unknown member role"
    },
    {
      "code": 6008,
      "name": "invalidMilestoneIndex",
      "msg": "Milestone index must equal the current milestone count"
    },
    {
      "code": 6009,
      "name": "tooManyMilestones",
      "msg": "Too many milestones"
    },
    {
      "code": 6010,
      "name": "invalidAmount",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6011,
      "name": "invalidAllocationCount",
      "msg": "Milestone must have between 1 and 8 allocations"
    },
    {
      "code": 6012,
      "name": "invalidBpsSum",
      "msg": "Allocations must sum to 10 000 bps"
    },
    {
      "code": 6013,
      "name": "zeroBps",
      "msg": "Allocation bps must be greater than zero"
    },
    {
      "code": 6014,
      "name": "allocationNotMember",
      "msg": "Allocation wallet is not a team member"
    },
    {
      "code": 6015,
      "name": "duplicateAllocation",
      "msg": "Duplicate allocation wallet"
    },
    {
      "code": 6016,
      "name": "contractAlreadySigned",
      "msg": "A member has already signed the contract; milestones are frozen"
    },
    {
      "code": 6017,
      "name": "alreadyAccepted",
      "msg": "Member has already accepted the contract"
    },
    {
      "code": 6018,
      "name": "noMilestones",
      "msg": "Project has no milestones"
    },
    {
      "code": 6019,
      "name": "mintMismatch",
      "msg": "Token mint does not match the project mint"
    },
    {
      "code": 6020,
      "name": "invalidRecipientAccounts",
      "msg": "Recipient token accounts must match allocations in count and order"
    },
    {
      "code": 6021,
      "name": "recipientMismatch",
      "msg": "Recipient token account is not owned by the allocation wallet"
    },
    {
      "code": 6022,
      "name": "mathOverflow",
      "msg": "Arithmetic overflow"
    }
  ],
  "types": [
    {
      "name": "allocation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "bps",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "changesRequested",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "milestone",
            "type": "pubkey"
          },
          {
            "name": "index",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "contractAccepted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "allAccepted",
            "docs": [
              "True when this signature activated the project."
            ],
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "dispute",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "openedBy",
            "type": "pubkey"
          },
          {
            "name": "resolution",
            "docs": [
              "None = dispute still open."
            ],
            "type": {
              "option": {
                "defined": {
                  "name": "resolution"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "disputeOpened",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "milestone",
            "type": "pubkey"
          },
          {
            "name": "index",
            "type": "u8"
          },
          {
            "name": "openedBy",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "disputeResolved",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "milestone",
            "type": "pubkey"
          },
          {
            "name": "index",
            "type": "u8"
          },
          {
            "name": "resolution",
            "type": {
              "defined": {
                "name": "resolution"
              }
            }
          },
          {
            "name": "teamAmount",
            "type": "u64"
          },
          {
            "name": "clientAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "member",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "role",
            "docs": [
              "0 backend, 1 frontend, 2 design, 3 qa, 4 other. Label only."
            ],
            "type": "u8"
          },
          {
            "name": "accepted",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "memberInput",
      "docs": [
        "Input for `create_project`: a member before signing the contract."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "role",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "milestone",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "index",
            "type": "u8"
          },
          {
            "name": "amount",
            "docs": [
              "In the smallest token units (USDC: 6 decimals)."
            ],
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "milestoneStatus"
              }
            }
          },
          {
            "name": "allocations",
            "docs": [
              "Sum of bps == 10 000, every wallet is a project member, immutable after creation."
            ],
            "type": {
              "vec": {
                "defined": {
                  "name": "allocation"
                }
              }
            }
          },
          {
            "name": "dispute",
            "type": {
              "option": {
                "defined": {
                  "name": "dispute"
                }
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "milestoneAccepted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "milestone",
            "type": "pubkey"
          },
          {
            "name": "index",
            "type": "u8"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "milestoneCancelled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "milestone",
            "type": "pubkey"
          },
          {
            "name": "index",
            "type": "u8"
          },
          {
            "name": "refunded",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "milestoneCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "milestone",
            "type": "pubkey"
          },
          {
            "name": "index",
            "type": "u8"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "milestoneFunded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "milestone",
            "type": "pubkey"
          },
          {
            "name": "index",
            "type": "u8"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "milestoneStarted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "milestone",
            "type": "pubkey"
          },
          {
            "name": "index",
            "type": "u8"
          },
          {
            "name": "member",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "milestoneStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "draft"
          },
          {
            "name": "funded"
          },
          {
            "name": "inProgress"
          },
          {
            "name": "submitted"
          },
          {
            "name": "changesRequested"
          },
          {
            "name": "disputed"
          },
          {
            "name": "paid"
          },
          {
            "name": "cancelled"
          }
        ]
      }
    },
    {
      "name": "milestoneSubmitted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "milestone",
            "type": "pubkey"
          },
          {
            "name": "index",
            "type": "u8"
          },
          {
            "name": "member",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "paymentDistributed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "milestone",
            "type": "pubkey"
          },
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "project",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "client",
            "type": "pubkey"
          },
          {
            "name": "seed",
            "type": "u64"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "arbiter",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "projectStatus"
              }
            }
          },
          {
            "name": "members",
            "type": {
              "vec": {
                "defined": {
                  "name": "member"
                }
              }
            }
          },
          {
            "name": "milestoneCount",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "closedMilestoneCount",
            "docs": [
              "Milestones in a terminal state (Paid or Cancelled). Project becomes Completed",
              "when every milestone is closed."
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "projectCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "project",
            "type": "pubkey"
          },
          {
            "name": "client",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "arbiter",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "memberCount",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "projectStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "draft"
          },
          {
            "name": "active"
          },
          {
            "name": "completed"
          },
          {
            "name": "cancelled"
          }
        ]
      }
    },
    {
      "name": "resolution",
      "docs": [
        "Closed list of arbiter decisions: how much of the milestone goes to the team.",
        "The rest is refunded to the client."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "team100"
          },
          {
            "name": "team75"
          },
          {
            "name": "team50"
          },
          {
            "name": "team25"
          },
          {
            "name": "client100"
          }
        ]
      }
    }
  ]
};
