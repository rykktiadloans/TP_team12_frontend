import { Fragment, useState, type ReactNode } from 'react'
import { NewModelButton } from '@/components/new-model/NewModelButton'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSelectedItem } from '@/context/SelectedItemContext'
import {
  modelToId,
  useModelStore,
} from '@/store/model-store'
import type {
  AttackStepModel,
  ControlModel,
  Model,
  ModelType,
  ThreatScenarioModel,
} from '@/types/models'
import { taraTableItems, type TaraTableKey } from '@/lib/taraTables'
import {
  elapsedTimeOptions,
  equipmentOptions,
  formatCIAFlags,
  impactOptions,
  knowledgeOptions,
  specialistExpertiseOptions,
  windowOfOpportunityOptions,
  type Option,
} from '@/lib/tara'
import { getName } from './MainCardsWindow'

interface TableViewWindowProps {
  activeTable: TaraTableKey
}

type Column<T> = {
  key: string
  label: string
  render: (..._args: [T]) => ReactNode
}

const creatableTableTypes: Partial<Record<TaraTableKey, ModelType>> = {
  threatScenarios: 'threatScenario',
  damageScenarios: 'damageScenario',
  attackSteps: 'attackStep',
  controls: 'control',
}

function optionLabel(options: Option[], value: number) {
  return options.find((option) => option.value === value)?.label ?? String(value)
}

function scoreText(options: Option[], value: number) {
  return `${optionLabel(options, value)} (${value})`
}

function ratingText(label?: string | null, value?: number | null) {
  if (!label) {
    return 'unknown'
  }

  return value == null ? label : `${label} (${value})`
}

function attackPotentialPointsText(value?: number | null) {
  return value == null ? 'not practical' : String(value)
}

function modelNames(ids: number[] | undefined, map: Map<number, Model>) {
  const values = (ids ?? [])
    .map((id) => map.get(id))
    .filter(Boolean)
    .map((model) => getName(model as Model))

  return values.length ? values.join(', ') : 'none'
}

function modelName(id: number | null | undefined, map: Map<number, Model>) {
  if (id == null) {
    return 'none'
  }

  const model = map.get(id)
  return model ? getName(model) : `#${id}`
}

function concernText(
  concerns: Array<{ component: number; affected_CIA_parts: number }> | undefined,
  components: Map<number, Model>
) {
  const values = (concerns ?? []).map(
    (concern) =>
      `${modelName(concern.component, components)}: ${formatCIAFlags(concern.affected_CIA_parts)}`
  )

  return values.length ? values.join(', ') : 'none'
}

function DetailBlock({
  description,
  children,
}: {
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="space-y-3 text-sm">
      <div>
        <div className="text-xs font-medium uppercase text-muted-foreground">Description</div>
        <div className="mt-1 whitespace-pre-wrap">
          {description?.trim() || 'No description.'}
        </div>
      </div>
      {children}
    </div>
  )
}

function DetailGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {children}
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  )
}

function AttackFeasibilityDetails({ row }: { row: AttackStepModel | ControlModel }) {
  return (
    <DetailGrid>
      <DetailItem label="AFL" value={ratingText(row.afl, row.afl_value)} />
      <DetailItem label="Attack Potential" value={row.attack_potential ?? 'unknown'} />
      <DetailItem label="Attack Potential Points" value={attackPotentialPointsText(row.attack_potential_points)} />
      <DetailItem label="Elapsed Time" value={scoreText(elapsedTimeOptions, row.fr_et)} />
      <DetailItem label="Specialist Expertise" value={scoreText(specialistExpertiseOptions, row.fr_se)} />
      <DetailItem label="Knowledge of Component" value={scoreText(knowledgeOptions, row.fr_koC)} />
      <DetailItem label="Window of Opportunity" value={scoreText(windowOfOpportunityOptions, row.fr_WoO)} />
      <DetailItem label="Equipment" value={scoreText(equipmentOptions, row.fr_eq)} />
    </DetailGrid>
  )
}

function ImpactDetails({ row }: { row: {
  affected_CIA_parts: number
  impact_scale: number
  safety_impact: number
  finantial_impact: number
  operational_impact: number
  privacy_impact: number
  il?: number
  il_label?: string
} }) {
  return (
    <DetailGrid>
      <DetailItem label="Affected CIA" value={formatCIAFlags(row.affected_CIA_parts)} />
      <DetailItem label="IL" value={ratingText(row.il_label, row.il)} />
      <DetailItem label="Safety" value={scoreText(impactOptions, row.safety_impact)} />
      <DetailItem label="Financial" value={scoreText(impactOptions, row.finantial_impact)} />
      <DetailItem label="Operational" value={scoreText(impactOptions, row.operational_impact)} />
      <DetailItem label="Privacy" value={scoreText(impactOptions, row.privacy_impact)} />
    </DetailGrid>
  )
}

function EmptyTable({ label }: { label: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-md border border-dashed px-6 text-center">
      <div>
        <div className="text-sm font-medium">No {label.toLowerCase()} to show.</div>
        <div className="mt-1 text-sm text-muted-foreground">
          This project has no rows for this table yet.
        </div>
      </div>
    </div>
  )
}

function UnmodeledTable({ label }: { label: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-md border border-dashed px-6 text-center">
      <div>
        <div className="text-sm font-medium">{label} is not modeled yet.</div>
        <div className="mt-1 text-sm text-muted-foreground">
          The table tab is ready, but the backend does not have a dedicated entity for it yet.
        </div>
      </div>
    </div>
  )
}

interface DataTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  getRowId: (..._args: [T]) => string
  getSelectId?: (..._args: [T]) => string
  renderExpanded?: (..._args: [T]) => ReactNode
}

function DataTable<T>({
  rows,
  columns,
  getRowId,
  getSelectId,
  renderExpanded,
}: DataTableProps<T>) {
  const { selectedItem, setSelectedItem } = useSelectedItem()
  const storeSelectedId = useModelStore((store) => store.selectedId)
  const setStoreSelectedId = useModelStore((store) => store.setSelectedId)
  const activeSelectedId = selectedItem ?? storeSelectedId ?? ''
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(() => new Set())

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key}>{column.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const rowId = getRowId(row)
          const selectId = getSelectId?.(row) ?? ''
          const isSelected = selectId && activeSelectedId === selectId
          const isExpanded = expandedRowIds.has(rowId)

          return (
            <Fragment key={rowId}>
              <TableRow
                data-state={isSelected ? 'selected' : undefined}
                className="cursor-pointer"
                onClick={() => {
                  if (selectId) {
                    setSelectedItem(selectId)
                    setStoreSelectedId(selectId)
                  }
                  setExpandedRowIds((current) => {
                    const next = new Set(current)
                    if (next.has(rowId)) {
                      next.delete(rowId)
                    } else {
                      next.add(rowId)
                    }
                    return next
                  })
                }}
              >
                {columns.map((column) => (
                  <TableCell key={column.key}>{column.render(row)}</TableCell>
                ))}
              </TableRow>
              {isExpanded && renderExpanded ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="bg-muted/20 p-0">
                    <div className="border-l-2 border-primary/40 px-4 py-3">
                      {renderExpanded(row)}
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </Fragment>
          )
        })}
      </TableBody>
    </Table>
  )
}

function tableTitle(activeTable: TaraTableKey) {
  return taraTableItems.find((item) => item.key === activeTable)?.label ?? 'TABLE'
}

export function TableViewWindow({ activeTable }: TableViewWindowProps) {
  const state = useModelStore((store) => store.state)
  const risks = useModelStore((store) => store.risks)
  const title = tableTitle(activeTable)
  const creatableType = creatableTableTypes[activeTable]

  let content

  if (activeTable === 'threatScenarios') {
    const rows = [...state.threatScenarios.values()]
    content = rows.length ? (
      <DataTable
        rows={rows}
        getRowId={(row) => String(row.id)}
        getSelectId={(row) => modelToId('threatScenario', row)}
        renderExpanded={(row) => (
          <DetailBlock description={row.description}>
            <DetailGrid>
              <DetailItem
                label="Involved Components"
                value={modelNames(row.components, state.components as Map<number, Model>)}
              />
              <DetailItem
                label="Attack Steps"
                value={modelNames(row.attack_steps, state.attackSteps as Map<number, Model>)}
              />
              <DetailItem
                label="Damage Scenarios"
                value={modelNames(row.damage_scenarios, state.damageScenarios as Map<number, Model>)}
              />
            </DetailGrid>
          </DetailBlock>
        )}
        columns={[
          { key: 'id', label: 'ID', render: (row) => `TS.${row.id}` },
          { key: 'name', label: 'Threat Scenario', render: (row) => row.name },
          {
            key: 'components',
            label: 'Involved Components',
            render: (row) => modelNames(row.components, state.components as Map<number, Model>),
          },
          {
            key: 'attack_steps',
            label: 'Attack Steps',
            render: (row) => modelNames(row.attack_steps, state.attackSteps as Map<number, Model>),
          },
          {
            key: 'damage_scenarios',
            label: 'Damage Scenarios',
            render: (row) => modelNames(row.damage_scenarios, state.damageScenarios as Map<number, Model>),
          },
        ]}
      />
    ) : (
      <EmptyTable label={title} />
    )
  }

  if (activeTable === 'damageScenarios') {
    const rows = [...state.damageScenarios.values()]
    content = rows.length ? (
      <DataTable
        rows={rows}
        getRowId={(row) => String(row.id)}
        getSelectId={(row) => modelToId('damageScenario', row)}
        renderExpanded={(row) => (
          <DetailBlock description={row.description}>
            <ImpactDetails row={row} />
            <DetailGrid>
              <DetailItem
                label="Concerns"
                value={concernText(row.concerns, state.components as Map<number, Model>)}
              />
            </DetailGrid>
          </DetailBlock>
        )}
        columns={[
          { key: 'id', label: 'ID', render: (row) => `DS.${row.id}` },
          { key: 'name', label: 'Damage Scenario', render: (row) => row.name },
          {
            key: 'impact',
            label: 'IL',
            render: (row) => ratingText(row.il_label, row.il),
          },
          {
            key: 'cia',
            label: 'CIA',
            render: (row) => formatCIAFlags(row.affected_CIA_parts),
          },
          {
            key: 'threats',
            label: 'Threat Scenarios',
            render: (row) => modelNames(row.threat_scenarios, state.threatScenarios as Map<number, Model>),
          },
        ]}
      />
    ) : (
      <EmptyTable label={title} />
    )
  }

  if (activeTable === 'attackSteps') {
    const rows = [...state.attackSteps.values()]
    content = rows.length ? (
      <DataTable
        rows={rows}
        getRowId={(row) => String(row.id)}
        getSelectId={(row) => modelToId('attackStep', row)}
        renderExpanded={(row) => (
          <DetailBlock description={row.description}>
            <AttackFeasibilityDetails row={row} />
          </DetailBlock>
        )}
        columns={[
          { key: 'id', label: 'ID', render: (row) => `AS.${row.id}` },
          { key: 'name', label: 'Attack Step', render: (row) => row.name },
          {
            key: 'component',
            label: 'Step Component',
            render: (row) => modelName(row.component, state.components as Map<number, Model>),
          },
          {
            key: 'threats',
            label: 'Threatens',
            render: (row) => modelNames(row.threat_scenarios, state.threatScenarios as Map<number, Model>),
          },
          { key: 'afl', label: 'AFL', render: (row) => ratingText(row.afl, row.afl_value) },
        ]}
      />
    ) : (
      <EmptyTable label={title} />
    )
  }

  if (activeTable === 'controls') {
    const rows = [...state.controls.values()]
    content = rows.length ? (
      <DataTable
        rows={rows}
        getRowId={(row) => String(row.id)}
        getSelectId={(row) => modelToId('control', row)}
        renderExpanded={(row) => (
          <DetailBlock description={row.description}>
            <AttackFeasibilityDetails row={row} />
          </DetailBlock>
        )}
        columns={[
          { key: 'id', label: 'ID', render: (row) => `C.${row.id}` },
          { key: 'name', label: 'Control', render: (row) => row.name },
          {
            key: 'component',
            label: 'Component',
            render: (row) => modelName(row.component, state.components as Map<number, Model>),
          },
          {
            key: 'attack_steps',
            label: 'Mitigates',
            render: (row) => modelNames(row.attack_steps, state.attackSteps as Map<number, Model>),
          },
          { key: 'afl', label: 'AFL', render: (row) => ratingText(row.afl, row.afl_value) },
        ]}
      />
    ) : (
      <EmptyTable label={title} />
    )
  }

  if (activeTable === 'controlScenarios') {
    content = <UnmodeledTable label={title} />
  }

  if (activeTable === 'risks') {
    const rows = risks
    content = rows.length ? (
      <DataTable
        rows={rows}
        getRowId={(row) => row.id}
        getSelectId={(row) => {
          const threatScenario = state.threatScenarios.get(row.threat_scenario)
          return threatScenario ? modelToId('threatScenario', threatScenario as ThreatScenarioModel) : ''
        }}
        renderExpanded={(row) => {
          const threatScenario = state.threatScenarios.get(row.threat_scenario)
          const damageScenario = state.damageScenarios.get(row.damage_scenario)

          return (
            <DetailBlock description={threatScenario?.description}>
              <DetailGrid>
                <DetailItem
                  label="Threat Scenario"
                  value={row.threat_scenario_name ?? threatScenario?.name ?? `TS.${row.threat_scenario}`}
                />
                <DetailItem
                  label="Damage Scenario"
                  value={row.damage_scenario_name ?? damageScenario?.name ?? `DS.${row.damage_scenario}`}
                />
                <DetailItem label="AFL" value={ratingText(row.afl, row.afl_value)} />
                <DetailItem label="IL" value={ratingText(row.il_label, row.il)} />
                <DetailItem label="RL" value={row.rl ?? 'unknown'} />
                <DetailItem label="Affected Component" value={row.component_name ?? 'none'} />
                <DetailItem label="Affected CIA" value={formatCIAFlags(row.affected_CIA_parts)} />
              </DetailGrid>
            </DetailBlock>
          )
        }}
        columns={[
          { key: 'id', label: 'ID', render: (row) => `R.${row.id}` },
          { key: 'title', label: 'Risk', render: (row) => row.title },
          { key: 'afl', label: 'AFL', render: (row) => ratingText(row.afl, row.afl_value) },
          {
            key: 'impact',
            label: 'IL',
            render: (row) => ratingText(row.il_label, row.il),
          },
          { key: 'rl', label: 'RL', render: (row) => row.rl ?? 'unknown' },
          { key: 'component', label: 'Affected Component', render: (row) => row.component_name ?? 'none' },
          { key: 'cia', label: 'CIA', render: (row) => formatCIAFlags(row.affected_CIA_parts) },
        ]}
      />
    ) : (
      <EmptyTable label={title} />
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <div className="font-medium">{title}</div>
        <Badge variant="outline">TABLE VIEW</Badge>
        {creatableType ? (
          <div className="ml-auto">
            <NewModelButton fixedType={creatableType} label="New" />
          </div>
        ) : null}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-4">{content}</div>
      </ScrollArea>
    </div>
  )
}
