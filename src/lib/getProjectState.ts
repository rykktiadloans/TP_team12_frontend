import { api } from '@/lib/api'
import type {
  AttackStepModel,
  ComponentModel,
  CompromisesModel,
  ControlClassModel,
  ControlGroupModel,
  ControlModel,
  CybersecurityGoalModel,
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
    technology?: number[]
  }>
}

type LoadedProjectState = {
  technologies: TechnologyModel[]
  components: ComponentModel[]
  dataEntities: DataEntityModel[]
  controls: ControlModel[]
  controlClasses: ControlClassModel[]
  controlGroups: ControlGroupModel[]
  threatClasses: ThreatClassModel[]
  attackSteps: AttackStepModel[]
  threatScenarios: ThreatScenarioModel[]
  damageScenarios: DamageScenarioModel[]
  compromises: CompromisesModel[]
  cybersecurityGoals: CybersecurityGoalModel[]
}

async function getList<T>(url: string, projectId: string | number): Promise<T[]> {
  const response = await api.get(url, {
    params: { project_id: projectId },
  })

  return Array.isArray(response.data) ? (response.data as T[]) : []
}

async function getGlobalList<T>(url: string): Promise<T[]> {
  const response = await api.get(url)
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
    controlClasses,
    controlGroups,
    threatClasses,
    attackSteps,
    threatScenariosRaw,
    damageScenariosRaw,
    cybersecurityGoals,
  ] = await Promise.all([
    getList<ComponentApiItem>('/component/', projectId),
    getList<TechnologyModel>('/technology/', projectId),
    getList<ControlModel>('/control/', projectId),
    getGlobalList<ControlClassModel>('/control_class/'),
    getList<ControlGroupModel>('/control_group/', projectId),
    getList<ThreatClassModel>('/threat_class/', projectId),
    getList<AttackStepModel>('/attack_step/', projectId),
    getList<Partial<ThreatScenarioModel>>('/threat_scenario/', projectId),
    getList<DamageScenarioModel>('/damage_scenario/', projectId),
    getList<CybersecurityGoalModel>('/cybersecurity_goal/', projectId),
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
          technology: entity.technology ?? [],
          project: component.project ?? null,
        })
      )
    )
  )

  const threatScenarios = threatScenariosRaw.map(
    (scenario): ThreatScenarioModel => ({
      id: scenario.id ?? -1,
      name: scenario.name ?? '',
      description: scenario.description ?? '',
      components: scenario.components ?? [],
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
      description: scenario.description ?? '',
      affected_CIA_parts: scenario.affected_CIA_parts,
      safety_impact: scenario.safety_impact,
      finantial_impact: scenario.finantial_impact,
      operational_impact: scenario.operational_impact,
      privacy_impact: scenario.privacy_impact,
      threat_scenarios: scenario.threat_scenarios ?? [],
      concerns: scenario.concerns ?? [],
      il: scenario.il ?? 0,
      il_label: scenario.il_label ?? 'Negligible',
      project: scenario.project ?? null,
    })
  )

  return {
    technologies,
    components,
    dataEntities,
    controlClasses,
    controlGroups,
    controls: controls.map((control) => ({
      ...control,
      description: control.description ?? '',
      control_class: control.control_class ?? null,
      attack_steps: control.attack_steps ?? [],
      threat_scenarios: control.threat_scenarios ?? [],
      attack_potential_points: control.attack_potential_points ?? null,
      attack_potential: control.attack_potential ?? null,
      afl: control.afl ?? null,
      afl_value: control.afl_value ?? null,
    })),
    threatClasses: threatClasses.map((tc) => ({
      ...tc,
      mitre_tactic_id: tc.mitre_tactic_id ?? '',
      mitre_tactic_name: tc.mitre_tactic_name ?? '',
    })),
    attackSteps: attackSteps.map((step) => ({
      ...step,
      description: step.description ?? '',
      required_access: step.required_access ?? '',
      previous_steps: step.previous_steps ?? [],
      attack_potential_points: step.attack_potential_points ?? null,
      attack_potential: step.attack_potential ?? null,
      afl: step.afl ?? null,
      afl_value: step.afl_value ?? null,
    })),
    threatScenarios,
    damageScenarios,
    compromises: [],
    cybersecurityGoals: cybersecurityGoals.map((g) => ({
      ...g,
      damage_scenarios: g.damage_scenarios ?? [],
      controls: g.controls ?? [],
    })),
  }
}
