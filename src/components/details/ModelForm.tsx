import type {
  AttackStepModel,
  ComponentModel,
  CompromisesModel,
  ControlModel,
  CybersecurityGoalModel,
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
  calculateEffectiveAttackFeasibilityRating,
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

const attackStepExamples: Array<{
  name: string
  description: string
  required_access: string
  fr_et: number
  fr_se: number
  fr_koC: number
  fr_WoO: number
  fr_eq: number
}> = [
  {
    name: 'CAN frame injection',
    description: 'Attacker injects crafted CAN frames to influence component behaviour or state.',
    required_access: 'Physical or logical access to the vehicle network',
    fr_et: 10,
    fr_se: 3,
    fr_koC: 0,
    fr_WoO: 1,
    fr_eq: 4,
  },
  {
    name: 'Diagnostic service abuse',
    description: 'Attacker invokes exposed diagnostic services to read data, alter configuration, or trigger routines.',
    required_access: 'Diagnostic session through OBD, gateway, or remote maintenance channel',
    fr_et: 4,
    fr_se: 3,
    fr_koC: 3,
    fr_WoO: 4,
    fr_eq: 0,
  },
  {
    name: 'Firmware extraction',
    description: 'Attacker extracts firmware from memory or update packages to discover secrets and implementation weaknesses.',
    required_access: 'Physical device access, update image access, or debug interface access',
    fr_et: 17,
    fr_se: 6,
    fr_koC: 7,
    fr_WoO: 10,
    fr_eq: 7,
  },
  {
    name: 'Credential or key compromise',
    description: 'Attacker obtains credentials or cryptographic keys and uses them to impersonate trusted software or users.',
    required_access: 'Access to storage, logs, memory, backend account, or provisioning material',
    fr_et: 10,
    fr_se: 6,
    fr_koC: 7,
    fr_WoO: 4,
    fr_eq: 4,
  },
]

const threatScenarioExamples: Array<{
  name: string
  description: string
}> = [
  {
    name: 'Spoofed in-vehicle network messages',
    description: 'Attacker sends messages that appear to originate from a trusted ECU to manipulate receiving components.',
  },
  {
    name: 'Unauthorized diagnostic access',
    description: 'Attacker reaches diagnostic functionality and performs operations outside the intended service context.',
  },
  {
    name: 'Malicious software update',
    description: 'Attacker delivers or installs an unauthorized software package that changes component behaviour.',
  },
  {
    name: 'Remote service exploitation',
    description: 'Attacker exploits a remotely reachable service to gain access to vehicle functions, data, or networks.',
  },
]

const damageScenarioExamples: Array<{
  name: string
  description: string
  affected_CIA_parts: number
  safety_impact: number
  finantial_impact: number
  operational_impact: number
  privacy_impact: number
}> = [
  {
    name: 'Loss of integrity of control commands',
    description: 'Manipulated commands or signals cause unintended or incorrect component behaviour.',
    affected_CIA_parts: 2,
    safety_impact: 3,
    finantial_impact: 2,
    operational_impact: 3,
    privacy_impact: 0,
  },
  {
    name: 'Disclosure of sensitive vehicle or user data',
    description: 'Confidential data is exposed to an unauthorized party through storage, communication, or service misuse.',
    affected_CIA_parts: 4,
    safety_impact: 0,
    finantial_impact: 2,
    operational_impact: 1,
    privacy_impact: 3,
  },
  {
    name: 'Loss of availability of vehicle function',
    description: 'A component or function becomes unavailable, degraded, delayed, or unreliable.',
    affected_CIA_parts: 1,
    safety_impact: 2,
    finantial_impact: 2,
    operational_impact: 3,
    privacy_impact: 0,
  },
  {
    name: 'Unauthorized change to security configuration',
    description: 'Security-relevant settings are modified, weakening protection or enabling later compromise.',
    affected_CIA_parts: 2,
    safety_impact: 1,
    finantial_impact: 2,
    operational_impact: 2,
    privacy_impact: 1,
  },
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
  const controlClasses = useModelStore((store) => store.controlClasses)
  const getActiveControlIds = useModelStore((store) => store.getActiveControlIds)
  useModelStore((store) => store.activeControlGroupId) // re-render when group changes
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
    const availableControlClasses = [...controlClasses.values()]
    const applyControlClass = (classId: number) => {
      const cls = controlClasses.get(classId)
      if (!cls) return
      setModel({
        type: model.type,
        item: {
          ...control,
          control_class: classId,
          fr_et: cls.fr_et,
          fr_se: cls.fr_se,
          fr_koC: cls.fr_koC,
          fr_WoO: cls.fr_WoO,
          fr_eq: cls.fr_eq,
        } as ControlModel,
      })
    }
    const availableThreatScenarios = [...state.threatScenarios.values()].map((ts) => ({
      id: ts.id,
      label: ts.name || `Threat Scenario ${ts.id}`,
    }))
    const toggleThreatScenario = (tsId: number, checked: boolean) => {
      const next = checked
        ? [...new Set([...(control.threat_scenarios ?? []), tsId])]
        : (control.threat_scenarios ?? []).filter((id) => id !== tsId)
      setModel({ type: model.type, item: { ...control, threat_scenarios: next } as ControlModel })
      if (control.id < 0) return
      const promise = checked
        ? addConnection(control.id, 'control', tsId, 'threatScenario')
        : deleteConnection(control.id, 'control', tsId, 'threatScenario')
      void promise.catch((error) => { console.error(error) })
    }
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
            <FieldLabel htmlFor="control-class">Instantiates</FieldLabel>
            <select
              id="control-class"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none"
              value={control.control_class ?? ''}
              onChange={(e) => {
                const val = e.target.value
                if (val === '') {
                  setModel({ type: model.type, item: { ...control, control_class: null } as ControlModel })
                } else {
                  applyControlClass(Number(val))
                }
              }}
            >
              <option value="">— None —</option>
              {availableControlClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Selecting a class fills the factor fields with its default values. You can still adjust them freely.
            </p>
          </Field>
          <Field>
            <FieldLabel>Threatened By</FieldLabel>
            <RelationCheckboxList
              idPrefix="control-threat-scenarios"
              options={availableThreatScenarios}
              selectedIds={control.threat_scenarios ?? []}
              onToggle={toggleThreatScenario}
              emptyLabel="No threat scenarios available yet."
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Threat scenarios this control addresses. Traceability only — does not affect calculations.
            </p>
          </Field>
          <p className="text-xs text-muted-foreground">
            The values below define how much additional effort this control requires from an attacker to bypass. They are added on top of the mitigated attack step's base factors.
          </p>
          <Field>
            <FieldLabel htmlFor="control-fr-et">Added Elapsed Time</FieldLabel>
            <OptionSelect
              id="control-fr-et"
              value={control.fr_et}
              options={elapsedTimeOptions}
              onChange={setFrEt}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="control-fr-se">Added Specialist Expertise</FieldLabel>
            <OptionSelect
              id="control-fr-se"
              value={control.fr_se}
              options={specialistExpertiseOptions}
              onChange={setFrSe}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="control-fr-koc">Added Knowledge Required</FieldLabel>
            <OptionSelect
              id="control-fr-koc"
              value={control.fr_koC}
              options={knowledgeOptions}
              onChange={setFrKoc}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="control-fr-woo">Added Window of Opportunity</FieldLabel>
            <OptionSelect
              id="control-fr-woo"
              value={control.fr_WoO}
              options={windowOfOpportunityOptions}
              onChange={setFrWoO}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="control-fr-eq">Added Equipment Required</FieldLabel>
            <OptionSelect
              id="control-fr-eq"
              value={control.fr_eq}
              options={equipmentOptions}
              onChange={setFrEq}
            />
          </Field>
          <Field>
            <FieldLabel>Local Contribution (AFL)</FieldLabel>
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
    const activeControlIds = getActiveControlIds()
    const activeControls = [...state.controls.values()].filter((c) =>
      activeControlIds.includes(c.id)
    )
    const effectiveRating = calculateEffectiveAttackFeasibilityRating(
      { ...attackStep, id: attackStep.id },
      activeControls
    )
    const hasActiveControls = activeControls.some((c) => c.attack_steps.includes(attackStep.id))
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
    const applyAttackStepExample = (exampleIndex: number) => {
      const example = attackStepExamples[exampleIndex]
      if (!example) return
      setModel({
        type: model.type,
        item: {
          ...attackStep,
          ...example,
        } as AttackStepModel,
      })
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
            <FieldLabel htmlFor="attack-step-example">Example</FieldLabel>
            <select
              id="attack-step-example"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
              defaultValue=""
              onChange={(event) => {
                applyAttackStepExample(Number(event.target.value))
                event.target.value = ''
              }}
            >
              <option value="" disabled>Apply an attack step example</option>
              {attackStepExamples.map((example, index) => (
                <option key={example.name} value={index}>
                  {example.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-muted-foreground">
              Applying an example fills the attack-feasibility fields. You can still adjust them freely.
            </p>
          </Field>
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
            <FieldLabel>Attack Feasibility</FieldLabel>
            {hasActiveControls ? (
              <div className="flex flex-col gap-1.5">
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                  <span className="text-muted-foreground text-xs mr-2">Effective (with controls):</span>
                  {effectiveRating.level} ({effectiveRating.value}) | {effectiveRating.attackPotential} | {formatAttackPotentialPoints(effectiveRating.points)} pts
                </div>
                <div className="rounded-md border bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                  <span className="mr-2">Base (no controls):</span>
                  {attackFeasibilityRating.level} ({attackFeasibilityRating.value}) | {attackFeasibilityRating.attackPotential} | {formatAttackPotentialPoints(attackFeasibilityRating.points)} pts
                </div>
              </div>
            ) : (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                {formatAttackFeasibilityRating(attackStep)} | {attackFeasibilityRating.attackPotential} | {formatAttackPotentialPoints(attackFeasibilityRating.points)} pts
              </div>
            )}
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
    const applyThreatScenarioExample = (exampleIndex: number) => {
      const example = threatScenarioExamples[exampleIndex]
      if (!example) return
      setModel({
        type: model.type,
        item: {
          ...threatScenario,
          ...example,
        } as ThreatScenarioModel,
      })
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
            <FieldLabel htmlFor="threat-scenario-example">Example</FieldLabel>
            <select
              id="threat-scenario-example"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
              defaultValue=""
              onChange={(event) => {
                applyThreatScenarioExample(Number(event.target.value))
                event.target.value = ''
              }}
            >
              <option value="" disabled>Apply a threat scenario example</option>
              {threatScenarioExamples.map((example, index) => (
                <option key={example.name} value={index}>
                  {example.name}
                </option>
              ))}
            </select>
          </Field>
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
    const applyDamageScenarioExample = (exampleIndex: number) => {
      const example = damageScenarioExamples[exampleIndex]
      if (!example) return
      const concerns = damageScenario.concerns ?? []
      setModel({
        type: model.type,
        item: {
          ...damageScenario,
          ...example,
          concerns,
          affected_CIA_parts: concerns.length
            ? concernSummary(concerns)
            : example.affected_CIA_parts,
        } as DamageScenarioModel,
      })
    }
    return (
      <form>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="damage-scenario-example">Example</FieldLabel>
            <select
              id="damage-scenario-example"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
              defaultValue=""
              onChange={(event) => {
                applyDamageScenarioExample(Number(event.target.value))
                event.target.value = ''
              }}
            >
              <option value="" disabled>Apply a damage scenario example</option>
              {damageScenarioExamples.map((example, index) => (
                <option key={example.name} value={index}>
                  {example.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-muted-foreground">
              Applying an example fills impact ratings and the fallback CIA summary.
            </p>
          </Field>
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

  if (model.type == 'cybersecurityGoal') {
    const goal = model.item as CybersecurityGoalModel
    const availableDamageScenarios = [...state.damageScenarios.values()].map((ds) => ({
      id: ds.id,
      label: ds.name || `Damage Scenario ${ds.id}`,
    }))
    const availableControls = [...state.controls.values()].map((c) => ({
      id: c.id,
      label: c.name || `Control ${c.id}`,
    }))
    const setName: ChangeEventHandler<HTMLInputElement> = (event) => {
      setModel({ type: model.type, item: { ...goal, name: event.target.value } as CybersecurityGoalModel })
    }
    const setDescription: ChangeEventHandler<HTMLInputElement> = (event) => {
      setModel({ type: model.type, item: { ...goal, description: event.target.value } as CybersecurityGoalModel })
    }
    const toggleDS = (id: number, checked: boolean) => {
      const next = checked
        ? [...new Set([...(goal.damage_scenarios ?? []), id])]
        : (goal.damage_scenarios ?? []).filter((x) => x !== id)
      setModel({ type: model.type, item: { ...goal, damage_scenarios: next } as CybersecurityGoalModel })
      if (goal.id < 0) return
      const promise = checked
        ? addConnection(goal.id, 'cybersecurityGoal', id, 'damageScenario')
        : deleteConnection(goal.id, 'cybersecurityGoal', id, 'damageScenario')
      void promise.catch(console.error)
    }
    const toggleControl = (id: number, checked: boolean) => {
      const next = checked
        ? [...new Set([...(goal.controls ?? []), id])]
        : (goal.controls ?? []).filter((x) => x !== id)
      setModel({ type: model.type, item: { ...goal, controls: next } as CybersecurityGoalModel })
      if (goal.id < 0) return
      const promise = checked
        ? addConnection(goal.id, 'cybersecurityGoal', id, 'control')
        : deleteConnection(goal.id, 'cybersecurityGoal', id, 'control')
      void promise.catch(console.error)
    }
    return (
      <form>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="cg-name">Name</FieldLabel>
            <Input id="cg-name" value={goal.name} onChange={setName} placeholder="e.g. CG-01" />
          </Field>
          <Field>
            <FieldLabel htmlFor="cg-desc">Description</FieldLabel>
            <Input id="cg-desc" value={goal.description} onChange={setDescription}
              placeholder="The security objective to achieve…" />
          </Field>
          <Field>
            <FieldLabel htmlFor="cg-cal">CAL (Cybersecurity Assurance Level)</FieldLabel>
            <select
              id="cg-cal"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
              value={goal.cal ?? ''}
              onChange={(e) =>
                setModel({
                  type: model.type,
                  item: { ...goal, cal: e.target.value ? Number(e.target.value) : null } as CybersecurityGoalModel,
                })
              }
            >
              <option value="">— Not set —</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>CAL {n}</option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel>Derived From (Damage Scenarios)</FieldLabel>
            <RelationCheckboxList
              idPrefix="cg-ds"
              options={availableDamageScenarios}
              selectedIds={goal.damage_scenarios ?? []}
              onToggle={toggleDS}
              emptyLabel="No damage scenarios available yet."
            />
          </Field>
          <Field>
            <FieldLabel>Addressed By (Controls)</FieldLabel>
            <RelationCheckboxList
              idPrefix="cg-controls"
              options={availableControls}
              selectedIds={goal.controls ?? []}
              onToggle={toggleControl}
              emptyLabel="No controls available yet."
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
