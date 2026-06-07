import { api } from '@/lib/api'
import type {
  LangchainChatMessage,
  LangchainGenerationResult,
  LangchainProposal,
} from './types'

function getProjectId() {
  const projectId = sessionStorage.getItem('projectId')
  if (!projectId) {
    throw new Error('No project selected')
  }
  return Number(projectId)
}

export type LangchainsPrepareResponse = LangchainGenerationResult & {
  provider: string
  mode: string
  model: string
  assistantApiConfigured: boolean
  apiUrlConfigured: boolean
}

export async function prepareLangchainProposalsFromApi(
  prompt: string,
  messages: LangchainChatMessage[] = [],
  proposalMemory: LangchainProposal[] = []
) {
  const response = await api.post('/langchains/prepare/', {
    project_id: getProjectId(),
    prompt,
    messages,
    proposal_memory: proposalMemory,
  })

  return response.data as LangchainsPrepareResponse
}
