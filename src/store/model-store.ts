import type {
  AttackStepModel,
  ComponentModel,
  CompromisesModel,
  ControlModel,
  DamageScenarioModel,
  DataEntityModel,
  Model,
  ModelType,
  NodeModel,
  TechnologyModel,
  ThreatClassModel,
  ThreatScenarioModel,
} from '@/types/models'

import { create } from 'zustand'

export interface ModelState {
  nodes: Map<number, NodeModel>
  technologies: Map<number, TechnologyModel>
  components: Map<number, ComponentModel>
  dataEntities: Map<number, DataEntityModel>
  controls: Map<number, ControlModel>
  threatClasses: Map<number, ThreatClassModel>
  attackSteps: Map<number, AttackStepModel>
  threatScenarios: Map<number, ThreatScenarioModel>
  damageScenarios: Map<number, DamageScenarioModel>
  compromises: Map<number, CompromisesModel>
}

export interface ModelStore {
  state: ModelState
  getItem: (id: string) => Model | null
  setItem: (type: ModelType, model: Model) => void
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
  ) => void
  addConnection: (
    fromId: number,
    fromType: ModelType,
    toId: number,
    toType: ModelType
  ) => void
}

const defaultState: ModelState = {
  nodes: new Map(),
  technologies: new Map(),
  components: new Map(),
  dataEntities: new Map(),
  controls: new Map(),
  threatClasses: new Map(),
  attackSteps: new Map(),
  threatScenarios: new Map(),
  damageScenarios: new Map(),
  compromises: new Map(),
}

const testState: ModelState = {
  nodes: new Map<number, NodeModel>([]),
  technologies: new Map<number, TechnologyModel>([
    [
      1,
      {
        id: 1,
        name: 'Technology name 1',
        description: 'desc',
        project: 1,
      },
    ],
    [
      2,
      {
        id: 2,
        name: 'Second technology',
        description: 'Something',
        project: 1,
      },
    ],
  ]),
  components: new Map<number, ComponentModel>([
    [
      1,
      {
        id: 1,
        name: 'Component',
        description: 'Something',
        communicates_with: [2],
        technology: [1],
        project: 1,
      },
    ],
    [
      2,
      {
        id: 2,
        name: 'Component of 2',
        description: 'Something else',
        communicates_with: [1],
        technology: [],
        project: 1,
      },
    ],
  ]),
  dataEntities: new Map<number, DataEntityModel>([
    [
      1,
      {
        id: 1,
        name: 'Data entity',
        description: 'some',
        component: 1,
        technology: [],
        project: 1,
      },
    ],
  ]),
  controls: new Map<number, ControlModel>([]),
  threatClasses: new Map<number, ThreatClassModel>([]),
  attackSteps: new Map<number, AttackStepModel>([]),
  threatScenarios: new Map<number, ThreatScenarioModel>([]),
  damageScenarios: new Map([]),
  compromises: new Map([]),
}

export const useModelStore = create<ModelStore>((set, get) => ({
  state: testState,

  getItem: (id: string) => {
    if (id.split('.').length < 2) {
      return null
    }
    const state = get().state
    const n = +id.split('.')[0]
    const type = id.split('.')[1] as ModelType
    switch (type) {
      case 'node':
        return state.nodes.get(n) ?? null
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
      default:
        return null
    }
  },

  setItem: (type: ModelType, model: Model) => {
    const state = get().state
    let map
    switch (type) {
      case 'node':
        map = state.nodes
        map.set(model.id, model as NodeModel)
        break
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
    }

    set({state: {...state}})
    console.log('updated')
  },

  isConnectable: (
    fromId: number,
    fromType: ModelType,
    toId: number,
    toType: ModelType
  ): boolean => {
    const state = get().state
    const map = state[modelTypeToKey(fromType)]
    const from = map.get(fromId)
    if (from == undefined) {
      return false
    }
    const connection = connectionProperty(fromType, toType)
    if (connection == null) {
      return false
    }
    const value = from[connection] as number | number[] | undefined
    if (value == undefined) {
      return true
    }
    if (typeof value == 'number') {
      return false
    }
    return !value.includes(toId)
  },

  deleteConnection: (
    fromId: number,
    fromType: ModelType,
    toId: number,
    toType: ModelType
  ): void => {
    const state = get().state
    const map = state[modelTypeToKey(fromType)]
    const from = map.get(fromId)
    if (from == undefined) {
      throw new Error(`Source not found! ${fromId} ${fromType}`)
      return
    }
    const connection = connectionProperty(fromType, toType)
    if (connection == null) {
      throw new Error(`Connection not found!`)
      return
    }
    const value = from[connection] as number | number[] | undefined
    if (value == undefined) {
      throw new Error(`Value not found!`)
      return
    }
    if (typeof value == 'number') {
      from[connection] = null
      map.set(fromId, from)
      state[modelTypeToKey(fromType)] = map
      set({ state: state })
      return
    }
    value.splice(value.indexOf(toId), 1)
    from[connection] = value
    map.set(fromId, from)
    state[modelTypeToKey(fromType)] = map
    set({ state: state })
  },

  addConnection: (
    fromId: number,
    fromType: ModelType,
    toId: number,
    toType: ModelType
  ): void => {
    const state = get().state
    const map = state[modelTypeToKey(fromType)]
    const from = map.get(fromId)
    if (from == undefined) {
      throw new Error(`Source not found! ${fromId} ${fromType}`)
      return
    }
    const connection = connectionProperty(fromType, toType)
    if (connection == null) {
      throw new Error(`Connection not found!`)
      return
    }
    const value = from[connection] as number | number[] | undefined
    if (value == undefined) {
      from[connection] = toId
      map.set(fromId, from)
      state[modelTypeToKey(fromType)] = map
      set({ state: state })
      return
    }
    if (typeof value == 'number') {
      throw new Error(`Value already present`)
    }
    value.push(toId)
    from[connection] = value
    map.set(fromId, from)
    state[modelTypeToKey(fromType)] = map
    set({ state: state })
  },
}))

export function keyToModelType(type: keyof ModelState): ModelType {
  const table = {
    nodes: 'node',
    technologies: 'technology',
    components: 'component',
    dataEntities: 'dataEntity',
    controls: 'control',
    threatClasses: 'threatClass',
    attackSteps: 'attackStep',
    threatScenarios: 'threatScenario',
    damageScenarios: 'damageScenario',
    compromises: 'compromise',
  } as Record<keyof ModelState, ModelType>
  return table[type]
}

export function modelTypeToKey(modelType: ModelType): keyof ModelState {
  const table = {
    node: 'nodes',
    technology: 'technologies',
    component: 'components',
    dataEntity: 'dataEntities',
    control: 'controls',
    threatClass: 'threatClasses',
    attackStep: 'attackSteps',
    threatScenario: 'threatScenarios',
    damageScenario: 'damageScenarios',
    compromise: 'compromises',
  } as Record<ModelType, keyof ModelState>

  return table[modelType]
}

export function connectionType(
  current: ModelType,
  target: ModelType
): 'one' | 'many' | null {
  const table = {
    node: [],
    technology: [],
    component: [
      ['component', 'many'],
      ['technology', 'many'],
    ],
    dataEntity: [
      ['component', 'one'],
      ['technology', 'many'],
    ],
    control: [['component', 'one']],
    threatClass: [],
    attackStep: [
      ['component', 'one'],
      ['control', 'many'],
      ['attackStep', 'many'],
      ['threatClass', 'one'],
    ],
    threatScenario: [
      ['attackStep', 'one'],
      ['threatClass', 'one'],
    ],
    damageScenario: [
      ['component', 'one'],
      ['threatScenario', 'one'],
    ],
    compromise: [
      ['component', 'one'],
      ['threatScenario', 'one'],
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
    node: {},
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
    },
    threatClass: {},
    attackStep: {
      component: 'component',
      control: 'control',
      attackStep: 'prepared_by',
      threatClass: 'threat_class',
    },
    threatScenario: {
      attackStep: 'attackStep',
      threatClass: 'threat_class',
    },
    damageScenario: {
      component: 'component',
      threatScenario: 'threat_scenario',
    },
    compromise: {
      component: 'component',
      threatScenario: 'threat_scenario',
    },
  } as Record<ModelType, Record<ModelType, string | undefined>>

  return table[current][target] ?? null
}

export function modelToId(type: ModelType, model: Model) {
  return `${model.id}.${type}`
}

