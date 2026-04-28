import { useState } from 'react'
import { Layers, Plus, Pencil, Trash2, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useModelStore, type ActiveControlGroup } from '@/store/model-store'
import {
  createControlGroup,
  updateControlGroup,
  deleteControlGroup,
} from '@/lib/controlGroupApi'
import type { ControlGroupModel } from '@/types/models'
import { ControlGroupForm } from './ControlGroupForm'

export function ControlGroupManager() {
  const controlGroups = useModelStore((s) => s.controlGroups)
  const activeControlGroupId = useModelStore((s) => s.activeControlGroupId)
  const setActiveControlGroupId = useModelStore((s) => s.setActiveControlGroupId)
  const setControlGroups = useModelStore((s) => s.setControlGroups)
  const loadProjectState = useModelStore((s) => s.loadProjectState)
  const controlsMap = useModelStore((s) => s.state.controls)
  const allControls = Array.from(controlsMap.values())

  const [open, setOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<ControlGroupModel | null>(null)
  const [showForm, setShowForm] = useState(false)

  function getActiveLabel() {
    if (activeControlGroupId === 'all') return 'All Controls'
    if (activeControlGroupId === 'none') return 'No Controls'
    const group = controlGroups.find((g) => g.id === activeControlGroupId)
    return group ? group.name : 'All Controls'
  }

  function handleStartCreate() {
    setEditingGroup(null)
    setShowForm(true)
  }

  function handleStartEdit(group: ControlGroupModel) {
    setEditingGroup(group)
    setShowForm(true)
  }

  function handleCancelForm() {
    setShowForm(false)
    setEditingGroup(null)
  }

  async function handleSaveGroup(name: string, description: string, controlIds: number[]) {
    const projectIdStr = sessionStorage.getItem('projectId')
    if (!projectIdStr) return

    if (editingGroup) {
      await updateControlGroup(editingGroup.id, name, description, controlIds)
    } else {
      await createControlGroup(name, description, controlIds)
    }

    setShowForm(false)
    setEditingGroup(null)
    await loadProjectState(Number(projectIdStr))
  }

  async function handleDelete(group: ControlGroupModel) {
    if (!confirm(`Delete control group "${group.name}"?`)) return
    await deleteControlGroup(group.id)
    if (activeControlGroupId === group.id) {
      setActiveControlGroupId('all')
    }
    setControlGroups(controlGroups.filter((g) => g.id !== group.id))
  }

  const isActive = (id: ActiveControlGroup) => activeControlGroupId === id

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="gap-1.5">
          <Layers className="size-4" />
          <span className="hidden sm:inline">Controls:</span>
          <span className="max-w-32 truncate font-semibold">{getActiveLabel()}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Control Groups</DialogTitle>
        </DialogHeader>

        {showForm ? (
          <ControlGroupForm
            group={editingGroup}
            allControls={allControls}
            onSave={handleSaveGroup}
            onCancel={handleCancelForm}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm">
              Select the control group to use for risk calculations and PDF reports. Built-in
              groups are always available.
            </p>

            <div className="flex flex-col gap-1.5">
              <GroupRow
                label="All Controls"
                description="All controls in this project are active"
                active={isActive('all')}
                virtual
                onSelect={() => setActiveControlGroupId('all')}
              />
              <GroupRow
                label="No Controls"
                description="No controls active — shows base attack feasibility"
                active={isActive('none')}
                virtual
                onSelect={() => setActiveControlGroupId('none')}
              />

              {controlGroups.map((group) => (
                <GroupRow
                  key={group.id}
                  label={group.name}
                  description={
                    group.description ||
                    `${group.controls.length} control${group.controls.length !== 1 ? 's' : ''}`
                  }
                  badge={String(group.controls.length)}
                  active={isActive(group.id)}
                  onSelect={() => setActiveControlGroupId(group.id)}
                  onEdit={() => handleStartEdit(group)}
                  onDelete={() => handleDelete(group)}
                />
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button" size="sm" onClick={handleStartCreate}>
                <Plus className="size-4" />
                New Group
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface GroupRowProps {
  label: string
  description: string
  badge?: string
  active: boolean
  virtual?: boolean
  onSelect: () => void
  onEdit?: () => void
  onDelete?: () => void
}

function GroupRow({
  label,
  description,
  badge,
  active,
  virtual,
  onSelect,
  onEdit,
  onDelete,
}: GroupRowProps) {
  return (
    <div
      className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition-colors hover:bg-accent ${
        active ? 'border-primary bg-primary/5' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex size-5 shrink-0 items-center justify-center">
        {active && <Check className="size-4 text-primary" />}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="font-medium">{label}</span>
          {virtual && (
            <Badge variant="secondary" className="text-xs">
              built-in
            </Badge>
          )}
          {badge != null && !virtual && (
            <Badge variant="outline" className="text-xs">
              {badge} controls
            </Badge>
          )}
        </div>
        <span className="text-muted-foreground truncate text-xs">{description}</span>
      </div>

      {!virtual && (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <Button type="button" size="icon" variant="ghost" className="size-7" onClick={onEdit}>
              <Pencil className="size-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
