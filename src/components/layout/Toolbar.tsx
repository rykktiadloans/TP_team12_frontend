import type { Dispatch, SetStateAction } from 'react'
import { GitBranch, Table2 } from 'lucide-react'
import { Button } from '../ui/button'
import { ControlGroupManager } from '@/components/control-groups/ControlGroupManager'

export type ProjectViewMode = 'graph' | 'table'

interface ToolbarProps {
  viewMode: ProjectViewMode
  onViewModeChange: Dispatch<SetStateAction<ProjectViewMode>>
}

export default function Toolbar({ viewMode, onViewModeChange }: ToolbarProps) {
  return (
    <div className="flex h-11 items-center gap-2 border-b bg-background px-3">
      <Button
        type="button"
        size="sm"
        variant={viewMode === 'graph' ? 'default' : 'outline'}
        onClick={() => onViewModeChange('graph')}
      >
        <GitBranch />
        GRAPH VIEW
      </Button>
      <Button
        type="button"
        size="sm"
        variant={viewMode === 'table' ? 'default' : 'outline'}
        onClick={() => onViewModeChange('table')}
      >
        <Table2 />
        TABLE VIEW
      </Button>

      <div className="ml-auto">
        <ControlGroupManager />
      </div>
    </div>
  )
}
