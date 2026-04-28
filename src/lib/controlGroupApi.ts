import { api } from '@/lib/api'
import type { ControlGroupModel } from '@/types/models'

function getProjectId(): number {
  const projectId = sessionStorage.getItem('projectId')
  if (!projectId) throw new Error('No project selected')
  return Number(projectId)
}

export async function fetchControlGroups(projectId: number): Promise<ControlGroupModel[]> {
  const response = await api.get('/control_group/', { params: { project_id: projectId } })
  return Array.isArray(response.data) ? response.data : []
}

export async function createControlGroup(
  name: string,
  description: string,
  controlIds: number[]
): Promise<ControlGroupModel> {
  const projectId = getProjectId()
  const response = await api.post('/control_group/', {
    project_id: projectId,
    name,
    description,
    controls: controlIds,
  })
  return response.data
}

export async function updateControlGroup(
  id: number,
  name: string,
  description: string,
  controlIds: number[]
): Promise<ControlGroupModel> {
  const projectId = getProjectId()
  const response = await api.put(`/control_group/${id}/`, {
    project_id: projectId,
    name,
    description,
    controls: controlIds,
  })
  return response.data
}

export async function deleteControlGroup(id: number): Promise<void> {
  const projectId = getProjectId()
  await api.delete(`/control_group/${id}/`, {
    params: { project_id: projectId },
    data: { project_id: projectId },
  })
}
