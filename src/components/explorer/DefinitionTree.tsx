import { useMemo, useState } from 'react'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import {
  DefinitionTreeItem,
  type DefinitionTreeNode,
} from './DefinitionTreeItem'
import { modelToId, useModelStore, type ModelState } from '@/store/model-store'

export function DefinitionTree() {
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState('')
  const state = useModelStore((state) => state.state)
  const tree = useMemo(() => modelStateToTreeItems(state), [state])
  return (
    <>
      <div className="px-3 pt-3">
        <Input
          placeholder="Filter…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <div className="space-y-1">
          {tree.map((n) => (
            <DefinitionTreeItem
              key={n.id}
              node={n}
              onSelect={setSelected}
              selectedId={selected}
              filter={filter}
            />
          ))}
        </div>
      </ScrollArea>
    </>
  )
}

function modelStateToTreeItems(state: ModelState): DefinitionTreeNode[] {
  const keys = Object.keys(state) as (keyof ModelState)[]
  return keys.map((key): DefinitionTreeNode => {
    switch (key) {
      case 'nodes': {
        const values = [...state[key].values()]
        return {
          id: 'nodes',
          label: 'Nodes',
          kind: 'main-component',
          children: values.map(
            (node): DefinitionTreeNode => ({
              id: modelToId('node', node),
              label: node.title,
              kind: 'sub-component',
            })
          ),
        }
      }
      case 'technologies': {
        const values = [...state[key].values()]
        return {
          id: 'technologies',
          label: 'Technologies',
          kind: 'main-component',
          children: values.map(
            (tech): DefinitionTreeNode => ({
              id: modelToId('technology', tech),
              label: tech.name,
              kind: 'sub-component',
            })
          ),
        }
      }
      case 'components': {
        const values = [...state[key].values()]
        return {
          id: 'components',
          label: 'Components',
          kind: 'main-component',
          children: values.map(
            (component): DefinitionTreeNode => ({
              id: modelToId('component', component),
              label: component.name,
              kind: 'sub-component',
            })
          ),
        }
      }
      case 'dataEntities': {
        const values = [...state[key].values()]
        return {
          id: 'dataEntities',
          label: 'Data Entities',
          kind: 'main-component',
          children: values.map(
            (entity): DefinitionTreeNode => ({
              id: modelToId('dataEntity', entity),
              label: entity.name,
              kind: 'sub-component',
            })
          ),
        }
      }
      case 'controls': {
        const values = [...state[key].values()]
        return {
          id: 'controls',
          label: 'Controls',
          kind: 'main-component',
          children: values.map(
            (control): DefinitionTreeNode => ({
              id: modelToId('control', control),
              label: control.name,
              kind: 'sub-component',
            })
          ),
        }
      }
      case 'threatClasses': {
        const values = [...state[key].values()]
        return {
          id: 'threatClasses',
          label: 'Threat Classes',
          kind: 'main-component',
          children: values.map(
            (threat): DefinitionTreeNode => ({
              id: modelToId('threatClass', threat),
              label: threat.name,
              kind: 'sub-component',
            })
          ),
        }
      }
      case 'attackSteps': {
        const values = [...state[key].values()]
        return {
          id: 'attackSteps',
          label: 'Attack Steps',
          kind: 'main-component',
          children: values.map(
            (step): DefinitionTreeNode => ({
              id: modelToId('attackStep', step),
              label: step.name,
              kind: 'sub-component',
            })
          ),
        }
      }
      case 'threatScenarios': {
        const values = [...state[key].values()]
        return {
          id: 'threatScenarios',
          label: 'Threat Scenarios',
          kind: 'main-component',
          children: values.map(
            (scenario): DefinitionTreeNode => ({
              id: modelToId('threatScenario', scenario),
              label: scenario.name,
              kind: 'sub-component',
            })
          ),
        }
      }
      case 'damageScenarios': {
        const values = [...state[key].values()]
        return {
          id: 'damageScenarios',
          label: 'Damage Scenarios',
          kind: 'main-component',
          children: values.map(
            (scenario): DefinitionTreeNode => ({
              id: modelToId('damageScenario', scenario),
              label: scenario.name,
              kind: 'sub-component',
            })
          ),
        }
      }
      case 'compromises': {
        const values = [...state[key].values()]
        return {
          id: 'compromises',
          label: 'Compromises',
          kind: 'main-component',
          children: values.map(
            (compromise): DefinitionTreeNode => ({
              id: modelToId('compromise', compromise),
              label: String(compromise.id),
              kind: 'sub-component',
            })
          ),
        }
      }
    }
  })
}
