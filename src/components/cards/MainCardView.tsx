import { useState, useCallback } from 'react'
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  type Edge as FlowEdge,
  type NodeChange,
  type EdgeChange,
  Background,
  BackgroundVariant,
  Controls,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Edge, Node } from '../layout/MainCardsWindow'
import type { CardNodeType } from './cardTypes'
import { CardNode } from './CardNode'

interface MainCardViewProps {
  nodes: Node[]
  edges: Edge[]
}

function castNodes(nodes: Node[]): CardNodeType[] {
  return nodes.map(
    (node): CardNodeType => ({
      id: node.id,
      type: 'cardNode',
      position: {
        x: node.x - (node.w ?? 280) / 2,
        y: node.y - 75,
      },
      width: node.w ?? 280,
      height: 150,
      data: {
        title: node.title,
        description: node.desc,
        status: node.status,
      },
    })
  )
}

function castEdges(edges: Edge[]): FlowEdge[] {
  return edges.map(
    (edge): FlowEdge => ({
      id: edge.id,
      source: edge.from,
      target: edge.to,
      label: edge.label,
    })
  )
}

export function MainCardView({ nodes, edges }: MainCardViewProps) {
  const [flowNodes, setFlowNodes] = useState(castNodes(nodes))
  const [flowEdges, setFlowEdges] = useState(castEdges(edges))

  const onNodesChange = useCallback(
    (changes: NodeChange<CardNodeType>[]) =>
      setFlowNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  )
  const onEdgesChange = useCallback(
    (changes: EdgeChange<FlowEdge>[]) =>
      setFlowEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  )

  const nodeTypes = useCallback(() => ({cardNode: CardNode}), [])

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodeTypes={nodeTypes()}
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Controls />
        <Background
          variant={BackgroundVariant.Dots}
          color="#808080"
          gap={20}
          size={1}
        />
      </ReactFlow>
    </div>
  )
}
