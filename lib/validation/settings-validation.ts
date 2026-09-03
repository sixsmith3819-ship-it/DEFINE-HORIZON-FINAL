export type SettingType = 'number' | 'percentage' | 'text'

export interface SettingValidationResult {
  valid: boolean
  error?: string
}

export function validateSettingValue(value: string, type: SettingType): SettingValidationResult {
  if (!value || value.trim() === '') {
    return { valid: false, error: 'Value is required' }
  }

  if (type === 'number' || type === 'percentage') {
    const num = parseFloat(value)
    if (isNaN(num)) {
      return { valid: false, error: 'Must be a valid number' }
    }
    if (num < 0) {
      return { valid: false, error: 'Must be zero or greater' }
    }
    if (type === 'percentage' && num > 100) {
      return { valid: false, error: 'Percentage cannot exceed 100' }
    }
  }

  return { valid: true }
}
