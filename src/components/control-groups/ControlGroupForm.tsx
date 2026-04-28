import { useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ControlGroupModel, ControlModel } from '@/types/models'

interface ControlGroupFormProps {
  group: ControlGroupModel | null
  allControls: ControlModel[]
  onSave: (name: string, description: string, controlIds: number[]) => Promise<void>
  onCancel: () => void
}

export function ControlGroupForm({ group, allControls, onSave, onCancel }: ControlGroupFormProps) {
  const [name, setName] = useState(group?.name ?? '')
  const [description, setDescription] = useState(group?.description ?? '')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(group?.controls.map((c) => c.id) ?? [])
  )
  const [saving, setSaving] = useState(false)

  function toggleControl(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSave(name.trim(), description.trim(), [...selectedIds])
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button type="button" size="icon" variant="ghost" className="size-8" onClick={onCancel}>
          <ArrowLeft className="size-4" />
        </Button>
        <span className="font-medium">{group ? 'Edit Group' : 'New Group'}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cg-name">Name</Label>
        <Input
          id="cg-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Baseline Controls"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cg-desc">Description</Label>
        <Textarea
          id="cg-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional — appears in PDF reports"
          rows={2}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Controls in this group</Label>
        <div className="max-h-56 overflow-y-auto rounded-md border">
          {allControls.length === 0 ? (
            <p className="text-muted-foreground p-4 text-sm">No controls in this project yet.</p>
          ) : (
            allControls.map((control) => (
              <label
                key={control.id}
                className="flex cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-0 hover:bg-accent"
              >
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={selectedIds.has(control.id)}
                  onChange={() => toggleControl(control.id)}
                />
                <span className="text-sm">{control.name}</span>
              </label>
            ))
          )}
        </div>
        <p className="text-muted-foreground text-xs">
          {selectedIds.size} control{selectedIds.size !== 1 ? 's' : ''} selected
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !name.trim()}>
          <Save className="size-4" />
          {saving ? 'Saving…' : 'Save Group'}
        </Button>
      </div>
    </form>
  )
}
