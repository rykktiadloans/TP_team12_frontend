import { Handle, Position, useConnection, type NodeProps } from '@xyflow/react'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import type { CardNodeType } from './cardTypes'
import { StatusBadge } from './StatusBadge'
import { Move } from 'lucide-react'
import { Button } from '../ui/button'
import '../../css/card.css'

export function CardNode({ data, selected, id }: NodeProps<CardNodeType>) {
  const connection = useConnection<CardNodeType>()

  const isTarget =
    connection.inProgress && connection.fromNode.id !== id
  const metaRows = data.metaRows ?? []

  return (
    <Card
      className={`cursor-pointer transition shadow-sm ${
        selected ? 'ring-2 ring-ring' : ''
      }`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{data.title}</CardTitle>
        {data.description ? (
          <CardDescription className="line-clamp-2">
            {data.description}
          </CardDescription>
        ) : (
          <></>
        )}
        <CardAction>
          <StatusBadge status={data.modelType} />
        </CardAction>
      </CardHeader>
      {metaRows.length ? (
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          {metaRows.map((row) => (
            <div key={row.label} className="flex justify-between gap-4">
              <span>{row.label}</span>
              <span className="truncate text-right text-foreground">{row.value}</span>
            </div>
          ))}
        </CardContent>
      ) : null}
      <div className="move-handle">
        <Button>
          <Move />
        </Button>
      </div>
      {!connection.inProgress && (
        <Handle
          className="customHandle"
          position={Position.Right}
          type="source"
        />
      )}
      {(!connection.inProgress || isTarget) && (
        <Handle
          className="customHandle"
          position={Position.Left}
          type="target"
          isConnectableStart={false}
        />
      )}
    </Card>
  )
}
