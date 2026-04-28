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
  Model,
  ModelType,
  TechnologyModel,
  ThreatClassModel,
  ThreatScenarioModel,
  GeneratedRiskModel,
} from '@/types/models'

import { create } from 'zustand'
import { getProjectTree, type TreeNode } from '@/lib/GetProjectTree'
import { getProjectState } from '@/lib/getProjectState'
import { getProjectRisks } from '@/lib/getProjectRisks'
import {
  createModel,
  deleteModel as deleteApiModel,
  supportsApiCreateType,
  supportsApiDeleteType,
  supportsApiUpdateType,
  updateModel,
} from '@/lib/modelApi'

export interface ModelState {
  technologies: Map<number, TechnologyModel>
  components: Map<number, ComponentModel>
  dataEntities: Map<number, DataEntityModel>
  controls: Map<number, ControlModel>
  threatClasses: Map<number, ThreatClassModel>
  attackSteps: Map<number, AttackStepModel>
  threatScenarios: Map<number, ThreatScenarioModel>
  damageScenarios: Map<number, DamageScenarioModel>
  compromises: Map<number, CompromisesModel>
  cybersecurityGoals: Map<number, CybersecurityGoalModel>
}

// 'all' = virtual "All Controls", 'none' = virtual "No Controls", number = real group ID
export type ActiveControlGroup = 'all' | 'none' | number

export interface ModelStore {
  state: ModelState
  controlClasses: Map<number, ControlClassModel>
  controlGroups: ControlGroupModel[]
  activeControlGroupId: ActiveControlGroup

  // explorer/tree slice
  tree: TreeNode[]
  treeLoading: boolean
  treeError: string
  selectedId: string
  focusTargetId: string
  treeProjectId: string | number | null
  risks: GeneratedRiskModel[]
  risksLoading: boolean
  risksError: string

  loadProjectState: (projectId: string | number) => Promise<void>
  setActiveControlGroupId: (id: ActiveControlGroup) => void
  setControlGroups: (groups: ControlGroupModel[]) => void
  getActiveControlIds: () => number[]
  loadRisks: (projectId: string | number) => Promise<void>
  loadTree: (projectId: string | number) => Promise<void>
  setSelectedId: (id: string) => void
  requestFocus: (id: string) => void
  clearFocus: () => void
  clearTree: () => void

  // existing model store API
  getItem: (id: string) => Model | null
  setItem: (type: ModelType, model: Model) => void
  saveItem: (type: ModelType, model: Model) => Promise<Model>
  addItem: (type: ModelType, model: Model) => Promise<Model>
  deleteItem: (id: string) => Promise<void>
  isConnectable: (
    fromId: number,
    fromType: ModelType,
    toId: number,
    toType: ModelType
  ) => boolean
  deleteConnection: (
    fromId: number,
    fromType: ModelType,
    toId: number,
    toType: ModelType
  ) => Promise<void>
  addConnection: (
    fromId: number,
    fromType: ModelType,
    toId: number,
    toType: ModelType
  ) => Promise<void>
}

function createEmptyState(): ModelState {
  return {
    technologies: new Map<number, TechnologyModel>(),
    components: new Map<number, ComponentModel>(),
    dataEntities: new Map<number, DataEntityModel>(),
    controls: new Map<number, ControlModel>(),
    threatClasses: new Map<number, ThreatClassModel>(),
    attackSteps: new Map<number, AttackStepModel>(),
    threatScenarios: new Map<number, ThreatScenarioModel>(),
    damageScenarios: new Map<number, DamageScenarioModel>(),
    compromises: new Map<number, CompromisesModel>(),
    cybersecurityGoals: new Map<number, CybersecurityGoalModel>(),
  }
}

function getMapForType(state: ModelState, type: ModelType): Map<number, Model> {
  return state[modelTypeToKey(type)] as Map<number, Model>
}

function refreshTreeIfLoaded(get: () => ModelStore) {
  const treeProjectId = get().treeProjectId
  if (treeProjectId != null) {
    void get().loadTree(treeProjectId)
  }
}

function getCurrentProjectId(model?: Model) {
  if (model && 'project' in model && model.project != null) {
    return model.project as number
  }

  const projectId = sessionStorage.getItem('projectId')
  return projectId ? Number(projectId) : null
}

async function reloadProjectStateAfterRelationshipUpdate(
  get: () => ModelStore,
  type: ModelType,
  model?: Model
) {
  if (
    type !== 'threatScenario' &&
    type !== 'damageScenario' &&
    type !== 'attackStep'
  ) {
    return
  }

  const projectId = getCurrentProjectId(model)
  if (projectId != null) {
    await get().loadProjectState(projectId)
  }
}

function resolveConnectionDirection(
  state: ModelState,
  fromId: number,
  fromType: ModelType,
  toId: number,
  toType: ModelType
) {
  if (fromId === toId && fromType === toType) {
    return null
  }

  if (fromType === 'attackStep' && toType === 'attackStep') {
    const from = state.attackSteps.get(fromId)
    const to = state.attackSteps.get(toId)
    if (!from || !to) {
      return null
    }

    if (from.previous_steps.includes(toId)) {
      return {
        source: from,
        sourceId: fromId,
        sourceType: fromType,
        targetId: toId,
        targetType: toType,
        property: 'previous_steps',
      }
    }

    if (to.previous_steps.includes(fromId)) {
      return {
        source: to,
        sourceId: toId,
        sourceType: toType,
        targetId: fromId,
        targetType: fromType,
        property: 'previous_steps',
      }
    }

    // When creating a chain, treat source -> target as "source is previous of target".
    return {
      source: to,
      sourceId: toId,
      sourceType: toType,
      targetId: fromId,
      targetType: fromType,
      property: 'previous_steps',
    }
  }

  const directProperty = connectionProperty(fromType, toType)
  if (directProperty) {
    const source = getMapForType(state, fromType).get(fromId)
    if (source) {
      return {
        source,
        sourceId: fromId,
        sourceType: fromType,
        targetId: toId,
        targetType: toType,
        property: directProperty,
      }
    }
  }

  const reverseProperty = connectionProperty(toType, fromType)
  if (reverseProperty) {
    const source = getMapForType(state, toType).get(toId)
    if (source) {
      return {
        source,
        sourceId: toId,
        sourceType: toType,
        targetId: fromId,
        targetType: fromType,
        property: reverseProperty,
      }
    }
  }

  return null
}

function getPersistedActiveControlGroupId(): ActiveControlGroup {
  const stored = sessionStorage.getItem('activeControlGroupId')
  if (!stored) return 'all'
  if (stored === 'all' || stored === 'none') return stored
  const n = Number(stored)
  return isFinite(n) && !isNaN(n) ? n : 'all'
}

export const useModelStore = create<ModelStore>((set, get) => ({
  state: createEmptyState(),
  controlClasses: new Map<number, ControlClassModel>(),
  controlGroups: [],
  activeControlGroupId: getPersistedActiveControlGroupId(),

  // explorer/tree slice
  tree: [],
  treeLoading: false,
  treeError: '',
  selectedId: '',
  focusTargetId: '',
  treeProjectId: null,
  risks: [],
  risksLoading: false,
  risksError: '',

  loadProjectState: async (projectId: string | number) => {
    try {
      const [projectState, risks] = await Promise.all([
        getProjectState(projectId),
        getProjectRisks(projectId),
      ])

      set({
        risks,
        controlClasses: new Map(projectState.controlClasses.map((item) => [item.id, item])),
        controlGroups: projectState.controlGroups,
        state: {
          technologies: new Map(
            projectState.technologies.map((item) => [item.id, item])
          ),
          components: new Map(
            projectState.components.map((item) => [item.id, item])
          ),
          dataEntities: new Map(
            projectState.dataEntities.map((item) => [item.id, item])
          ),
          controls: new Map(projectState.controls.map((item) => [item.id, item])),
          threatClasses: new Map(
            projectState.threatClasses.map((item) => [item.id, item])
          ),
          attackSteps: new Map(
            projectState.attackSteps.map((item) => [item.id, item])
          ),
          threatScenarios: new Map(
            projectState.threatScenarios.map((item) => [item.id, item])
          ),
          damageScenarios: new Map(
            projectState.damageScenarios.map((item) => [item.id, item])
          ),
          compromises: new Map(
            projectState.compromises.map((item) => [item.id, item])
          ),
          cybersecurityGoals: new Map(
            projectState.cybersecurityGoals.map((item) => [item.id, item])
          ),
        },
      })
    } catch (error) {
      console.error(error)
      set({ state: createEmptyState(), risks: [] })
    }
  },

  setActiveControlGroupId: (id: ActiveControlGroup) => {
    sessionStorage.setItem('activeControlGroupId', String(id))
    set({ activeControlGroupId: id })
  },

  setControlGroups: (groups: ControlGroupModel[]) => {
    set({ controlGroups: groups })
  },

  getActiveControlIds: () => {
    const { activeControlGroupId, controlGroups, state } = get()
    if (activeControlGroupId === 'none') return []
    if (activeControlGroupId === 'all') {
      return [...state.controls.keys()]
    }
    const group = controlGroups.find((g) => g.id === activeControlGroupId)
    return group ? group.controls.map((c) => c.id) : []
  },

  loadRisks: async (projectId: string | number) => {
    set({ risksLoading: true, risksError: '' })

    try {
      const risks = await getProjectRisks(projectId)
      set({ risks, risksLoading: false })
    } catch (error) {
      console.error(error)
      set({
        risks: [],
        risksLoading: false,
        risksError: 'Risks could not be loaded',
      })
    }
  },

  loadTree: async (projectId: string | number) => {
    set({
      treeLoading: true,
      treeError: '',
      treeProjectId: projectId,
    })

    try {
      const tree = await getProjectTree(projectId)
      set({
        tree,
        treeLoading: false,
      })
    } catch (err) {
      console.error(err)
      set({
        tree: [],
        treeLoading: false,
        treeError: 'Tree couldnt be loaded',
      })
    }
  },

  setSelectedId: (id: string) => {
    set({ selectedId: id })
  },

  requestFocus: (id: string) => {
    set({ focusTargetId: id })
  },

  clearFocus: () => {
    set({ focusTargetId: '' })
  },

  clearTree: () => {
    set({
      tree: [],
      state: createEmptyState(),
      controlGroups: [],
      treeLoading: false,
      treeError: '',
      selectedId: '',
      focusTargetId: '',
      treeProjectId: null,
      risks: [],
      risksLoading: false,
      risksError: '',
    })
  },

  getItem: (id: string) => {
    if (id.split('.').length < 2) {
      return null
    }
    const state = get().state
    const n = +id.split('.')[0]
    const type = id.split('.')[1] as ModelType
    switch (type) {
      case 'technology':
        return state.technologies.get(n) ?? null
      case 'component':
        return state.components.get(n) ?? null
      case 'dataEntity':
        return state.dataEntities.get(n) ?? null
      case 'control':
        return state.controls.get(n) ?? null
      case 'threatClass':
        return state.threatClasses.get(n) ?? null
      case 'attackStep':
        return state.attackSteps.get(n) ?? null
      case 'threatScenario':
        return state.threatScenarios.get(n) ?? null
      case 'damageScenario':
        return state.damageScenarios.get(n) ?? null
      case 'compromise':
        return state.compromises.get(n) ?? null
      case 'cybersecurityGoal':
        return state.cybersecurityGoals.get(n) ?? null
      default:
        return null
    }
  },

  setItem: (type: ModelType, model: Model) => {
    const state = get().state
    let map
    switch (type) {
      case 'technology':
        map = state.technologies
        map.set(model.id, model as TechnologyModel)
        break
      case 'component':
        map = state.components
        map.set(model.id, model as ComponentModel)
        break
      case 'dataEntity':
        map = state.dataEntities
        map.set(model.id, model as DataEntityModel)
        break
    case 'control':
      map = state.controls
      map.set(model.id, model as ControlModel)
      break
      case 'threatClass':
        map = state.threatClasses
        map.set(model.id, model as ThreatClassModel)
        break
      case 'attackStep':
        map = state.attackSteps
        map.set(model.id, model as AttackStepModel)
        break
      case 'threatScenario':
        map = state.threatScenarios
        map.set(model.id, model as ThreatScenarioModel)
        break
      case 'damageScenario':
        map = state.damageScenarios
        map.set(model.id, model as DamageScenarioModel)
        break
      case 'compromise':
        map = state.compromises
        map.set(model.id, model as CompromisesModel)
        break
      case 'cybersecurityGoal':
        map = state.cybersecurityGoals
        map.set(model.id, model as CybersecurityGoalModel)
        break
    }

    set({ state: { ...state } })
  },

  saveItem: async (type: ModelType, model: Model) => {
    if (!supportsApiUpdateType(type)) {
      get().setItem(type, model)
      return model
    }

    const savedModel = await updateModel(type, model)
    const state = get().state
    const map = getMapForType(state, type)
    const currentModel = map.get(savedModel.id)

    if (JSON.stringify(currentModel) === JSON.stringify(model)) {
      map.set(savedModel.id, savedModel)
      set({ state: { ...state } })
    }

    await reloadProjectStateAfterRelationshipUpdate(get, type, savedModel)
    refreshTreeIfLoaded(get)
    return savedModel
  },

  addItem: async (type: ModelType, model: Model) => {
    const state = get().state
    const map = getMapForType(state, type)

    if (supportsApiCreateType(type)) {
      const savedModel = await createModel(type, model)
      const projectId = getCurrentProjectId(savedModel)
      if (projectId != null) {
        await get().loadProjectState(projectId)
      } else {
        map.set(savedModel.id, savedModel)
        set({ state: { ...state } })
      }
      refreshTreeIfLoaded(get)
      return savedModel
    }

    const maxId = Math.max(...[...map.values()].map((currentModel) => currentModel.id))
    const nextId = isFinite(maxId) && !isNaN(maxId) ? maxId + 1 : 0

    const createdModel = { ...model, id: nextId }
    map.set(nextId, createdModel)
    set({ state: { ...state } })
    return createdModel
  },

  deleteItem: async (id: string) => {
    const [idStr, type] = id.split('.')
    const state = get().state
    let map
    switch (type) {
      case 'technology':
        map = state.technologies
        break
      case 'component':
        map = state.components
        break
      case 'dataEntity':
        map = state.dataEntities
        break
      case 'control':
        map = state.controls
        break
      case 'threatClass':
        map = state.threatClasses
        break
      case 'attackStep':
        map = state.attackSteps
        break
      case 'threatScenario':
        map = state.threatScenarios
        break
      case 'damageScenario':
        map = state.damageScenarios
        break
      case 'compromise':
        map = state.compromises
        break
      case 'cybersecurityGoal':
        map = state.cybersecurityGoals
        break
    }

    if (supportsApiDeleteType(type as ModelType)) {
      await deleteApiModel(type as ModelType, +idStr)
      refreshTreeIfLoaded(get)
    }

    map?.delete(+idStr)

    set({ state: { ...state } })
  },

  isConnectable: (
    fromId: number,
    fromType: ModelType,
    toId: number,
    toType: ModelType
  ): boolean => {
    const state = get().state
    const resolved = resolveConnectionDirection(
      state,
      fromId,
      fromType,
      toId,
      toType
    )
    if (!resolved) {
      return false
    }
    const value = (resolved.source as any)[resolved.property] as
      | number
      | number[]
      | undefined
    if (value == undefined) {
      return true
    }
    if (typeof value == 'number') {
      return value !== resolved.targetId
    }
    return !value.includes(resolved.targetId)
  },

  deleteConnection: async (
    fromId: number,
    fromType: ModelType,
    toId: number,
    toType: ModelType
  ): Promise<void> => {
    const state = get().state
    const resolved = resolveConnectionDirection(
      state,
      fromId,
      fromType,
      toId,
      toType
    )
    if (!resolved) {
      throw new Error(`Connection not found!`)
    }
    const map = getMapForType(state, resolved.sourceType)
    const source = { ...resolved.source } as any
    const value = source[resolved.property] as number | number[] | undefined
    if (value == undefined) {
      throw new Error(`Value not found!`)
    }
    if (typeof value == 'number') {
      source[resolved.property] = null
      if (supportsApiUpdateType(resolved.sourceType)) {
        const savedModel = await updateModel(resolved.sourceType, source)
        map.set(savedModel.id, savedModel as any)
        set({ state: { ...state } })
        await reloadProjectStateAfterRelationshipUpdate(
          get,
          resolved.sourceType,
          savedModel
        )
        refreshTreeIfLoaded(get)
        return
      } else {
        map.set(resolved.sourceId, source)
      }
      set({ state: { ...state } })
      return
    }
    source[resolved.property] = value.filter((item) => item !== resolved.targetId)
    if (supportsApiUpdateType(resolved.sourceType)) {
      const savedModel = await updateModel(resolved.sourceType, source)
      map.set(savedModel.id, savedModel as any)
      set({ state: { ...state } })
      await reloadProjectStateAfterRelationshipUpdate(
        get,
        resolved.sourceType,
        savedModel
      )
      refreshTreeIfLoaded(get)
      return
    } else {
      map.set(resolved.sourceId, source)
    }
    set({ state: { ...state } })
  },

  addConnection: async (
    fromId: number,
    fromType: ModelType,
    toId: number,
    toType: ModelType
  ): Promise<void> => {
    const state = get().state
    const resolved = resolveConnectionDirection(
      state,
      fromId,
      fromType,
      toId,
      toType
    )
    if (!resolved) {
      throw new Error(`Connection not found!`)
    }
    const map = getMapForType(state, resolved.sourceType)
    const source = { ...resolved.source } as any
    const value = source[resolved.property] as number | number[] | undefined
    if (value == undefined) {
      source[resolved.property] = resolved.targetId
      if (supportsApiUpdateType(resolved.sourceType)) {
        const savedModel = await updateModel(resolved.sourceType, source)
        map.set(savedModel.id, savedModel as any)
        set({ state: { ...state } })
        await reloadProjectStateAfterRelationshipUpdate(
          get,
          resolved.sourceType,
          savedModel
        )
        refreshTreeIfLoaded(get)
        return
      } else {
        map.set(resolved.sourceId, source)
      }
      set({ state: { ...state } })
      return
    }
    if (typeof value == 'number') {
      throw new Error(`Value already present`)
    }
    if (value.includes(resolved.targetId)) {
      return
    }
    source[resolved.property] = [...value, resolved.targetId]
    if (supportsApiUpdateType(resolved.sourceType)) {
      const savedModel = await updateModel(resolved.sourceType, source)
      map.set(savedModel.id, savedModel as any)
      set({ state: { ...state } })
      await reloadProjectStateAfterRelationshipUpdate(
        get,
        resolved.sourceType,
        savedModel
      )
      refreshTreeIfLoaded(get)
      return
    } else {
      map.set(resolved.sourceId, source)
    }
    set({ state: { ...state } })
  },
}))

export function keyToModelType(type: keyof ModelState): ModelType {
  const table = {
    technologies: 'technology',
    components: 'component',
    dataEntities: 'dataEntity',
    controls: 'control',
    threatClasses: 'threatClass',
    attackSteps: 'attackStep',
    threatScenarios: 'threatScenario',
    damageScenarios: 'damageScenario',
    compromises: 'compromise',
    cybersecurityGoals: 'cybersecurityGoal',
  } as Record<keyof ModelState, ModelType>
  return table[type]
}

export function modelTypeToKey(modelType: ModelType): keyof ModelState {
  const table = {
    technology: 'technologies',
    component: 'components',
    dataEntity: 'dataEntities',
    control: 'controls',
    threatClass: 'threatClasses',
    attackStep: 'attackSteps',
    threatScenario: 'threatScenarios',
    damageScenario: 'damageScenarios',
    compromise: 'compromises',
    cybersecurityGoal: 'cybersecurityGoals',
  } as Record<ModelType, keyof ModelState>

  return table[modelType]
}

export function connectionType(
  current: ModelType,
  target: ModelType
): 'one' | 'many' | null {
  const table = {
    technology: [],
    component: [
      ['component', 'many'],
      ['technology', 'many'],
    ],
    dataEntity: [
      ['component', 'one'],
      ['technology', 'many'],
    ],
    control: [['component', 'one'], ['threatScenario', 'many']],
    threatClass: [],
    attackStep: [
      ['component', 'one'],
      ['control', 'many'],
      ['attackStep', 'many'],
      ['threatScenario', 'many'],
      ['threatClass', 'one'],
    ],
    threatScenario: [
      ['component', 'many'],
      ['attackStep', 'many'],
      ['damageScenario', 'many'],
      ['threatClass', 'one'],
    ],
    damageScenario: [
      ['threatScenario', 'many'],
    ],
    compromise: [
      ['component', 'one'],
      ['threatScenario', 'one'],
    ],
    cybersecurityGoal: [
      ['damageScenario', 'many'],
      ['control', 'many'],
    ],
  } as Record<ModelType, [ModelType, 'many' | 'one'][]>

  const res = table[current].find((el) => el[0] == target)

  if (res == undefined) {
    return null
  }

  return res[1]
}

export function connectionProperty(
  current: ModelType,
  target: ModelType
): string | null {
  const table = {
    technology: {},
    component: {
      component: 'communicates_with',
      technology: 'technology',
    },
    dataEntity: {
      component: 'component',
      technology: 'technology',
    },
    control: {
      component: 'component',
      threatScenario: 'threat_scenarios',
    },
    threatClass: {},
    attackStep: {
      component: 'component',
      control: 'controls',
      attackStep: 'previous_steps',
      threatScenario: 'threat_scenarios',
      threatClass: 'threat_class',
    },
    threatScenario: {
      component: 'components',
      attackStep: 'attack_steps',
      damageScenario: 'damage_scenarios',
      threatClass: 'threat_class',
    },
    damageScenario: {
      threatScenario: 'threat_scenarios',
    },
    compromise: {
      component: 'component',
      threatScenario: 'threat_scenario',
    },
    cybersecurityGoal: {
      damageScenario: 'damage_scenarios',
      control: 'controls',
    },
  } as Record<ModelType, Record<ModelType, string | undefined>>

  return table[current][target] ?? null
}

export function modelToId(type: ModelType, model: Model) {
  return `${model.id}.${type}`
}
