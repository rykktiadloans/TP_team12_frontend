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
  const state = useModelStore((store) => store.state)
  const nodes = React.useMemo(() => stateToNodes(state), [state])
  const edges = React.useMemo(() => stateToEdges(state), [state])
  return (
    <div className="h-full w-full flex flex-col">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <div className="font-medium">Main</div>
        <div className="text-xs text-muted-foreground">Connections view</div>
        <div className="ml-auto flex items-center gap-2">
          <NewModelButton />
        </div>
      </div>

      {nodes.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <div>
            <div className="text-sm font-medium">This project has no models yet.</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Start by creating a component, then connect the rest of the TARA items to it.
            </div>
          </div>
        </div>
      ) : (
        <MainCardView nodes={nodes} edges={edges} />
      )}
    </div>
  )
}

export function getName(model: Model): string {
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
    'controls'
  )

  const attackStepSelf = attackSteps.flatMap((step) =>
    (step.previous_steps ?? []).map((previousStepId) => {
      const previousStep = state.attackSteps.get(previousStepId)
      if (!previousStep) {
        return null
      }
      return [
        modelToId('attackStep', previousStep),
        modelToId('attackStep', step),
      ].join('-')
    })
  ).filter((edge): edge is string => edge != null)

  const attackStepThreatClass = toOne(
    attackSteps,
    'attackStep',
    'threat_class',
    'threatClass',
    state.threatClasses
  )

  const threatScenarioAttackStep = toMany(
    threatScenarios,
    'threatScenario',
    attackSteps,
    'attackStep',
    'attack_steps'
  )

  const attackStepThreatScenarios = toMany(
    attackSteps,
    'attackStep',
    threatScenarios,
    'threatScenario',
    'threat_scenarios'
  )

  const threatScenarioThreatClass = toOne(
    threatScenarios,
    'threatScenario',
    'threat_class',
    'threatClass',
    state.threatClasses
  )

  const threatScenarioComponent = toMany(
    threatScenarios,
    'threatScenario',
    components,
    'component',
    'components'
  )

  const threatScenarioDamageScenario = toMany(
    threatScenarios,
    'threatScenario',
    damageScenarios,
    'damageScenario',
    'damage_scenarios'
  )

  const damageScenarioThreatScenario = toMany(
    damageScenarios,
    'damageScenario',
    threatScenarios,
    'threatScenario',
    'threat_scenarios'
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
    ...attackStepThreatScenarios,
    ...threatScenarioAttackStep,
    ...threatScenarioComponent,
    ...threatScenarioThreatClass,
    ...threatScenarioDamageScenario,
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
