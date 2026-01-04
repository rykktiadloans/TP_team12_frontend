import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="text-sm text-muted-foreground">{k}</div>
      <div className="text-sm text-right">{v}</div>
    </div>
  )
}

export function DetailsWindow() {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="px-3 py-2 border-b">
        <div className="text-sm font-medium flex items-center gap-2">
          Details <Badge variant="outline">Selected</Badge>
        </div>
        <div className="text-xs text-muted-foreground">Context + properties</div>
      </div>

      <div className="flex-1 mt-0">
        <ScrollArea className="h-full">
          <div className="p-3">
            <KV k="Name" v="Example Item" />
            <Separator />
            <KV k="Detail1" v={<Badge variant="secondary">Val1</Badge>} />
            <KV k="Detail2" v="Val2" />
            <KV k="Detail3" v="Val3" />
            <Separator />
            <KV k="Detail4" v="Val4" />
            <KV k="Detai5" v={<span className="text-muted-foreground">Val5</span>} />
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
