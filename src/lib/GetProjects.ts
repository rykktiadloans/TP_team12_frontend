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
