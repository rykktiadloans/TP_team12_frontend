import type {
  AttackStepModel,
  ComponentModel,
  CompromisesModel,
  ControlModel,
  DamageScenarioModel,
  DataEntityModel,
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
  state: ModelState,
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
  compromises: new Map()
}

const testState: ModelState = {
  nodes: new Map<number, NodeModel>([
    [
      1,
      {
        id: 1,
        title: 'node title',
        content: 'node content',
      },
    ],
  ]),
  technologies: new Map<number, TechnologyModel>([
    [
      1,
      {
        id: 1,
        name: 'Technology name 1',
        description: 'desc',
      },
    ],
    [
      2,
      {
        id: 2,
        name: 'Second technology',
        description: 'Something',
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
      },
    ],
  ]),
  dataEntities: new Map<number, DataEntityModel>([
    [
      1,
      {
        id: 1,
        name: 'First data entity',
        description: 'Description',
        component: 2,
        technology: [],
      },
    ],
    [
      2,
      {
        id: 2,
        name: 'Second data entity',
        description: 'Description',
        component: null,
        technology: [1],
      },
    ],
  ]),
  controls: new Map<number, ControlModel>([
    [
      1,
      {
        id: 1,
        name: 'Control',
        fr_et: 'fret',
        fr_se: 'se',
        fr_koC: 'cohk',
        fr_WoO: 'frwoo',
        fr_eq: 'frequency',
        component: 1,
      },
    ],
  ]),
  threatClasses: new Map<number, ThreatClassModel>([
    [
      1,
      {
        id: 1,
        name: 'Threat class',
        description: 'Something',
      },
    ],
  ]),
  attackSteps: new Map<number, AttackStepModel>([
    [
      1,
      {
        id: 1,
        name: 'First attack step',
        fr_et: 'fret',
        fr_se: 'se',
        fr_koC: 'cohk',
        fr_WoO: 'frwoo',
        fr_eq: 'frequency',
        component: null,
        control: [1],
        prepared_by: [],
        threat_class: 1,
      },
    ],
    [
      2,
      {
        id: 2,
        name: 'Second attack step',
        fr_et: 'fret',
        fr_se: 'se',
        fr_koC: 'cohk',
        fr_WoO: 'frwoo',
        fr_eq: 'frequency',
        component: 1,
        control: [],
        prepared_by: [],
        threat_class: null,
      },
    ],
  ]),
  threatScenarios: new Map<number, ThreatScenarioModel>([
    [
      1,
      {
        id: 1,
        name: 'Threat scenario',
        attackStep: null,
        threat_class: 1,
      },
    ],
    [
      2,
      {
        id: 2,
        name: 'Threat scenario 2',
        attackStep: 1,
        threat_class: null,
      },
    ],
  ]),
  damageScenarios: new Map([
    [
      1,
      {
        id: 1,
        name: 'damage scenario',
        affected_CIA_parts: 'parts',
        impact_scale: 'scale',
        safety_impact: 'unknown',
        finantial_impact: 'large',
        operational_impact: 'big',
        privacy_impact: 'small-ish',
        component: null,
        threat_scenario: 1,
      },
    ],
  ]),
  compromises: new Map([
    [
      1,
      {
        id: 1,
        affected_CIA_parts: 'none',
        component: 2,
        threat_scenario: 1,
      },
    ],
  ]),
}

export const useModelStore = create<ModelStore>(() => ({
  state: testState,
}))