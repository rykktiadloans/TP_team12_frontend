import Header from '@/components/layout/Header'
import Toolbar from '@/components/layout/Toolbar'
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
  SelectedItemProvider,
  useSelectedItem,
} from '@/context/SelectedItemContext'
import { useState } from 'react'
import { ReactFlowProvider, useStore } from '@xyflow/react'

export default function ProjectPage() {
  const [resetSelectedElements, addSelectedNodes] = useStore((state) => [
    state.resetSelectedElements,
    state.addSelectedNodes,
  ])
  const [selectedItem, setSelectedItem] = useState(null as null | string)
  const defaultValue = {
    selectedItem,
    setSelectedItem(item: null | string) {
      setSelectedItem(item)
      resetSelectedElements([])
      addSelectedNodes([item].filter((i) => i != null))
    },
  }
  return (
    <div className="w-screen h-screen flex flex-col">
        <SelectedItemProvider value={defaultValue}>
          <Header />
          <Toolbar />
          <ResizablePanelGroup
            direction="horizontal"
            className="flex-1 min-h-0 w-full"
          >
            <ResizablePanel defaultSize={22} minSize={16}>
              <ExplorerWindow />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={56} minSize={30}>
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
