// Generated from the verified SprayContract ABI (Sourcify exact match) at
// BNB 0x3093a2951FB77b3beDfB8BA20De645F7413432C1 and Base 0x1646452F98E36A3c9Cfc3eDD8868221E207B5eEC.
// Both deployments share this ABI.

export const spraayAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_feeRecipient',
        type: 'address',
      },
      {
        name: '_feeBps',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    name: 'EnforcedPause',
    type: 'error',
    inputs: [],
  },
  {
    name: 'ExpectedPause',
    type: 'error',
    inputs: [],
  },
  {
    name: 'OwnableInvalidOwner',
    type: 'error',
    inputs: [
      {
        name: 'owner',
        type: 'address',
      },
    ],
  },
  {
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
    inputs: [
      {
        name: 'account',
        type: 'address',
      },
    ],
  },
  {
    name: 'ReentrancyGuardReentrantCall',
    type: 'error',
    inputs: [],
  },
  {
    name: 'SafeERC20FailedOperation',
    type: 'error',
    inputs: [
      {
        name: 'token',
        type: 'address',
      },
    ],
  },
  {
    name: 'EmergencyWithdraw',
    type: 'event',
    inputs: [
      {
        name: 'token',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    name: 'FeeRecipientUpdated',
    type: 'event',
    inputs: [
      {
        name: 'oldRecipient',
        type: 'address',
        indexed: false,
      },
      {
        name: 'newRecipient',
        type: 'address',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    name: 'FeeUpdated',
    type: 'event',
    inputs: [
      {
        name: 'oldFeeBps',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newFeeBps',
        type: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    name: 'OwnershipTransferred',
    type: 'event',
    inputs: [
      {
        name: 'previousOwner',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        type: 'address',
        indexed: true,
      },
    ],
    anonymous: false,
  },
  {
    name: 'Paused',
    type: 'event',
    inputs: [
      {
        name: 'account',
        type: 'address',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    name: 'SprayETHExecuted',
    type: 'event',
    inputs: [
      {
        name: 'sender',
        type: 'address',
        indexed: true,
      },
      {
        name: 'totalAmount',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'recipientCount',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'feeAmount',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'timestamp',
        type: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    name: 'SprayTokenExecuted',
    type: 'event',
    inputs: [
      {
        name: 'sender',
        type: 'address',
        indexed: true,
      },
      {
        name: 'token',
        type: 'address',
        indexed: true,
      },
      {
        name: 'totalAmount',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'recipientCount',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'feeAmount',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'timestamp',
        type: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    name: 'Unpaused',
    type: 'event',
    inputs: [
      {
        name: 'account',
        type: 'address',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    name: 'MAX_FEE_BPS',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'MAX_RECIPIENTS',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'calculateFee',
    type: 'function',
    inputs: [
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'calculateTotalCost',
    type: 'function',
    inputs: [
      {
        name: 'totalAmount',
        type: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'emergencyWithdraw',
    type: 'function',
    inputs: [
      {
        name: 'token',
        type: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'feeBps',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'feeRecipient',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'owner',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'pause',
    type: 'function',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'paused',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'renounceOwnership',
    type: 'function',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'sprayETH',
    type: 'function',
    inputs: [
      {
        name: 'recipients',
        type: 'tuple[]',
        components: [
          {
            name: 'recipient',
            type: 'address',
          },
          {
            name: 'amount',
            type: 'uint256',
          },
        ],
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    name: 'sprayEqual',
    type: 'function',
    inputs: [
      {
        name: 'token',
        type: 'address',
      },
      {
        name: 'recipients',
        type: 'address[]',
      },
      {
        name: 'amountPerRecipient',
        type: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    name: 'sprayToken',
    type: 'function',
    inputs: [
      {
        name: 'token',
        type: 'address',
      },
      {
        name: 'recipients',
        type: 'tuple[]',
        components: [
          {
            name: 'recipient',
            type: 'address',
          },
          {
            name: 'amount',
            type: 'uint256',
          },
        ],
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'transferOwnership',
    type: 'function',
    inputs: [
      {
        name: 'newOwner',
        type: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'unpause',
    type: 'function',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'updateFee',
    type: 'function',
    inputs: [
      {
        name: 'newFeeBps',
        type: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'updateFeeRecipient',
    type: 'function',
    inputs: [
      {
        name: 'newFeeRecipient',
        type: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'receive',
    stateMutability: 'payable',
  },
] as const
