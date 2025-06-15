
import { useState, useEffect } from 'react'
import { useAdvancedTemplates } from '@/hooks/useAdvancedTemplates'
import { useTemplatePreview } from '@/hooks/useTemplatePreview'
import { useClients } from '@/hooks/useClients'
import { useProcesses } from '@/hooks/useProcesses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, FileText, X } from 'lucide-react'
import { PetitionTemplate, TemplateField } from '@/types/templates'

interface AdvancedTemplateExecutorProps {
  isOpen: boolean
  template: PetitionTemplate
  onClose: () => void
  onSuccess: () => void
}

export const AdvancedTemplateExecutor = ({ 
  isOpen, 
  template, 
  onClose, 
  onSuccess 
}: AdvancedTemplateExecutorProps) => {
  const { executeTemplate } = useAdvancedTemplates()
  const { validateFieldData } = useTemplatePreview()
  const { clients } = useClients()
  const { processes } = useProcesses()
  
  const [filledData, setFilledData] = useState<Record<string, any>>({})
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [selectedProcess, setSelectedProcess] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<Array<{ field: string; message: string }>>([])
  const [isExecuting, setIsExecuting] = useState(false)

  useEffect(() => {
    // Inicializar dados com valores padrão
    const initialData: Record<string, any> = {}
    template.fields?.forEach(field => {
      if (field.field_options?.default) {
        initialData[field.field_key] = field.field_options.default
      } else if (field.field_type === 'multiselect') {
        initialData[field.field_key] = []
      }
    })
    setFilledData(initialData)
  }, [template])

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFilledData(prev => ({
      ...prev,
      [fieldKey]: value
    }))
    
    // Limpar erros de validação para este campo
    setValidationErrors(prev => prev.filter(error => error.field !== fieldKey))
  }

  const handleMultiSelectChange = (fieldKey: string, optionValue: string, checked: boolean) => {
    setFilledData(prev => {
      const currentValues = prev[fieldKey] || []
      let newValues
      
      if (checked) {
        newValues = [...currentValues, optionValue]
      } else {
        newValues = currentValues.filter((value: string) => value !== optionValue)
      }
      
      return {
        ...prev,
        [fieldKey]: newValues
      }
    })
    
    // Limpar erros de validação para este campo
    setValidationErrors(prev => prev.filter(error => error.field !== fieldKey))
  }

  const removeMultiSelectValue = (fieldKey: string, valueToRemove: string) => {
    setFilledData(prev => ({
      ...prev,
      [fieldKey]: (prev[fieldKey] || []).filter((value: string) => value !== valueToRemove)
    }))
  }

  const handleAutoFillFromClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    if (!client) return

    const autoFillData: Record<string, any> = {}
    
    // Mapear dados do cliente para campos comuns
    const clientMappings = {
      'cliente_nome': client.name,
      'cliente_email': client.email,
      'cliente_telefone': client.phone,
      'cliente_documento': client.document_number,
      'cliente_endereco': `${client.address?.street || ''}, ${client.address?.city || ''}, ${client.address?.state || ''}`.trim().replace(/^,|,$/, ''),
      'cliente_cep': client.address?.zip_code,
      'cliente_cidade': client.address?.city,
      'cliente_estado': client.address?.state
    }

    template.fields?.forEach(field => {
      const mapping = clientMappings[field.field_key as keyof typeof clientMappings]
      if (mapping) {
        autoFillData[field.field_key] = mapping
      }
    })

    setFilledData(prev => ({ ...prev, ...autoFillData }))
  }

  const handleAutoFillFromProcess = (processId: string) => {
    const process = processes.find(p => p.id === processId)
    if (!process) return

    const autoFillData: Record<string, any> = {}
    
    // Mapear dados do processo para campos comuns
    const processMappings = {
      'processo_numero': process.process_number,
      'processo_titulo': process.title,
      'processo_comarca': process.court,
      'processo_valor': process.case_value,
      'processo_status': process.status
    }

    template.fields?.forEach(field => {
      const mapping = processMappings[field.field_key as keyof typeof processMappings]
      if (mapping) {
        autoFillData[field.field_key] = mapping
      }
    })

    setFilledData(prev => ({ ...prev, ...autoFillData }))
  }

  const handleExecute = async () => {
    if (!template.fields) return

    // Validar campos
    const validation = validateFieldData(template.fields, filledData)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    try {
      setIsExecuting(true)
      
      const execution = await executeTemplate(
        template.id,
        filledData,
        selectedClient || undefined,
        selectedProcess || undefined
      )

      if (execution) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error executing template:', error)
    } finally {
      setIsExecuting(false)
    }
  }

  const getOptionTitle = (field: TemplateField, optionValue: string): string => {
    if (!field.field_options?.options) return optionValue
    
    const option = field.field_options.options.find((opt: any) => {
      // Suporte para formato antigo (string) e novo (objeto com title/value)
      return typeof opt === 'string' ? opt === optionValue : opt.value === optionValue
    })
    
    if (!option) return optionValue
    
    // Se é string, retorna a própria string; se é objeto, retorna o title
    return typeof option === 'string' ? option : option.title || option.value
  }

  const renderField = (field: TemplateField) => {
    const error = validationErrors.find(e => e.field === field.field_key)
    const value = filledData[field.field_key] || (field.field_type === 'multiselect' ? [] : '')

    const baseProps = {
      id: field.field_key,
      value: field.field_type === 'multiselect' ? '' : value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        handleFieldChange(field.field_key, e.target.value),
      placeholder: field.field_options?.placeholder || `Digite ${field.field_label.toLowerCase()}...`,
      required: field.is_required,
      className: error ? 'border-red-500' : ''
    }

    switch (field.field_type) {
      case 'textarea':
        return (
          <Textarea 
            {...baseProps}
            rows={4}
          />
        )
        
      case 'select':
        return (
          <Select 
            value={value} 
            onValueChange={(val) => handleFieldChange(field.field_key, val)}
          >
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={`Selecione ${field.field_label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.field_options?.options?.map((option: any, index: number) => {
                // Suporte para formato antigo (string) e novo (objeto com title/value)
                const optionValue = typeof option === 'string' ? option : option.value
                const optionTitle = typeof option === 'string' ? option : option.title || option.value
                
                return (
                  <SelectItem key={index} value={optionValue}>
                    {optionTitle}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        )

      case 'multiselect':
        return (
          <div className="space-y-2">
            {/* Valores selecionados */}
            {value.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {value.map((selectedValue: string) => (
                  <Badge 
                    key={selectedValue} 
                    variant="secondary" 
                    className="flex items-center gap-1"
                  >
                    {getOptionTitle(field, selectedValue)}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-500" 
                      onClick={() => removeMultiSelectValue(field.field_key, selectedValue)}
                    />
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Opções disponíveis */}
            <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
              {field.field_options?.options?.map((option: any, index: number) => {
                // Suporte para formato antigo (string) e novo (objeto com title/value)
                const optionValue = typeof option === 'string' ? option : option.value
                const optionTitle = typeof option === 'string' ? option : option.title || option.value
                const isSelected = value.includes(optionValue)
                
                return (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${field.field_key}-${index}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => 
                        handleMultiSelectChange(field.field_key, optionValue, !!checked)
                      }
                    />
                    <Label 
                      htmlFor={`${field.field_key}-${index}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {optionTitle}
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>
        )
        
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.field_key}
              checked={!!value}
              onCheckedChange={(checked) => handleFieldChange(field.field_key, checked)}
            />
            <Label htmlFor={field.field_key}>{field.field_label}</Label>
          </div>
        )
        
      case 'date':
        return (
          <Input 
            {...baseProps}
            type="date"
          />
        )
        
      case 'number':
      case 'currency':
        return (
          <Input 
            {...baseProps}
            type="number"
            step={field.field_type === 'currency' ? '0.01' : '1'}
          />
        )
        
      case 'email':
        return (
          <Input 
            {...baseProps}
            type="email"
          />
        )
        
      case 'phone':
        return (
          <Input 
            {...baseProps}
            type="tel"
            placeholder="(11) 99999-9999"
          />
        )
        
      default:
        return (
          <Input {...baseProps} />
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Executar Template: {template.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6 flex-1 overflow-hidden">
          {/* Formulário */}
          <div className="col-span-2 space-y-4 overflow-y-auto">
            {/* Auto-preenchimento */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Auto-preenchimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Cliente (Opcional)</Label>
                  <Select value={selectedClient} onValueChange={(value) => {
                    setSelectedClient(value)
                    handleAutoFillFromClient(value)
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs">Processo (Opcional)</Label>
                  <Select value={selectedProcess} onValueChange={(value) => {
                    setSelectedProcess(value)
                    handleAutoFillFromProcess(value)
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um processo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {processes.map(process => (
                        <SelectItem key={process.id} value={process.id}>
                          {process.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Campos do Template */}
            <div className="space-y-4">
              <h3 className="font-medium">Preencher Campos</h3>
              
              {template.fields?.map((field) => {
                const error = validationErrors.find(e => e.field === field.field_key)
                
                return (
                  <div key={field.id} className="space-y-1">
                    <Label htmlFor={field.field_key} className="flex items-center gap-2">
                      {field.field_label}
                      {field.is_required && (
                        <Badge variant="destructive" className="text-xs px-1 py-0">
                          Obrigatório
                        </Badge>
                      )}
                    </Label>
                    
                    {renderField(field)}
                    
                    {error && (
                      <div className="flex items-center gap-1 text-red-600 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        {error.message}
                      </div>
                    )}
                    
                    {field.field_options?.helpText && (
                      <p className="text-xs text-gray-500">
                        {field.field_options.helpText}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Informações do Template */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Categoria:</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {template.category}
                  </Badge>
                </div>
                
                <div>
                  <span className="font-medium">Campos:</span>
                  <span className="ml-2">{template.fields?.length || 0}</span>
                </div>
                
                <div>
                  <span className="font-medium">Execuções:</span>
                  <span className="ml-2">{template.execution_count}</span>
                </div>
                
                {template.description && (
                  <div>
                    <span className="font-medium">Descrição:</span>
                    <p className="text-gray-600 mt-1">{template.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botão fixo no rodapé */}
        <DialogFooter className="border-t pt-4 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleExecute}
            disabled={isExecuting}
            className="min-w-[140px]"
          >
            {isExecuting ? (
              'Gerando Petição...'
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Gerar Petição
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
