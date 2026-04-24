import type {
  AttackStepModel,
  ComponentModel,
  CompromisesModel,
  ControlModel,
  DamageScenarioModel,
  DataEntityModel,
  Model,
  ModelType,
  NodeModel,
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
  elapsedTimeOptions,
  equipmentOptions,
  formatCIABinary,
  impactOptions,
  knowledgeOptions,
  specialistExpertiseOptions,
  windowOfOpportunityOptions,
  type Option,
} from '@/lib/tara'

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
        Stored value: {numericValue} ({formatCIABinary(numericValue)})
      </p>
    </div>
  )
}

export function ModelForm({ model, setModel = () => {} }: Props) {
  if (model.type == 'node') {
    const node = model.item as NodeModel
    const setTitle: ChangeEventHandler<HTMLInputElement> = (event) => {
      node.title = event.target.value
      setModel({ type: model.type, item: {...node} })
    }
    const setContent: ChangeEventHandler<HTMLInputElement> = (event) => {
      node.content = event.target.value
      setModel({ type: model.type, item: {...node} })
    }
    return (
      <form>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="node-title">Title</FieldLabel>
            <Input id="node-title" value={node.title} onChange={setTitle} />
          </Field>
          <Field>
            <FieldLabel htmlFor="node-content">Content</FieldLabel>
            <Input
              id="node-content"
              value={node.content}
              onChange={setContent}
            />
          </Field>
        </FieldGroup>
      </form>
    )
  }

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
    const setName: ChangeEventHandler<HTMLInputElement> = (event) => {
      control.name = event.target.value
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
            <FieldLabel htmlFor="control-fr-et">Fr_et</FieldLabel>
            <OptionSelect
              id="control-fr-et"
              value={control.fr_et}
              options={elapsedTimeOptions}
              onChange={setFrEt}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="control-fr-se">Fr_se</FieldLabel>
            <OptionSelect
              id="control-fr-se"
              value={control.fr_se}
              options={specialistExpertiseOptions}
              onChange={setFrSe}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="control-fr-koc">Fr_koC</FieldLabel>
            <OptionSelect
              id="control-fr-koc"
              value={control.fr_koC}
              options={knowledgeOptions}
              onChange={setFrKoc}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="control-fr-woo">Fr_WoO</FieldLabel>
            <OptionSelect
              id="control-fr-woo"
              value={control.fr_WoO}
              options={windowOfOpportunityOptions}
              onChange={setFrWoO}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="control-fr-eq">Fr_eq</FieldLabel>
            <OptionSelect
              id="control-fr-eq"
              value={control.fr_eq}
              options={equipmentOptions}
              onChange={setFrEq}
            />
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
    const setName: ChangeEventHandler<HTMLInputElement> = (event) => {
      attackStep.name = event.target.value
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
            <FieldLabel htmlFor="attack-step-fr-et">Fr_et</FieldLabel>
            <OptionSelect
              id="attack-step-fr-et"
              value={attackStep.fr_et}
              options={elapsedTimeOptions}
              onChange={setFrEt}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="attack-step-fr-se">Fr_se</FieldLabel>
            <OptionSelect
              id="attack-step-fr-se"
              value={attackStep.fr_se}
              options={specialistExpertiseOptions}
              onChange={setFrSe}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="attack-step-fr-koc">Fr_koC</FieldLabel>
            <OptionSelect
              id="attack-step-fr-koc"
              value={attackStep.fr_koC}
              options={knowledgeOptions}
              onChange={setFrKoc}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="attack-step-fr-woo">Fr_WoO</FieldLabel>
            <OptionSelect
              id="attack-step-fr-woo"
              value={attackStep.fr_WoO}
              options={windowOfOpportunityOptions}
              onChange={setFrWoO}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="attack-step-fr-eq">Fr_eq</FieldLabel>
            <OptionSelect
              id="attack-step-fr-eq"
              value={attackStep.fr_eq}
              options={equipmentOptions}
              onChange={setFrEq}
            />
          </Field>
        </FieldGroup>
      </form>
    )
  }

  if (model.type == 'threatScenario') {
    const threatScenario = model.item as ThreatScenarioModel
    const setName: ChangeEventHandler<HTMLInputElement> = (event) => {
      threatScenario.name = event.target.value
      setModel({ type: model.type, item: {...threatScenario} })
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
        </FieldGroup>
      </form>
    )
  }

  if (model.type == 'damageScenario') {
    const damageScenario = model.item as DamageScenarioModel
    const setName: ChangeEventHandler<HTMLInputElement> = (event) => {
      damageScenario.name = event.target.value
      setModel({ type: model.type, item: {...damageScenario} })
    }
    const setAffectedCIAParts = (value: number) => {
      damageScenario.affected_CIA_parts = value
      setModel({ type: model.type, item: {...damageScenario} })
    }
    const setImpactScale: ChangeEventHandler<HTMLSelectElement> = (event) => {
      damageScenario.impact_scale = asNumber(event.target.value)
      setModel({ type: model.type, item: {...damageScenario} })
    }
    const setSafetyImpact: ChangeEventHandler<HTMLSelectElement> = (event) => {
      damageScenario.safety_impact = asNumber(event.target.value)
      setModel({ type: model.type, item: {...damageScenario} })
    }
    const setFinancialImpact: ChangeEventHandler<HTMLSelectElement> = (
      event
    ) => {
      damageScenario.finantial_impact = asNumber(event.target.value)
      setModel({ type: model.type, item: {...damageScenario} })
    }
    const setOperationalImpact: ChangeEventHandler<HTMLSelectElement> = (
      event
    ) => {
      damageScenario.operational_impact = asNumber(event.target.value)
      setModel({ type: model.type, item: {...damageScenario} })
    }
    const setPrivacyImpact: ChangeEventHandler<HTMLSelectElement> = (event) => {
      damageScenario.privacy_impact = asNumber(event.target.value)
      setModel({ type: model.type, item: {...damageScenario} })
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
            <FieldLabel htmlFor="damage-scenario-parts">
              Affected CIA Parts
            </FieldLabel>
            <CIABitmaskCheckboxGroup
              idPrefix="damage-scenario-parts"
              value={damageScenario.affected_CIA_parts}
              onChange={setAffectedCIAParts}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="damage-scenario-scale">
              Impact Scale
            </FieldLabel>
            <OptionSelect
              id="damage-scenario-scale"
              value={damageScenario.impact_scale}
              options={impactOptions}
              onChange={setImpactScale}
            />
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
