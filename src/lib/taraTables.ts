import { AlertTriangle, GitBranch, ScrollText, Shield, Table2 } from 'lucide-react'

export type TaraTableKey =
  | 'threatScenarios'
  | 'damageScenarios'
  | 'attackSteps'
  | 'controls'
  | 'controlScenarios'
  | 'risks'

export const taraTableItems: Array<{
  key: TaraTableKey
  label: string
  icon: typeof Table2
}> = [
  { key: 'threatScenarios', label: 'THREAT SCENARIOS', icon: AlertTriangle },
  { key: 'damageScenarios', label: 'DAMAGE SCENARIOS', icon: ScrollText },
  { key: 'attackSteps', label: 'ATTACK STEPS', icon: GitBranch },
  { key: 'controls', label: 'CONTROLS', icon: Shield },
  { key: 'controlScenarios', label: 'CONTROL SCENARIOS', icon: Table2 },
  { key: 'risks', label: 'RISKS', icon: AlertTriangle },
]
