import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"

// ✅ add these
import { Blocks, ToyBrick, ChevronDown, ChevronRight } from "lucide-react"

type TreeNode = {
  id: string
  label: string
  kind?: "main-component" | "sub-component"
  badge?: string
  children?: TreeNode[]
}

const SAMPLE_TREE: TreeNode[] = [
  {
    id: "item-def",
    label: "Item Definition",
    kind: "main-component",
    children: [
      {
        id: "cam-ecu",
        label: "Camera ECU",
        kind: "main-component",
        children: [
          { id: "it1", label: "item1", kind: "sub-component" },
          { id: "it2", label: "item2", kind: "sub-component" },
        ],
      },
      { id: "pwr-sw-act", label: "Power Switch Actuator", kind: "sub-component" },
      { id: "body-ecu", label: "Body Control ECU", kind: "sub-component" },
      { id: "headlight-sw", label: "Headlamp switch", kind: "sub-component" },
    ],
  },
  {
    id: "item-con",
    label: "Item Connections",
    kind: "main-component",
    children: [
      { id: "item2-1", label: "Item 1", kind: "sub-component" },
      { id: "item2-2", label: "Item 2", kind: "sub-component" },
      { id: "item2-3", label: "Item 3", kind: "sub-component" },
    ],
  },
  {
    id: "damage-scen",
    label: "Damage Scenarios",
    kind: "main-component",
    children: [
      { id: "item3-1", label: "Item 1", kind: "sub-component" },
      { id: "item3-2", label: "Item 2", kind: "sub-component" },
      { id: "item3-3", label: "Item 3", kind: "sub-component" },
    ],
  },
  {
    id: "threat-scen",
    label: "Threat Scenarios",
    kind: "main-component",
  },
  {
    id: "attack-path",
    label: "Attack Paths",
    kind: "main-component",
  },
]

function matchesFilter(node: TreeNode, q: string): boolean {
  if (!q.trim()) return true
  const hit = node.label.toLowerCase().includes(q.toLowerCase())
  const childHit = node.children?.some((c) => matchesFilter(c, q)) ?? false
  return hit || childHit
}

function TreeItem({
  node,
  depth = 0,
  onSelect,
  selectedId,
  filter,
}: {
  node: TreeNode
  depth?: number
  onSelect?: (id: string) => void
  selectedId?: string
  filter: string
}) {
  if (!matchesFilter(node, filter)) return null

  const isFolder = node.kind === "main-component" || !!node.children?.length
  const paddingLeft = 12 + depth * 14
  const isSelected = selectedId === node.id

  if (!isFolder) {
    return (
      <Button
        type="button"
        variant={isSelected ? "secondary" : "ghost"}
        className="w-full justify-start h-8 px-2"
        style={{ paddingLeft }}
        onClick={() => onSelect?.(node.id)}
      >
        {/* ✅ file icon -> sub-component icon */}
        <ToyBrick className="mr-2 h-4 w-4 opacity-70" />
        <span className="truncate">{node.label}</span>
        {node.badge ? (
          <Badge variant="outline" className="ml-auto">
            {node.badge}
          </Badge>
        ) : null}
      </Button>
    )
  }

  return (
    <Collapsible defaultOpen>
      <div className="flex items-center">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant={isSelected ? "secondary" : "ghost"}
            className="w-full justify-start h-8 px-2"
            style={{ paddingLeft }}
            onClick={() => onSelect?.(node.id)}
          >
            {/* ✅ optional disclosure icon */}
            <ChevronDown className="mr-1 h-4 w-4 opacity-60 data-[state=closed]:hidden" />
            <ChevronRight className="mr-1 h-4 w-4 opacity-60 data-[state=open]:hidden" />

            {/* ✅ folder icon -> main-component icon */}
            <Blocks className="mr-2 h-4 w-4 opacity-70" />

            <span className="truncate">{node.label}</span>
            {node.badge ? (
              <Badge variant="outline" className="ml-auto">
                {node.badge}
              </Badge>
            ) : null}
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <div className="mt-1 space-y-1">
          {node.children?.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              filter={filter}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function ExplorerWindow() {
  const [filter, setFilter] = React.useState("")
  const [selectedId, setSelectedId] = React.useState<string>("app")

  return (
    <div className="h-full w-full flex flex-col">
      <Tabs defaultValue="tree" className="h-full w-full flex flex-col">
        <div className="px-3 pt-3">
          <TabsList className="w-full justify-start overflow-auto">
            <TabsTrigger value="tree">Definition</TabsTrigger>
            <TabsTrigger value="search">Analysis</TabsTrigger>
            <TabsTrigger value="favorites">Resolution</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tree" className="flex-1 mt-0">
          <div className="px-3 pt-3">
            <Input
              placeholder="Filter…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          <ScrollArea className="flex-1 px-2 py-3">
            <div className="space-y-1">
              {SAMPLE_TREE.map((n) => (
                <TreeItem
                  key={n.id}
                  node={n}
                  onSelect={setSelectedId}
                  selectedId={selectedId}
                  filter={filter}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="search" className="flex-1 mt-0">
          <div className="p-3 text-sm text-muted-foreground">TODO</div>
        </TabsContent>

        <TabsContent value="favorites" className="flex-1 mt-0">
          <div className="p-3 text-sm text-muted-foreground">TODO</div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
