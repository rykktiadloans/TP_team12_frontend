import type { Node } from '@xyflow/react'

export type CardNodeStatus = 'ok' | 'warn' | 'err'

export type CardNodeType = Node<{
  title: string
  description?: string
  status?: CardNodeStatus
}, 'cardNode'>
