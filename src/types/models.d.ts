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
}

export interface ComponentModel extends Model{
  name: string 
  description: string
  communicates_with: number[]
  technology: number[]
}

export interface DataEntityModel extends Model{
  name: string 
  description: string
  component: number | null
  technology: number[]
}

export interface ControlModel extends Model {
  name: string
  fr_et: string
  fr_se: string
  fr_koC: string
  fr_WoO: string
  fr_eq: string
  component: number | null
}

export interface ThreatClassModel extends Model{
  name: string
  description: string
}

export interface AttackStepModel extends Model{
  name: string
  fr_et: string
  fr_se: string
  fr_koC: string
  fr_WoO: string
  fr_eq: string
  component: number | null
  control: number[]
  prepared_by: number[]
  threat_class: number | null
}

export interface ThreatScenarioModel extends Model{
  name: string
  attackStep: number | null
  threat_class: number | null
}

export interface DamageScenarioModel extends Model{
  name: string
  affected_CIA_parts: string
  impact_scale: string
  safety_impact: string
  finantial_impact: string
  operational_impact: string
  privacy_impact: string
  component: number | null
  threat_scenario: number | null
}

export interface CompromisesModel extends Model{
  affected_CIA_parts: string
  component: number | null
  threat_scenario: number | null
}