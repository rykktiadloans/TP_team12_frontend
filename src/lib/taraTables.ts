import { AlertTriangle, GitBranch, ScrollText, Shield, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type TaraTableKey =
  | 'threatScenarios'
  | 'damageScenarios'
  | 'attackSteps'
  | 'controls'
  | 'risks'
  | 'cybersecurityGoals'

export const taraTableItems: Array<{
  key: TaraTableKey
  label: string
  icon: LucideIcon
}> = [
  { key: 'threatScenarios', label: 'THREAT SCENARIOS', icon: AlertTriangle },
  { key: 'damageScenarios', label: 'DAMAGE SCENARIOS', icon: ScrollText },
  { key: 'attackSteps', label: 'ATTACK STEPS', icon: GitBranch },
  { key: 'controls', label: 'CONTROLS', icon: Shield },
  { key: 'risks', label: 'RISKS', icon: AlertTriangle },
  { key: 'cybersecurityGoals', label: 'CYBERSECURITY GOALS', icon: Target },
]
