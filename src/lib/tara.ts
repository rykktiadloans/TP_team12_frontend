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
