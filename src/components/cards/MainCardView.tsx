import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  type Edge as FlowEdge,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  applyNodeChanges,
  type OnConnect,
  type OnNodesChange,
  type OnSelectionChangeFunc,
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
  const setStoreSelectedId = useModelStore((store) => store.setSelectedId)

  const isConnectable = useModelStore((store) => store.isConnectable)
  const addConnection = useModelStore((store) => store.addConnection)
  const castedNodes = useMemo(() => castNodes(nodes), [nodes])
  const flowEdges = useMemo(() => castEdges(edges), [edges])
  const [flowNodes, setFlowNodes] = useState(castedNodes)

  useEffect(() => {
    setFlowNodes((currentNodes) => {
      const currentById = new Map(currentNodes.map((node) => [node.id, node]))
      const nextNodes = castedNodes.map((node) => {
        const currentNode = currentById.get(node.id)
        if (!currentNode) {
          return node
        }

        return {
          ...node,
          position: currentNode.position,
          selected: currentNode.selected,
          dragging: currentNode.dragging,
        }
      })

      return lodashIsequal(currentNodes, nextNodes) ? currentNodes : nextNodes
    })
  }, [castedNodes])

  const onSelect: OnSelectionChangeFunc<CardNodeType> = (params) => {
    const node = params.nodes[0] ?? null
    const id = node ? node.id : null
    setSelectedItem(id)
    setStoreSelectedId(id ?? '')
  }

  const onNodesChange = useCallback<OnNodesChange<CardNodeType>>(
    (changes) => {
      setFlowNodes((currentNodes) => applyNodeChanges(changes, currentNodes))
    },
    []
  )

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
        void addConnection(
          +fromId,
          fromType as ModelType,
          +toId,
          toType as ModelType
        ).catch((error) => {
          console.error(error)
        })
      }
    },
    [addConnection, isConnectable]
  )

  const nodeTypes = useMemo(() => ({ cardNode: CardNode }), [])
  const edgeTypes = useMemo(() => ({ floating: FloatingEdge }), [])

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineComponent={CustomConnectionLine}
        connectionLineStyle={connectionLineStyle}
        onSelectionChange={onSelect}
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
