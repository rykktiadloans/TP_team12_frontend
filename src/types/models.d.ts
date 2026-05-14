export type ModelType =
  | 'technology'
  | 'component'
  | 'dataEntity'
  | 'control'
  | 'threatClass'
  | 'attackStep'
  | 'threatScenario'
  | 'damageScenario'
  | 'compromise'
  | 'cybersecurityGoal'

export interface Model {
  id: number
}

export interface DamageScenarioConcernModel extends Model {
  component: number
  affected_CIA_parts: number
}

export interface TechnologyModel extends Model{
  name: string
  description: string
  project: number | null
}

export interface ComponentModel extends Model{
  name: string 
  description: string
  communicates_with: number[]
  technology: number[]
  project: number | null
}

export interface DataEntityModel extends Model{
  name: string 
  description: string
  component: number | null
  technology: number[]
  project: number | null
}

export interface ControlClassModel extends Model {
  name: string
  description: string
  fr_et: number
  fr_se: number
  fr_koC: number
  fr_WoO: number
  fr_eq: number
}

export interface ControlModel extends Model {
  name: string
  description: string
  fr_et: number
  fr_se: number
  fr_koC: number
  fr_WoO: number
  fr_eq: number
  control_class: number | null
  component: number | null
  attack_steps: number[]
  threat_scenarios: number[]
  attack_potential_points?: number | null
  attack_potential?: string | null
  afl?: string | null
  afl_value?: number | null
  project: number | null
}

export interface ThreatClassModel extends Model{
  name: string
  description: string
  mitre_tactic_id: string
  mitre_tactic_name: string
  project: number | null
}

export interface AttackStepModel extends Model{
  name: string
  description: string
  required_access: string
  fr_et: number
  fr_se: number
  fr_koC: number
  fr_WoO: number
  fr_eq: number
  component: number | null
  controls: number[]
  previous_steps: number[]
  threat_scenarios: number[]
  threat_class: number | null
  mitre_technique_id: string
  mitre_technique_name: string
  attack_potential_points?: number | null
  attack_potential?: string | null
  afl?: string | null
  afl_value?: number | null
  project: number | null
}

export interface ThreatScenarioModel extends Model{
  name: string
  description: string
  components: number[]
  attack_steps: number[]
  damage_scenarios: number[]
  compromises: number[]
  threat_class: number | null
  project: number | null
}

export interface DamageScenarioModel extends Model{
  name: string
  description: string
  affected_CIA_parts: number
  safety_impact: number
  finantial_impact: number
  operational_impact: number
  privacy_impact: number
  threat_scenarios: number[]
  concerns: DamageScenarioConcernModel[]
  il?: number
  il_label?: string
  project: number | null
}

export interface CompromisesModel extends Model{
  compromised_CIA_part: number
  component: number | null
  threat_scenario: number | null
  project: number | null
}

export interface CybersecurityGoalModel extends Model {
  name: string
  description: string
  cal: number | null
  damage_scenarios: number[]
  controls: number[]
  project: number
}

export interface ControlGroupModel extends Model {
  name: string
  description: string
  controls: Array<{ id: number; name: string }>
  project: number
  created_at: string
}

export interface GeneratedRiskModel {
  id: string
  title: string
  threat_scenario: number
  threat_scenario_name: string
  damage_scenario: number
  damage_scenario_name: string
  concern: number | null
  component: number | null
  component_name: string | null
  affected_CIA_parts: number
  attack_potential_points: number | null
  attack_potential: string | null
  afl: string | null
  afl_value: number | null
  safety_impact: number
  finantial_impact: number
  operational_impact: number
  privacy_impact: number
  il: number
  il_label: string
  rl: number | null
  treatment_decision: string | null
  treatment_rationale: string
}
