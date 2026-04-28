import * as React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import {
  Blocks,
  ToyBrick,
  ChevronDown,
  ChevronRight,
  Database,
  Shield,
  Wrench,
  AlertTriangle,
  Swords,
  GitBranch,
  Search,
  Plus,
} from 'lucide-react'

import type { TreeNode } from '@/lib/GetProjectTree'
import {
  connectionType,
  modelToId,
  useModelStore,
  type ModelState,
} from '@/store/model-store'
import { useSelectedItem } from '@/context/SelectedItemContext'
import type { ComponentModel, Model, ModelType } from '@/types/models'
import { createDefaultModel, hasRequiredName } from '@/lib/modelFactory'
import { ModelForm } from '../details/ModelForm'
import { getName } from '@/lib/modelName'

function matchesFilter(node: TreeNode, q: string): boolean {
  if (!q.trim()) return true
  const hit = node.label.toLowerCase().includes(q.toLowerCase())
  const childHit = node.children?.some((c) => matchesFilter(c, q)) ?? false
  return hit || childHit
}

function getNodeIcon(kind?: TreeNode['kind']) {
  switch (kind) {
    case 'component':
    case 'group':
      return Blocks
    case 'data-entity':
      return Database
    case 'technology':
      return Wrench
    case 'damage-scenario':
      return AlertTriangle
    case 'control':
      return Shield
    case 'attack-step':
      return GitBranch
    case 'threat-scenario':
      return Swords
    default:
      return ToyBrick
  }
}

function mergeLocalComponentsIntoTree(
  tree: TreeNode[],
  components: ComponentModel[]
): TreeNode[] {
  const localComponentNodes = components.map(
    (component): TreeNode => ({
      id: `${component.id}.component`,
      label: component.name?.trim() || `Component ${component.id}`,
      kind: 'component',
      raw: component,
      children: [],
    })
  )

  if (localComponentNodes.length === 0) {
    return tree
  }

  if (tree.length === 0) {
    return localComponentNodes
  }

  const baseTree = tree.filter(
    (node) => !(node.badge === 'empty' && node.children?.length === 1)
  )
  const treeById = new Map(baseTree.map((node) => [node.id, node]))
  const merged = [...baseTree]

  for (const componentNode of localComponentNodes) {
    if (!treeById.has(componentNode.id)) {
      merged.push(componentNode)
    }
  }

  return merged
}

function TreeItem({
                    node,
                    depth = 0,
                    onSelect,
                    selectedId,
                    filter,
                  }: {
  node: TreeNode
  depth?: number
  onSelect?: (id: string) => void
  selectedId?: string
  filter: string
}) {
  if (!matchesFilter(node, filter)) return null

  const [open, setOpen] = React.useState(depth < 2)
  const isFolder = !!node.children?.length
  const paddingLeft = 12 + depth * 14
  const isSelected = selectedId === node.id
  const Icon = getNodeIcon(node.kind)

  if (!isFolder) {
    return (
      <Button
        type="button"
        variant={isSelected ? 'secondary' : 'ghost'}
        className="w-full justify-start h-8 px-2"
        style={{ paddingLeft }}
        onClick={() => onSelect?.(node.id)}
      >
        <Icon className="mr-2 h-4 w-4 opacity-70" />
        <span className="truncate">{node.label}</span>
        {node.badge ? (
          <Badge variant="outline" className="ml-auto">
            {node.badge}
          </Badge>
        ) : null}
      </Button>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            style={{ marginLeft: paddingLeft }}
            aria-label={open ? `Collapse ${node.label}` : `Expand ${node.label}`}
          >
            {open ? (
              <ChevronDown className="h-4 w-4 opacity-60" />
            ) : (
              <ChevronRight className="h-4 w-4 opacity-60" />
            )}
          </Button>
        </CollapsibleTrigger>
        <Button
          type="button"
          variant={isSelected ? 'secondary' : 'ghost'}
          className="h-8 flex-1 justify-start px-2 min-w-0"
          onClick={() => onSelect?.(node.id)}
        >
          <Icon className="mr-2 h-4 w-4 opacity-70" />
          <span className="truncate">{node.label}</span>
          {node.badge ? (
            <Badge variant="outline" className="ml-auto">
              {node.badge}
            </Badge>
          ) : null}
        </Button>
      </div>

      <CollapsibleContent>
        <div className="mt-1 space-y-1">
          {node.children?.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              filter={filter}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

type ExplorerWindowProps = {
  projectId: string | number | null
}

export function ExplorerWindow({ projectId }: ExplorerWindowProps) {
  const [filter, setFilter] = React.useState('')
  const [creatorOpen, setCreatorOpen] = React.useState(false)
  const [creatorType, setCreatorType] = React.useState<ModelType | ''>('')
  const [creatorModel, setCreatorModel] = React.useState<Model>({ id: -1 })
  const [existingTargetId, setExistingTargetId] = React.useState('')
  const [creatorError, setCreatorError] = React.useState('')
  const selected = useSelectedItem()

  const tree = useModelStore((s) => s.tree)
  const loading = useModelStore((s) => s.treeLoading)
  const error = useModelStore((s) => s.treeError)
  const selectedId = useModelStore((s) => s.selectedId)
  const loadTree = useModelStore((s) => s.loadTree)
  const setStoreSelectedId = useModelStore((s) => s.setSelectedId)
  const requestFocus = useModelStore((s) => s.requestFocus)
  const modelState = useModelStore((s) => s.state)
  const getItem = useModelStore((s) => s.getItem)
  const addItem = useModelStore((s) => s.addItem)
  const addConnection = useModelStore((s) => s.addConnection)
  const isConnectable = useModelStore((s) => s.isConnectable)

  React.useEffect(() => {
    if (!projectId) {
      return
    }
    void loadTree(projectId)
  }, [projectId, loadTree])

  const activeSelectedId = selected.selectedItem ?? selectedId
  const selectedItem = getItem(activeSelectedId)
  const selectedType = (
    activeSelectedId ? activeSelectedId.split('.')[1] : ''
  ) as ModelType
  const components = React.useMemo(
    () => [...modelState.components.values()],
    [modelState]
  )
  const visibleTree = React.useMemo(
    () => mergeLocalComponentsIntoTree(tree, components),
    [tree, components]
  )
  const relatedCreateTypes = React.useMemo(
    () => (selectedType ? getRelevantRelatedTypes(selectedType) : []),
    [selectedType]
  )
  const existingCandidates = React.useMemo(() => {
    if (!creatorType || !activeSelectedId || !selectedType) {
      return []
    }

    const [currentId] = activeSelectedId.split('.')
    const currentNumericId = Number(currentId)

    return getModelsForType(creatorType, modelState)
      .filter((candidate) => candidate.id !== currentNumericId || creatorType !== selectedType)
      .filter((candidate) =>
        isConnectable(currentNumericId, selectedType, candidate.id, creatorType)
      )
      .map((candidate) => ({
        id: modelToId(creatorType, candidate),
        label: getName(candidate),
      }))
  }, [activeSelectedId, creatorType, isConnectable, modelState, selectedType])

  const handleSelect = React.useCallback(
    (id: string) => {
      setStoreSelectedId(id)
      requestFocus(id)
      selected.setSelectedItem(id)
    },
    [requestFocus, selected, setStoreSelectedId]
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
    if (!creatorType || !activeSelectedId || !selectedType) {
      return
    }

    const [currentId] = activeSelectedId.split('.')

    try {
      setCreatorError('')
      const createdModel = await addItem(creatorType, creatorModel)
      await addConnection(+currentId, selectedType, createdModel.id, creatorType)
      const nextId = modelToId(creatorType, createdModel)
      setStoreSelectedId(nextId)
      selected.setSelectedItem(nextId)
      handleCloseCreator()
    } catch (createError) {
      console.error(createError)
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
    selectedType,
    setStoreSelectedId,
  ])

  const handleConnectExisting = React.useCallback(async () => {
    if (!existingTargetId || !activeSelectedId || !selectedType || !creatorType) {
      return
    }

    const [currentId] = activeSelectedId.split('.')
    const [targetId] = existingTargetId.split('.')

    try {
      setCreatorError('')
      await addConnection(+currentId, selectedType, +targetId, creatorType)
      setStoreSelectedId(existingTargetId)
      selected.setSelectedItem(existingTargetId)
      handleCloseCreator()
    } catch (connectError) {
      console.error(connectError)
      setCreatorError('Could not connect the selected existing model.')
    }
  }, [
    activeSelectedId,
    addConnection,
    creatorType,
    existingTargetId,
    handleCloseCreator,
    selected,
    selectedType,
    setStoreSelectedId,
  ])

  return (
    <div className="h-full w-full flex flex-col">
      <div className="px-3 pt-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter tree..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10"
          />
          </div>
          {selectedItem && relatedCreateTypes.length ? (
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              onClick={handleOpenCreator}
              aria-label="Add related model from explorer"
              title="Add related model"
            >
              <Plus />
            </Button>
          ) : null}
        </div>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        {loading ? (
          <div className="p-3 text-sm text-muted-foreground">
            Loading tree...
          </div>
        ) : error ? (
          <div className="p-3 text-sm text-destructive">{error}</div>
        ) : visibleTree.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">
            No components yet. Create a component to start building the project tree.
          </div>
        ) : (
          <div className="space-y-1">
            {visibleTree.map((n) => (
              <TreeItem
                key={n.id}
                node={n}
                onSelect={handleSelect}
                selectedId={activeSelectedId}
                filter={filter}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {creatorOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-lg border bg-background shadow-lg">
            <div className="px-6 pt-6 pb-4">
              <div className="text-lg font-semibold">Add Related Model</div>
              <div className="text-sm text-muted-foreground">
                Create a new model and connect it to {selectedItem ? getName(selectedItem) : 'the selected item'}.
              </div>
            </div>

            <div className="px-6 pb-4">
              <label className="mb-2 block text-sm font-medium" htmlFor="explorer-related-model-type">
                Type
              </label>
              <select
                id="explorer-related-model-type"
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

            <div className="min-h-0 flex-1 overflow-y-auto px-6">
              <div className="space-y-4 pb-4 pr-3">
                {creatorType ? (
                  <div className="rounded-md border border-border p-3">
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
                  <div className="rounded-md border border-border p-3">
                    <div className="mb-3 text-sm font-medium">Create New</div>
                    <ModelForm
                      model={{ type: creatorType, item: creatorModel }}
                      setModel={(nextModel) => setCreatorModel(nextModel.item)}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {creatorError ? (
              <div className="mx-6 mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {creatorError}
              </div>
            ) : null}

            <div className="flex shrink-0 justify-end gap-2 border-t px-6 py-4">
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
