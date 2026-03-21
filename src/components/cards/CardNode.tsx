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
  const connection = useConnection()
  const isTarget = connection.inProgress && connection.fromNode.id !== id

  const placeholderPercentrage = Math.min(100, data.title.length * 2)

  const placeholderMs = Math.min(100, data.title.length * 4)

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
      <CardContent className="text-sm text-muted-foreground">
        <div className="flex justify-between">
          <span>Placeholder A</span>
          <span>{placeholderPercentrage}%</span>
        </div>
        <div className="flex justify-between">
          <span>Placeholder B</span>
          <span>{placeholderMs} ms</span>
        </div>
      </CardContent>
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
