import { Blocks, ChevronDown, ChevronRight, ToyBrick } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible'

export interface DefinitionTreeNode {
  id: string
  label: string
  kind?: 'main-component' | 'sub-component'
  badge?: string
  children?: DefinitionTreeNode[]
}

interface Props {
  node: DefinitionTreeNode
  depth?: number
  onSelect?: (id: string) => void
  selectedId?: string
  filter: string
}

export function DefinitionTreeItem({
  node,
  depth = 0,
  onSelect,
  selectedId,
  filter,
}: Props) {
  if (!matchesFilter(node, filter)) return null

  const isFolder = node.kind === 'main-component' || !!node.children?.length
  const paddingLeft = 12 + depth * 14
  const isSelected = selectedId === node.id

  if (!isFolder) {
    return (
      <Button
        type="button"
        variant={isSelected ? 'secondary' : 'ghost'}
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
            variant={isSelected ? 'secondary' : 'ghost'}
            className="group w-full justify-start h-8 px-2"
            style={{ paddingLeft }}
            onClick={() => onSelect?.(node.id)}
          >
            <ChevronDown className="mr-1 h-4 w-4 opacity-60 group-data-[state=closed]:hidden" />
            <ChevronRight className="mr-1 h-4 w-4 opacity-60 group-data-[state=open]:hidden" />
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
            <DefinitionTreeItem
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

function matchesFilter(node: DefinitionTreeNode, q: string): boolean {
  if (!q.trim()) return true
  const hit = node.label.toLowerCase().includes(q.toLowerCase())
  const childHit = node.children?.some((c) => matchesFilter(c, q)) ?? false
  return hit || childHit
}
