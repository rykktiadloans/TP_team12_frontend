import { useState } from 'react'
import { ModelForm, type ModelFormItem } from '../details/ModelForm'
import { Button } from '../ui/button'
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
import { useModelStore } from '@/store/model-store'

interface Props {}

function createDefaultModel(type: ModelType): Model {
  switch (type) {
    case 'node':
      return { id: -1, title: '', content: '' } as NodeModel
    case 'technology':
      return { id: -1, name: '', description: '', project: null } as TechnologyModel
    case 'component':
      return {
        id: -1,
        name: '',
        description: '',
        communicates_with: [],
        technology: [],
        project: null,
      } as ComponentModel
    case 'dataEntity':
      return {
        id: -1,
        name: '',
        description: '',
        component: null,
        technology: [],
        project: null,
      } as DataEntityModel
    case 'control':
      return {
        id: -1,
        name: '',
        fr_et: 0,
        fr_se: 0,
        fr_koC: 0,
        fr_WoO: 0,
        fr_eq: 0,
        component: null,
        project: null,
      } as ControlModel
    case 'threatClass':
      return { id: -1, name: '', description: '', project: null } as ThreatClassModel
    case 'attackStep':
      return {
        id: -1,
        name: '',
        fr_et: 0,
        fr_se: 0,
        fr_koC: 0,
        fr_WoO: 0,
        fr_eq: 0,
        component: null,
        controls: [],
        prepared_by: [],
        threat_scenarios: [],
        threat_class: null,
        project: null,
      } as AttackStepModel
    case 'threatScenario':
      return {
        id: -1,
        name: '',
        attack_steps: [],
        damage_scenarios: [],
        compromises: [],
        threat_class: null,
        project: null,
      } as ThreatScenarioModel
    case 'damageScenario':
      return {
        id: -1,
        name: '',
        affected_CIA_parts: 0,
        impact_scale: 0,
        safety_impact: 0,
        finantial_impact: 0,
        operational_impact: 0,
        privacy_impact: 0,
        component: null,
        threat_scenarios: [],
        project: null,
      } as DamageScenarioModel
    case 'compromise':
      return {
        id: -1,
        compromised_CIA_part: 0,
        component: null,
        threat_scenario: null,
        project: null,
      } as CompromisesModel
    default:
      return { id: -1 }
  }
}

export function NewModelButton({}: Props) {
  const types: ModelType[] = [
    'node',
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

  const addItem = useModelStore((store) => store.addItem)
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<ModelType | ''>('')
  const [model, setModel] = useState<Model>({ id: -1 })
  const [error, setError] = useState('')

  const resetForm = () => {
    setType('')
    setModel({ id: -1 })
  }

  const handleTypeChange = (nextType: ModelType) => {
    setType(nextType)
    setModel(createDefaultModel(nextType))
  }

  const handleClose = () => {
    setOpen(false)
    setError('')
    resetForm()
  }

  const handleCreate = async () => {
    if (!type) {
      return
    }

    try {
      setError('')
      await addItem(type, model)
      handleClose()
    } catch (createError) {
      console.error(createError)
      setError('Could not save this model to the API.')
    }
  }

  const setFormModel = (item: ModelFormItem) => {
    setModel(item.item)
  }

  return (
    <>
      <Button size="sm" type="button" onClick={() => setOpen(true)}>
        New
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg">
            <div className="mb-4">
              <div className="text-lg font-semibold">New Model</div>
              <div className="text-sm text-muted-foreground">
                Create a new model
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium" htmlFor="new-model-type">
                Type
              </label>
              <select
                id="new-model-type"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
                value={type}
                onChange={(event) => handleTypeChange(event.target.value as ModelType)}
              >
                <option value="">Select a type</option>
                {types.map((itemType) => (
                  <option key={itemType} value={itemType}>
                    {itemType}
                  </option>
                ))}
              </select>
            </div>

            {type ? (
              <div className="mb-4">
                <ModelForm
                  model={{ type, item: model }}
                  setModel={setFormModel}
                />
              </div>
            ) : null}

            {error ? (
              <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="button" disabled={!type} onClick={handleCreate}>
                Create
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
