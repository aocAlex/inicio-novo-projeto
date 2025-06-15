
import { useState, useCallback, useMemo } from 'react'
import { TemplatePreview, TemplateField } from '@/types/templates'

export const useTemplatePreview = () => {
  const [preview, setPreview] = useState<TemplatePreview | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePreview = useCallback((
    templateContent: string,
    fields: TemplateField[],
    filledData: Record<string, any>
  ): TemplatePreview => {
    setIsGenerating(true)
    
    try {
      let previewContent = templateContent
      const missingFields: string[] = []
      const filledFields: Record<string, any> = {}
      const orphanVariables: string[] = []

      // Encontrar todas as variáveis no template
      const variableRegex = /\{\{([^}]+)\}\}/g
      const matches = templateContent.match(variableRegex) || []
      const uniqueVariables = [...new Set(matches.map(match => match.replace(/[{}]/g, '').trim()))]
      
      uniqueVariables.forEach(fieldKey => {
        // Verificar se é variável do sistema
        if (isSystemVariable(fieldKey)) {
          const systemValue = getSystemVariableValue(fieldKey)
          previewContent = previewContent.replace(
            new RegExp(`\\{\\{\\s*${fieldKey}\\s*\\}\\}`, 'g'),
            systemValue
          )
          filledFields[fieldKey] = systemValue
          return
        }

        // Buscar campo definido
        const field = fields.find(f => f.field_key === fieldKey)
        
        if (field) {
          const value = filledData[fieldKey]
          
          if (value !== undefined && value !== null && value !== '') {
            // Substituir variável pelo valor formatado
            const formattedValue = formatFieldValue(value, field.field_type)
            previewContent = previewContent.replace(
              new RegExp(`\\{\\{\\s*${fieldKey}\\s*\\}\\}`, 'g'),
              formattedValue
            )
            filledFields[fieldKey] = formattedValue
          } else {
            // Campo não preenchido
            if (field.is_required) {
              missingFields.push(field.field_label)
            }
            // Manter placeholder visual
            previewContent = previewContent.replace(
              new RegExp(`\\{\\{\\s*${fieldKey}\\s*\\}\\}`, 'g'),
              `<span class="text-red-500 bg-red-50 px-1 rounded">[${field.field_label}]</span>`
            )
          }
        } else {
          // Campo não definido (variável órfã)
          orphanVariables.push(fieldKey)
          previewContent = previewContent.replace(
            new RegExp(`\\{\\{\\s*${fieldKey}\\s*\\}\\}`, 'g'),
            `<span class="text-orange-500 bg-orange-50 px-1 rounded">[CAMPO NÃO DEFINIDO: ${fieldKey}]</span>`
          )
        }
      })

      const previewData: TemplatePreview = {
        original_content: templateContent,
        preview_content: previewContent,
        missing_fields: missingFields,
        filled_fields: filledFields,
        orphan_variables: orphanVariables
      }

      setPreview(previewData)
      return previewData

    } finally {
      setIsGenerating(false)
    }
  }, [])

  const isSystemVariable = (variable: string): boolean => {
    const systemVariables = [
      'data_hoje',
      'data_atual',
      'hora_atual',
      'workspace_nome',
      'usuario_nome',
      'numero_auto'
    ]
    return systemVariables.includes(variable)
  }

  const getSystemVariableValue = (variable: string): string => {
    const now = new Date()
    
    switch (variable) {
      case 'data_hoje':
      case 'data_atual':
        return now.toLocaleDateString('pt-BR')
      case 'hora_atual':
        return now.toLocaleTimeString('pt-BR')
      case 'workspace_nome':
        return '[Nome da Workspace]'
      case 'usuario_nome':
        return '[Nome do Usuário]'
      case 'numero_auto':
        return '[Número Automático]'
      default:
        return `[${variable}]`
    }
  }

  const formatFieldValue = (value: any, fieldType: string): string => {
    if (value === null || value === undefined || value === '') {
      return ''
    }

    try {
      switch (fieldType) {
        case 'date':
          return new Date(value).toLocaleDateString('pt-BR')
        case 'datetime':
          return new Date(value).toLocaleString('pt-BR')
        case 'time':
          return new Date(`1970-01-01T${value}`).toLocaleTimeString('pt-BR')
        case 'cpf':
          return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        case 'cnpj':
          return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
        case 'phone':
          const digits = value.replace(/\D/g, '')
          if (digits.length === 11) {
            return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
          } else if (digits.length === 10) {
            return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
          }
          return value
        case 'cep':
          return value.replace(/(\d{5})(\d{3})/, '$1-$2')
        case 'currency':
          const numValue = parseFloat(value)
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(isNaN(numValue) ? 0 : numValue)
        case 'percentage':
          const pctValue = parseFloat(value)
          return `${isNaN(pctValue) ? 0 : pctValue}%`
        case 'number':
          const number = parseFloat(value)
          return isNaN(number) ? value : number.toLocaleString('pt-BR')
        case 'multiselect':
          return Array.isArray(value) ? value.join(', ') : value
        case 'checkbox':
          return value ? 'Sim' : 'Não'
        case 'oab':
          return value.toUpperCase()
        case 'processo_numero':
          // Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
          const processDigits = value.replace(/\D/g, '')
          if (processDigits.length === 20) {
            return processDigits.replace(
              /(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})/,
              '$1-$2.$3.$4.$5.$6'
            )
          }
          return value
        default:
          return String(value)
      }
    } catch (error) {
      console.error('Error formatting field value:', error)
      return String(value)
    }
  }

  const extractVariablesFromContent = useCallback((content: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g
    const matches = content.match(variableRegex) || []
    return [...new Set(matches.map(match => match.replace(/[{}]/g, '').trim()))]
  }, [])

  const suggestFieldsFromContent = useCallback((
    content: string,
    existingFields: TemplateField[]
  ): Partial<TemplateField>[] => {
    const variables = extractVariablesFromContent(content)
    const existingKeys = existingFields.map(f => f.field_key)
    
    return variables
      .filter(variable => !existingKeys.includes(variable) && !isSystemVariable(variable))
      .map(variable => ({
        field_key: variable,
        field_label: formatFieldKeyToLabel(variable),
        field_type: guessFieldType(variable),
        is_required: false,
        display_order: existingFields.length,
        field_options: {},
        validation_rules: {}
      }))
  }, [extractVariablesFromContent])

  const formatFieldKeyToLabel = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  const guessFieldType = (key: string): TemplateField['field_type'] => {
    const keyLower = key.toLowerCase()
    
    if (keyLower.includes('cpf')) return 'cpf'
    if (keyLower.includes('cnpj')) return 'cnpj'
    if (keyLower.includes('email')) return 'email'
    if (keyLower.includes('telefone') || keyLower.includes('phone')) return 'phone'
    if (keyLower.includes('data') || keyLower.includes('date')) return 'date'
    if (keyLower.includes('valor') || keyLower.includes('price')) return 'currency'
    if (keyLower.includes('cep')) return 'cep'
    if (keyLower.includes('numero') && keyLower.includes('processo')) return 'processo_numero'
    if (keyLower.includes('oab')) return 'oab'
    if (keyLower.includes('descricao') || keyLower.includes('observ')) return 'textarea'
    if (keyLower.includes('quantidade') || keyLower.includes('numero')) return 'number'
    
    return 'text'
  }

  const validateFieldData = useCallback((
    fields: TemplateField[],
    data: Record<string, any>
  ): { isValid: boolean; errors: Array<{ field: string; message: string }> } => {
    const errors: Array<{ field: string; message: string }> = []

    fields.forEach(field => {
      const value = data[field.field_key]
      
      // Verificar obrigatório
      if (field.is_required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: field.field_key,
          message: `${field.field_label} é obrigatório`
        })
        return
      }

      // Se não há valor, pular outras validações
      if (value === undefined || value === null || value === '') {
        return
      }

      // Validações específicas por tipo
      switch (field.field_type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            errors.push({
              field: field.field_key,
              message: `${field.field_label} deve ser um email válido`
            })
          }
          break
          
        case 'cpf':
          const cpfDigits = value.replace(/\D/g, '')
          if (cpfDigits.length !== 11) {
            errors.push({
              field: field.field_key,
              message: `${field.field_label} deve ter 11 dígitos`
            })
          }
          break
          
        case 'cnpj':
          const cnpjDigits = value.replace(/\D/g, '')
          if (cnpjDigits.length !== 14) {
            errors.push({
              field: field.field_key,
              message: `${field.field_label} deve ter 14 dígitos`
            })
          }
          break
          
        case 'phone':
          const phoneDigits = value.replace(/\D/g, '')
          if (phoneDigits.length < 10 || phoneDigits.length > 11) {
            errors.push({
              field: field.field_key,
              message: `${field.field_label} deve ter 10 ou 11 dígitos`
            })
          }
          break
      }

      // Validações customizadas
      if (field.validation_rules) {
        if (field.validation_rules.minLength && value.length < field.validation_rules.minLength) {
          errors.push({
            field: field.field_key,
            message: `${field.field_label} deve ter pelo menos ${field.validation_rules.minLength} caracteres`
          })
        }
        
        if (field.validation_rules.maxLength && value.length > field.validation_rules.maxLength) {
          errors.push({
            field: field.field_key,
            message: `${field.field_label} deve ter no máximo ${field.validation_rules.maxLength} caracteres`
          })
        }
        
        if (field.validation_rules.pattern) {
          const regex = new RegExp(field.validation_rules.pattern)
          if (!regex.test(value)) {
            errors.push({
              field: field.field_key,
              message: `${field.field_label} não atende ao formato exigido`
            })
          }
        }
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }, [])

  // Memoizar funções auxiliares para performance
  const memoizedHelpers = useMemo(() => ({
    formatFieldValue,
    extractVariablesFromContent,
    suggestFieldsFromContent,
    validateFieldData
  }), [extractVariablesFromContent, suggestFieldsFromContent, validateFieldData])

  return {
    preview,
    isGenerating,
    generatePreview,
    ...memoizedHelpers
  }
}
