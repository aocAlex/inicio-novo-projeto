
import { useState, useEffect } from 'react'
import { useAdvancedTemplates } from '@/hooks/useAdvancedTemplates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, X, Save, AlertCircle } from 'lucide-react'
import { PetitionTemplate, CreateTemplateData, TemplateField } from '@/types/templates'

interface AdvancedTemplateEditorProps {
  isOpen: boolean
  template?: PetitionTemplate
  onClose: () => void
  onSuccess: () => void
}

const CATEGORIES = [
  { value: 'civil', label: 'Civil' },
  { value: 'criminal', label: 'Criminal' },
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'tributario', label: 'Tributário' },
  { value: 'empresarial', label: 'Empresarial' },
  { value: 'familia', label: 'Família' }
]

const FIELD_TYPES = [
  { value: 'text', label: 'Texto Simples' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Telefone' },
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'date', label: 'Data' },
  { value: 'number', label: 'Número' },
  { value: 'currency', label: 'Moeda' },
  { value: 'select', label: 'Lista Suspensa' },
  { value: 'multiselect', label: 'Múltipla Seleção' },
  { value: 'checkbox', label: 'Sim/Não' }
]

export const AdvancedTemplateEditor = ({ 
  isOpen, 
  template, 
  onClose, 
  onSuccess 
}: AdvancedTemplateEditorProps) => {
  const { createTemplate, updateTemplate } = useAdvancedTemplates()
  
  const [formData, setFormData] = useState<CreateTemplateData>({
    name: '',
    description: '',
    category: 'civil',
    template_content: '',
    is_shared: false,
    webhook_url: '',
    webhook_enabled: false,
    fields: []
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('editor')

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        category: template.category,
        template_content: template.template_content,
        is_shared: template.is_shared,
        webhook_url: template.webhook_url || '',
        webhook_enabled: template.webhook_enabled,
        fields: template.fields?.map(field => ({
          field_key: field.field_key,
          field_label: field.field_label,
          field_type: field.field_type,
          field_options: field.field_options,
          is_required: field.is_required,
          display_order: field.display_order,
          validation_rules: field.validation_rules
        })) || []
      })
    }
  }, [template])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsLoading(true)
      
      if (template) {
        await updateTemplate(template.id, formData)
      } else {
        await createTemplate(formData)
      }
      
      onSuccess()
    } catch (error) {
      console.error('Error saving template:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addField = () => {
    const newField = {
      field_key: `campo_${formData.fields.length + 1}`,
      field_label: `Campo ${formData.fields.length + 1}`,
      field_type: 'text' as const,
      field_options: {},
      is_required: false,
      display_order: formData.fields.length,
      validation_rules: {}
    }
    
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }))
  }

  const updateField = (index: number, field: Partial<typeof formData.fields[0]>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? { ...f, ...field } : f)
    }))
  }

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }))
  }

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const value = textarea.value
      const newValue = value.substring(0, start) + `{{${variable}}}` + value.substring(end)
      
      setFormData(prev => ({
        ...prev,
        template_content: newValue
      }))
      
      // Restaurar posição do cursor
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4)
      }, 0)
    }
  }

  const updateFieldOptions = (index: number, options: any) => {
    updateField(index, { field_options: options })
  }

  const addSelectOption = (fieldIndex: number) => {
    const field = formData.fields[fieldIndex]
    const currentOptions = field.field_options.options || []
    const newOptions = [...currentOptions, '']
    updateFieldOptions(fieldIndex, { ...field.field_options, options: newOptions })
  }

  const updateSelectOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const field = formData.fields[fieldIndex]
    const currentOptions = field.field_options.options || []
    const newOptions = currentOptions.map((opt: string, i: number) => i === optionIndex ? value : opt)
    updateFieldOptions(fieldIndex, { ...field.field_options, options: newOptions })
  }

  const removeSelectOption = (fieldIndex: number, optionIndex: number) => {
    const field = formData.fields[fieldIndex]
    const currentOptions = field.field_options.options || []
    const newOptions = currentOptions.filter((_: string, i: number) => i !== optionIndex)
    updateFieldOptions(fieldIndex, { ...field.field_options, options: newOptions })
  }

  const renderFieldSpecificOptions = (field: any, index: number) => {
    switch (field.field_type) {
      case 'select':
      case 'multiselect':
        const options = field.field_options.options || []
        return (
          <div className="space-y-2">
            <Label className="text-xs">Opções da Lista</Label>
            {options.map((option: string, optionIndex: number) => (
              <div key={optionIndex} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateSelectOption(index, optionIndex, e.target.value)}
                  placeholder={`Opção ${optionIndex + 1}`}
                  className="text-sm h-8"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSelectOption(index, optionIndex)}
                  className="h-8 w-8 p-0 text-red-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addSelectOption(index)}
              className="h-8"
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar Opção
            </Button>
          </div>
        )

      case 'number':
      case 'currency':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Valor Mínimo</Label>
              <Input
                type="number"
                value={field.field_options.min || ''}
                onChange={(e) => updateFieldOptions(index, { ...field.field_options, min: e.target.value })}
                className="text-sm h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Valor Máximo</Label>
              <Input
                type="number"
                value={field.field_options.max || ''}
                onChange={(e) => updateFieldOptions(index, { ...field.field_options, max: e.target.value })}
                className="text-sm h-8"
              />
            </div>
          </div>
        )

      case 'text':
      case 'textarea':
      case 'email':
      case 'phone':
        return (
          <div>
            <Label className="text-xs">Placeholder</Label>
            <Input
              value={field.field_options.placeholder || ''}
              onChange={(e) => updateFieldOptions(index, { ...field.field_options, placeholder: e.target.value })}
              placeholder="Texto de exemplo..."
              className="text-sm h-8"
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Editar Template' : 'Novo Template'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              {/* Editor Tab */}
              <TabsContent value="editor" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome do Template</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Petição Inicial - Ação de Cobrança"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição (Opcional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Breve descrição do template..."
                  />
                </div>

                {/* Conteúdo do Template */}
                <div>
                  <Label htmlFor="template-content" className="text-sm font-medium">
                    Conteúdo do Template
                  </Label>
                  
                  <Textarea
                    id="template-content"
                    value={formData.template_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, template_content: e.target.value }))}
                    placeholder="Digite o conteúdo da petição usando variáveis como {{cliente_nome}}, {{data_hoje}}, etc..."
                    className="mt-2 h-[200px] font-mono text-sm"
                    required
                  />
                  
                  <div className="mt-2 text-xs text-gray-500">
                    💡 Use variáveis como {`{{cliente_nome}}`} para campos dinâmicos
                  </div>
                </div>

                {/* Campos Configuráveis */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-sm font-medium">Campos Configuráveis</Label>
                    <Button type="button" onClick={addField} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Campo
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {formData.fields.map((field, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Chave da Variável</Label>
                                  <Input
                                    value={field.field_key}
                                    onChange={(e) => updateField(index, { field_key: e.target.value })}
                                    placeholder="cliente_nome"
                                    className="text-sm h-8"
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-xs">Label do Campo</Label>
                                  <Input
                                    value={field.field_label}
                                    onChange={(e) => updateField(index, { field_label: e.target.value })}
                                    placeholder="Nome do Cliente"
                                    className="text-sm h-8"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Tipo</Label>
                                  <Select 
                                    value={field.field_type} 
                                    onValueChange={(value: any) => updateField(index, { field_type: value, field_options: {} })}
                                  >
                                    <SelectTrigger className="text-sm h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {FIELD_TYPES.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                          {type.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="flex items-center justify-between pt-4">
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={field.is_required}
                                      onCheckedChange={(checked) => updateField(index, { is_required: checked })}
                                    />
                                    <Label className="text-xs">Obrigatório</Label>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => insertVariable(field.field_key)}
                                      className="h-6 w-6 p-0"
                                      title="Inserir no template"
                                    >
                                      +
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeField(index)}
                                      className="h-6 w-6 p-0 text-red-600"
                                      title="Remover campo"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Configurações específicas do tipo de campo */}
                              {renderFieldSpecificOptions(field, index)}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_shared}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_shared: checked }))}
                    />
                    <Label>Compartilhar template com outros membros</Label>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.webhook_enabled}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, webhook_enabled: checked }))}
                      />
                      <Label>Webhook ativo</Label>
                    </div>
                    
                    {formData.webhook_enabled && (
                      <div>
                        <Label htmlFor="webhook_url">URL do Webhook</Label>
                        <Input
                          id="webhook_url"
                          value={formData.webhook_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                          placeholder="https://n8n.exemplo.com/webhook/petition"
                          type="url"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          URL que receberá os dados quando o template for executado
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : (template ? 'Atualizar' : 'Criar Template')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
