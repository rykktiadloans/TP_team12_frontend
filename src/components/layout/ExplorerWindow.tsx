import * as React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import {
  Blocks,
  ToyBrick,
  ChevronDown,
  ChevronRight,
  Database,
  Shield,
  Wrench,
  AlertTriangle,
  Swords,
  GitBranch,
  Search,
} from 'lucide-react'

import { getProjectTree, type TreeNode } from '@/lib/GetProjectTree'

function matchesFilter(node: TreeNode, q: string): boolean {
  if (!q.trim()) return true
  const hit = node.label.toLowerCase().includes(q.toLowerCase())
  const childHit = node.children?.some((c) => matchesFilter(c, q)) ?? false
  return hit || childHit
}

function getNodeIcon(kind?: TreeNode['kind']) {
  switch (kind) {
    case 'component':
    case 'group':
      return Blocks
    case 'data-entity':
      return Database
    case 'technology':
      return Wrench
    case 'damage-scenario':
      return AlertTriangle
    case 'control':
      return Shield
    case 'attack-step':
      return GitBranch
    case 'threat-scenario':
      return Swords
    default:
      return ToyBrick
  }
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

  const isFolder = !!node.children?.length
  const paddingLeft = 12 + depth * 14
  const isSelected = selectedId === node.id
  const Icon = getNodeIcon(node.kind)

  if (!isFolder) {
    return (
      <Button
        type="button"
        variant={isSelected ? 'secondary' : 'ghost'}
        className="w-full justify-start h-8 px-2"
        style={{ paddingLeft }}
        onClick={() => onSelect?.(node.id)}
      >
        <Icon className="mr-2 h-4 w-4 opacity-70" />
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
    <Collapsible defaultOpen={depth < 2}>
      <div className="flex items-center">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant={isSelected ? 'secondary' : 'ghost'}
            className="w-full justify-start h-8 px-2"
            style={{ paddingLeft }}
            onClick={() => onSelect?.(node.id)}
          >
            <ChevronDown className="mr-1 h-4 w-4 opacity-60 data-[state=closed]:hidden" />
            <ChevronRight className="mr-1 h-4 w-4 opacity-60 data-[state=open]:hidden" />
            <Icon className="mr-2 h-4 w-4 opacity-70" />
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

type ExplorerWindowProps = {
  projectId: string | number
}

export function ExplorerWindow({ projectId }: ExplorerWindowProps) {
  const [filter, setFilter] = React.useState('')
  const [selectedId, setSelectedId] = React.useState<string>('')
  const [tree, setTree] = React.useState<TreeNode[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    async function loadTree() {
      setLoading(true)
      setError('')

      try {
        const data = await getProjectTree(projectId)
        setTree(data)
      } catch (err) {
        console.error(err)
        setError('Tree couldnt be loaded')
      } finally {
        setLoading(false)
      }
    }

    loadTree()
  }, [projectId])

  return (
    <div className="h-full w-full flex flex-col">
      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter tree..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>


      <ScrollArea className="flex-1 px-2 py-3">
        {loading ? (
          <div className="p-3 text-sm text-muted-foreground">
            Loading tree...
          </div>
        ) : error ? (
          <div className="p-3 text-sm text-destructive">{error}</div>
        ) : tree.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">No data.</div>
        ) : (
          <div className="space-y-1">
            {tree.map((n) => (
              <TreeItem
                key={n.id}
                node={n}
                onSelect={setSelectedId}
                selectedId={selectedId}
                filter={filter}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
