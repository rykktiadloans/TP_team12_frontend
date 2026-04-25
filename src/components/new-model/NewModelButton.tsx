import { useState } from 'react'
import { ModelForm, type ModelFormItem } from '../details/ModelForm'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import type { Model, ModelType } from '@/types/models'
import { useModelStore } from '@/store/model-store'
import { createDefaultModel, hasRequiredName } from '@/lib/modelFactory'

interface Props {}

export function NewModelButton({}: Props) {
  const types: ModelType[] = [
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
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-lg border bg-background shadow-lg">
            <div className="px-6 pt-6 pb-4">
              <div className="text-lg font-semibold">New Model</div>
              <div className="text-sm text-muted-foreground">
                Create a new model
              </div>
            </div>

            <div className="px-6 pb-4">
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
              <ScrollArea className="min-h-0 flex-1 px-6">
                <div className="pb-4 pr-3">
                  <ModelForm
                    model={{ type, item: model }}
                    setModel={setFormModel}
                  />
                </div>
              </ScrollArea>
            ) : null}

            {error ? (
              <div className="mx-6 mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex shrink-0 justify-end gap-2 border-t px-6 py-4">
              <Button variant="outline" type="button" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!type || !hasRequiredName(model)}
                onClick={handleCreate}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
