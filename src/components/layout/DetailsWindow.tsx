import * as React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useSelectedItem } from '@/context/SelectedItemContext'
import {
  connectionType,
  modelToId,
  useModelStore,
  type ModelState,
} from '@/store/model-store'
import { getName } from './MainCardsWindow'
import { ModelForm } from '../details/ModelForm'
import type { Model, ModelType } from '@/types/models'
import { Button } from '../ui/button'
import { createDefaultModel, hasRequiredName } from '@/lib/modelFactory'
import { Plus } from 'lucide-react'

export function DetailsWindow() {
  const selected = useSelectedItem()
  const state = useModelStore((store) => store.state)
  const storeSelectedId = useModelStore((store) => store.selectedId)
  const getItem = useModelStore((store) => store.getItem)
  const setItem = useModelStore((store) => store.setItem)
  const setStoreSelectedId = useModelStore((store) => store.setSelectedId)
  const deleteItem = useModelStore((store) => store.deleteItem)
  const addItem = useModelStore((store) => store.addItem)
  const addConnection = useModelStore((store) => store.addConnection)
  const isConnectable = useModelStore((store) => store.isConnectable)
  const activeSelectedId = storeSelectedId || selected.selectedItem || ''
  const item = getItem(activeSelectedId)
  const type = (
    activeSelectedId ? activeSelectedId.split('.')[1] : ''
  ) as ModelType
  const title = item ? getName(item) : 'Unselected'
  const [creatorOpen, setCreatorOpen] = React.useState(false)
  const [creatorType, setCreatorType] = React.useState<ModelType | ''>('')
  const [creatorModel, setCreatorModel] = React.useState<Model>({ id: -1 })
  const [existingTargetId, setExistingTargetId] = React.useState('')
  const [creatorError, setCreatorError] = React.useState('')
  const relatedCreateTypes = React.useMemo(
    () => (type ? getRelevantRelatedTypes(type) : []),
    [type]
  )
  const existingCandidates = React.useMemo(() => {
    if (!creatorType || !activeSelectedId || !type) {
      return []
    }

    const [currentId] = activeSelectedId.split('.')
    const currentNumericId = Number(currentId)

    return getModelsForType(creatorType, state)
      .filter((candidate) => candidate.id !== currentNumericId || creatorType !== type)
      .filter((candidate) =>
        isConnectable(currentNumericId, type, candidate.id, creatorType)
      )
      .map((candidate) => ({
        id: modelToId(creatorType, candidate),
        numericId: candidate.id,
        label: getName(candidate),
      }))
  }, [activeSelectedId, creatorType, isConnectable, state, type])

  const onDelete = async () => {
    if (activeSelectedId) {
      setStoreSelectedId('')
      selected.setSelectedItem(null)
      try {
        await deleteItem(activeSelectedId)
      } catch (error) {
        console.error(error)
      }
    }
  }

  const handleRelatedSelect = React.useCallback(
    (id: string) => {
      setStoreSelectedId(id)
      selected.setSelectedItem(id)
    },
    [selected, setStoreSelectedId]
  )

  const handleOpenCreator = React.useCallback(() => {
    const defaultType = relatedCreateTypes[0] ?? ''
    setCreatorType(defaultType)
    setCreatorModel(defaultType ? createDefaultModel(defaultType) : { id: -1 })
    setExistingTargetId('')
    setCreatorError('')
    setCreatorOpen(true)
  }, [relatedCreateTypes])

  const handleCloseCreator = React.useCallback(() => {
    setCreatorOpen(false)
    setCreatorType('')
    setCreatorModel({ id: -1 })
    setExistingTargetId('')
    setCreatorError('')
  }, [])

  const handleCreatorTypeChange = React.useCallback((nextType: ModelType) => {
    setCreatorType(nextType)
    setCreatorModel(createDefaultModel(nextType))
    setExistingTargetId('')
  }, [])

  React.useEffect(() => {
    if (!creatorOpen) {
      return
    }

    if (existingCandidates.length === 0) {
      setExistingTargetId('')
      return
    }

    setExistingTargetId((current) =>
      current && existingCandidates.some((candidate) => candidate.id === current)
        ? current
        : existingCandidates[0].id
    )
  }, [creatorOpen, existingCandidates])

  const handleCreateRelated = React.useCallback(async () => {
    if (!creatorType || !activeSelectedId || !type) {
      return
    }

    const [currentId] = activeSelectedId.split('.')

    try {
      setCreatorError('')
      const createdModel = await addItem(creatorType, creatorModel)
      await addConnection(+currentId, type, createdModel.id, creatorType)
      const nextId = modelToId(creatorType, createdModel)
      setStoreSelectedId(nextId)
      selected.setSelectedItem(nextId)
      handleCloseCreator()
    } catch (error) {
      console.error(error)
      setCreatorError('Could not create and connect the related model.')
    }
  }, [
    activeSelectedId,
    addConnection,
    addItem,
    creatorModel,
    creatorType,
    handleCloseCreator,
    selected,
    setStoreSelectedId,
    type,
  ])

  const handleConnectExisting = React.useCallback(async () => {
    if (!existingTargetId || !activeSelectedId || !type || !creatorType) {
      return
    }

    const [currentId] = activeSelectedId.split('.')
    const [targetId] = existingTargetId.split('.')

    try {
      setCreatorError('')
      await addConnection(+currentId, type, +targetId, creatorType)
      setStoreSelectedId(existingTargetId)
      selected.setSelectedItem(existingTargetId)
      handleCloseCreator()
    } catch (error) {
      console.error(error)
      setCreatorError('Could not connect the selected existing model.')
    }
  }, [
    activeSelectedId,
    addConnection,
    creatorType,
    existingTargetId,
    handleCloseCreator,
    selected,
    setStoreSelectedId,
    type,
  ])

  const form = item ? (
    <>
      <ModelForm
        model={{
          type: type,
          item: item,
        }}
        setModel={(item) => setItem(type, item.item)}
      />
      <Button variant="destructive" onClick={onDelete}>
        Delete
      </Button>
    </>
  ) : null
  const relatedItems = item ? getRelatedItems(type, item, state) : []
  const setCreatorFormModel = React.useCallback(
    (nextModel: { type: ModelType; item: Model }) => {
      setCreatorModel(nextModel.item)
    },
    []
  )

  return (
    <div className="h-full min-h-0 w-full flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b">
        <div className="text-sm font-medium flex items-center gap-2">
          {title} {activeSelectedId ? <Badge>{type}</Badge> : null}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full w-full">
          <div className="p-3 flex flex-col gap-3 justify-baseline">
            {form}
            {item ? (
              <>
                <Separator />
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">Relations</div>
                    {relatedCreateTypes.length ? (
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        onClick={handleOpenCreator}
                        aria-label="Add related model"
                        title="Add related model"
                      >
                        <Plus />
                      </Button>
                    ) : null}
                  </div>
                  {relatedItems.length ? (
                    relatedItems.map((group) => (
                      <div key={group.label} className="flex flex-col gap-2">
                        <div className="text-xs text-muted-foreground">{group.label}</div>
                        <div className="flex flex-wrap gap-2">
                          {group.items.map((related) => (
                            <button
                              key={related.id}
                              type="button"
                              className="rounded-full border border-border px-2 py-1 text-xs transition-colors hover:bg-muted"
                              onClick={() => handleRelatedSelect(related.id)}
                            >
                              {related.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No relations yet.
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </ScrollArea>
      </div>

      {creatorOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg">
            <div className="mb-4">
              <div className="text-lg font-semibold">Add Related Model</div>
              <div className="text-sm text-muted-foreground">
                Create a new model and connect it to {title}.
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium" htmlFor="related-model-type">
                Type
              </label>
              <select
                id="related-model-type"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
                value={creatorType}
                onChange={(event) => handleCreatorTypeChange(event.target.value as ModelType)}
              >
                <option value="">Select a related type</option>
                {relatedCreateTypes.map((itemType) => (
                  <option key={itemType} value={itemType}>
                    {formatModelTypeLabel(itemType)}
                  </option>
                ))}
              </select>
            </div>

            {creatorType ? (
              <div className="mb-4 rounded-md border border-border p-3">
                <div className="mb-2 text-sm font-medium">Pick Existing</div>
                {existingCandidates.length ? (
                  <div className="flex gap-2">
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
                      value={existingTargetId}
                      onChange={(event) => setExistingTargetId(event.target.value)}
                    >
                      {existingCandidates.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      type="button"
                      disabled={!existingTargetId}
                      onClick={handleConnectExisting}
                    >
                      Connect Existing
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No existing {formatModelTypeLabel(creatorType).toLowerCase()} can be connected here right now.
                  </div>
                )}
              </div>
            ) : null}

            {creatorType ? (
              <div className="mb-4 rounded-md border border-border p-3">
                <div className="mb-3 text-sm font-medium">Or Create New</div>
                <ModelForm
                  model={{ type: creatorType, item: creatorModel }}
                  setModel={setCreatorFormModel}
                />
              </div>
            ) : null}

            {creatorError ? (
              <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {creatorError}
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={handleCloseCreator}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!creatorType || !hasRequiredName(creatorModel)}
                onClick={handleCreateRelated}
              >
                Create New
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const allModelTypes: ModelType[] = [
  'technology',
  'component',
  'dataEntity',
  'control',
  'threatClass',
  'attackStep',
  'threatScenario',
  'damageScenario',
  'compromise',
]

function getRelevantRelatedTypes(currentType: ModelType) {
  return allModelTypes.filter(
    (candidate) =>
      connectionType(currentType, candidate) != null ||
      connectionType(candidate, currentType) != null
  )
}

function formatModelTypeLabel(type: ModelType) {
  const labels: Record<ModelType, string> = {
    technology: 'Technology',
    component: 'Component',
    dataEntity: 'Data Entity',
    control: 'Control',
    threatClass: 'Threat Class',
    attackStep: 'Attack Step',
    threatScenario: 'Threat Scenario',
    damageScenario: 'Damage Scenario',
    compromise: 'Compromise',
  }

  return labels[type]
}

function getModelsForType(type: ModelType, state: ModelState): Model[] {
  const maps: Record<ModelType, Map<number, Model>> = {
    technology: state.technologies as Map<number, Model>,
    component: state.components as Map<number, Model>,
    dataEntity: state.dataEntities as Map<number, Model>,
    control: state.controls as Map<number, Model>,
    threatClass: state.threatClasses as Map<number, Model>,
    attackStep: state.attackSteps as Map<number, Model>,
    threatScenario: state.threatScenarios as Map<number, Model>,
    damageScenario: state.damageScenarios as Map<number, Model>,
    compromise: state.compromises as Map<number, Model>,
  }

  return [...maps[type].values()]
}

function asRelatedItem(type: ModelType, model: Model | null | undefined) {
  if (!model) {
    return null
  }

  return {
    id: modelToId(type, model),
    label: getName(model),
  }
}

function listFromIds(
  type: ModelType,
  ids: number[],
  map: Map<number, Model>
) {
  return ids
    .map((id) => asRelatedItem(type, map.get(id) ?? null))
    .filter((item): item is { id: string; label: string } => item != null)
}

function getRelatedItems(type: ModelType, item: Model, state: ModelState) {
  switch (type) {
    case 'technology': {
      const technology = item as Model & { id: number }
      return [
        {
          label: 'Components',
          items: [...state.components.values()]
            .filter((component) => component.technology.includes(technology.id))
            .map((component) => ({
              id: modelToId('component', component),
              label: component.name,
            })),
        },
        {
          label: 'Data Entities',
          items: [...state.dataEntities.values()]
            .filter((entity) => entity.technology.includes(technology.id))
            .map((entity) => ({
              id: modelToId('dataEntity', entity),
              label: entity.name,
            })),
        },
      ].filter((group) => group.items.length)
    }
    case 'component': {
      const component = item as Model & { id: number; communicates_with: number[]; technology: number[] }
      return [
        { label: 'Communicates With', items: listFromIds('component', component.communicates_with, state.components as Map<number, Model>) },
        { label: 'Technologies', items: listFromIds('technology', component.technology, state.technologies as Map<number, Model>) },
        {
          label: 'Data Entities',
          items: [...state.dataEntities.values()]
            .filter((entity) => entity.component === component.id)
            .map((entity) => ({ id: modelToId('dataEntity', entity), label: entity.name })),
        },
        {
          label: 'Controls',
          items: [...state.controls.values()]
            .filter((control) => control.component === component.id)
            .map((control) => ({ id: modelToId('control', control), label: control.name })),
        },
        {
          label: 'Attack Steps',
          items: [...state.attackSteps.values()]
            .filter((step) => step.component === component.id)
            .map((step) => ({ id: modelToId('attackStep', step), label: step.name })),
        },
        {
          label: 'Damage Scenarios',
          items: [...state.damageScenarios.values()]
            .filter((scenario) => scenario.component === component.id)
            .map((scenario) => ({ id: modelToId('damageScenario', scenario), label: scenario.name })),
        },
      ].filter((group) => group.items.length)
    }
    case 'dataEntity': {
      const entity = item as Model & { component: number | null; technology: number[] }
      return [
        { label: 'Component', items: listFromIds('component', entity.component == null ? [] : [entity.component], state.components as Map<number, Model>) },
        { label: 'Technologies', items: listFromIds('technology', entity.technology, state.technologies as Map<number, Model>) },
      ].filter((group) => group.items.length)
    }
    case 'control': {
      const control = item as Model & { component: number | null; attack_steps: number[] }
      return [
        { label: 'Component', items: listFromIds('component', control.component == null ? [] : [control.component], state.components as Map<number, Model>) },
        { label: 'Attack Steps', items: listFromIds('attackStep', control.attack_steps ?? [], state.attackSteps as Map<number, Model>) },
      ].filter((group) => group.items.length)
    }
    case 'attackStep': {
      const attackStep = item as Model & {
        component: number | null
        controls: number[]
        threat_scenarios: number[]
        previous_steps: number[]
      }
      return [
        { label: 'Component', items: listFromIds('component', attackStep.component == null ? [] : [attackStep.component], state.components as Map<number, Model>) },
        { label: 'Controls', items: listFromIds('control', attackStep.controls ?? [], state.controls as Map<number, Model>) },
        { label: 'Previous Steps', items: listFromIds('attackStep', attackStep.previous_steps ?? [], state.attackSteps as Map<number, Model>) },
        {
          label: 'Next Steps',
          items: [...state.attackSteps.values()]
            .filter((step) => step.previous_steps.includes(attackStep.id))
            .map((step) => ({ id: modelToId('attackStep', step), label: step.name })),
        },
        { label: 'Threat Scenarios', items: listFromIds('threatScenario', attackStep.threat_scenarios ?? [], state.threatScenarios as Map<number, Model>) },
      ].filter((group) => group.items.length)
    }
    case 'threatScenario': {
      const scenario = item as Model & { attack_steps: number[]; damage_scenarios: number[] }
      return [
        { label: 'Attack Steps', items: listFromIds('attackStep', scenario.attack_steps ?? [], state.attackSteps as Map<number, Model>) },
        { label: 'Damage Scenarios', items: listFromIds('damageScenario', scenario.damage_scenarios ?? [], state.damageScenarios as Map<number, Model>) },
      ].filter((group) => group.items.length)
    }
    case 'damageScenario': {
      const scenario = item as Model & { component: number | null; threat_scenarios: number[] }
      return [
        { label: 'Component', items: listFromIds('component', scenario.component == null ? [] : [scenario.component], state.components as Map<number, Model>) },
        { label: 'Threat Scenarios', items: listFromIds('threatScenario', scenario.threat_scenarios ?? [], state.threatScenarios as Map<number, Model>) },
      ].filter((group) => group.items.length)
    }
    case 'compromise': {
      const compromise = item as Model & { component: number | null; threat_scenario: number | null }
      return [
        { label: 'Component', items: listFromIds('component', compromise.component == null ? [] : [compromise.component], state.components as Map<number, Model>) },
        { label: 'Threat Scenario', items: listFromIds('threatScenario', compromise.threat_scenario == null ? [] : [compromise.threat_scenario], state.threatScenarios as Map<number, Model>) },
      ].filter((group) => group.items.length)
    }
    default:
      return []
  }
}
