import { Badge } from '../ui/badge'
import type { CardNodeStatus } from './cardTypes'


export function StatusBadge({ status }: { status: CardNodeStatus }) {
  if (status === 'ok') return <Badge variant="secondary">OK</Badge>
  if (status === 'warn') return <Badge variant="outline">Warning</Badge>
  return <Badge variant="destructive">Error</Badge>
}
