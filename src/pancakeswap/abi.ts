// Generated from the BatchDistributeHook Foundry artifact in plagtech/infinity-hooks
// (branch feat/batch-distribute-hook, src/pool-cl/batch-distribute/BatchDistributeHook.sol).

export const batchDistributeHookAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_poolManager',
        type: 'address',
      },
      {
        name: '_spraay',
        type: 'address',
      },
      {
        name: '_owner',
        type: 'address',
      },
      {
        name: '_operator',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'MAX_RECIPIENTS',
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
    type: 'function',
    name: 'acceptOwnership',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'afterAddLiquidity',
    inputs: [
      {
        name: 'sender',
        type: 'address',
      },
      {
        name: 'key',
        type: 'tuple',
        components: [
          {
            name: 'currency0',
            type: 'address',
          },
          {
            name: 'currency1',
            type: 'address',
          },
          {
            name: 'hooks',
            type: 'address',
          },
          {
            name: 'poolManager',
            type: 'address',
          },
          {
            name: 'fee',
            type: 'uint24',
          },
          {
            name: 'parameters',
            type: 'bytes32',
          },
        ],
      },
      {
        name: 'params',
        type: 'tuple',
        components: [
          {
            name: 'tickLower',
            type: 'int24',
          },
          {
            name: 'tickUpper',
            type: 'int24',
          },
          {
            name: 'liquidityDelta',
            type: 'int256',
          },
          {
            name: 'salt',
            type: 'bytes32',
          },
        ],
      },
      {
        name: 'delta',
        type: 'int256',
      },
      {
        name: 'feesAccrued',
        type: 'int256',
      },
      {
        name: 'hookData',
        type: 'bytes',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes4',
      },
      {
        name: '',
        type: 'int256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'afterDonate',
    inputs: [
      {
        name: 'sender',
        type: 'address',
      },
      {
        name: 'key',
        type: 'tuple',
        components: [
          {
            name: 'currency0',
            type: 'address',
          },
          {
            name: 'currency1',
            type: 'address',
          },
          {
            name: 'hooks',
            type: 'address',
          },
          {
            name: 'poolManager',
            type: 'address',
          },
          {
            name: 'fee',
            type: 'uint24',
          },
          {
            name: 'parameters',
            type: 'bytes32',
          },
        ],
      },
      {
        name: 'amount0',
        type: 'uint256',
      },
      {
        name: 'amount1',
        type: 'uint256',
      },
      {
        name: 'hookData',
        type: 'bytes',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes4',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'afterInitialize',
    inputs: [
      {
        name: 'sender',
        type: 'address',
      },
      {
        name: 'key',
        type: 'tuple',
        components: [
          {
            name: 'currency0',
            type: 'address',
          },
          {
            name: 'currency1',
            type: 'address',
          },
          {
            name: 'hooks',
            type: 'address',
          },
          {
            name: 'poolManager',
            type: 'address',
          },
          {
            name: 'fee',
            type: 'uint24',
          },
          {
            name: 'parameters',
            type: 'bytes32',
          },
        ],
      },
      {
        name: 'sqrtPriceX96',
        type: 'uint160',
      },
      {
        name: 'tick',
        type: 'int24',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes4',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'afterRemoveLiquidity',
    inputs: [
      {
        name: 'sender',
        type: 'address',
      },
      {
        name: 'key',
        type: 'tuple',
        components: [
          {
            name: 'currency0',
            type: 'address',
          },
          {
            name: 'currency1',
            type: 'address',
          },
          {
            name: 'hooks',
            type: 'address',
          },
          {
            name: 'poolManager',
            type: 'address',
          },
          {
            name: 'fee',
            type: 'uint24',
          },
          {
            name: 'parameters',
            type: 'bytes32',
          },
        ],
      },
      {
        name: 'params',
        type: 'tuple',
        components: [
          {
            name: 'tickLower',
            type: 'int24',
          },
          {
            name: 'tickUpper',
            type: 'int24',
          },
          {
            name: 'liquidityDelta',
            type: 'int256',
          },
          {
            name: 'salt',
            type: 'bytes32',
          },
        ],
      },
      {
        name: 'delta',
        type: 'int256',
      },
      {
        name: 'feesAccrued',
        type: 'int256',
      },
      {
        name: 'hookData',
        type: 'bytes',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes4',
      },
      {
        name: '',
        type: 'int256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'afterSwap',
    inputs: [
      {
        name: 'sender',
        type: 'address',
      },
      {
        name: 'key',
        type: 'tuple',
        components: [
          {
            name: 'currency0',
            type: 'address',
          },
          {
            name: 'currency1',
            type: 'address',
          },
          {
            name: 'hooks',
            type: 'address',
          },
          {
            name: 'poolManager',
            type: 'address',
          },
          {
            name: 'fee',
            type: 'uint24',
          },
          {
            name: 'parameters',
            type: 'bytes32',
          },
        ],
      },
      {
        name: 'params',
        type: 'tuple',
        components: [
          {
            name: 'zeroForOne',
            type: 'bool',
          },
          {
            name: 'amountSpecified',
            type: 'int256',
          },
          {
            name: 'sqrtPriceLimitX96',
            type: 'uint160',
          },
        ],
      },
      {
        name: 'delta',
        type: 'int256',
      },
      {
        name: 'hookData',
        type: 'bytes',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes4',
      },
      {
        name: '',
        type: 'int128',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'batchDistribute',
    inputs: [
      {
        name: 'poolId',
        type: 'bytes32',
      },
      {
        name: 'token',
        type: 'address',
      },
      {
        name: 'recipients',
        type: 'address[]',
      },
      {
        name: 'amounts',
        type: 'uint256[]',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'batchDistributeEqual',
    inputs: [
      {
        name: 'poolId',
        type: 'bytes32',
      },
      {
        name: 'token',
        type: 'address',
      },
      {
        name: 'recipients',
        type: 'address[]',
      },
      {
        name: 'amountEach',
        type: 'uint256',
      },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'beforeAddLiquidity',
    inputs: [
      {
        name: 'sender',
        type: 'address',
      },
      {
        name: 'key',
        type: 'tuple',
        components: [
          {
            name: 'currency0',
            type: 'address',
          },
          {
            name: 'currency1',
            type: 'address',
          },
          {
            name: 'hooks',
            type: 'address',
          },
          {
            name: 'poolManager',
            type: 'address',
          },
          {
            name: 'fee',
            type: 'uint24',
          },
          {
            name: 'parameters',
            type: 'bytes32',
          },
        ],
      },
      {
        name: 'params',
        type: 'tuple',
        components: [
          {
            name: 'tickLower',
            type: 'int24',
          },
          {
            name: 'tickUpper',
            type: 'int24',
          },
          {
            name: 'liquidityDelta',
            type: 'int256',
          },
          {
            name: 'salt',
            type: 'bytes32',
          },
        ],
      },
      {
        name: 'hookData',
        type: 'bytes',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes4',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'beforeDonate',
    inputs: [
      {
        name: 'sender',
        type: 'address',
      },
      {
        name: 'key',
        type: 'tuple',
        components: [
          {
            name: 'currency0',
            type: 'address',
          },
          {
            name: 'currency1',
            type: 'address',
          },
          {
            name: 'hooks',
            type: 'address',
          },
          {
            name: 'poolManager',
            type: 'address',
          },
          {
            name: 'fee',
            type: 'uint24',
          },
          {
            name: 'parameters',
            type: 'bytes32',
          },
        ],
      },
      {
        name: 'amount0',
        type: 'uint256',
      },
      {
        name: 'amount1',
        type: 'uint256',
      },
      {
        name: 'hookData',
        type: 'bytes',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes4',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'beforeInitialize',
    inputs: [
      {
        name: 'sender',
        type: 'address',
      },
      {
        name: 'key',
        type: 'tuple',
        components: [
          {
            name: 'currency0',
            type: 'address',
          },
          {
            name: 'currency1',
            type: 'address',
          },
          {
            name: 'hooks',
            type: 'address',
          },
          {
            name: 'poolManager',
            type: 'address',
          },
          {
            name: 'fee',
            type: 'uint24',
          },
          {
            name: 'parameters',
            type: 'bytes32',
          },
        ],
      },
      {
        name: 'sqrtPriceX96',
        type: 'uint160',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes4',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'beforeRemoveLiquidity',
    inputs: [
      {
        name: 'sender',
        type: 'address',
      },
      {
        name: 'key',
        type: 'tuple',
        components: [
          {
            name: 'currency0',
            type: 'address',
          },
          {
            name: 'currency1',
            type: 'address',
          },
          {
            name: 'hooks',
            type: 'address',
          },
          {
            name: 'poolManager',
            type: 'address',
          },
          {
            name: 'fee',
            type: 'uint24',
          },
          {
            name: 'parameters',
            type: 'bytes32',
          },
        ],
      },
      {
        name: 'params',
        type: 'tuple',
        components: [
          {
            name: 'tickLower',
            type: 'int24',
          },
          {
            name: 'tickUpper',
            type: 'int24',
          },
          {
            name: 'liquidityDelta',
            type: 'int256',
          },
          {
            name: 'salt',
            type: 'bytes32',
          },
        ],
      },
      {
        name: 'hookData',
        type: 'bytes',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes4',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'beforeSwap',
    inputs: [
      {
        name: 'sender',
        type: 'address',
      },
      {
        name: 'key',
        type: 'tuple',
        components: [
          {
            name: 'currency0',
            type: 'address',
          },
          {
            name: 'currency1',
            type: 'address',
          },
          {
            name: 'hooks',
            type: 'address',
          },
          {
            name: 'poolManager',
            type: 'address',
          },
          {
            name: 'fee',
            type: 'uint24',
          },
          {
            name: 'parameters',
            type: 'bytes32',
          },
        ],
      },
      {
        name: 'params',
        type: 'tuple',
        components: [
          {
            name: 'zeroForOne',
            type: 'bool',
          },
          {
            name: 'amountSpecified',
            type: 'int256',
          },
          {
            name: 'sqrtPriceLimitX96',
            type: 'uint160',
          },
        ],
      },
      {
        name: 'hookData',
        type: 'bytes',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes4',
      },
      {
        name: '',
        type: 'int256',
      },
      {
        name: '',
        type: 'uint24',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getHooksRegistrationBitmap',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint16',
      },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'isOperator',
    inputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isRegisteredPool',
    inputs: [
      {
        name: '',
        type: 'bytes32',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'lockAcquired',
    inputs: [
      {
        name: 'data',
        type: 'bytes',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bytes',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'owner',
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
    type: 'function',
    name: 'pendingOwner',
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
    type: 'function',
    name: 'poolManager',
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
    type: 'function',
    name: 'quoteTotalCost',
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
    type: 'function',
    name: 'renounceOwnership',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'rescueTokens',
    inputs: [
      {
        name: 'token',
        type: 'address',
      },
      {
        name: 'to',
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
    type: 'function',
    name: 'setOperator',
    inputs: [
      {
        name: 'operator',
        type: 'address',
      },
      {
        name: 'allowed',
        type: 'bool',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setSpraayContract',
    inputs: [
      {
        name: 'newSpraay',
        type: 'address',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'spraay',
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
    type: 'function',
    name: 'transferOwnership',
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
    type: 'function',
    name: 'vault',
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
    type: 'event',
    name: 'BatchDistributed',
    inputs: [
      {
        name: 'poolId',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'operator',
        type: 'address',
        indexed: true,
      },
      {
        name: 'token',
        type: 'address',
        indexed: true,
      },
      {
        name: 'recipientCount',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'totalAmount',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'feeAmount',
        type: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'OperatorUpdated',
    inputs: [
      {
        name: 'operator',
        type: 'address',
        indexed: true,
      },
      {
        name: 'allowed',
        type: 'bool',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'OwnershipTransferStarted',
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
    type: 'event',
    name: 'OwnershipTransferred',
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
    type: 'event',
    name: 'PoolDonation',
    inputs: [
      {
        name: 'poolId',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'sender',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount0',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'amount1',
        type: 'uint256',
        indexed: false,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'PoolRegistered',
    inputs: [
      {
        name: 'poolId',
        type: 'bytes32',
        indexed: true,
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'SpraayContractUpdated',
    inputs: [
      {
        name: 'oldSpraay',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newSpraay',
        type: 'address',
        indexed: true,
      },
    ],
    anonymous: false,
  },
  {
    type: 'error',
    name: 'HookNotImplemented',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InsufficientNativeAmount',
    inputs: [
      {
        name: 'required',
        type: 'uint256',
      },
      {
        name: 'provided',
        type: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'InvalidPool',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LengthMismatch',
    inputs: [],
  },
  {
    type: 'error',
    name: 'LockFailure',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NativeTransferFailed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NoRecipients',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NotOperator',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NotPoolManager',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NotSelf',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NotVault',
    inputs: [],
  },
  {
    type: 'error',
    name: 'OwnableInvalidOwner',
    inputs: [
      {
        name: 'owner',
        type: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'OwnableUnauthorizedAccount',
    inputs: [
      {
        name: 'account',
        type: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'PoolNotRegistered',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ReentrancyGuardReentrantCall',
    inputs: [],
  },
  {
    type: 'error',
    name: 'SafeERC20FailedOperation',
    inputs: [
      {
        name: 'token',
        type: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'TooManyRecipients',
    inputs: [
      {
        name: 'count',
        type: 'uint256',
      },
      {
        name: 'max',
        type: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'UnexpectedNativeAmount',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ZeroAddress',
    inputs: [],
  },
] as const
