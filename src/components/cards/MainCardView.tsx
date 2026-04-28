import { startTransition, useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  type Edge as FlowEdge,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  applyNodeChanges,
  type Node as FlowNode,
  type OnConnect,
  type OnNodesChange,
  type ReactFlowInstance,
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

interface MainCardViewProps {
  nodes: Node[]
  edges: Edge[]
}

type StoredPositions = Record<string, { x: number; y: number }>

function getProjectLayoutKey() {
  const projectId = sessionStorage.getItem('projectId') ?? 'unknown'
  return `tpfrontend:graph-layout:${projectId}`
}

function readStoredPositions(): StoredPositions {
  try {
    const raw = localStorage.getItem(getProjectLayoutKey())
    if (!raw) {
      return {}
    }
    const parsed = JSON.parse(raw) as StoredPositions
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStoredPositions(nodes: FlowNode[]) {
  try {
    const positions = Object.fromEntries(
      nodes.map((node) => [
        node.id,
        { x: node.position.x, y: node.position.y },
      ])
    )
    localStorage.setItem(getProjectLayoutKey(), JSON.stringify(positions))
  } catch {
    // Ignore localStorage failures so the graph still works.
  }
}

function getDefaultPosition(index: number) {
  const columns = 4
  const column = index % columns
  const row = Math.floor(index / columns)
  return {
    x: 80 + column * 360,
    y: 80 + row * 220,
  }
}

function castNodes(nodes: Node[], storedPositions: StoredPositions): CardNodeType[] {
  return nodes.map(
    (node, index): CardNodeType => ({
      id: node.id,
      type: 'cardNode',
      width: 300,
      position: storedPositions[node.id] ?? getDefaultPosition(index),
      dragHandle: '.move-handle',
      data: {
        title: node.title,
        description: node.desc,
        modelType: node.type,
        metaRows: node.metaRows,
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
  const { selectedItem, setSelectedItem } = useSelectedItem()
  const storeSelectedId = useModelStore((store) => store.selectedId)
  const focusTargetId = useModelStore((store) => store.focusTargetId)
  const setStoreSelectedId = useModelStore((store) => store.setSelectedId)
  const clearFocus = useModelStore((store) => store.clearFocus)

  const isConnectable = useModelStore((store) => store.isConnectable)
  const addConnection = useModelStore((store) => store.addConnection)
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance<CardNodeType> | null>(null)
  const storedPositions = useMemo(() => readStoredPositions(), [nodes])
  const castedNodes = useMemo(
    () => castNodes(nodes, storedPositions),
    [nodes, storedPositions]
  )
  const flowEdges = useMemo(() => castEdges(edges), [edges])
  const [flowNodes, setFlowNodes] = useState(castedNodes)
  const activeSelectedId = selectedItem ?? storeSelectedId ?? ''

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

      return nextNodes
    })
  }, [castedNodes])

  useEffect(() => {
    writeStoredPositions(flowNodes)
  }, [flowNodes])

  useEffect(() => {
    setFlowNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.selected === (node.id === activeSelectedId)
          ? node
          : { ...node, selected: node.id === activeSelectedId }
      )
    )
  }, [activeSelectedId])

  useEffect(() => {
    if (!focusTargetId || !reactFlowInstance) {
      return
    }

    const selectedNode = flowNodes.find((node) => node.id === focusTargetId)
    if (!selectedNode) {
      return
    }

    reactFlowInstance.setCenter(
      selectedNode.position.x + 150,
      selectedNode.position.y + 80,
      { duration: 250, zoom: Math.max(reactFlowInstance.getZoom(), 0.9) }
    )
    clearFocus()
  }, [clearFocus, flowNodes, focusTargetId, reactFlowInstance])

  const selectId = useCallback(
    (id: string | null) => {
      const normalizedId = id ?? ''
      if ((selectedItem ?? '') === normalizedId && storeSelectedId === normalizedId) {
        return
      }
      startTransition(() => {
        setSelectedItem(id)
      })
      setStoreSelectedId(normalizedId)
    },
    [selectedItem, setSelectedItem, setStoreSelectedId, storeSelectedId]
  )

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
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineComponent={CustomConnectionLine}
        connectionLineStyle={connectionLineStyle}
        onNodeClick={(_, node) => selectId(node.id)}
        onPaneClick={() => selectId(null)}
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
