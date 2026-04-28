import { api } from '@/lib/api'

export type TreatmentDecision = 'avoid' | 'reduce' | 'share' | 'accept' | ''

export const TREATMENT_LABELS: Record<string, string> = {
  avoid: 'Avoid',
  reduce: 'Reduce',
  share: 'Share',
  accept: 'Accept',
}

export async function setRiskTreatment(
  projectId: number,
  threatScenarioId: number,
  damageScenarioId: number,
  decision: TreatmentDecision,
  rationale: string
): Promise<void> {
  await api.put('/risk_treatment/', {
    project_id: projectId,
    threat_scenario: threatScenarioId,
    damage_scenario: damageScenarioId,
    decision,
    rationale,
  })
}
