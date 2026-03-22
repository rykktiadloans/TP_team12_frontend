import type { ModelType } from '@/types/models'
import { Badge } from '../ui/badge'

export function StatusBadge({ status }: { status: ModelType }) {
  return <Badge>{status}</Badge>
}
