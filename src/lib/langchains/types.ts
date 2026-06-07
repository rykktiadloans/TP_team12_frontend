export type LangchainProposalType =
  | 'technology'
  | 'component'
  | 'damageScenario'
  | 'attackStep'
  | 'threatScenario'
  | 'control'

export type LangchainProposalStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'failed'
  | 'saving'

export type LangchainProposalReference = {
  field: string
  tempId: string
  mode: 'one' | 'many'
  label?: string
}

export type LangchainProposal = {
  tempId: string
  type: LangchainProposalType
  title: string
  description?: string
  rationale?: string
  payload: Record<string, unknown>
  references?: LangchainProposalReference[]
  createdId?: number
  status: LangchainProposalStatus
  error?: string
}

export type LangchainGenerationResult = {
  prompt: string
  message?: string
  analysis?: LangchainAnalysis | null
  proposals: LangchainProposal[]
}

export type LangchainChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type LangchainAnalysis = {
  title: string
  summary: string
  counts: Record<string, number>
  gaps: Array<{
    severity: string
    title: string
    description: string
  }>
  recommendations: string[]
}

export const langchainTypeLabels: Record<LangchainProposalType, string> = {
  technology: 'Technology',
  component: 'Component',
  damageScenario: 'Damage Scenario',
  attackStep: 'Attack Step',
  threatScenario: 'Threat Scenario',
  control: 'Control',
}

export function proposalDisplayName(proposal: LangchainProposal) {
  return proposal.title || String(proposal.payload.name ?? proposal.tempId)
}
