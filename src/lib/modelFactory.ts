import type {
  AttackStepModel,
  ComponentModel,
  CompromisesModel,
  ControlModel,
  DamageScenarioModel,
  DataEntityModel,
  Model,
  ModelType,
  TechnologyModel,
  ThreatClassModel,
  ThreatScenarioModel,
} from '@/types/models'

export function createDefaultModel(type: ModelType): Model {
  switch (type) {
    case 'technology':
      return { id: -1, name: '', description: '', project: null } as TechnologyModel
    case 'component':
      return {
        id: -1,
        name: '',
        description: '',
        communicates_with: [],
        technology: [],
        project: null,
      } as ComponentModel
    case 'dataEntity':
      return {
        id: -1,
        name: '',
        description: '',
        component: null,
        technology: [],
        project: null,
      } as DataEntityModel
    case 'control':
      return {
        id: -1,
        name: '',
        description: '',
        fr_et: 0,
        fr_se: 0,
        fr_koC: 0,
        fr_WoO: 0,
        fr_eq: 0,
        component: null,
        attack_steps: [],
        project: null,
      } as ControlModel
    case 'threatClass':
      return { id: -1, name: '', description: '', project: null } as ThreatClassModel
    case 'attackStep':
      return {
        id: -1,
        name: '',
        description: '',
        required_access: '',
        fr_et: 0,
        fr_se: 0,
        fr_koC: 0,
        fr_WoO: 0,
        fr_eq: 0,
        component: null,
        controls: [],
        previous_steps: [],
        threat_scenarios: [],
        threat_class: null,
        project: null,
      } as AttackStepModel
    case 'threatScenario':
      return {
        id: -1,
        name: '',
        description: '',
        components: [],
        attack_steps: [],
        damage_scenarios: [],
        compromises: [],
        threat_class: null,
        project: null,
      } as ThreatScenarioModel
    case 'damageScenario':
      return {
        id: -1,
        name: '',
        description: '',
        affected_CIA_parts: 0,
        impact_scale: 0,
        safety_impact: 0,
        finantial_impact: 0,
        operational_impact: 0,
        privacy_impact: 0,
        threat_scenarios: [],
        concerns: [],
        project: null,
      } as DamageScenarioModel
    case 'compromise':
      return {
        id: -1,
        compromised_CIA_part: 0,
        component: null,
        threat_scenario: null,
        project: null,
      } as CompromisesModel
    default:
      return { id: -1 }
  }
}

export function hasRequiredName(model: Model) {
  if (!('name' in model)) {
    return true
  }

  return String(model.name ?? '').trim().length > 0
}
