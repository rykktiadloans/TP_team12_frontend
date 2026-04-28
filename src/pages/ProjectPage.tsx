import Header from '@/components/layout/Header'
import Toolbar, { type ProjectViewMode } from '@/components/layout/Toolbar'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { ExplorerWindow } from '@/components/layout/ExplorerWindow'
import { MainCardsWindow } from '@/components/layout/MainCardsWindow'
import { ConsoleWindow } from '@/components/layout/ConsoleWindow'
import { DetailsWindow } from '@/components/layout/DetailsWindow'
import {
  TableNavigationWindow,
} from '@/components/layout/TableNavigationWindow'
import { TableViewWindow } from '@/components/layout/TableViewWindow'
import {
  AssistantNavigationWindow,
  AssistantViewWindow,
  type AssistantKey,
} from '@/components/assistants/AssistantViewWindow'
import type { TaraTableKey } from '@/lib/taraTables'
import { SelectedItemProvider } from '@/context/SelectedItemContext'
import { useEffect, useMemo, useState } from 'react'
import { useModelStore } from '@/store/model-store'

export default function ProjectPage() {
  const [selectedItem, setSelectedItem] = useState(null as null | string)
  const [viewMode, setViewMode] = useState<ProjectViewMode>('graph')
  const [activeTable, setActiveTable] = useState<TaraTableKey>('threatScenarios')
  const [activeAssistant, setActiveAssistant] = useState<AssistantKey>('assetIdentification')
  const loadProjectState = useModelStore((store) => store.loadProjectState)
  const projectId = sessionStorage.getItem('projectId')

  useEffect(() => {
    if (!projectId) {
      return
    }

    void loadProjectState(projectId)
  }, [loadProjectState, projectId])

  const defaultValue = useMemo(
    () => ({
      selectedItem,
      setSelectedItem,
    }),
    [selectedItem]
  )
  return (
    <div className="w-screen h-screen flex flex-col">
      <SelectedItemProvider value={defaultValue}>
        <Header />
        <Toolbar viewMode={viewMode} onViewModeChange={setViewMode} />
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 min-h-0 w-full"
        >
          <ResizablePanel defaultSize={22} minSize={16}>
            {viewMode === 'graph' ? (
              <ExplorerWindow projectId={projectId} />
            ) : viewMode === 'table' ? (
              <TableNavigationWindow
                activeTable={activeTable}
                onActiveTableChange={setActiveTable}
              />
            ) : (
              <AssistantNavigationWindow
                activeAssistant={activeAssistant}
                onActiveAssistantChange={setActiveAssistant}
              />
            )}
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={56} minSize={30}>
            {viewMode === 'graph' ? (
              <ResizablePanelGroup
                direction="vertical"
                className="flex-1 min-h-0 w-full"
              >
                <ResizablePanel defaultSize={70} minSize={30}>
                  <MainCardsWindow />
                </ResizablePanel>

                <ResizableHandle />

                <ResizablePanel defaultSize={30} minSize={15}>
                  <ConsoleWindow />
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : viewMode === 'table' ? (
              <TableViewWindow activeTable={activeTable} />
            ) : (
              <AssistantViewWindow activeAssistant={activeAssistant} />
            )}
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={22} minSize={16}>
            <DetailsWindow />
          </ResizablePanel>
        </ResizablePanelGroup>
      </SelectedItemProvider>
    </div>
  )
}
