
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Play, Eye, FileText } from 'lucide-react'
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
  const { generatePreview, validateFieldData } = useTemplatePreview()
  const { clients } = useClients()
  const { processes } = useProcesses()
  
  const [filledData, setFilledData] = useState<Record<string, any>>({})
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [selectedProcess, setSelectedProcess] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<Array<{ field: string; message: string }>>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [preview, setPreview] = useState<any>(null)

  useEffect(() => {
    // Inicializar dados com valores padrão
    const initialData: Record<string, any> = {}
    template.fields?.forEach(field => {
      if (field.field_options?.default) {
        initialData[field.field_key] = field.field_options.default
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

  const handlePreview = () => {
    if (!template.fields) return
    
    const previewResult = generatePreview(
      template.template_content, 
      template.fields, 
      filledData
    )
    setPreview(previewResult)
    setShowPreview(true)
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

  const renderField = (field: TemplateField) => {
    const error = validationErrors.find(e => e.field === field.field_key)
    const value = filledData[field.field_key] || ''

    const baseProps = {
      id: field.field_key,
      value,
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
              {field.field_options?.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
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

              <div className="space-y-2">
                <Button 
                  onClick={handlePreview}
                  variant="outline" 
                  className="w-full"
                  size="sm"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar Preview
                </Button>
                
                <Button 
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className="w-full"
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
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      {showPreview && preview && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Preview da Petição</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 overflow-y-auto">
              {preview.missing_fields.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Campos pendentes:</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    {preview.missing_fields.join(', ')}
                  </p>
                </div>
              )}
              
              <div className="border rounded-lg p-4 bg-white">
                <div 
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: preview.preview_content }}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
