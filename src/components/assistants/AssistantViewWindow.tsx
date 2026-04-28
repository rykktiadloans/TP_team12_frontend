import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Bot, Check, CircleDot, RefreshCw, RotateCcw, WandSparkles, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSelectedItem } from '@/context/SelectedItemContext'
import { modelToId, useModelStore } from '@/store/model-store'
import { formatCIAFlags } from '@/lib/tara'
import type {
  ComponentModel,
  DamageScenarioModel,
  DataEntityModel,
  ThreatScenarioModel,
} from '@/types/models'

type AssistantKey = 'assetIdentification'
type AssetKind = 'dataEntity' | 'component'

interface AssistantNavigationWindowProps {
  activeAssistant: AssistantKey
  onActiveAssistantChange: Dispatch<SetStateAction<AssistantKey>>
}

interface AssistantViewWindowProps {
  activeAssistant: AssistantKey
}

type CiaPart = {
  key: 'C' | 'I' | 'A'
  label: string
  bit: 4 | 2 | 1
}

type AssetSuggestion = {
  id: string
  kind: AssetKind
  displayId: string
  name: string
  description: string
  targetComponentId: number | null
  targetComponentName: string | null
  sourceTagBase: string
}

type CiaSuggestion = AssetSuggestion & {
  cia: CiaPart
  sourceTag: string
}

type ScenarioMatch = {
  id: string
  label: string
}

type CreationNotice = {
  threatScenarioId: string
  threatScenarioName: string
  damageScenarioId: string
  damageScenarioName: string
}

const ciaParts: CiaPart[] = [
  { key: 'C', label: 'Confidentiality', bit: 4 },
  { key: 'I', label: 'Integrity', bit: 2 },
  { key: 'A', label: 'Availability', bit: 1 },
]

const assistantItems: Array<{
  key: AssistantKey
  label: string
  icon: typeof Bot
}> = [
  { key: 'assetIdentification', label: 'Asset Identification', icon: Bot },
]

const SOURCE_PREFIX = 'assistant:asset-identification'

function truncateName(value: string, fallback: string) {
  const normalized = value.trim() || fallback
  return normalized.length > 100 ? normalized.slice(0, 100) : normalized
}

function componentLabel(component?: ComponentModel | null) {
  if (!component) {
    return null
  }

  return component.name || `Component ${component.id}`
}

function sourceTagFor(asset: AssetSuggestion, cia: CiaPart) {
  return `${asset.sourceTagBase}:${cia.bit}`
}

function acceptedScenarioForSuggestion(
  suggestion: CiaSuggestion,
  damageScenarios: Map<number, DamageScenarioModel>
) {
  const scenario = [...damageScenarios.values()].find((item) =>
    item.description?.includes(suggestion.sourceTag)
  )

  return scenario
    ? {
        id: modelToId('damageScenario', scenario),
        label: scenario.name || `Damage Scenario ${scenario.id}`,
      }
    : null
}

function existingScenariosForSuggestion(
  suggestion: CiaSuggestion,
  damageScenarios: Map<number, DamageScenarioModel>,
  threatScenarios: Map<number, ThreatScenarioModel>
) {
  if (suggestion.targetComponentId == null) {
    return []
  }

  return [...damageScenarios.values()]
    .filter((scenario) => {
      const targetedConcern = (scenario.concerns ?? []).some(
        (concern) =>
          concern.component === suggestion.targetComponentId &&
          (concern.affected_CIA_parts & suggestion.cia.bit) === suggestion.cia.bit
      )
      if (targetedConcern) {
        return true
      }

      const linkedToComponent = (scenario.threat_scenarios ?? []).some((id) =>
        (threatScenarios.get(id)?.components ?? []).includes(suggestion.targetComponentId as number)
      )

      return linkedToComponent && (scenario.affected_CIA_parts & suggestion.cia.bit) === suggestion.cia.bit
    })
    .map((scenario) => ({
      id: modelToId('damageScenario', scenario),
      label: scenario.name || `Damage Scenario ${scenario.id}`,
    }))
}

function buildAssetSuggestions(
  dataEntities: DataEntityModel[],
  components: ComponentModel[]
) {
  const componentById = new Map(components.map((component) => [component.id, component]))
  const dataSuggestions: AssetSuggestion[] = dataEntities.map((entity, index) => {
    const targetComponent = entity.component != null ? componentById.get(entity.component) : null
    return {
      id: `dataEntity:${entity.id}`,
      kind: 'dataEntity',
      displayId: `D.${index + 1}`,
      name: entity.name || `Data ${entity.id}`,
      description: entity.description ?? '',
      targetComponentId: targetComponent?.id ?? null,
      targetComponentName: componentLabel(targetComponent),
      sourceTagBase: `${SOURCE_PREFIX}:dataEntity:${entity.id}`,
    }
  })

  const componentSuggestions: AssetSuggestion[] = components.map((component, index) => ({
    id: `component:${component.id}`,
    kind: 'component',
    displayId: `Cmp.${index + 1}`,
    name: component.name || `Component ${component.id}`,
    description: component.description ?? '',
    targetComponentId: component.id,
    targetComponentName: componentLabel(component),
    sourceTagBase: `${SOURCE_PREFIX}:component:${component.id}`,
  }))

  return {
    data: dataSuggestions,
    components: componentSuggestions,
  }
}

function statusText({
  accepted,
  rejected,
  saving,
}: {
  accepted: boolean
  rejected: boolean
  saving: boolean
}) {
  if (saving) return 'Creating'
  if (accepted) return 'Accepted'
  if (rejected) return 'Rejected'
  return 'Proposed'
}

function ScenarioLinks({
  label,
  matches,
  onSelectModel,
}: {
  label: string
  matches: ScenarioMatch[]
  // eslint-disable-next-line no-unused-vars
  onSelectModel(id: string): void
}) {
  if (matches.length === 0) {
    return null
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      <span>{label}</span>
      {matches.slice(0, 3).map((match) => (
        <button
          key={match.id}
          type="button"
          className="rounded-full border border-border px-2 py-0.5 text-foreground transition-colors hover:bg-muted"
          onClick={() => onSelectModel(match.id)}
        >
          {match.label}
        </button>
      ))}
      {matches.length > 3 ? <span>+{matches.length - 3} more</span> : null}
    </div>
  )
}

function CreationPopup({
  notice,
  onClose,
  onSelectModel,
}: {
  notice: CreationNotice
  onClose(): void
  // eslint-disable-next-line no-unused-vars
  onSelectModel(id: string): void
}) {
  return (
    <div className="fixed right-4 top-16 z-50 w-[min(420px,calc(100vw-2rem))] rounded-md border bg-background p-4 shadow-lg">
      <div className="text-sm font-medium">New scenarios created</div>
      <div className="mt-1 text-sm text-muted-foreground">
        A linked threat scenario and damage scenario were added.
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onSelectModel(notice.threatScenarioId)}
        >
          View Threat
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onSelectModel(notice.damageScenarioId)}
        >
          View Damage
        </Button>
        <Button type="button" size="sm" variant="ghost" className="ml-auto" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <div className="truncate">Threat: {notice.threatScenarioName}</div>
        <div className="truncate">Damage: {notice.damageScenarioName}</div>
      </div>
    </div>
  )
}

export function AssistantNavigationWindow({
  activeAssistant,
  onActiveAssistantChange,
}: AssistantNavigationWindowProps) {
  const state = useModelStore((store) => store.state)
  const assistantCounts: Record<AssistantKey, number> = {
    assetIdentification: state.dataEntities.size + state.components.size,
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="border-b px-3 py-3">
        <div className="text-sm font-medium">Assistants</div>
        <div className="text-xs text-muted-foreground">Analysis helpers</div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-2 py-3">
        <div className="space-y-1">
          {assistantItems.map((item) => {
            const Icon = item.icon
            const isActive = activeAssistant === item.key

            return (
              <Button
                key={item.key}
                type="button"
                variant={isActive ? 'secondary' : 'ghost'}
                className="h-9 w-full justify-start px-2"
                onClick={() => onActiveAssistantChange(item.key)}
              >
                <Icon className="h-4 w-4 opacity-70" />
                <span className="truncate">{item.label}</span>
                <Badge variant="outline" className="ml-auto">
                  {assistantCounts[item.key]}
                </Badge>
              </Button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

function AssetRows({
  title,
  rows,
  rejectedIds,
  savingIds,
  onAccept,
  onApplyAsset,
  onReject,
  onRestore,
  onSelectModel,
}: {
  title: string
  rows: AssetSuggestion[]
  rejectedIds: Set<string>
  savingIds: Set<string>
  // eslint-disable-next-line no-unused-vars
  onAccept(suggestion: CiaSuggestion): Promise<void>
  // eslint-disable-next-line no-unused-vars
  onApplyAsset(asset: AssetSuggestion): Promise<void>
  // eslint-disable-next-line no-unused-vars
  onReject(id: string): void
  // eslint-disable-next-line no-unused-vars
  onRestore(id: string): void
  // eslint-disable-next-line no-unused-vars
  onSelectModel(id: string): void
}) {
  const damageScenarios = useModelStore((store) => store.state.damageScenarios)
  const threatScenarios = useModelStore((store) => store.state.threatScenarios)

  if (rows.length === 0) {
    return null
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="text-sm font-semibold">{title}</div>
        <Badge variant="outline">{rows.length}</Badge>
      </div>

      <div className="overflow-hidden rounded-md border">
        {rows.map((asset) => {
          const assetSuggestions = ciaParts.map((cia): CiaSuggestion => ({
            ...asset,
            cia,
            sourceTag: sourceTagFor(asset, cia),
          }))
          const pendingCount = assetSuggestions.filter(
            (suggestion) => !rejectedIds.has(suggestion.sourceTag)
          ).length

          return (
            <div
              key={asset.id}
              className="grid gap-0 border-b last:border-b-0 lg:grid-cols-[minmax(190px,1.1fr)_minmax(360px,2fr)_auto]"
            >
              <div className="border-b bg-muted/20 px-3 py-3 lg:border-b-0 lg:border-r">
                <div className="flex items-start gap-2">
                  <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {asset.displayId}: {asset.name}
                    </div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {asset.targetComponentName ?? 'No target component'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="divide-y">
                {assetSuggestions.map((suggestion) => {
                  const acceptedScenario = acceptedScenarioForSuggestion(suggestion, damageScenarios)
                  const existingScenarios = existingScenariosForSuggestion(
                    suggestion,
                    damageScenarios,
                    threatScenarios
                  ).filter((match) => match.id !== acceptedScenario?.id)
                  const accepted = acceptedScenario != null
                  const alreadyExists = existingScenarios.length > 0
                  const rejected = rejectedIds.has(suggestion.sourceTag)
                  const saving = savingIds.has(suggestion.sourceTag)
                  const disabled = rejected || saving

                  return (
                    <div
                      key={suggestion.sourceTag}
                      className="grid min-h-12 items-center gap-2 px-3 py-2 sm:grid-cols-[minmax(130px,1fr)_auto]"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm">
                          {suggestion.cia.key}: {suggestion.cia.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {alreadyExists
                            ? 'Scenario already exists'
                            : statusText({ accepted, rejected, saving })}
                        </div>
                        <ScenarioLinks
                          label={accepted ? 'Created:' : 'Open:'}
                          matches={acceptedScenario ? [acceptedScenario] : existingScenarios}
                          onSelectModel={onSelectModel}
                        />
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {rejected ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => onRestore(suggestion.sourceTag)}
                          >
                            <RotateCcw />
                            Restore
                          </Button>
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={disabled}
                              onClick={() => void onAccept(suggestion)}
                            >
                              <Check />
                              {alreadyExists ? 'Add another' : 'Accept'}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={saving}
                              onClick={() => onReject(suggestion.sourceTag)}
                            >
                              <X />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center border-t px-3 py-3 lg:border-l lg:border-t-0">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pendingCount === 0}
                  onClick={() => void onApplyAsset(asset)}
                >
                  <WandSparkles />
                  Apply All
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function AssetIdentificationAssistant() {
  const state = useModelStore((store) => store.state)
  const addItem = useModelStore((store) => store.addItem)
  const loadProjectState = useModelStore((store) => store.loadProjectState)
  const setStoreSelectedId = useModelStore((store) => store.setSelectedId)
  const selected = useSelectedItem()
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(() => new Set())
  const [savingIds, setSavingIds] = useState<Set<string>>(() => new Set())
  const [error, setError] = useState('')
  const [creationNotice, setCreationNotice] = useState<CreationNotice | null>(null)
  const projectId = sessionStorage.getItem('projectId')

  const suggestions = useMemo(
    () =>
      buildAssetSuggestions(
        [...state.dataEntities.values()],
        [...state.components.values()]
      ),
    [state.components, state.dataEntities]
  )

  const allSuggestions = useMemo(
    () =>
      [...suggestions.data, ...suggestions.components].flatMap((asset) =>
        ciaParts.map((cia): CiaSuggestion => ({
          ...asset,
          cia,
          sourceTag: sourceTagFor(asset, cia),
        }))
      ),
    [suggestions]
  )

  const pendingSuggestions = allSuggestions.filter(
    (suggestion) => !rejectedIds.has(suggestion.sourceTag)
  )

  const setSaving = (id: string, saving: boolean) => {
    setSavingIds((current) => {
      const next = new Set(current)
      if (saving) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }

  const selectModel = (id: string) => {
    setStoreSelectedId(id)
    selected.setSelectedItem(id)
  }

  const acceptSuggestion = async (suggestion: CiaSuggestion) => {
    if (rejectedIds.has(suggestion.sourceTag)) {
      return
    }

    setError('')
    setSaving(suggestion.sourceTag, true)
    try {
      const targetLabel =
        suggestion.targetComponentName != null
          ? `${suggestion.name} on ${suggestion.targetComponentName}`
          : suggestion.name
      const threatScenario = await addItem('threatScenario', {
        id: -1,
        name: truncateName(
          `${suggestion.cia.label} compromise of ${suggestion.name}`,
          `${suggestion.cia.label} compromise`
        ),
        description: [
          `${suggestion.sourceTag}:threat`,
          `Threat scenario created by the asset identification assistant.`,
          `Target asset: ${suggestion.displayId} ${targetLabel}.`,
          `Cybersecurity property: ${formatCIAFlags(suggestion.cia.bit)}.`,
          suggestion.description ? `Asset note: ${suggestion.description}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        components: suggestion.targetComponentId != null ? [suggestion.targetComponentId] : [],
        attack_steps: [],
        damage_scenarios: [],
        compromises: [],
        threat_class: null,
        project: null,
      } as ThreatScenarioModel) as ThreatScenarioModel
      const threatScenarioIds = [threatScenario.id]
      const concern =
        suggestion.targetComponentId != null
          ? [
              {
                id: -suggestion.targetComponentId,
                component: suggestion.targetComponentId,
                affected_CIA_parts: suggestion.cia.bit,
              },
            ]
          : []

      const damageScenario = await addItem('damageScenario', {
        id: -1,
        name: truncateName(
          `Loss of ${suggestion.cia.label} for ${suggestion.name}`,
          `Loss of ${suggestion.cia.label}`
        ),
        description: [
          suggestion.sourceTag,
          `Asset: ${suggestion.displayId} ${targetLabel}.`,
          `Affected cybersecurity property: ${formatCIAFlags(suggestion.cia.bit)}.`,
          suggestion.description ? `Asset note: ${suggestion.description}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        affected_CIA_parts: suggestion.cia.bit,
        safety_impact: 0,
        finantial_impact: 0,
        operational_impact: 0,
        privacy_impact: 0,
        threat_scenarios: threatScenarioIds,
        concerns: concern,
        il: 0,
        il_label: 'Negligible',
        project: null,
      } as DamageScenarioModel) as DamageScenarioModel
      const threatScenarioId = modelToId('threatScenario', threatScenario)
      const damageScenarioId = modelToId('damageScenario', damageScenario)
      selectModel(threatScenarioId)
      setCreationNotice({
        threatScenarioId,
        threatScenarioName: threatScenario.name || `Threat Scenario ${threatScenario.id}`,
        damageScenarioId,
        damageScenarioName: damageScenario.name || `Damage Scenario ${damageScenario.id}`,
      })
    } catch (createError) {
      console.error(createError)
      setError('Could not create the threat scenario and damage scenario.')
    } finally {
      setSaving(suggestion.sourceTag, false)
    }
  }

  const applyAsset = async (asset: AssetSuggestion) => {
    for (const cia of ciaParts) {
      const suggestion = {
        ...asset,
        cia,
        sourceTag: sourceTagFor(asset, cia),
      }
      if (
        !rejectedIds.has(suggestion.sourceTag)
      ) {
        await acceptSuggestion(suggestion)
      }
    }
  }

  const applyAll = async () => {
    for (const suggestion of pendingSuggestions) {
      await acceptSuggestion(suggestion)
    }
  }

  const rejectSuggestion = (id: string) => {
    setRejectedIds((current) => new Set(current).add(id))
  }

  const restoreSuggestion = (id: string) => {
    setRejectedIds((current) => {
      const next = new Set(current)
      next.delete(id)
      return next
    })
  }

  const refresh = async () => {
    if (projectId) {
      await loadProjectState(projectId)
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <div className="font-medium">Asset Identification</div>
        <Badge variant="outline">ASSISTANT</Badge>
        <div className="ml-auto flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => void refresh()}>
            <RefreshCw />
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pendingSuggestions.length === 0 || savingIds.size > 0}
            onClick={() => void applyAll()}
          >
            <WandSparkles />
            Apply All
          </Button>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-6 p-4">
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {suggestions.data.length === 0 && suggestions.components.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-md border border-dashed px-6 text-center">
              <div>
                <div className="text-sm font-medium">No system elements found.</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Add data or components before running this assistant.
                </div>
              </div>
            </div>
          ) : (
            <>
              <AssetRows
                title="Data"
                rows={suggestions.data}
                rejectedIds={rejectedIds}
                savingIds={savingIds}
                onAccept={acceptSuggestion}
                onApplyAsset={applyAsset}
                onReject={rejectSuggestion}
                onRestore={restoreSuggestion}
                onSelectModel={selectModel}
              />
              <AssetRows
                title="Components"
                rows={suggestions.components}
                rejectedIds={rejectedIds}
                savingIds={savingIds}
                onAccept={acceptSuggestion}
                onApplyAsset={applyAsset}
                onReject={rejectSuggestion}
                onRestore={restoreSuggestion}
                onSelectModel={selectModel}
              />
            </>
          )}
        </div>
      </ScrollArea>
      {creationNotice ? (
        <CreationPopup
          notice={creationNotice}
          onClose={() => setCreationNotice(null)}
          onSelectModel={selectModel}
        />
      ) : null}
    </div>
  )
}

export function AssistantViewWindow({ activeAssistant }: AssistantViewWindowProps) {
  if (activeAssistant === 'assetIdentification') {
    return <AssetIdentificationAssistant />
  }

  return null
}

export type { AssistantKey }
