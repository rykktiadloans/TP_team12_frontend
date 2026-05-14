import { api } from '@/lib/api'

export interface MitreTactic {
  id: string
  name: string
}

export interface MitreTechnique {
  id: string
  name: string
  tactic_short_names: string[]
}

let tacticsPromise: Promise<MitreTactic[]> | null = null
let techniquesPromise: Promise<MitreTechnique[]> | null = null

export function fetchMitreTactics(): Promise<MitreTactic[]> {
  if (!tacticsPromise) {
    tacticsPromise = api.get<MitreTactic[]>('/mitre/tactics/').then(r => r.data)
  }
  return tacticsPromise
}

export function fetchMitreTechniques(): Promise<MitreTechnique[]> {
  if (!techniquesPromise) {
    techniquesPromise = api.get<MitreTechnique[]>('/mitre/techniques/').then(r => r.data)
  }
  return techniquesPromise
}
