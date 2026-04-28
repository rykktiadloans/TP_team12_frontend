import { useState, type Dispatch, type SetStateAction } from 'react'
import { Bot, FileDown, GitBranch, Table2 } from 'lucide-react'
import { Button } from '../ui/button'
import { ControlGroupManager } from '@/components/control-groups/ControlGroupManager'
import { api } from '@/lib/api'

export type ProjectViewMode = 'graph' | 'table' | 'assistants'

interface ToolbarProps {
  viewMode: ProjectViewMode
  onViewModeChange: Dispatch<SetStateAction<ProjectViewMode>>
}

export default function Toolbar({ viewMode, onViewModeChange }: ToolbarProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownloadReport = async () => {
    const projectId = sessionStorage.getItem('projectId')
    if (!projectId) return
    setDownloading(true)
    try {
      const response = await api.get('/report/', {
        params: { project_id: projectId },
        responseType: 'blob',
      })
      const url = URL.createObjectURL(response.data as Blob)
      const a   = document.createElement('a')
      a.href     = url
      a.download = `tara-report-${projectId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Report generation failed', err)
    } finally {
      setDownloading(false)
    }
  }

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
      <Button
        type="button"
        size="sm"
        variant={viewMode === 'assistants' ? 'default' : 'outline'}
        onClick={() => onViewModeChange('assistants')}
      >
        <Bot />
        ASSISTANTS
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleDownloadReport}
          disabled={downloading}
        >
          <FileDown />
          {downloading ? 'Generating…' : 'Generate Report'}
        </Button>
        <ControlGroupManager />
      </div>
    </div>
  )
}
