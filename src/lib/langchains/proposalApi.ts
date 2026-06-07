import { api } from '@/lib/api'
import type {
  LangchainProposal,
  LangchainProposalReference,
  LangchainProposalType,
} from './types'

const endpointByType: Record<LangchainProposalType, string> = {
  technology: '/technology/',
  component: '/component/',
  damageScenario: '/damage_scenario/',
  attackStep: '/attack_step/',
  threatScenario: '/threat_scenario/',
  control: '/control/',
}

function getProjectId() {
  const projectId = sessionStorage.getItem('projectId')
  if (!projectId) {
    throw new Error('No project selected')
  }
  return Number(projectId)
}

function clonePayload(payload: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(payload)) as Record<string, unknown>
}

function appendUnique(values: unknown[], nextValue: number) {
  return values.includes(nextValue) ? values : [...values, nextValue]
}

function resolveReference(
  payload: Record<string, unknown>,
  reference: LangchainProposalReference,
  proposals: LangchainProposal[]
) {
  const target = proposals.find((proposal) => proposal.tempId === reference.tempId)

  if (target?.status !== 'accepted' || target.createdId == null) {
    return
  }

  if (reference.mode === 'many') {
    const currentValue = payload[reference.field]
    const currentValues = Array.isArray(currentValue) ? currentValue : []
    payload[reference.field] = appendUnique(currentValues, target.createdId)
    return
  }

  payload[reference.field] = target.createdId
}

export function buildProposalPayload(
  proposal: LangchainProposal,
  proposals: LangchainProposal[]
) {
  const payload = clonePayload(proposal.payload)
  payload.project_id = getProjectId()

  proposal.references?.forEach((reference) => {
    resolveReference(payload, reference, proposals)
  })

  return payload
}

export async function createLangchainProposal(
  proposal: LangchainProposal,
  proposals: LangchainProposal[]
) {
  const response = await api.post(
    endpointByType[proposal.type],
    buildProposalPayload(proposal, proposals)
  )

  return response.data as { id?: number }
}

export async function patchLangchainProposal(
  proposal: LangchainProposal,
  proposals: LangchainProposal[]
) {
  if (proposal.createdId == null) {
    return
  }

  await api.patch(
    `${endpointByType[proposal.type]}${proposal.createdId}/`,
    buildProposalPayload(proposal, proposals)
  )
}

export async function reconcileAcceptedProposals(
  proposals: LangchainProposal[]
) {
  const patchable = proposals.filter(
    (proposal) =>
      proposal.status === 'accepted' &&
      proposal.createdId != null &&
      (proposal.references?.length ?? 0) > 0
  )

  await Promise.allSettled(
    patchable.map((proposal) => patchLangchainProposal(proposal, proposals))
  )
}
