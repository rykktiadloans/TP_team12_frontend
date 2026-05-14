import { api } from '@/lib/api'
import type {
  AttackStepModel,
  ComponentModel,
  ControlModel,
  CybersecurityGoalModel,
  DamageScenarioModel,
  Model,
  ModelType,
  TechnologyModel,
  ThreatClassModel,
  ThreatScenarioModel,
} from '@/types/models'

const endpointByType: Partial<Record<ModelType, string>> = {
  technology: '/technology/',
  component: '/component/',
  control: '/control/',
  attackStep: '/attack_step/',
  threatScenario: '/threat_scenario/',
  damageScenario: '/damage_scenario/',
  cybersecurityGoal: '/cybersecurity_goal/',
  threatClass: '/threat_class/',
}

export function supportsApiCreateType(type: ModelType) {
  return type in endpointByType
}

export function supportsApiUpdateType(type: ModelType) {
  return type in endpointByType
}

export function supportsApiDeleteType(type: ModelType) {
  return type in endpointByType
}

function getProjectId() {
  const projectId = sessionStorage.getItem('projectId')
  if (!projectId) {
    throw new Error('No project selected')
  }
  return Number(projectId)
}

function getEndpoint(type: ModelType) {
  const endpoint = endpointByType[type]
  if (!endpoint) {
    throw new Error(`No API endpoint configured for model type "${type}"`)
  }
  return endpoint
}

function toApiPayload(type: ModelType, model: Model) {
  const projectId = getProjectId()

  switch (type) {
    case 'technology': {
      const technology = model as TechnologyModel
      return {
        name: technology.name,
        description: technology.description,
        project_id: projectId,
      }
    }
    case 'component': {
      const component = model as ComponentModel
      return {
        name: component.name,
        description: component.description,
        communicates_with: component.communicates_with ?? [],
        technology: component.technology ?? [],
        project_id: projectId,
      }
    }
    case 'control': {
      const control = model as ControlModel
      return {
        name: control.name,
        description: control.description,
        control_class: control.control_class ?? null,
        fr_et: control.fr_et,
        fr_se: control.fr_se,
        fr_koC: control.fr_koC,
        fr_WoO: control.fr_WoO,
        fr_eq: control.fr_eq,
        component: control.component,
        attack_steps: control.attack_steps ?? [],
        threat_scenarios: control.threat_scenarios ?? [],
        project_id: projectId,
      }
    }
    case 'attackStep': {
      const attackStep = model as AttackStepModel
      return {
        name: attackStep.name,
        description: attackStep.description,
        required_access: attackStep.required_access,
        fr_et: attackStep.fr_et,
        fr_se: attackStep.fr_se,
        fr_koC: attackStep.fr_koC,
        fr_WoO: attackStep.fr_WoO,
        fr_eq: attackStep.fr_eq,
        component: attackStep.component,
        previous_steps: attackStep.previous_steps ?? [],
        threat_class: attackStep.threat_class,
        threat_scenarios: attackStep.threat_scenarios ?? [],
        controls: attackStep.controls ?? [],
        mitre_technique_id: attackStep.mitre_technique_id ?? '',
        mitre_technique_name: attackStep.mitre_technique_name ?? '',
        project_id: projectId,
      }
    }
    case 'threatClass': {
      const threatClass = model as ThreatClassModel
      return {
        name: threatClass.name,
        description: threatClass.description,
        mitre_tactic_id: threatClass.mitre_tactic_id ?? '',
        mitre_tactic_name: threatClass.mitre_tactic_name ?? '',
        project_id: projectId,
      }
    }
    case 'threatScenario': {
      const threatScenario = model as ThreatScenarioModel
      return {
        name: threatScenario.name,
        description: threatScenario.description,
        components: threatScenario.components ?? [],
        attack_steps: threatScenario.attack_steps ?? [],
        damage_scenarios: threatScenario.damage_scenarios ?? [],
        threat_class: threatScenario.threat_class,
        project_id: projectId,
      }
    }
    case 'damageScenario': {
      const damageScenario = model as DamageScenarioModel
      return {
        name: damageScenario.name,
        description: damageScenario.description,
        affected_CIA_parts: damageScenario.affected_CIA_parts,
        safety_impact: damageScenario.safety_impact,
        finantial_impact: damageScenario.finantial_impact,
        operational_impact: damageScenario.operational_impact,
        privacy_impact: damageScenario.privacy_impact,
        threat_scenarios: damageScenario.threat_scenarios ?? [],
        concerns: damageScenario.concerns ?? [],
        project_id: projectId,
      }
    }
    case 'cybersecurityGoal': {
      const goal = model as CybersecurityGoalModel
      return {
        name: goal.name,
        description: goal.description,
        cal: goal.cal,
        damage_scenarios: goal.damage_scenarios ?? [],
        controls: goal.controls ?? [],
        project_id: projectId,
      }
    }
    default:
      throw new Error(`Unsupported model type "${type}"`)
  }
}

export function normalizeApiModel(type: ModelType, data: any): Model {
  switch (type) {
    case 'technology':
      return {
        id: data.id,
        name: data.name ?? '',
        description: data.description ?? '',
        project: data.project ?? null,
      } as TechnologyModel
    case 'component':
      return {
        id: data.id,
        name: data.name ?? '',
        description: data.description ?? '',
        communicates_with: data.communicates_with ?? [],
        technology: data.technology ?? [],
        project: data.project ?? null,
      } as ComponentModel
    case 'control':
      return {
        id: data.id,
        name: data.name ?? '',
        description: data.description ?? '',
        fr_et: data.fr_et ?? 0,
        fr_se: data.fr_se ?? 0,
        fr_koC: data.fr_koC ?? 0,
        fr_WoO: data.fr_WoO ?? 0,
        fr_eq: data.fr_eq ?? 0,
        control_class: data.control_class ?? null,
        component: data.component ?? null,
        attack_steps: data.attack_steps ?? [],
        threat_scenarios: data.threat_scenarios ?? [],
        attack_potential_points: data.attack_potential_points ?? null,
        attack_potential: data.attack_potential ?? null,
        afl: data.afl ?? null,
        afl_value: data.afl_value ?? null,
        project: data.project ?? null,
      } as ControlModel
    case 'attackStep':
      return {
        id: data.id,
        name: data.name ?? '',
        description: data.description ?? '',
        required_access: data.required_access ?? '',
        fr_et: data.fr_et ?? 0,
        fr_se: data.fr_se ?? 0,
        fr_koC: data.fr_koC ?? 0,
        fr_WoO: data.fr_WoO ?? 0,
        fr_eq: data.fr_eq ?? 0,
        component: data.component ?? null,
        controls: data.controls ?? [],
        previous_steps: data.previous_steps ?? [],
        threat_scenarios: data.threat_scenarios ?? [],
        threat_class: data.threat_class ?? null,
        mitre_technique_id: data.mitre_technique_id ?? '',
        mitre_technique_name: data.mitre_technique_name ?? '',
        attack_potential_points: data.attack_potential_points ?? null,
        attack_potential: data.attack_potential ?? null,
        afl: data.afl ?? null,
        afl_value: data.afl_value ?? null,
        project: data.project ?? null,
      } as AttackStepModel
    case 'threatScenario':
      return {
        id: data.id,
        name: data.name ?? '',
        description: data.description ?? '',
        components: data.components ?? [],
        attack_steps: data.attack_steps ?? [],
        damage_scenarios: data.damage_scenarios ?? [],
        compromises: data.compromises ?? [],
        threat_class: data.threat_class ?? null,
        project: data.project ?? null,
      } as ThreatScenarioModel
    case 'damageScenario':
      return {
        id: data.id,
        name: data.name ?? '',
        description: data.description ?? '',
        affected_CIA_parts: data.affected_CIA_parts ?? 0,
        safety_impact: data.safety_impact ?? 0,
        finantial_impact: data.finantial_impact ?? 0,
        operational_impact: data.operational_impact ?? 0,
        privacy_impact: data.privacy_impact ?? 0,
        threat_scenarios: data.threat_scenarios ?? [],
        concerns: data.concerns ?? [],
        il: data.il ?? 0,
        il_label: data.il_label ?? 'Negligible',
        project: data.project ?? null,
      } as DamageScenarioModel
    case 'cybersecurityGoal':
      return {
        id: data.id,
        name: data.name ?? '',
        description: data.description ?? '',
        cal: data.cal ?? null,
        damage_scenarios: data.damage_scenarios ?? [],
        controls: data.controls ?? [],
        project: data.project ?? null,
      } as CybersecurityGoalModel
    case 'threatClass':
      return {
        id: data.id,
        name: data.name ?? '',
        description: data.description ?? '',
        mitre_tactic_id: data.mitre_tactic_id ?? '',
        mitre_tactic_name: data.mitre_tactic_name ?? '',
        project: data.project ?? null,
      } as ThreatClassModel
    default:
      return data as Model
  }
}

export async function createModel(type: ModelType, model: Model) {
  const response = await api.post(getEndpoint(type), toApiPayload(type, model))
  return normalizeApiModel(type, response.data)
}

export async function updateModel(type: ModelType, model: Model) {
  const endpoint = `${getEndpoint(type)}${model.id}/`
  const response = await api.patch(endpoint, toApiPayload(type, model))
  return normalizeApiModel(type, response.data)
}

export async function deleteModel(type: ModelType, id: number) {
  const endpoint = `${getEndpoint(type)}${id}/`
  await api.delete(endpoint, {
    params: { project_id: getProjectId() },
    data: { project_id: getProjectId() },
  })
}
