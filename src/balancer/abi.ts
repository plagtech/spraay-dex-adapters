/**
 * ABI for Spraay's Balancer v3 BatchDistributeHook.
 *
 * Source: contracts/balancer/BatchDistributeHook.sol
 * Solidity ^0.8.24, inheriting BaseHooks + VaultGuard + Ownable2Step + ReentrancyGuard
 *
 * The hook mirrors PancakeSwap's BatchDistributeHook but targets Balancer v3:
 * - Pools are identified by contract address (not PoolId bytes32)
 * - Registration happens in `onRegister` (not `afterInitialize`)
 * - Constructor takes `IVault` (not `ICLPoolManager`)
 */
export const batchDistributeHookAbi = [
  // ============ Constructor ============
  {
    type: 'constructor',
    inputs: [
      { name: '_vault', type: 'address', internalType: 'contract IVault' },
      { name: '_spraay', type: 'address', internalType: 'address' },
      { name: '_owner', type: 'address', internalType: 'address' },
      { name: '_operator', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'nonpayable',
  },

  // ============ Distribution ============
  {
    type: 'function',
    name: 'batchDistribute',
    inputs: [
      { name: 'pool', type: 'address', internalType: 'address' },
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'recipients', type: 'address[]', internalType: 'address[]' },
      { name: 'amounts', type: 'uint256[]', internalType: 'uint256[]' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'batchDistributeEqual',
    inputs: [
      { name: 'pool', type: 'address', internalType: 'address' },
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'recipients', type: 'address[]', internalType: 'address[]' },
      { name: 'amountEach', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'quoteTotalCost',
    inputs: [{ name: 'totalAmount', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },

  // ============ Views ============
  {
    type: 'function',
    name: 'MAX_RECIPIENTS',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'spraay',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract ISpraay' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'vault',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isOperator',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isRegisteredPool',
    inputs: [{ name: 'pool', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },

  // ============ Ownable2Step ============
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'pendingOwner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [{ name: 'newOwner', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
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
    name: 'renounceOwnership',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ============ Admin ============
  {
    type: 'function',
    name: 'setOperator',
    inputs: [
      { name: 'operator', type: 'address', internalType: 'address' },
      { name: 'allowed', type: 'bool', internalType: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setSpraayContract',
    inputs: [{ name: 'newSpraay', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'rescueTokens',
    inputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ============ Hook callbacks (IHooks / BaseHooks) ============
  {
    type: 'function',
    name: 'getHookFlags',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct HookFlags',
        components: [
          { name: 'enableHookAdjustedAmounts', type: 'bool', internalType: 'bool' },
          { name: 'shouldCallBeforeInitialize', type: 'bool', internalType: 'bool' },
          { name: 'shouldCallAfterInitialize', type: 'bool', internalType: 'bool' },
          { name: 'shouldCallComputeDynamicSwapFee', type: 'bool', internalType: 'bool' },
          { name: 'shouldCallBeforeSwap', type: 'bool', internalType: 'bool' },
          { name: 'shouldCallAfterSwap', type: 'bool', internalType: 'bool' },
          { name: 'shouldCallBeforeAddLiquidity', type: 'bool', internalType: 'bool' },
          { name: 'shouldCallAfterAddLiquidity', type: 'bool', internalType: 'bool' },
          { name: 'shouldCallBeforeRemoveLiquidity', type: 'bool', internalType: 'bool' },
          { name: 'shouldCallAfterRemoveLiquidity', type: 'bool', internalType: 'bool' },
        ],
      },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'onRegister',
    inputs: [
      { name: '', type: 'address', internalType: 'address' },
      { name: 'pool', type: 'address', internalType: 'address' },
      {
        name: '',
        type: 'tuple[]',
        internalType: 'struct TokenConfig[]',
        components: [
          { name: 'token', type: 'address', internalType: 'contract IERC20' },
          { name: 'tokenType', type: 'uint8', internalType: 'enum TokenType' },
          { name: 'rateProvider', type: 'address', internalType: 'contract IRateProvider' },
          { name: 'paysYieldFees', type: 'bool', internalType: 'bool' },
        ],
      },
      {
        name: '',
        type: 'tuple',
        internalType: 'struct LiquidityManagement',
        components: [
          { name: 'disableUnbalancedLiquidity', type: 'bool', internalType: 'bool' },
          { name: 'enableAddLiquidityCustom', type: 'bool', internalType: 'bool' },
          { name: 'enableRemoveLiquidityCustom', type: 'bool', internalType: 'bool' },
          { name: 'enableDonation', type: 'bool', internalType: 'bool' },
        ],
      },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable',
  },

  // ============ Events ============
  {
    type: 'event',
    name: 'SpraayContractUpdated',
    inputs: [
      { name: 'oldSpraay', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newSpraay', type: 'address', indexed: true, internalType: 'address' },
    ],
  },
  {
    type: 'event',
    name: 'OperatorUpdated',
    inputs: [
      { name: 'operator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'allowed', type: 'bool', indexed: false, internalType: 'bool' },
    ],
  },
  {
    type: 'event',
    name: 'PoolRegistered',
    inputs: [{ name: 'pool', type: 'address', indexed: true, internalType: 'address' }],
  },
  {
    type: 'event',
    name: 'BatchDistributed',
    inputs: [
      { name: 'pool', type: 'address', indexed: true, internalType: 'address' },
      { name: 'operator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'recipientCount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'totalAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'feeAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      { name: 'previousOwner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newOwner', type: 'address', indexed: true, internalType: 'address' },
    ],
  },
  {
    type: 'event',
    name: 'OwnershipTransferStarted',
    inputs: [
      { name: 'previousOwner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newOwner', type: 'address', indexed: true, internalType: 'address' },
    ],
  },

  // ============ Errors ============
  { type: 'error', name: 'NotOperator', inputs: [] },
  { type: 'error', name: 'ZeroAddress', inputs: [] },
  { type: 'error', name: 'PoolNotRegistered', inputs: [] },
  { type: 'error', name: 'NoRecipients', inputs: [] },
  {
    type: 'error',
    name: 'TooManyRecipients',
    inputs: [
      { name: 'count', type: 'uint256', internalType: 'uint256' },
      { name: 'max', type: 'uint256', internalType: 'uint256' },
    ],
  },
  { type: 'error', name: 'LengthMismatch', inputs: [] },
  {
    type: 'error',
    name: 'InsufficientNativeAmount',
    inputs: [
      { name: 'required', type: 'uint256', internalType: 'uint256' },
      { name: 'provided', type: 'uint256', internalType: 'uint256' },
    ],
  },
  { type: 'error', name: 'UnexpectedNativeAmount', inputs: [] },
  { type: 'error', name: 'NativeTransferFailed', inputs: [] },
  {
    type: 'error',
    name: 'OwnableUnauthorizedAccount',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
  },
  {
    type: 'error',
    name: 'OwnableInvalidOwner',
    inputs: [{ name: 'owner', type: 'address', internalType: 'address' }],
  },
  { type: 'error', name: 'ReentrancyGuardReentrantCall', inputs: [] },
  {
    type: 'error',
    name: 'SenderIsNotVault',
    inputs: [{ name: 'sender', type: 'address', internalType: 'address' }],
  },

  // ============ Receive ============
  { type: 'receive', stateMutability: 'payable' },
] as const
