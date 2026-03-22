import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  Position,
  useInternalNode,
  useReactFlow,
  type InternalNode,
  type Node,
} from '@xyflow/react'
import type { CSSProperties, MouseEventHandler } from 'react'
import type { CardNodeType } from './cardTypes'
import { connectionProperty, useModelStore } from '@/store/model-store'
import { Badge } from '../ui/badge'
import type { ModelType } from '@/types/models'

interface Props {
  id: string
  source: string
  target: string
  markerEnd?: string
  style?: CSSProperties
}

export function FloatingEdge({ id, source, target, markerEnd, style }: Props) {
  const deleteConnection = useModelStore((store) => store.deleteConnection)
  const { deleteElements } = useReactFlow()
  const sourceNode = useInternalNode<CardNodeType>(source)
  const targetNode = useInternalNode<CardNodeType>(target)

  if (!sourceNode || !targetNode) {
    return <></>
  }

  const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode)

  const [path, labelX, labelY] = getStraightPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  })

  const property = connectionProperty(
    sourceNode.data.modelType,
    targetNode.data.modelType
  )

  const deleteEdge: MouseEventHandler = (event) => {
    event.preventDefault()
    if (event.button == 2) {
      const [fromId, fromType] = source.split('.')
      const [toId, toType] = target.split('.')

      deleteConnection(+fromId, fromType as ModelType, +toId, toType as ModelType)
      deleteElements({ edges: [{ id }] })
    }
  }

  return (
    <>
      <BaseEdge
        id={id}
        label={<text>{property}</text>}
        className="react-flow__edge-path"
        path={path}
        markerEnd={markerEnd}
        style={style}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            cursor: 'pointer',
          }}
          className="nodrag nopan custom-edge"
          onContextMenu={deleteEdge}
        >
          <Badge variant="secondary">{property}</Badge>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

function getEdgeParams(source: InternalNode<Node>, target: InternalNode<Node>) {
  const sourceIntersectionPoint = getNodeIntersection(source, target)
  const targetIntersectionPoint = getNodeIntersection(target, source)

  const sourcePos = getEdgePosition(source, sourceIntersectionPoint)
  const targetPos = getEdgePosition(target, targetIntersectionPoint)

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  }
}

function getNodeIntersection(
  intersectionNode: InternalNode<Node>,
  targetNode: InternalNode<Node>
) {
  // https://math.stackexchange.com/questions/1724792/an-algorithm-for-finding-the-intersection-point-between-a-center-of-vision-and-a
  const { width: intersectionNodeWidth, height: intersectionNodeHeight } =
    intersectionNode.measured!
  const intersectionNodePosition = intersectionNode.internals.positionAbsolute
  const targetPosition = targetNode.internals.positionAbsolute

  const w = (intersectionNodeWidth ?? 0) / 2
  const h = (intersectionNodeHeight ?? 0) / 2

  const x2 = intersectionNodePosition.x + w
  const y2 = intersectionNodePosition.y + h
  const x1 = targetPosition.x + targetNode.measured.width! / 2
  const y1 = targetPosition.y + targetNode.measured.height! / 2

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h)
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h)
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1)
  const xx3 = a * xx1
  const yy3 = a * yy1
  const x = w * (xx3 + yy3) + x2
  const y = h * (-xx3 + yy3) + y2

  return { x, y }
}

function getEdgePosition(
  node: InternalNode<Node>,
  intersectionPoint: { x: number; y: number }
) {
  const n = { ...node.internals.positionAbsolute, ...node }
  const nx = Math.round(n.x)
  const ny = Math.round(n.y)
  const px = Math.round(intersectionPoint.x)
  const py = Math.round(intersectionPoint.y)

  if (px <= nx + 1) {
    return Position.Left
  }
  if (px >= nx + n.measured.width! - 1) {
    return Position.Right
  }
  if (py <= ny + 1) {
    return Position.Top
  }
  if (py >= n.y + n.measured.height! - 1) {
    return Position.Bottom
  }

  return Position.Top
}
