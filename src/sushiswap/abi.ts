import { parseAbi } from 'viem'

/** `SPRAAY_BATCH_ABI` from sushi-labs/sushiswap#2324: the subset of the Spraay ABI the launchpad uses */
export const SPRAAY_BATCH_ABI = parseAbi([
  'function sprayETH((address recipient, uint256 amount)[] recipients) payable',
  'function sprayToken(address token, (address recipient, uint256 amount)[] recipients)',
  'function sprayEqual(address token, address[] recipients, uint256 amountPerRecipient) payable',
  'function calculateFee(uint256 amount) view returns (uint256)',
  'function calculateTotalCost(uint256 totalAmount) view returns (uint256)',
  'function feeBps() view returns (uint256)',
  'function feeRecipient() view returns (address)',
  'function paused() view returns (bool)',
  'function MAX_FEE_BPS() view returns (uint256)',
  'function MAX_RECIPIENTS() view returns (uint256)',
  'function owner() view returns (address)',
])
