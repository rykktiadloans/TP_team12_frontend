import { Handle, Position, type NodeProps } from '@xyflow/react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import type { CardNodeType } from './cardTypes'
import { StatusBadge } from './StatusBadge'

export function CardNode({ data, selected }: NodeProps<CardNodeType>) {
  const placeholderPercentrage = Math.min(100, data.title.length * 2)

  const placeholderMs = Math.min(100, data.title.length * 4)

  return (
    <Card
      className={`cursor-pointer transition shadow-sm ${
        selected ? 'ring-2 ring-ring' : ''
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{data.title}</CardTitle>
          {data.status ? (
            <div className="ml-auto">
              <StatusBadge status={data.status} />
            </div>
          ) : (
            <></>
          )}
        </div>
        {data.description ? (
          <CardDescription className="line-clamp-2">
            {data.description}
          </CardDescription>
        ) : (
          <></>
        )}
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
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </Card>
  )
}
