import React, { type CSSProperties } from 'react'
import { getStraightPath } from '@xyflow/react'

interface Props {
  fromX: number
  fromY: number
  toX: number
  toY: number
  connectionLineStyle?: CSSProperties
}

export default function CustomConnectionLine({ fromX, fromY, toX, toY, connectionLineStyle }: Props) {
  const [edgePath] = getStraightPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  })

  return (
    <g>
      <path style={connectionLineStyle} fill="none" d={edgePath} />
    </g>
  )
}

