import { spraayAbi } from '../core/abi'
import { NATIVE_TOKEN, getSpraayAddress } from '../core/addresses'
import { buildRecipients, sumAmounts } from '../core/recipients'
import { executeDistribution, resolveTxContext } from '../core/tx'
import type {
  DistributeEqualParams,
  DistributeNativeParams,
  DistributeParams,
  DistributeResult,
} from '../core/types'
import { validateAmount, validateRecipients, validateToken } from '../core/validate'
import { readTotalCost } from './estimate'

/** ERC-20 batch with per-recipient amounts → `Spraay.sprayToken` */
export async function batchDistribute(params: DistributeParams): Promise<DistributeResult> {
  const { token } = params
  validateToken(token)
  const recipients = buildRecipients(params.recipients, params.amounts)
  const spraay = getSpraayAddress(params.chain)
  const ctx = await resolveTxContext(params)
  const totalAmount = sumAmounts(params.amounts)
  return executeDistribution(ctx, {
    address: spraay,
    abi: spraayAbi,
    functionName: 'sprayToken',
    args: [token, recipients],
    token,
    recipientCount: recipients.length,
    totalAmount,
    totalCost: await readTotalCost(ctx.reader, spraay, totalAmount),
  })
}

/** Same amount to every recipient → `Spraay.sprayEqual`. `token` may be `NATIVE_TOKEN` for BNB / ETH. */
export async function batchDistributeEqual(params: DistributeEqualParams): Promise<DistributeResult> {
  const { token, recipients, amountEach } = params
  validateToken(token, { allowNative: true })
  validateRecipients(recipients)
  validateAmount(amountEach, 'amountEach')
  const spraay = getSpraayAddress(params.chain)
  const ctx = await resolveTxContext(params)
  const totalAmount = amountEach * BigInt(recipients.length)
  return executeDistribution(ctx, {
    address: spraay,
    abi: spraayAbi,
    functionName: 'sprayEqual',
    args: [token, recipients, amountEach],
    token,
    recipientCount: recipients.length,
    totalAmount,
    totalCost: await readTotalCost(ctx.reader, spraay, totalAmount),
  })
}

/** Native currency (BNB / ETH) batch with per-recipient amounts → `Spraay.sprayETH` */
export async function batchDistributeETH(params: DistributeNativeParams): Promise<DistributeResult> {
  const recipients = buildRecipients(params.recipients, params.amounts)
  const spraay = getSpraayAddress(params.chain)
  const ctx = await resolveTxContext(params)
  const totalAmount = sumAmounts(params.amounts)
  return executeDistribution(ctx, {
    address: spraay,
    abi: spraayAbi,
    functionName: 'sprayETH',
    args: [recipients],
    token: NATIVE_TOKEN,
    recipientCount: recipients.length,
    totalAmount,
    totalCost: await readTotalCost(ctx.reader, spraay, totalAmount),
  })
}
