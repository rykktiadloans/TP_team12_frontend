import { useState, useCallback } from 'react'
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  type Node as FlowNode,
  type Edge as FlowEdge,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Edge, Node } from '../layout/MainCardsWindow'

interface MainCardViewProps {
  nodes: Node[]
  edges: Edge[]
}

function castNodes(nodes: Node[]): FlowNode[] {
  return nodes.map(
    (node): FlowNode => ({
      id: node.id,
      position: {
        x: node.x,
        y: node.y,
      },
      data: {
        label: node.title,
      },
    })
  )
}

function castEdges(edges: Edge[]): FlowEdge[] {
    return edges.map((edge): FlowEdge => ({
        id: edge.id,
        source: edge.from,
        target: edge.to,
        label: edge.label
    }))
}

export function MainCardView({ nodes, edges }: MainCardViewProps) {
    const [flowNodes, setFlowNodes] = useState(castNodes(nodes))
    const [flowEdges, setFlowEdges] = useState(castEdges(edges))

  const onNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) =>
      setFlowNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  )
  const onEdgesChange = useCallback(
    (changes: EdgeChange<FlowEdge>[]) =>
      setFlowEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  )

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      />
    </div>
  )
}
