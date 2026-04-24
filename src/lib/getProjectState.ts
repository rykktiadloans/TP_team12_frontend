import { api } from '@/lib/api'
import type {
  AttackStepModel,
  ComponentModel,
  CompromisesModel,
  ControlModel,
  DamageScenarioModel,
  DataEntityModel,
  TechnologyModel,
  ThreatClassModel,
  ThreatScenarioModel,
} from '@/types/models'

type ComponentApiItem = ComponentModel & {
  data_entity?: Array<{
    id: number
    name: string
    description: string
  }>
}

type DamageScenarioApiItem = Omit<DamageScenarioModel, 'component'> & {
  component_id?: number | null
}

type LoadedProjectState = {
  technologies: TechnologyModel[]
  components: ComponentModel[]
  dataEntities: DataEntityModel[]
  controls: ControlModel[]
  threatClasses: ThreatClassModel[]
  attackSteps: AttackStepModel[]
  threatScenarios: ThreatScenarioModel[]
  damageScenarios: DamageScenarioModel[]
  compromises: CompromisesModel[]
}

async function getList<T>(url: string, projectId: string | number): Promise<T[]> {
  const response = await api.get(url, {
    params: { project_id: projectId },
  })

  return Array.isArray(response.data) ? (response.data as T[]) : []
}

function uniqueById<T extends { id: number }>(items: T[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()]
}

export async function getProjectState(
  projectId: string | number
): Promise<LoadedProjectState> {
  const [
    componentsRaw,
    technologies,
    controls,
    attackSteps,
    threatScenariosRaw,
    damageScenariosRaw,
  ] = await Promise.all([
    getList<ComponentApiItem>('/component/', projectId),
    getList<TechnologyModel>('/technology/', projectId),
    getList<ControlModel>('/control/', projectId),
    getList<AttackStepModel>('/attack_step/', projectId),
    getList<Partial<ThreatScenarioModel>>('/threat_scenario/', projectId),
    getList<DamageScenarioApiItem>('/damage_scenario/', projectId),
  ])

  const components = componentsRaw.map((component) => ({
    id: component.id,
    name: component.name,
    description: component.description,
    communicates_with: component.communicates_with ?? [],
    technology: component.technology ?? [],
    project: component.project ?? null,
  }))

  const dataEntities = uniqueById(
    componentsRaw.flatMap((component) =>
      (component.data_entity ?? []).map(
        (entity): DataEntityModel => ({
          id: entity.id,
          name: entity.name,
          description: entity.description,
          component: component.id,
          technology: [],
          project: component.project ?? null,
        })
      )
    )
  )

  const threatScenarios = threatScenariosRaw.map(
    (scenario): ThreatScenarioModel => ({
      id: scenario.id ?? -1,
      name: scenario.name ?? '',
      attack_steps: scenario.attack_steps ?? [],
      damage_scenarios: scenario.damage_scenarios ?? [],
      compromises: scenario.compromises ?? [],
      threat_class: scenario.threat_class ?? null,
      project: scenario.project ?? null,
    })
  )

  const damageScenarios = damageScenariosRaw.map(
    (scenario): DamageScenarioModel => ({
      id: scenario.id,
      name: scenario.name,
      affected_CIA_parts: scenario.affected_CIA_parts,
      impact_scale: scenario.impact_scale,
      safety_impact: scenario.safety_impact,
      finantial_impact: scenario.finantial_impact,
      operational_impact: scenario.operational_impact,
      privacy_impact: scenario.privacy_impact,
      component: scenario.component_id ?? null,
      threat_scenarios: scenario.threat_scenarios ?? [],
      project: scenario.project ?? null,
    })
  )

  return {
    technologies,
    components,
    dataEntities,
    controls,
    threatClasses: [],
    attackSteps,
    threatScenarios,
    damageScenarios,
    compromises: [],
  }
}
