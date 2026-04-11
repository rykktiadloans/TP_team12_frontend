import { useEffect, useState } from 'react'
import { ModelForm, type ModelFormItem } from '../details/ModelForm'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { DialogClose } from '@radix-ui/react-dialog'
import { FieldGroup } from '../ui/field'
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { useModelStore } from '@/store/model-store'

interface Props {}

export function NewModelButton({}: Props) {
  const types = [
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
  ] as ModelType[]

  const addItem = useModelStore((store) => store.addItem)
  const [type, setType] = useState('' as ModelType)
  const [model, setModel] = useState({} as Model)

  const setSelectType = (value: ModelType) => {
    setType(() => {
      switch (value) {
        case 'node':
          setModel({
            id: -1,
            title: '',
            content: '',
          } as NodeModel)
          break
        case 'technology':
          setModel({
            id: -1,
            name: '',
            description: '',
            project: null,
          } as TechnologyModel)
          break
        case 'component':
          setModel({
            id: -1,
            name: '',
            description: '',
            communicates_with: [],
            technology: [],
            project: null,
          } as ComponentModel)
          break
        case 'dataEntity':
          setModel({
            id: -1,
            name: '',
            description: '',
            component: null,
            technology: [],
            project: null,
          } as DataEntityModel)
          break
        case 'control':
          setModel({
            id: -1,
            name: '',
            fr_et: '',
            fr_se: '',
            fr_koC: '',
            fr_WoO: '',
            fr_eq: '',
            component: null,
            project: null,
          } as ControlModel)
          break
        case 'threatClass':
          setModel({
            id: -1,
            name: '',
            description: '',
            project: null,
          } as ThreatClassModel)
          break
        case 'attackStep':
          setModel({
            id: -1,
            name: '',
            fr_et: '',
            fr_se: '',
            fr_koC: '',
            fr_WoO: '',
            fr_eq: '',
            component: null,
            control: [],
            prepared_by: [],
            threat_class: null,
            project: null,
          } as AttackStepModel)
          break
        case 'threatScenario':
          setModel({
            id: -1,
            name: '',
            attackStep: null,
            threat_class: null,
            project: null,
          } as ThreatScenarioModel)
          break
        case 'damageScenario':
          setModel({
            id: -1,
            name: '',
            affected_CIA_parts: '',
            impact_scale: '',
            safety_impact: '',
            finantial_impact: '',
            operational_impact: '',
            privacy_impact: '',
            component: null,
            threat_scenario: null,
            project: null,
          } as DamageScenarioModel)
          break
        case 'compromise':
          setModel({
            id: -1,
            affected_CIA_parts: '',
            component: null,
            threat_scenario: null,
            project: null,
          } as CompromisesModel)
          break
        default:
          setModel({
            id: -1,
          })
      }
      return value
    })
  }

  const modelForm = { type, item: model }
  const setFormModel = (item: ModelFormItem) => {
    setModel(item.item)
  }

  return (
    <Dialog
      onOpenChange={() => {
        setType('' as ModelType)
        setModel({ id: -1 })
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" type="button">
          New
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Model</DialogTitle>
          <DialogDescription>Create a new model</DialogDescription>
        </DialogHeader>

        <Select onValueChange={setSelectType}>
          <SelectTrigger>
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Types</SelectLabel>
              {types.map((type) => (
                <SelectItem value={type} key={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <ModelForm model={modelForm} setModel={setFormModel} />

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button disabled={type === ''} onClick={() => addItem(type, model)}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
