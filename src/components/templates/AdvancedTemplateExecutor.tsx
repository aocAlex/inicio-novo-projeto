
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
import { Separator } from '@/components/ui/separator'
import { AlertCircle, FileText, X, CheckCircle2, User, Briefcase, Eye, EyeOff } from 'lucide-react'
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
  const [showPreview, setShowPreview] = useState(false)
  const [currentStep, setCurrentStep] = useState<'auto-fill' | 'fields' | 'preview'>('auto-fill')

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
      setCurrentStep('fields')
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

  // Verificar quantos campos obrigatórios foram preenchidos
  const requiredFields = template.fields?.filter(field => field.is_required) || []
  const filledRequiredFields = requiredFields.filter(field => {
    const value = filledData[field.field_key]
    if (field.field_type === 'multiselect') {
      return Array.isArray(value) && value.length > 0
    }
    return value && value.toString().trim() !== ''
  })

  const completionPercentage = requiredFields.length > 0 
    ? Math.round((filledRequiredFields.length / requiredFields.length) * 100)
    : 100

  const renderPreview = () => {
    if (!template.template_content) return 'Nenhum conteúdo disponível'
    
    let preview = template.template_content
    Object.entries(filledData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
      if (Array.isArray(value)) {
        preview = preview.replace(regex, value.join(', '))
      } else {
        preview = preview.replace(regex, value || `[${key}]`)
      }
    })
    
    return preview
  }

  const renderField = (field: TemplateField) => {
    const error = validationErrors.find(e => e.field === field.field_key)
    const value = filledData[field.field_key] || (field.field_type === 'multiselect' ? [] : '')
    const isFilled = field.field_type === 'multiselect' 
      ? Array.isArray(value) && value.length > 0
      : value && value.toString().trim() !== ''

    const baseProps = {
      id: field.field_key,
      value: field.field_type === 'multiselect' ? '' : value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        handleFieldChange(field.field_key, e.target.value),
      placeholder: field.field_options?.placeholder || `Digite ${field.field_label.toLowerCase()}...`,
      required: field.is_required,
      className: error ? 'border-red-500' : isFilled ? 'border-green-500' : ''
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
            <SelectTrigger className={error ? 'border-red-500' : isFilled ? 'border-green-500' : ''}>
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
          <div className="space-y-3">
            {/* Valores selecionados */}
            {value.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {value.map((selectedValue: string) => (
                  <Badge 
                    key={selectedValue} 
                    variant="secondary" 
                    className="flex items-center gap-2 px-3 py-1"
                  >
                    {getOptionTitle(field, selectedValue)}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-500 transition-colors" 
                      onClick={() => removeMultiSelectValue(field.field_key, selectedValue)}
                    />
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Opções disponíveis */}
            <div className={`border rounded-md p-3 max-h-40 overflow-y-auto space-y-2 ${isFilled ? 'border-green-500' : ''}`}>
              {field.field_options?.options?.map((option: any, index: number) => {
                // Suporte para formato antigo (string) e novo (objeto com title/value)
                const optionValue = typeof option === 'string' ? option : option.value
                const optionTitle = typeof option === 'string' ? option : option.title || option.value
                const isSelected = value.includes(optionValue)
                
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <Checkbox
                      id={`${field.field_key}-${index}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => 
                        handleMultiSelectChange(field.field_key, optionValue, !!checked)
                      }
                    />
                    <Label 
                      htmlFor={`${field.field_key}-${index}`}
                      className="text-sm cursor-pointer flex-1 hover:text-blue-600 transition-colors"
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
          <div className="flex items-center space-x-3">
            <Checkbox
              id={field.field_key}
              checked={!!value}
              onCheckedChange={(checked) => handleFieldChange(field.field_key, checked)}
            />
            <Label htmlFor={field.field_key} className="cursor-pointer">{field.field_label}</Label>
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

  const StepNavigation = () => (
    <div className="flex items-center justify-center space-x-4 mb-6">
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        currentStep === 'auto-fill' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`} onClick={() => setCurrentStep('auto-fill')}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          currentStep === 'auto-fill' ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'
        }`}>1</div>
        <span className="text-sm font-medium">Auto-preenchimento</span>
      </div>
      
      <div className="w-8 h-0.5 bg-gray-300"></div>
      
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        currentStep === 'fields' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`} onClick={() => setCurrentStep('fields')}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          currentStep === 'fields' ? 'bg-blue-600 text-white' : completionPercentage === 100 ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'
        }`}>
          {completionPercentage === 100 && currentStep !== 'fields' ? <CheckCircle2 className="w-3 h-3" /> : '2'}
        </div>
        <span className="text-sm font-medium">Preencher Campos</span>
        {completionPercentage < 100 && (
          <Badge variant="secondary" className="text-xs">
            {completionPercentage}%
          </Badge>
        )}
      </div>
      
      <div className="w-8 h-0.5 bg-gray-300"></div>
      
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        currentStep === 'preview' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`} onClick={() => setCurrentStep('preview')}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          currentStep === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'
        }`}>3</div>
        <span className="text-sm font-medium">Preview</span>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Gerar Petição: {template.name}
          </DialogTitle>
        </DialogHeader>

        <StepNavigation />

        <div className="flex-1 overflow-hidden">
          {currentStep === 'auto-fill' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Auto-preenchimento de Dados
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Selecione um cliente ou processo para preencher automaticamente os campos correspondentes
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Cliente (Opcional)
                      </Label>
                      <Select value={selectedClient} onValueChange={(value) => {
                        setSelectedClient(value)
                        handleAutoFillFromClient(value)
                      }}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione um cliente..." />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{client.name}</span>
                                <span className="text-xs text-gray-500">{client.email}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Processo (Opcional)
                      </Label>
                      <Select value={selectedProcess} onValueChange={(value) => {
                        setSelectedProcess(value)
                        handleAutoFillFromProcess(value)
                      }}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecione um processo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {processes.map(process => (
                            <SelectItem key={process.id} value={process.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{process.title}</span>
                                <span className="text-xs text-gray-500">{process.process_number}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button onClick={() => setCurrentStep('fields')}>
                      Próximo: Preencher Campos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 'fields' && (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Progress Bar */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progresso dos Campos Obrigatórios</span>
                    <span className="text-sm text-gray-600">{filledRequiredFields.length}/{requiredFields.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{width: `${completionPercentage}%`}}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              {/* Campos do Template */}
              <div className="space-y-4">
                {template.fields?.map((field) => {
                  const error = validationErrors.find(e => e.field === field.field_key)
                  const isFilled = field.field_type === 'multiselect' 
                    ? Array.isArray(filledData[field.field_key]) && filledData[field.field_key].length > 0
                    : filledData[field.field_key] && filledData[field.field_key].toString().trim() !== ''
                  
                  return (
                    <Card key={field.id} className={`transition-all duration-200 ${
                      error ? 'border-red-300 bg-red-50' : 
                      isFilled ? 'border-green-300 bg-green-50' : 
                      'hover:border-gray-300'
                    }`}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <Label htmlFor={field.field_key} className="flex items-center gap-2 text-sm font-medium">
                            {field.field_label}
                            {field.is_required && (
                              <Badge variant="destructive" className="text-xs px-2 py-0">
                                Obrigatório
                              </Badge>
                            )}
                            {isFilled && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                          </Label>
                          
                          {renderField(field)}
                          
                          {error && (
                            <div className="flex items-center gap-2 text-red-600 text-sm">
                              <AlertCircle className="h-4 w-4" />
                              {error.message}
                            </div>
                          )}
                          
                          {field.field_options?.helpText && (
                            <p className="text-xs text-gray-500">
                              {field.field_options.helpText}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep('auto-fill')}>
                  Voltar
                </Button>
                <Button 
                  onClick={() => setCurrentStep('preview')}
                  disabled={completionPercentage < 100}
                >
                  Próximo: Preview
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'preview' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    Preview da Petição
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Revise o conteúdo da petição antes de gerar o documento final
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                      {renderPreview()}
                    </pre>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep('fields')}>
                  Voltar aos Campos
                </Button>
                <Button 
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className="min-w-[160px]"
                  size="lg"
                >
                  {isExecuting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Gerando Petição...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Gerar Petição Final
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Informações do Template na Sidebar */}
        <div className="absolute right-4 top-20 w-64 space-y-4 hidden xl:block">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Informações do Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Categoria:</span>
                <Badge variant="outline" className="text-xs">
                  {template.category}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Campos:</span>
                <span className="font-medium">{template.fields?.length || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Execuções:</span>
                <span className="font-medium">{template.execution_count}</span>
              </div>
              
              {template.description && (
                <>
                  <Separator />
                  <div>
                    <span className="font-medium text-gray-600">Descrição:</span>
                    <p className="text-gray-600 mt-1 text-xs leading-relaxed">{template.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
