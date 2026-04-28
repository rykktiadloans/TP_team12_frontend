import type { Model } from '@/types/models'

export function getName(model: Model): string {
  if ('name' in model) {
    return String(model.name)
  }

  return 'Compromise ' + model.id
}
