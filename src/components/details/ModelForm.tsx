import type {
  AttackStepModel,
  ComponentModel,
  CompromisesModel,
  ControlModel,
  DamageScenarioModel,
  DataEntityModel,
  Model,
  ModelType,
  TechnologyModel,
  ThreatClassModel,
  ThreatScenarioModel,
} from '@/types/models'
import { Field, FieldGroup, FieldLabel } from '../ui/field'
import { Input } from '../ui/input'
import type { ChangeEventHandler } from 'react'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { AlertCircleIcon } from 'lucide-react'
import {
  asNumber,
  calculateAttackFeasibilityRating,
  calculateImpactLevel,
  elapsedTimeOptions,
  equipmentOptions,
  formatAttackFeasibilityRating,
  formatAttackPotentialPoints,
  formatCIABinary,
  formatCIAFlags,
  formatImpactLevel,
  impactOptions,
  knowledgeOptions,
  specialistExpertiseOptions,
  windowOfOpportunityOptions,
  type Option,
} from '@/lib/tara'
import { useModelStore } from '@/store/model-store'

export interface ModelFormItem {
  type: ModelType
  item: Model
}

interface Props {
  model: ModelFormItem
  setModel?: (item: ModelFormItem) => void
}

function OptionSelect({
  id,
  value,
  options,
  onChange,
}: {
  id: string
  value: number
  options: Option[]
  onChange: ChangeEventHandler<HTMLSelectElement>
}) {
  return (
    <select
      id={id}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none"
      value={String(value)}
      onChange={onChange}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

const ciaCheckboxOptions = [
  { bit: 4, label: 'Confidentiality' },
  { bit: 2, label: 'Integrity' },
  { bit: 1, label: 'Availability' },
]

function CIABitmaskCheckboxGroup({
  idPrefix,
  value,
  onChange,
}: {
  idPrefix: string
  value: number
  onChange: (nextValue: number) => void
}) {
  const numericValue = asNumber(value)

  return (
    <div data-slot="checkbox-group" className="flex flex-col gap-3">
      {ciaCheckboxOptions.map((option) => {
        const optionId = `${idPrefix}-${option.label.toLowerCase()}`
        const checked = (numericValue & option.bit) === option.bit

        return (
          <label key={option.bit} htmlFor={optionId} className="flex items-center gap-3 text-sm">
            <input
              id={optionId}
              type="checkbox"
              className="h-4 w-4 rounded border border-input"
              checked={checked}
              onChange={(event) => {
                const nextValue = event.target.checked
                  ? numericValue | option.bit
                  : numericValue & ~option.bit
                onChange(nextValue)
              }}
            />
            <span>{option.label}</span>
          </label>
        )
      })}
      <p className="text-sm text-muted-foreground">
        Selected: {formatCIAFlags(numericValue)} ({formatCIABinary(numericValue)})
      </p>
    </div>
  )
}

function RelationCheckboxList({
  idPrefix,
  options,
  selectedIds,
  onToggle,
  emptyLabel,
}: {
  idPrefix: string
  options: Array<{ id: number; label: string }>
  selectedIds: number[]
  onToggle: (id: number, checked: boolean) => void
  emptyLabel: string
}) {
  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {options.map((option) => {
        const optionId = `${idPrefix}-${option.id}`
        return (
          <label key={option.id} htmlFor={optionId} className="flex items-center gap-3 text-sm">
            <input
              id={optionId}
              type="checkbox"
              className="h-4 w-4 rounded border border-input"
              checked={selectedIds.includes(option.id)}
              onChange={(event) => onToggle(option.id, event.target.checked)}
            />
            <span>{option.label}</span>
          </label>
        )
      })}
    </div>
  )
}

function RelationList({
  items,
  emptyLabel,
}: {
  items: string[]
  emptyLabel: string
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full border border-border px-2 py-1 text-xs">
          {item}
        </span>
      ))}
    </div>
  )
}

export function ModelForm({ model, setModel = () => {} }: Props) {
  const state = useModelStore((store) => store.state)
  const addConnection = useModelStore((store) => store.addConnection)
  const deleteConnection = useModelStore((store) => store.deleteConnection)

  if (model.type == 'technology') {
    const technology = model.item as TechnologyModel
    const setName: ChangeEventHandler<HTMLInputElement> = (event) => {
      technology.name = event.target.value
      setModel({ type: model.type, item: {...technology} })
    }
    const setDescription: ChangeEventHandler<HTMLInputElement> = (event) => {
      technology.description = event.target.value
      setModel({ type: model.type, item: {...technology} })
    }
    return (
      <form>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="technology-name">Name</FieldLabel>
            <Input
              id="technology-name"
              value={technology.name}
              onChange={setName}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="technology-description">
              Description
            </FieldLabel>
            <Input
              id="technology-description"
              value={technology.description}
              onChange={setDescription}
            />
          </Field>
        </FieldGroup>
      </form>
    )
  }

  if (model.type == 'component') {
    const component = model.item as ComponentModel
    const setName: ChangeEventHandler<HTMLInputElement> = (event) => {
      component.name = event.target.value
      setModel({ type: model.type, item: {...component} })
    }
    const setDescription: ChangeEventHandler<HTMLInputElement> = (event) => {
      component.description = event.target.value
      setModel({ type: model.type, item: {...component} })
    }
    return (
      <form>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="component-name">Name</FieldLabel>
            <Input
              id="component-name"
              value={component.name}
              onChange={setName}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="component-description">Description</FieldLabel>
            <Input
              id="component-description"
              value={component.description}
              onChange={setDescription}
            />
          </Field>
        </FieldGroup>
      </form>
    )
  }

  if (model.type == 'dataEntity') {
    const dataEntity = model.item as DataEntityModel
    const setName: ChangeEventHandler<HTMLInputElement> = (event) => {
      dataEntity.name = event.target.value
      setModel({ type: model.type, item: {...dataEntity} })
    }
    const setDescription: ChangeEventHandler<HTMLInputElement> = (event) => {
      dataEntity.description = event.target.value
      setModel({ type: model.type, item: {...dataEntity} })
    }
    return (
      <form>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="data-entity-name">Name</FieldLabel>
            <Input
              id="data-entity-name"
              value={dataEntity.name}
              onChange={setName}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="data-entity-description">
              Description
            </FieldLabel>
            <Input
              id="data-entity-description"
              value={dataEntity.description}
              onChange={setDescription}
            />
          </Field>
        </FieldGroup>
      </form>
    )
  }

  if (model.type == 'control') {
    const control = model.item as ControlModel
    const attackFeasibilityRating = calculateAttackFeasibilityRating(control)
    const setName: ChangeEventHandler<HTMLInputElement> = (event) => {
      control.name = event.target.value
      setModel({ type: model.type, item: {...control} })
    }
    const setDescription: ChangeEventHandler<HTMLInputElement> = (event) => {
      control.description = event.target.value
      setModel({ type: model.type, item: {...control} })
    }
    const setFrEt: ChangeEventHandler<HTMLSelectElement> = (event) => {
      control.fr_et = asNumber(event.target.value)
      setModel({ type: model.type, item: {...control} })
    }
    const setFrSe: ChangeEventHandler<HTMLSelectElement> = (event) => {
      control.fr_se = asNumber(event.target.value)
      setModel({ type: model.type, item: {...control} })
    }
    const setFrKoc: ChangeEventHandler<HTMLSelectElement> = (event) => {
      control.fr_koC = asNumber(event.target.value)
      setModel({ type: model.type, item: {...control} })
    }
    const setFrWoO: ChangeEventHandler<HTMLSelectElement> = (event) => {
      control.fr_WoO = asNumber(event.target.value)
      setModel({ type: model.type, item: {...control} })
    }
    const setFrEq: ChangeEventHandler<HTMLSelectElement> = (event) => {
      control.fr_eq = asNumber(event.target.value)
      setModel({ type: model.type, item: {...control} })
    }
    return (
      <form>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="control-name">Name</FieldLabel>
            <Input id="control-name" value={control.name} onChange={setName} />
          </Field>
          <Field>
            <FieldLabel htmlFor="control-description">Description</FieldLabel>
            <Input
              id="control-description"
              value={control.description}
              onChange={setDescription}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="control-fr-et">Elapsed Time</FieldLabel>
            <OptionSelect
              id="control-fr-et"
              value={control.fr_et}
              options={elapsedTimeOptions}
              onChange={setFrEt}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="control-fr-se">Specialist Expertise</FieldLabel>
            <OptionSelect
              id="control-fr-se"
              value={control.fr_se}
              options={specialistExpertiseOptions}
              onChange={setFrSe}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="control-fr-koc">Knowledge of Component</FieldLabel>
            <OptionSelect
              id="control-fr-koc"
              value={control.fr_koC}
              options={knowledgeOptions}
              onChange={setFrKoc}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="control-fr-woo">Window of Opportunity</FieldLabel>
            <OptionSelect
              id="control-fr-woo"
              value={control.fr_WoO}
              options={windowOfOpportunityOptions}
              onChange={setFrWoO}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="control-fr-eq">Equipment</FieldLabel>
            <OptionSelect
              id="control-fr-eq"
              value={control.fr_eq}
              options={equipmentOptions}
              onChange={setFrEq}
            />
          </Field>
          <Field>
            <FieldLabel>AFL</FieldLabel>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              {formatAttackFeasibilityRating(control)} | {attackFeasibilityRating.attackPotential} | {formatAttackPotentialPoints(attackFeasibilityRating.points)} points
            </div>
          </Field>
        </FieldGroup>
      </form>
    )
  }

  if (model.type == 'threatClass') {
    const threatClass = model.item as ThreatClassModel
    const setName: ChangeEventHandler<HTMLInputElement> = (event) => {
      threatClass.name = event.target.value
      setModel({ type: model.type, item: {...threatClass} })
    }
    const setDescription: ChangeEventHandler<HTMLInputElement> = (event) => {
      threatClass.description = event.target.value
      setModel({ type: model.type, item: {...threatClass} })
    }
    return (
      <form>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="threat-class-name">Name</FieldLabel>
            <Input
              id="threat-class-name"
              value={threatClass.name}
              onChange={setName}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="threat-class-description">
              Description
            </FieldLabel>
            <Input
              id="threat-class-description"
              value={threatClass.description}
              onChange={setDescription}
            />
          </Field>
        </FieldGroup>
      </form>
    )
  }

  if (model.type == 'attackStep') {
    const attackStep = model.item as AttackStepModel
    const attackFeasibilityRating = calculateAttackFeasibilityRating(attackStep)
    const availablePreviousSteps = [...state.attackSteps.values()]
      .filter((step) => step.id !== attackStep.id)
      .map((step) => ({ id: step.id, label: step.name || `Attack Step ${step.id}` }))
    const nextSteps = [...state.attackSteps.values()]
      .filter((step) => step.previous_steps.includes(attackStep.id))
      .map((step) => step.name || `Attack Step ${step.id}`)
    const setName: ChangeEventHandler<HTMLInputElement> = (event) => {
      attackStep.name = event.target.value
      setModel({ type: model.type, item: {...attackStep} })
    }
    const setDescription: ChangeEventHandler<HTMLInputElement> = (event) => {
      attackStep.description = event.target.value
      setModel({ type: model.type, item: {...attackStep} })
    }
    const setRequiredAccess: ChangeEventHandler<HTMLInputElement> = (event) => {
      attackStep.required_access = event.target.value
      setModel({ type: model.type, item: {...attackStep} })
    }
    const setFrEt: ChangeEventHandler<HTMLSelectElement> = (event) => {
      attackStep.fr_et = asNumber(event.target.value)
      setModel({ type: model.type, item: {...attackStep} })
    }
    const setFrSe: ChangeEventHandler<HTMLSelectElement> = (event) => {
      attackStep.fr_se = asNumber(event.target.value)
      setModel({ type: model.type, item: {...attackStep} })
    }
    const setFrKoc: ChangeEventHandler<HTMLSelectElement> = (event) => {
      attackStep.fr_koC = asNumber(event.target.value)
      setModel({ type: model.type, item: {...attackStep} })
    }
    const setFrWoO: ChangeEventHandler<HTMLSelectElement> = (event) => {
      attackStep.fr_WoO = asNumber(event.target.value)
      setModel({ type: model.type, item: {...attackStep} })
    }
    const setFrEq: ChangeEventHandler<HTMLSelectElement> = (event) => {
      attackStep.fr_eq = asNumber(event.target.value)
      setModel({ type: model.type, item: {...attackStep} })
    }
    const togglePreviousStep = (stepId: number, checked: boolean) => {
      const nextPreviousSteps = checked
        ? [...new Set([...(attackStep.previous_steps ?? []), stepId])]
        : (attackStep.previous_steps ?? []).filter((id) => id !== stepId)

      setModel({
        type: model.type,
        item: { ...attackStep, previous_steps: nextPreviousSteps } as AttackStepModel,
      })

      if (attackStep.id < 0) {
        return
      }

      const promise = checked
        ? addConnection(stepId, 'attackStep', attackStep.id, 'attackStep')
        : deleteConnection(stepId, 'attackStep', attackStep.id, 'attackStep')

      void promise.catch((error) => {
        console.error(error)
      })
    }
    return (
      <form>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="attack-step-name">Name</FieldLabel>
            <Input
              id="attack-step-name"
              value={attackStep.name}
              onChange={setName}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="attack-step-description">Description</FieldLabel>
            <Input
              id="attack-step-description"
              value={attackStep.description}
              onChange={setDescription}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="attack-step-required-access">
              Required Access
            </FieldLabel>
            <Input
              id="attack-step-required-access"
              value={attackStep.required_access}
              onChange={setRequiredAccess}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="attack-step-previous-steps">Previous Steps</FieldLabel>
            <RelationCheckboxList
              idPrefix="attack-step-previous-steps"
              options={availablePreviousSteps}
              selectedIds={attackStep.previous_steps ?? []}
              onToggle={togglePreviousStep}
              emptyLabel="No other attack steps available yet."
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Select predecessors here and the chain will be rendered in the graph automatically.
            </p>
          </Field>
          <Field>
            <FieldLabel htmlFor="attack-step-next-steps">Next Steps</FieldLabel>
            <RelationList
              items={nextSteps}
              emptyLabel="No next steps point here yet."
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="attack-step-fr-et">Elapsed Time</FieldLabel>
            <OptionSelect
              id="attack-step-fr-et"
              value={attackStep.fr_et}
              options={elapsedTimeOptions}
              onChange={setFrEt}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="attack-step-fr-se">Specialist Expertise</FieldLabel>
            <OptionSelect
              id="attack-step-fr-se"
              value={attackStep.fr_se}
              options={specialistExpertiseOptions}
              onChange={setFrSe}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="attack-step-fr-koc">Knowledge of Component</FieldLabel>
            <OptionSelect
              id="attack-step-fr-koc"
              value={attackStep.fr_koC}
              options={knowledgeOptions}
              onChange={setFrKoc}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="attack-step-fr-woo">Window of Opportunity</FieldLabel>
            <OptionSelect
              id="attack-step-fr-woo"
              value={attackStep.fr_WoO}
              options={windowOfOpportunityOptions}
              onChange={setFrWoO}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="attack-step-fr-eq">Equipment</FieldLabel>
            <OptionSelect
              id="attack-step-fr-eq"
              value={attackStep.fr_eq}
              options={equipmentOptions}
              onChange={setFrEq}
            />
          </Field>
          <Field>
            <FieldLabel>AFL</FieldLabel>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              {formatAttackFeasibilityRating(attackStep)} | {attackFeasibilityRating.attackPotential} | {formatAttackPotentialPoints(attackFeasibilityRating.points)} points
            </div>
          </Field>
        </FieldGroup>
      </form>
    )
  }

  if (model.type == 'threatScenario') {
    const threatScenario = model.item as ThreatScenarioModel
    const availableComponents = [...state.components.values()].map((component) => ({
      id: component.id,
      label: component.name || `Component ${component.id}`,
    }))
    const setName: ChangeEventHandler<HTMLInputElement> = (event) => {
      threatScenario.name = event.target.value
      setModel({ type: model.type, item: {...threatScenario} })
    }
    const setDescription: ChangeEventHandler<HTMLInputElement> = (event) => {
      threatScenario.description = event.target.value
      setModel({ type: model.type, item: {...threatScenario} })
    }
    const toggleComponent = (componentId: number, checked: boolean) => {
      const nextComponents = checked
        ? [...new Set([...(threatScenario.components ?? []), componentId])]
        : (threatScenario.components ?? []).filter((id) => id !== componentId)

      setModel({
        type: model.type,
        item: { ...threatScenario, components: nextComponents } as ThreatScenarioModel,
      })

      if (threatScenario.id < 0) {
        return
      }

      const promise = checked
        ? addConnection(threatScenario.id, 'threatScenario', componentId, 'component')
        : deleteConnection(threatScenario.id, 'threatScenario', componentId, 'component')

      void promise.catch((error) => {
        console.error(error)
      })
    }
    return (
      <form>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="threat-scenario-name">Name</FieldLabel>
            <Input
              id="threat-scenario-name"
              value={threatScenario.name}
              onChange={setName}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="threat-scenario-description">Description</FieldLabel>
            <Input
              id="threat-scenario-description"
              value={threatScenario.description}
              onChange={setDescription}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="threat-scenario-components">Involved Components</FieldLabel>
            <RelationCheckboxList
              idPrefix="threat-scenario-components"
              options={availableComponents}
              selectedIds={threatScenario.components ?? []}
              onToggle={toggleComponent}
              emptyLabel="No components available yet."
            />
          </Field>
        </FieldGroup>
      </form>
    )
  }

  if (model.type == 'damageScenario') {
    const damageScenario = model.item as DamageScenarioModel
    const linkedThreatScenarios = (damageScenario.threat_scenarios ?? [])
      .map((id) => state.threatScenarios.get(id))
      .filter(Boolean) as ThreatScenarioModel[]
    const availableConcernComponents = [
      ...new Set(linkedThreatScenarios.flatMap((scenario) => scenario.components ?? [])),
    ]
      .map((id) => state.components.get(id))
      .filter(Boolean) as ComponentModel[]
    const concernSummary = (concerns: DamageScenarioModel['concerns']) =>
      concerns.reduce((summary, concern) => summary | concern.affected_CIA_parts, 0)
    const setDamageScenario = (nextDamageScenario: DamageScenarioModel) => {
      setModel({
        type: model.type,
        item: {
          ...nextDamageScenario,
          impact_scale: calculateImpactLevel(nextDamageScenario),
          affected_CIA_parts: concernSummary(nextDamageScenario.concerns ?? []),
        } as DamageScenarioModel,
      })
    }
    const setName: ChangeEventHandler<HTMLInputElement> = (event) => {
      setDamageScenario({ ...damageScenario, name: event.target.value })
    }
    const setDescription: ChangeEventHandler<HTMLInputElement> = (event) => {
      setDamageScenario({ ...damageScenario, description: event.target.value })
    }
    const setConcernCIAParts = (componentId: number, value: number) => {
      const concerns = damageScenario.concerns ?? []
      const existingConcern = concerns.find((concern) => concern.component === componentId)
      const nextConcerns =
        value === 0
          ? concerns.filter((concern) => concern.component !== componentId)
          : [
              ...concerns.filter((concern) => concern.component !== componentId),
              {
                id: existingConcern?.id ?? -componentId,
                component: componentId,
                affected_CIA_parts: value,
              },
            ]

      setDamageScenario({ ...damageScenario, concerns: nextConcerns })
    }
    const setSafetyImpact: ChangeEventHandler<HTMLSelectElement> = (event) => {
      setDamageScenario({
        ...damageScenario,
        safety_impact: asNumber(event.target.value),
      })
    }
    const setFinancialImpact: ChangeEventHandler<HTMLSelectElement> = (
      event
    ) => {
      setDamageScenario({
        ...damageScenario,
        finantial_impact: asNumber(event.target.value),
      })
    }
    const setOperationalImpact: ChangeEventHandler<HTMLSelectElement> = (
      event
    ) => {
      setDamageScenario({
        ...damageScenario,
        operational_impact: asNumber(event.target.value),
      })
    }
    const setPrivacyImpact: ChangeEventHandler<HTMLSelectElement> = (event) => {
      setDamageScenario({
        ...damageScenario,
        privacy_impact: asNumber(event.target.value),
      })
    }
    return (
      <form>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="damage-scenario-name">Name</FieldLabel>
            <Input
              id="damage-scenario-name"
              value={damageScenario.name}
              onChange={setName}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="damage-scenario-description">Description</FieldLabel>
            <Input
              id="damage-scenario-description"
              value={damageScenario.description}
              onChange={setDescription}
            />
          </Field>
          <Field>
            <FieldLabel>Affected Components</FieldLabel>
            {damageScenario.threat_scenarios?.length ? (
              availableConcernComponents.length ? (
                <div className="flex flex-col gap-4">
                  {availableConcernComponents.map((component) => {
                    const concern = (damageScenario.concerns ?? []).find(
                      (item) => item.component === component.id
                    )
                    return (
                      <div key={component.id} className="rounded-md border p-3">
                        <div className="mb-3 text-sm font-medium">
                          {component.name || `Component ${component.id}`}
                        </div>
                        <CIABitmaskCheckboxGroup
                          idPrefix={`damage-scenario-concern-${component.id}`}
                          value={concern?.affected_CIA_parts ?? 0}
                          onChange={(value) => setConcernCIAParts(component.id, value)}
                        />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Linked threat scenarios do not have involved components yet.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                Link a threat scenario before choosing affected components.
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel>IL</FieldLabel>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              {formatImpactLevel(damageScenario)}
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="damage-scenario-safety">
              Safety Impact
            </FieldLabel>
            <OptionSelect
              id="damage-scenario-safety"
              value={damageScenario.safety_impact}
              options={impactOptions}
              onChange={setSafetyImpact}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="damage-scenario-financial">
              Financial Impact
            </FieldLabel>
            <OptionSelect
              id="damage-scenario-financial"
              value={damageScenario.finantial_impact}
              options={impactOptions}
              onChange={setFinancialImpact}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="damage-scenario-operational">
              Operational Impact
            </FieldLabel>
            <OptionSelect
              id="damage-scenario-operational"
              value={damageScenario.operational_impact}
              options={impactOptions}
              onChange={setOperationalImpact}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="damage-scenario-privacy">
              Privacy Impact
            </FieldLabel>
            <OptionSelect
              id="damage-scenario-privacy"
              value={damageScenario.privacy_impact}
              options={impactOptions}
              onChange={setPrivacyImpact}
            />
          </Field>
        </FieldGroup>
      </form>
    )
  }

  if (model.type == 'compromise') {
    const compromise = model.item as CompromisesModel
    const setAffectedCIAParts = (value: number) => {
      compromise.compromised_CIA_part = value
      setModel({ type: model.type, item: {...compromise} })
    }
    return (
      <form>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="compromises-parts">
              Compromised CIA Parts
            </FieldLabel>
            <CIABitmaskCheckboxGroup
              idPrefix="compromises-parts"
              value={compromise.compromised_CIA_part}
              onChange={setAffectedCIAParts}
            />
          </Field>
        </FieldGroup>
      </form>
    )
  }

  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Unknown model type</AlertTitle>
      <AlertDescription>{model.type}</AlertDescription>
    </Alert>
  )
}
