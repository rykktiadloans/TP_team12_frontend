import { api } from '@/lib/api'
import type { GeneratedRiskModel } from '@/types/models'

export async function getProjectRisks(projectId: string | number) {
  const response = await api.get('/risk/', {
    params: { project_id: projectId },
  })

  return Array.isArray(response.data) ? (response.data as GeneratedRiskModel[]) : []
}
