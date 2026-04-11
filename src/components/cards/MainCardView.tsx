import { useState, useCallback, useMemo } from 'react'
import {
  ReactFlow,
  type Edge as FlowEdge,
  type Node as FlowNode,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState,
  addEdge,
  type OnConnect,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Edge, Node } from '../layout/MainCardsWindow'
import type { CardNodeType } from './cardTypes'
import { CardNode } from './CardNode'
import { FloatingEdge } from './FloatingEdge'
import CustomConnectionLine from './CustomConnectionLine'
import { useModelStore } from '@/store/model-store'
import type { ModelType } from '@/types/models'
import { useSelectedItem } from '@/context/SelectedItemContext'
import lodashIsequal from 'lodash.isequal'

interface MainCardViewProps {
  nodes: Node[]
  edges: Edge[]
}

function castNodes(nodes: Node[]): CardNodeType[] {
  return nodes.map(
    (node): CardNodeType => ({
      id: node.id,
      type: 'cardNode',
      width: 300,
      position: {
        x: 0,
        y: 0,
      },
      dragHandle: '.move-handle',
      data: {
        title: node.title,
        description: node.desc,
        modelType: node.type,
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
    })
  )
}

const defaultEdgeOptions = {
  type: 'floating',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#b1b1b7',
  },
}

const connectionLineStyle = {
  stroke: '#b1b1b7',
}

export function MainCardView({ nodes, edges }: MainCardViewProps) {
  const { setSelectedItem } = useSelectedItem()

  const isConnectable = useModelStore((store) => store.isConnectable)
  const addConnection = useModelStore((store) => store.addConnection)
  const castedNodes = useMemo(() => castNodes(nodes), [nodes])
  const castedEdges = useMemo(() => castEdges(edges), [edges])
  const [flowNodes, setFlowNodes, onFlowNodesChange] =
    useNodesState(castedNodes)
  const [flowEdges, setFlowEdges, onFlowEdgesChange] =
    useEdgesState(castedEdges)

  const [prev, setPrev] = useState<[CardNodeType[], FlowEdge[]]>([
    castedNodes,
    castedEdges,
  ])

  if (!lodashIsequal(prev, [castedNodes, castedEdges])) {
    const newNodes = castedNodes.map((node, index) => {
      const same = flowNodes.find((n) => n.id == node.id)
      if (same == undefined) {
        return node
      }
      node.position = same.position
      return node
    })
    setPrev([newNodes, castedEdges])
    setFlowNodes([...newNodes])
    setFlowEdges([...castedEdges])
  }

  const onClick: NodeMouseHandler<CardNodeType> = (e, node) => {
    setSelectedItem(node.id)
    const newNodes = flowNodes.map((cur) => {
      if (node.id == cur.id) {
        return { ...cur, selected: true }
      }
      return { ...cur, selected: false }
    })
    setFlowNodes([...newNodes])
    setFlowEdges([...castedEdges])
  }

  const onConnect = useCallback<OnConnect>(
    (params) => {
      const [fromId, fromType] = params.source.split('.')
      const [toId, toType] = params.target.split('.')
      if (
        isConnectable(
          +fromId,
          fromType as ModelType,
          +toId,
          toType as ModelType
        )
      ) {
        setFlowEdges((eds) => addEdge(params, eds))
        addConnection(
          +fromId,
          fromType as ModelType,
          +toId,
          toType as ModelType
        )
      }
    },
    [addConnection, isConnectable, setFlowEdges]
  )

  const nodeTypes = useCallback(() => ({ cardNode: CardNode }), [])

  const edgeTypes = useCallback(() => ({ floating: FloatingEdge }), [])

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodeTypes={nodeTypes()}
        edgeTypes={edgeTypes()}
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onFlowNodesChange}
        onEdgesChange={onFlowEdgesChange}
        onConnect={onConnect}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineComponent={CustomConnectionLine}
        connectionLineStyle={connectionLineStyle}
        onNodeClick={onClick}
        connectOnClick={false}
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
