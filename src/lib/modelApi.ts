import { api } from '@/lib/api'
import type {
  AttackStepModel,
  ComponentModel,
  ControlModel,
  DamageScenarioModel,
  Model,
  ModelType,
  NodeModel,
  TechnologyModel,
  ThreatScenarioModel,
} from '@/types/models'

const endpointByType: Partial<Record<ModelType, string>> = {
  node: '/nodes/',
  technology: '/technology/',
  component: '/component/',
  control: '/control/',
  attackStep: '/attack_step/',
  threatScenario: '/threat_scenario/',
  damageScenario: '/damage_scenario/',
}

export function supportsApiCreateType(type: ModelType) {
  return type in endpointByType
}

export function supportsApiUpdateType(type: ModelType) {
  return type !== 'node' && type in endpointByType
}

export function supportsApiDeleteType(type: ModelType) {
  return type !== 'node' && type in endpointByType
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
    case 'node': {
      const node = model as NodeModel
      return {
        title: node.title,
        content: node.content,
        project_id: projectId,
      }
    }
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
        fr_et: control.fr_et,
        fr_se: control.fr_se,
        fr_koC: control.fr_koC,
        fr_WoO: control.fr_WoO,
        fr_eq: control.fr_eq,
        component: control.component,
        project_id: projectId,
      }
    }
    case 'attackStep': {
      const attackStep = model as AttackStepModel
      return {
        name: attackStep.name,
        fr_et: attackStep.fr_et,
        fr_se: attackStep.fr_se,
        fr_koC: attackStep.fr_koC,
        fr_WoO: attackStep.fr_WoO,
        fr_eq: attackStep.fr_eq,
        component: attackStep.component,
        prepared_by: attackStep.prepared_by ?? [],
        threat_class: attackStep.threat_class,
        threat_scenarios: attackStep.threat_scenarios ?? [],
        controls: attackStep.controls ?? [],
        project_id: projectId,
      }
    }
    case 'threatScenario': {
      const threatScenario = model as ThreatScenarioModel
      return {
        name: threatScenario.name,
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
        affected_CIA_parts: damageScenario.affected_CIA_parts,
        impact_scale: damageScenario.impact_scale,
        safety_impact: damageScenario.safety_impact,
        finantial_impact: damageScenario.finantial_impact,
        operational_impact: damageScenario.operational_impact,
        privacy_impact: damageScenario.privacy_impact,
        component_id: damageScenario.component,
        threat_scenarios: damageScenario.threat_scenarios ?? [],
        project_id: projectId,
      }
    }
    default:
      throw new Error(`Unsupported model type "${type}"`)
  }
}

export function normalizeApiModel(type: ModelType, data: any): Model {
  switch (type) {
    case 'node':
      return {
        id: data.id,
        title: data.title ?? '',
        content: data.content ?? '',
      } as NodeModel
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
        fr_et: data.fr_et ?? 0,
        fr_se: data.fr_se ?? 0,
        fr_koC: data.fr_koC ?? 0,
        fr_WoO: data.fr_WoO ?? 0,
        fr_eq: data.fr_eq ?? 0,
        component: data.component ?? null,
        project: data.project ?? null,
      } as ControlModel
    case 'attackStep':
      return {
        id: data.id,
        name: data.name ?? '',
        fr_et: data.fr_et ?? 0,
        fr_se: data.fr_se ?? 0,
        fr_koC: data.fr_koC ?? 0,
        fr_WoO: data.fr_WoO ?? 0,
        fr_eq: data.fr_eq ?? 0,
        component: data.component ?? null,
        controls: data.controls ?? [],
        prepared_by: data.prepared_by ?? [],
        threat_scenarios: data.threat_scenarios ?? [],
        threat_class: data.threat_class ?? null,
        project: data.project ?? null,
      } as AttackStepModel
    case 'threatScenario':
      return {
        id: data.id,
        name: data.name ?? '',
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
        affected_CIA_parts: data.affected_CIA_parts ?? 0,
        impact_scale: data.impact_scale ?? 0,
        safety_impact: data.safety_impact ?? 0,
        finantial_impact: data.finantial_impact ?? 0,
        operational_impact: data.operational_impact ?? 0,
        privacy_impact: data.privacy_impact ?? 0,
        component: data.component_id ?? data.component ?? null,
        threat_scenarios: data.threat_scenarios ?? [],
        project: data.project ?? null,
      } as DamageScenarioModel
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
