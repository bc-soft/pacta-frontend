import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useCallback } from 'react'
import { env, requireUsdcMint } from '../../../env'
import { api, ApiError } from '../../../lib/api'
import { UserFacingError } from '../../../lib/solana/errors'
import { buildCreateProjectTxs } from '../../../lib/solana/instructions'
import { projectPda } from '../../../lib/solana/pda'
import { useProgram } from '../../../lib/solana/program'
import { useSendAllAndSync, type TxPhase } from '../../../lib/solana/tx'
import { useBackendAuth } from '../../auth/useBackendAuth'
import { toChainParams, toDraftInput } from './chainParams'
import type { ProjectForm } from './schema'

export interface CreatedProject {
  pda: string
  signature: string
}

/** Saves the draft (texts) in the backend, then creates the project + milestones on-chain. */
export function useCreateProject() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const program = useProgram()
  const ensureBackendAuth = useBackendAuth()
  const sendAll = useSendAllAndSync()

  const missingConfig = !env.programId
    ? 'The Pacta program address is not configured (VITE_PACTA_PROGRAM_ID).'
    : !env.usdcMint
      ? 'The USDC token is not configured (VITE_USDC_MINT).'
      : !program
        ? 'The program definition is missing (src/lib/solana/idl/pacta.json).'
        : null

  const create = useCallback(
    async (form: ProjectForm, onPhase: (phase: TxPhase) => void): Promise<CreatedProject> => {
      if (!publicKey) throw new UserFacingError('Connect your wallet first')
      if (!program || missingConfig) throw new UserFacingError(missingConfig ?? 'Not ready yet')

      const params = toChainParams(form, publicKey, requireUsdcMint())
      const pda = projectPda(publicKey, params.seed)

      // Texts (titles, criteria) live in the backend; the chain only has money, wallets and shares
      onPhase('signing')
      await ensureBackendAuth()
      await api
        .createProjectDraft(toDraftInput(form, params))
        .catch((error: unknown) => {
          // 409 = draft already saved on a previous attempt
          if (!(error instanceof ApiError && error.status === 409)) throw error
        })

      const signatures = await sendAll(() => buildCreateProjectTxs(program, connection, params), pda, onPhase)
      if (signatures.length === 0) throw new UserFacingError('This contract is already on-chain.')
      return { pda: pda.toBase58(), signature: signatures[0] }
    },
    [publicKey, program, missingConfig, ensureBackendAuth, connection, sendAll],
  )

  return { create, missingConfig }
}
