export type ModelType = 
  | 'node'
  | 'technology'
  | 'component'
  | 'dataEntity'
  | 'control'
  | 'threatClass'
  | 'attackStep'
  | 'threatScenario'
  | 'damageScenario'
  | 'compromise'

export interface Model {
  id: number
}

export interface NodeModel extends Model{
  title: string
  content: string
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

export interface ControlModel extends Model {
  name: string
  fr_et: number
  fr_se: number
  fr_koC: number
  fr_WoO: number
  fr_eq: number
  component: number | null
  project: number | null
}

export interface ThreatClassModel extends Model{
  name: string
  description: string
  project: number | null
}

export interface AttackStepModel extends Model{
  name: string
  fr_et: number
  fr_se: number
  fr_koC: number
  fr_WoO: number
  fr_eq: number
  component: number | null
  controls: number[]
  prepared_by: number[]
  threat_scenarios: number[]
  threat_class: number | null
  project: number | null
}

export interface ThreatScenarioModel extends Model{
  name: string
  attack_steps: number[]
  damage_scenarios: number[]
  compromises: number[]
  threat_class: number | null
  project: number | null
}

export interface DamageScenarioModel extends Model{
  name: string
  affected_CIA_parts: number
  impact_scale: number
  safety_impact: number
  finantial_impact: number
  operational_impact: number
  privacy_impact: number
  component: number | null
  threat_scenarios: number[]
  project: number | null
}

export interface CompromisesModel extends Model{
  compromised_CIA_part: number
  component: number | null
  threat_scenario: number | null
  project: number | null
}
