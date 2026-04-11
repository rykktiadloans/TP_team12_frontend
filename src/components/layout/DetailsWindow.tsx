import * as React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useSelectedItem } from '@/context/SelectedItemContext'
import { useModelStore } from '@/store/model-store'
import { getName } from './MainCardsWindow'
import { ModelForm } from '../details/ModelForm'
import type { ModelType } from '@/types/models'

export function DetailsWindow() {
  const selected = useSelectedItem()
  useModelStore(store => store.state)
  const getItem = useModelStore(store => store.getItem)
  const setItem = useModelStore(store => store.setItem)
  const item = getItem(selected.selectedItem ?? '')
  const type = (
    selected.selectedItem ? selected.selectedItem.split('.')[1] : ''
  ) as ModelType
  const title = item ? getName(item) : 'Unselected'
  const form = item ? (
    <ModelForm
      model={{
        type: type,
        item: item,
      }}
      setModel={(item) => setItem(type, item.item)}
    />
  ) : null
  return (
    <div className="h-full w-full flex flex-col">
      <div className="px-3 py-2 border-b">
        <div className="text-sm font-medium flex items-center gap-2">
          {title} <Badge>{type}</Badge>
        </div>
      </div>

      <div className="flex-1 mt-0">
        <ScrollArea className="h-full">
          <div className="p-3">{form}</div>
        </ScrollArea>
      </div>
    </div>
  )
}
