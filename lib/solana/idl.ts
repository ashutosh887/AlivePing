export const IDL = {
  "version": "0.1.0",
  "name": "aliveping",
  "instructions": [
    {
      "name": "startCheckIn",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "session",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "deadline",
          "type": "i64"
        },
        {
          "name": "contextHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "triggerPanic",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "session",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "contextHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "closeSession",
      "accounts": [
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "session",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "confirmSafe",
      "accounts": [
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "session",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "cancelCheckIn",
      "accounts": [
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "session",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "expireCheckIn",
      "accounts": [
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "session",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "updateLastPing",
      "accounts": [
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "session",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "safetySession",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "lastPing",
            "type": "i64"
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "eventType",
            "type": "u8"
          },
          {
            "name": "contextHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "NotActive",
      "msg": "Session is not active"
    },
    {
      "code": 6001,
      "name": "DeadlineNotReached",
      "msg": "Deadline has not been reached"
    },
    {
      "code": 6002,
      "name": "Unauthorized",
      "msg": "Unauthorized"
    },
    {
      "code": 6003,
      "name": "InvalidDeadline",
      "msg": "Invalid deadline"
    },
    {
      "code": 6004,
      "name": "DeadlineTooFar",
      "msg": "Deadline too far in the future (max 24 hours)"
    },
    {
      "code": 6005,
      "name": "SessionExists",
      "msg": "Session already exists"
    },
    {
      "code": 6006,
      "name": "InvalidState",
      "msg": "Invalid session state"
    }
  ]
}
