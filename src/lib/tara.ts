export type Option = {
  value: number
  label: string
}

export const impactOptions: Option[] = [
  { value: 0, label: 'Negligible' },
  { value: 1, label: 'Moderate' },
  { value: 2, label: 'Major' },
  { value: 3, label: 'Severe' },
]

export const elapsedTimeOptions: Option[] = [
  { value: 0, label: '<=1 day' },
  { value: 1, label: '<=1 week' },
  { value: 4, label: '<=1 month' },
  { value: 10, label: '<=3 months' },
  { value: 17, label: '<=6 months' },
  { value: 19, label: '>6 months' },
  { value: 99, label: 'Not practical' },
]

export const specialistExpertiseOptions: Option[] = [
  { value: 0, label: 'Layman' },
  { value: 3, label: 'Proficient' },
  { value: 6, label: 'Expert' },
  { value: 8, label: 'Multiple experts' },
]

export const knowledgeOptions: Option[] = [
  { value: 0, label: 'Public' },
  { value: 3, label: 'Restricted' },
  { value: 7, label: 'Sensitive' },
  { value: 11, label: 'Critical' },
]

export const windowOfOpportunityOptions: Option[] = [
  { value: 0, label: 'Unnecessary/unlimited' },
  { value: 1, label: 'Easy' },
  { value: 4, label: 'Moderate' },
  { value: 10, label: 'Difficult' },
  { value: 99, label: 'None' },
]

export const equipmentOptions: Option[] = [
  { value: 0, label: 'Standard' },
  { value: 4, label: 'Specialized' },
  { value: 7, label: 'Bespoke' },
  { value: 9, label: 'Multiple bespoke' },
]

export const ciaBitmaskOptions: Option[] = [
  { value: 0, label: 'None (000)' },
  { value: 4, label: 'Confidentiality (100)' },
  { value: 2, label: 'Integrity (010)' },
  { value: 1, label: 'Availability (001)' },
  { value: 6, label: 'Confidentiality + Integrity (110)' },
  { value: 5, label: 'Confidentiality + Availability (101)' },
  { value: 3, label: 'Integrity + Availability (011)' },
  { value: 7, label: 'Confidentiality + Integrity + Availability (111)' },
]

export type AttackFeasibilityInput = {
  fr_et: number
  fr_se: number
  fr_koC: number
  fr_WoO: number
  fr_eq: number
}

export type AttackFeasibilityRating = {
  points: number
  level: 'High' | 'Medium' | 'Low' | 'Very Low'
  value: 1 | 2 | 3 | 4 | 5
  attackPotential: 'Basic' | 'Enhanced-Basic' | 'Moderate' | 'High' | 'Beyond High'
}

export type ImpactLevelInput = {
  safety_impact: number
  finantial_impact: number
  operational_impact: number
  privacy_impact: number
}

export function asNumber(value: number | string | null | undefined, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

export function formatCIABinary(value: number | string | null | undefined) {
  return asNumber(value, 0).toString(2).padStart(3, '0')
}

export function formatCIABitmask(
  value: number | string | null | undefined,
  explicitBinary?: string | null
) {
  const numeric = asNumber(value, 0)
  const binary = explicitBinary ?? formatCIABinary(numeric)
  const labels: string[] = []

  if (numeric & 4) labels.push('C')
  if (numeric & 2) labels.push('I')
  if (numeric & 1) labels.push('A')

  return labels.length ? `${labels.join('')} (${binary})` : `None (${binary})`
}

export function formatCIAFlags(value: number | string | null | undefined) {
  const numeric = asNumber(value, 0)
  const labels: string[] = []

  if (numeric & 4) labels.push('C')
  if (numeric & 2) labels.push('I')
  if (numeric & 1) labels.push('A')

  return labels.length ? labels.join('') : 'None'
}

export function calculateAttackPotentialPoints(row: AttackFeasibilityInput) {
  if (row.fr_et >= 99 || row.fr_WoO >= 99) {
    return Number.POSITIVE_INFINITY
  }

  return row.fr_et + row.fr_se + row.fr_koC + row.fr_WoO + row.fr_eq
}

export function calculateAttackFeasibilityRating(
  row: AttackFeasibilityInput
): AttackFeasibilityRating {
  const points = calculateAttackPotentialPoints(row)

  if (points <= 9) {
    return { points, level: 'High', value: 5, attackPotential: 'Basic' }
  }

  if (points <= 13) {
    return { points, level: 'High', value: 4, attackPotential: 'Enhanced-Basic' }
  }

  if (points <= 19) {
    return { points, level: 'Medium', value: 3, attackPotential: 'Moderate' }
  }

  if (points <= 24) {
    return { points, level: 'Low', value: 2, attackPotential: 'High' }
  }

  return { points, level: 'Very Low', value: 1, attackPotential: 'Beyond High' }
}

export function formatAttackPotentialPoints(points: number) {
  return Number.isFinite(points) ? String(points) : 'not practical'
}

export function formatAttackFeasibilityRating(row: AttackFeasibilityInput) {
  const rating = calculateAttackFeasibilityRating(row)
  return `${rating.level} (${rating.value})`
}

export function calculateImpactLevel(row: ImpactLevelInput) {
  return Math.max(
    asNumber(row.safety_impact),
    asNumber(row.finantial_impact),
    asNumber(row.operational_impact),
    asNumber(row.privacy_impact)
  )
}

export function formatImpactLevel(row: ImpactLevelInput) {
  const value = calculateImpactLevel(row)
  return `${impactOptions.find((option) => option.value === value)?.label ?? value} (${value})`
}
