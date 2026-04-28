import { api } from '@/lib/api'

export type Project = {
  id: number
  name: string
  description?: string
  created_at?: string
}

export async function getProjects(): Promise<Project[]> {
  const response = await api.get('/projects/')
  return Array.isArray(response.data) ? response.data : []
}

export async function createProject(data: {
  name: string
  description?: string
}): Promise<Project> {
  const response = await api.post('/projects/', {
    name: data.name,
    description: data.description ?? '',
  })

  return response.data as Project
}
