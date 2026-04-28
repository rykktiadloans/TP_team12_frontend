import { api } from '@/lib/api'
import { formatCIABitmask } from '@/lib/tara'

function extractList<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[]

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>

    if (Array.isArray(record[key])) {
      return record[key] as T[]
    }

    const firstArray = Object.values(record).find(Array.isArray)
    if (Array.isArray(firstArray)) {
      return firstArray as T[]
    }
  }

  return []
}

export type TreeNode = {
  id: string
  label: string
  kind?:
    | 'component'
    | 'group'
    | 'data-entity'
    | 'technology'
    | 'damage-scenario'
    | 'control'
    | 'attack-step'
    | 'threat-scenario'
    | 'leaf'
  badge?: string
  children?: TreeNode[]
  raw?: unknown
}

type ComponentItem = {
  id: number | string
  name: string
  description?: string
}

type DamageScenarioItem = {
  id: number | string
  name: string
  threat_scenarios?: Array<number | string>
  attack_steps?: Array<number | string>
  affected_CIA_parts?: number | string
  affected_cia_binary?: string
  [key: string]: unknown
}

type ControlItem = {
  id: number | string
  name: string
  component_id?: number | string
  attack_steps?: Array<number | string>
  [key: string]: unknown
}

type AttackStepItem = {
  id: number | string
  name: string
  component_id?: number | string
  threat_scenarios?: Array<number | string>
  controls?: Array<number | string>
  previous_steps?: Array<number | string>
  [key: string]: unknown
}

type ThreatScenarioItem = {
  id: number | string
  name: string
  components?: Array<number | string>
  attack_steps?: Array<number | string>
  damage_scenarios?: Array<number | string>
  compromises?: Array<{
    component_id?: number | string
    compromised_part_cia?: number | string
    compromised_part_cia_binary?: string
  }>
  threat_class_id?: number | string
  [key: string]: unknown
}

type ComponentDetail = {
  id: number | string
  name: string
  description?: string
  data_entity?: Array<{
    id: number | string
    name: string
    description?: string
  }>
  technology?: Array<{
    id: number | string
    name: string
    description?: string
  }>
  damage_scenario?: DamageScenarioItem[]
  control?: Array<number | string>
  threat_scenarios?: Array<number | string>
  attack_steps?: Array<number | string>
  [key: string]: unknown
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  return []
}

function makeGroupId(prefix: string, value: string | number) {
  return `${prefix}-${value}`
}

function makeModelId(
  type:
    | 'component'
    | 'technology'
    | 'dataEntity'
    | 'control'
    | 'attackStep'
    | 'threatScenario'
    | 'damageScenario',
  value: string | number
) {
  return `${value}.${type}`
}

function safeName(
  item: { name?: string; id?: string | number },
  fallback: string
) {
  return item?.name?.trim() || `${fallback} ${item?.id ?? ''}`.trim()
}

function leafFromIdRef(label: string, id: string | number): TreeNode {
  const modelTypes = {
    Control: 'control',
    'Attack Step': 'attackStep',
    'Threat Scenario': 'threatScenario',
    'Damage Scenario': 'damageScenario',
    Component: 'component',
    Technology: 'technology',
    'Data Entity': 'dataEntity',
  } as const

  const modelType = modelTypes[label as keyof typeof modelTypes]

  return {
    id: modelType
      ? makeModelId(modelType, id)
      : `${label.toLowerCase().replace(/\s+/g, '-')}-${id}`,
    label: `${label} ${id}`,
    kind: 'leaf',
    badge: 'id-ref',
    raw: { id },
  }
}

function buildThreatScenarioNode(
  threatScenario: ThreatScenarioItem,
  attackStepsById: Map<string, AttackStepItem>,
  damageScenariosById: Map<string, DamageScenarioItem>,
  visited: Set<string>
): TreeNode {
  const visitKey = `threat-scenario-${threatScenario.id}`
  if (visited.has(visitKey)) {
    return {
      id: makeModelId('threatScenario', String(threatScenario.id)),
      label: safeName(threatScenario, 'Threat Scenario'),
      kind: 'threat-scenario',
      badge: 'recursive',
      raw: threatScenario,
      children: [],
    }
  }

  const nextVisited = new Set(visited)
  nextVisited.add(visitKey)

  const children: TreeNode[] = []

  const componentIds = asArray<number | string>(threatScenario.components)
  if (componentIds.length) {
    children.push({
      id: `group-ts-components-${threatScenario.id}`,
      label: 'Involved Components',
      kind: 'group',
      badge: String(componentIds.length),
      children: componentIds.map((id) => leafFromIdRef('Component', id)),
    })
  }

  const linkedAttackSteps = asArray<number | string>(threatScenario.attack_steps)
    .map((id) => attackStepsById.get(String(id)))
    .filter(Boolean) as AttackStepItem[]

  if (linkedAttackSteps.length) {
    children.push({
      id: `group-ts-attack-steps-${threatScenario.id}`,
      label: 'Attack Steps',
      kind: 'group',
      badge: String(linkedAttackSteps.length),
      children: linkedAttackSteps.map((step) =>
        buildAttackStepNode(
          step,
          attackStepsById,
          damageScenariosById,
          new Map(),
          nextVisited
        )
      ),
    })
  }

  const linkedDamageScenarios = asArray<number | string>(
    threatScenario.damage_scenarios
  )
    .map((id) => damageScenariosById.get(String(id)))
    .filter(Boolean) as DamageScenarioItem[]

  if (linkedDamageScenarios.length) {
    children.push({
      id: `group-ts-damage-scenarios-${threatScenario.id}`,
      label: 'Damage Scenarios',
      kind: 'group',
      badge: String(linkedDamageScenarios.length),
      children: linkedDamageScenarios.map((ds) =>
        buildDamageScenarioNode(
          ds,
          new Map(),
          attackStepsById,
          damageScenariosById,
          nextVisited
        )
      ),
    })
  }

  if (
    Array.isArray(threatScenario.compromises) &&
    threatScenario.compromises.length
  ) {
    children.push({
      id: `group-ts-compromises-${threatScenario.id}`,
      label: 'Compromises',
      kind: 'group',
      badge: String(threatScenario.compromises.length),
      children: threatScenario.compromises.map((c, index) => ({
        id: `ts-compromise-${threatScenario.id}-${index}`,
        label: `Component ${c.component_id ?? '?'} → ${formatCIABitmask(
          c.compromised_part_cia,
          c.compromised_part_cia_binary
        )}`,
        kind: 'leaf',
        raw: c,
      })),
    })
  }

  return {
    id: makeModelId('threatScenario', String(threatScenario.id)),
    label: safeName(threatScenario, 'Threat Scenario'),
    kind: 'threat-scenario',
    raw: threatScenario,
    children,
  }
}

function buildDamageScenarioNode(
  damageScenario: DamageScenarioItem,
  threatScenariosById: Map<string, ThreatScenarioItem>,
  attackStepsById: Map<string, AttackStepItem>,
  damageScenariosById: Map<string, DamageScenarioItem>,
  visited: Set<string>
): TreeNode {
  const children: TreeNode[] = []

  const threatScenarioIds = asArray<number | string>(damageScenario.threat_scenarios)
  if (threatScenarioIds.length) {
    children.push({
      id: `group-damage-scenario-threat-scenarios-${damageScenario.id}`,
      label: 'Threat Scenarios',
      kind: 'group',
      badge: String(threatScenarioIds.length),
      children: threatScenarioIds.map((id) => {
        const ts = threatScenariosById.get(String(id))
        if (!ts) return leafFromIdRef('Threat Scenario', id)
        return buildThreatScenarioNode(
          ts,
          attackStepsById,
          damageScenariosById,
          visited
        )
      }),
    })
  }

  return {
    id: makeModelId('damageScenario', String(damageScenario.id)),
    label: safeName(damageScenario, 'Damage Scenario'),
    kind: 'damage-scenario',
    raw: damageScenario,
    children,
  }
}

function buildAttackStepNode(
  attackStep: AttackStepItem,
  attackStepsById: Map<string, AttackStepItem>,
  damageScenariosById: Map<string, DamageScenarioItem>,
  threatScenariosById: Map<string, ThreatScenarioItem>,
  visited: Set<string>
): TreeNode {
  const visitKey = `attack-step-${attackStep.id}`
  if (visited.has(visitKey)) {
    return {
      id: makeModelId('attackStep', String(attackStep.id)),
      label: safeName(attackStep, 'Attack Step'),
      kind: 'attack-step',
      badge: 'recursive',
      raw: attackStep,
      children: [],
    }
  }

  const nextVisited = new Set(visited)
  nextVisited.add(visitKey)

  const children: TreeNode[] = []

  const tsIds = asArray<number | string>(attackStep.threat_scenarios)
  if (tsIds.length) {
    children.push({
      id: `group-attack-step-threat-scenarios-${attackStep.id}`,
      label: 'Threat Scenarios',
      kind: 'group',
      badge: String(tsIds.length),
      children: tsIds.map((id) => {
        const ts = threatScenariosById.get(String(id))
        if (!ts) return leafFromIdRef('Threat Scenario', id)
        return buildThreatScenarioNode(
          ts,
          attackStepsById,
          damageScenariosById,
          nextVisited
        )
      }),
    })
  }

  const controlIds = asArray<number | string>(attackStep.controls)
  if (controlIds.length) {
    children.push({
      id: `group-attack-step-controls-${attackStep.id}`,
      label: 'Controls',
      kind: 'group',
      badge: String(controlIds.length),
      children: controlIds.map((id) => leafFromIdRef('Control', id)),
    })
  }

  const previousStepIds = asArray<number | string>(attackStep.previous_steps)
  if (previousStepIds.length) {
    children.push({
      id: `group-attack-step-previous-steps-${attackStep.id}`,
      label: 'Previous Steps',
      kind: 'group',
      badge: String(previousStepIds.length),
      children: previousStepIds.map((id) => {
        const step = attackStepsById.get(String(id))
        if (!step) return leafFromIdRef('Attack Step', id)
        return {
          id: makeModelId('attackStep', String(step.id)),
          label: safeName(step, 'Attack Step'),
          kind: 'attack-step',
          raw: step,
        }
      }),
    })
  }

  const nextSteps = [...attackStepsById.values()].filter((candidate) =>
    asArray<number | string>(candidate.previous_steps).some(
      (id) => String(id) === String(attackStep.id)
    )
  )
  if (nextSteps.length) {
    children.push({
      id: `group-attack-step-next-steps-${attackStep.id}`,
      label: 'Next Steps',
      kind: 'group',
      badge: String(nextSteps.length),
      children: nextSteps.map((step) => ({
        id: makeModelId('attackStep', String(step.id)),
        label: safeName(step, 'Attack Step'),
        kind: 'attack-step',
        raw: step,
      })),
    })
  }

  return {
    id: makeModelId('attackStep', String(attackStep.id)),
    label: safeName(attackStep, 'Attack Step'),
    kind: 'attack-step',
    raw: attackStep,
    children,
  }
}

function buildControlNode(control: ControlItem): TreeNode {
  const children: TreeNode[] = []

  const attackSteps = asArray<number | string>(control.attack_steps)
  if (attackSteps.length) {
    children.push({
      id: `group-control-attack-steps-${control.id}`,
      label: 'Attack Steps',
      kind: 'group',
      badge: String(attackSteps.length),
      children: attackSteps.map((id) => leafFromIdRef('Attack Step', id)),
    })
  }

  return {
    id: makeModelId('control', String(control.id)),
    label: safeName(control, 'Control'),
    kind: 'control',
    raw: control,
    children,
  }
}

function buildComponentNode(
  detail: ComponentDetail,
  controls: ControlItem[],
  attackSteps: AttackStepItem[],
  threatScenarios: ThreatScenarioItem[],
  damageScenarios: DamageScenarioItem[]
): TreeNode {
  const children: TreeNode[] = []

  const controlById = new Map(controls.map((item) => [String(item.id), item]))
  const attackStepsById = new Map(
    attackSteps.map((item) => [String(item.id), item])
  )
  const threatScenariosById = new Map(
    threatScenarios.map((item) => [String(item.id), item])
  )
  const damageScenariosById = new Map(
    damageScenarios.map((item) => [String(item.id), item])
  )

  const dataEntities = asArray<{
    id: number | string
    name: string
    description?: string
  }>(detail.data_entity)
  if (dataEntities.length) {
    children.push({
      id: `group-component-data-entities-${detail.id}`,
      label: 'Data Entities',
      kind: 'group',
      badge: String(dataEntities.length),
      children: dataEntities.map((entity) => ({
        id: makeModelId('dataEntity', String(entity.id)),
        label: safeName(entity, 'Data Entity'),
        kind: 'data-entity',
        raw: entity,
      })),
    })
  }

  const technologies = asArray<{
    id: number | string
    name: string
    description?: string
  }>(detail.technology)
  if (technologies.length) {
    children.push({
      id: `group-component-technologies-${detail.id}`,
      label: 'Technologies',
      kind: 'group',
      badge: String(technologies.length),
      children: technologies.map((tech) => ({
        id: makeModelId('technology', String(tech.id)),
        label: safeName(tech, 'Technology'),
        kind: 'technology',
        raw: tech,
      })),
    })
  }

  if (damageScenarios.length) {
    children.push({
      id: `group-component-damage-scenarios-${detail.id}`,
      label: 'Damage Scenarios',
      kind: 'group',
      badge: String(damageScenarios.length),
      children: damageScenarios.map((ds) =>
        buildDamageScenarioNode(
          ds,
          threatScenariosById,
          attackStepsById,
          damageScenariosById,
          new Set()
        )
      ),
    })
  }

  if (controls.length) {
    children.push({
      id: `group-component-controls-${detail.id}`,
      label: 'Controls',
      kind: 'group',
      badge: String(controls.length),
      children: controls.map((control) => buildControlNode(control)),
    })
  }

  if (attackSteps.length) {
    children.push({
      id: `group-component-attack-steps-${detail.id}`,
      label: 'Attack Steps',
      kind: 'group',
      badge: String(attackSteps.length),
      children: attackSteps.map((step) =>
        buildAttackStepNode(
          step,
          attackStepsById,
          damageScenariosById,
          threatScenariosById,
          new Set()
        )
      ),
    })
  }

  if (threatScenarios.length) {
    children.push({
      id: `group-component-threat-scenarios-${detail.id}`,
      label: 'Threat Scenarios',
      kind: 'group',
      badge: String(threatScenarios.length),
      children: threatScenarios.map((ts) =>
        buildThreatScenarioNode(
          ts,
          attackStepsById,
          damageScenariosById,
          new Set()
        )
      ),
    })
  }

  const unresolvedControlIds = asArray<number | string>(detail.control).filter(
    (id) => !controlById.has(String(id))
  )
  if (unresolvedControlIds.length) {
    children.push({
      id: `group-component-control-refs-${detail.id}`,
      label: 'Control Refs',
      kind: 'group',
      badge: String(unresolvedControlIds.length),
      children: unresolvedControlIds.map((id) => leafFromIdRef('Control', id)),
    })
  }

  const unresolvedAttackStepIds = asArray<number | string>(
    detail.attack_steps
  ).filter((id) => !attackStepsById.has(String(id)))
  if (unresolvedAttackStepIds.length) {
    children.push({
      id: `group-component-attack-step-refs-${detail.id}`,
      label: 'Attack Step Refs',
      kind: 'group',
      badge: String(unresolvedAttackStepIds.length),
      children: unresolvedAttackStepIds.map((id) =>
        leafFromIdRef('Attack Step', id)
      ),
    })
  }

  const unresolvedThreatScenarioIds = asArray<number | string>(
    detail.threat_scenarios
  ).filter((id) => !threatScenariosById.has(String(id)))
  if (unresolvedThreatScenarioIds.length) {
    children.push({
      id: `group-component-threat-scenario-refs-${detail.id}`,
      label: 'Threat Scenario Refs',
      kind: 'group',
      badge: String(unresolvedThreatScenarioIds.length),
      children: unresolvedThreatScenarioIds.map((id) =>
        leafFromIdRef('Threat Scenario', id)
      ),
    })
  }

  return {
    id: makeModelId('component', String(detail.id)),
    label: safeName(detail, 'Component'),
    kind: 'component',
    raw: detail,
    children,
  }
}

async function safeGet<T>(
  url: string,
  projectId?: string | number,
  includeProjectId = true
): Promise<T | null> {
  try {
    const response = await api.get(url, {
      params:
        includeProjectId && projectId != null
          ? { project_id: projectId }
          : undefined,
    })

    return response.data as T
  } catch (error) {
    console.warn(`Failed to load ${url}`, error)
    return null
  }
}

function extractControls(data: unknown): ControlItem[] {
  return extractList<ControlItem>(data, 'control')
}

function extractAttackSteps(data: unknown): AttackStepItem[] {
  return extractList<AttackStepItem>(data, 'attack_steps')
}

function extractThreatScenarios(data: unknown): ThreatScenarioItem[] {
  return extractList<ThreatScenarioItem>(data, 'threat_scenarios')
}

function extractDamageScenarios(data: unknown): DamageScenarioItem[] {
  return extractList<DamageScenarioItem>(data, 'damage_scenarios')
}

function extractComponents(data: unknown): ComponentItem[] {
  return extractList<ComponentItem>(data, 'component')
}

async function loadComponentBundle(
  componentId: string | number,
  projectId: string | number
) {
  const [
    detail,
    damageScenariosRaw,
    controlsRaw,
    attackStepsRaw,
    threatScenariosRaw,
  ] = await Promise.all([
    safeGet<ComponentDetail>(`/component/${componentId}`, projectId, true),

    safeGet<{ damage_scenario?: DamageScenarioItem[] } | DamageScenarioItem[]>(`/damage_scenario/component/${componentId}`, projectId, true),

    safeGet<{ control?: ControlItem[] } | ControlItem[]>(`/control/component/${componentId}`, projectId, true),

    safeGet<{ attack_step?: AttackStepItem[] } | AttackStepItem[]>(`/attack_step/component/${componentId}`, projectId, true),

    safeGet<{ threat_scenario?: ThreatScenarioItem[] } | ThreatScenarioItem[]>(`/threat_scenario/component/${componentId}`, projectId, true),
  ])

  return {
    detail: detail ?? {
      id: componentId,
      name: `Component ${componentId}`,
      data_entity: [],
      technology: [],
      damage_scenario: [],
      control: [],
      attack_steps: [],
      threat_scenarios: [],
    },
    damageScenarios: extractDamageScenarios(damageScenariosRaw),
    controls: extractControls(controlsRaw),
    attackSteps: extractAttackSteps(attackStepsRaw),
    threatScenarios: extractThreatScenarios(threatScenariosRaw),
  }
}

export async function getProjectTree(
  projectId: string | number
): Promise<TreeNode[]> {
  const [projectResponse, componentsResponse] = await Promise.all([
    safeGet<{ id: number | string; name: string }>(
      `/projects/${projectId}/`,
      undefined,
      false
    ),
    safeGet<unknown>(
      '/component/',
      projectId,
      true
    ),
  ])
  const components = extractComponents(componentsResponse)

  if (components.length === 0) {
    return [
      {
        id: makeGroupId('project', projectId),
        label: projectResponse?.name ?? `Project ${projectId}`,
        kind: 'group',
        badge: 'empty',
        children: [
          {
            id: `project-empty-${projectId}`,
            label: 'No components yet',
            kind: 'leaf',
          },
        ],
      },
    ]
  }

  console.log('componentsResponse =', componentsResponse)
  console.log('components =', components)

  const bundles = await Promise.all(
    components.map((component) => loadComponentBundle(component.id, projectId))
  )

  return bundles.map((bundle) =>
    buildComponentNode(
      bundle.detail,
      bundle.controls,
      bundle.attackSteps,
      bundle.threatScenarios,
      bundle.damageScenarios
    )
  )
}
