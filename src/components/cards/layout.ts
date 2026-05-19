import type { Node } from "@xyflow/react";

export type StoredPositions = Record<string, { x: number; y: number }>

export function getProjectLayoutKey() {
  const projectId = sessionStorage.getItem('projectId') ?? 'unknown'
  return `tpfrontend:graph-layout:${projectId}`
}

export function readStoredPositions(): StoredPositions {
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

export function writeStoredPositions(nodes: Node[]) {
  try {
    const positions = Object.fromEntries(
      nodes.map((node) => [node.id, { x: node.position.x, y: node.position.y }])
    )
    localStorage.setItem(getProjectLayoutKey(), JSON.stringify(positions))
  } catch {
    // Ignore localStorage failures so the graph still works.
  }
}

export function getDefaultPosition(index: number) {
  const columns = 4
  const column = index % columns
  const row = Math.floor(index / columns)
  return {
    x: 80 + column * 360,
    y: 80 + row * 220,
  }
}