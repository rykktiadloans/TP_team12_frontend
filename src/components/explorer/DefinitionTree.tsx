import { useState } from 'react'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import { DefinitionTreeItem, type DefinitionTreeNode } from './DefinitionTreeItem'


const SAMPLE_TREE: DefinitionTreeNode[] = [
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

export function DefinitionTree() {
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState('')
  return (
    <>
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
            <DefinitionTreeItem
              key={n.id}
              node={n}
              onSelect={setSelected}
              selectedId={selected}
              filter={filter}
            />
          ))}
        </div>
      </ScrollArea>
    </>
  )
}
