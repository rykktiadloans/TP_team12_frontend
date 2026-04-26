import type { Dispatch, SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useModelStore } from '@/store/model-store'
import { taraTableItems, type TaraTableKey } from '@/lib/taraTables'

interface TableNavigationWindowProps {
  activeTable: TaraTableKey
  onActiveTableChange: Dispatch<SetStateAction<TaraTableKey>>
}

export function TableNavigationWindow({
  activeTable,
  onActiveTableChange,
}: TableNavigationWindowProps) {
  const state = useModelStore((store) => store.state)
  const risks = useModelStore((store) => store.risks)
  const counts: Record<TaraTableKey, number> = {
    threatScenarios: state.threatScenarios.size,
    damageScenarios: state.damageScenarios.size,
    attackSteps: state.attackSteps.size,
    controls: state.controls.size,
    controlScenarios: 0,
    risks: risks.length,
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="border-b px-3 py-3">
        <div className="text-sm font-medium">Tables</div>
        <div className="text-xs text-muted-foreground">Analysis views</div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-2 py-3">
        <div className="space-y-1">
          {taraTableItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTable === item.key

            return (
              <Button
                key={item.key}
                type="button"
                variant={isActive ? 'secondary' : 'ghost'}
                className="h-9 w-full justify-start px-2"
                onClick={() => onActiveTableChange(item.key)}
              >
                <Icon className="h-4 w-4 opacity-70" />
                <span className="truncate">{item.label}</span>
                <Badge variant="outline" className="ml-auto">
                  {counts[item.key]}
                </Badge>
              </Button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
