import * as React from 'react'
import { Button } from '@/components/ui/button'
import { MainCardView } from '../cards/MainCardView'
import {
  keyToModelType,
  modelToId,
  useModelStore,
  type ModelState,
} from '@/store/model-store'
import type { Model, ModelType } from '@/types/models'
import { NewModelButton } from '../new-model/NewModelButton'

export type Node = {
  id: string
  title: string
  desc?: string
  type: ModelType
  // "kinda grid but not really" positions (px) in a big canvas
}

export type Edge = {
  id: string
  from: string
  to: string
}

export function MainCardsWindow() {
  const store = useModelStore()
  const state = store.state
  const nodes = stateToNodes(state)
  const edges = stateToEdges(state)
  return (
    <div className="h-full w-full flex flex-col">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <div className="font-medium">Main</div>
        <div className="text-xs text-muted-foreground">Connections view</div>
        <div className="ml-auto flex items-center gap-2">
          <NewModelButton />
        </div>
      </div>

      <MainCardView nodes={nodes} edges={edges} />
    </div>
  )
}

export function getName(model: Model): string {
  if ('title' in model) {
    return String(model.title)
  }
  if ('name' in model) {
    return String(model.name)
  }
  return 'Compromise ' + model.id
}

function stateToNodes(state: ModelState): Node[] {
  const nodes = Object.entries(state).flatMap(
    ([name, map]: [string, Map<number, Model>]) => {
      const key = keyToModelType(name as keyof ModelState)
      const models = [...map.values()].map((model): Node => {
        const name = getName(model)

        let desc = null
        if ('description' in model) {
          desc = model.description
        }
        if ('content' in model) {
          desc = model.content
        }

        const node = {
          id: modelToId(key, model),
          title: name,
          desc: desc,
          type: key,
        } as Node

        if (desc == null) {
          delete node.desc
        }

        return node
      })

      return models
    }
  )

  return nodes
}

function stateToEdges(state: ModelState): Edge[] {
  const components = [...state.components.values()]
  const technologies = [...state.technologies.values()]
  const dataEntities = [...state.dataEntities.values()]
  const controls = [...state.controls.values()]
  const attackSteps = [...state.attackSteps.values()]
  const threatScenarios = [...state.threatScenarios.values()]
  const damageScenarios = [...state.damageScenarios.values()]
  const compromises = [...state.compromises.values()]

  const componentComponent = toMany(
    components,
    'component',
    components,
    'component',
    'communicates_with'
  )

  const componentTechnology = toMany(
    components,
    'component',
    technologies,
    'technology',
    'technology'
  )

  const dataEntityComponent = toOne(
    dataEntities,
    'dataEntity',
    'component',
    'component',
    state.components
  )

  const dataEntityTechnology = toMany(
    dataEntities,
    'dataEntity',
    technologies,
    'technology',
    'technology'
  )

  const controlComponent = toOne(
    controls,
    'control',
    'component',
    'component',
    state.components
  )

  const attackStepComponent = toOne(
    attackSteps,
    'attackStep',
    'component',
    'component',
    state.components
  )

  const attackStepControls = toMany(
    attackSteps,
    'attackStep',
    controls,
    'control',
    'control'
  )

  const attackStepSelf = toMany(
    attackSteps,
    'attackStep',
    attackSteps,
    'attackStep',
    'prepared_by'
  )

  const attackStepThreatClass = toOne(
    attackSteps,
    'attackStep',
    'threat_class',
    'threatClass',
    state.threatClasses
  )

  const threatScenarioAttackStep = toOne(
    threatScenarios,
    'threatScenario',
    'attackStep',
    'attackStep',
    state.attackSteps
  )

  const threatScenarioThreatClass = toOne(
    threatScenarios,
    'threatScenario',
    'threat_class',
    'threatClass',
    state.threatClasses
  )

  const damageScenarioComponent = toOne(
    damageScenarios,
    'damageScenario',
    'component',
    'component',
    state.components
  )

  const damageScenarioThreatScenario = toOne(
    damageScenarios,
    'damageScenario',
    'threat_scenario',
    'threatScenario',
    state.threatScenarios
  )

  const compromiseComponent = toOne(
    compromises,
    'compromise',
    'component',
    'component',
    state.components
  )

  const compromiseThreatScenario = toOne(
    compromises,
    'compromise',
    'threat_scenario',
    'threatScenario',
    state.threatScenarios
  )

  const all = [
    ...componentComponent,
    ...componentTechnology,
    ...dataEntityComponent,
    ...dataEntityTechnology,
    ...controlComponent,
    ...attackStepComponent,
    ...attackStepControls,
    ...attackStepSelf,
    ...attackStepThreatClass,
    ...threatScenarioAttackStep,
    ...threatScenarioThreatClass,
    ...damageScenarioComponent,
    ...damageScenarioThreatScenario,
    ...compromiseComponent,
    ...compromiseThreatScenario,
  ]

  return all.map((id): Edge => {
    const split = id.split('-')
    return {
      id: id,
      from: split[0],
      to: split[1],
    }
  })
}

function toOne<T extends Model, U extends Model>(
  current: T[],
  currentModelType: ModelType,
  key: keyof T,
  targetModelType: ModelType,
  map: Map<number, U>
): string[] {
  return current
    .map((cur): string | null => {
      const thisKey = modelToId(currentModelType, cur)
      const id = +cur[key]
      const t = map.get(id)
      if (t == undefined) {
        return null
      }
      return [thisKey, modelToId(targetModelType, t)].join('-')
    })
    .filter((el) => el != null)
}

function toMany<T extends Model, U extends Model>(
  current: T[],
  currentModelType: ModelType,
  target: U[],
  targetModelType: ModelType,
  key: keyof T
): string[] {
  return current.flatMap((cur): string[] => {
    const thisKey = modelToId(currentModelType, cur)
    const ids = cur[key] as number[]
    const others = target.filter((c) => ids.includes(c.id))
    return others.map((other) =>
      [thisKey, modelToId(targetModelType, other)].join('-')
    )
  })
}
