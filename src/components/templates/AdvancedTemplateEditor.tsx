
import { useState, useEffect } from 'react'
import { useAdvancedTemplates } from '@/hooks/useAdvancedTemplates'
import { useTemplatePreview } from '@/hooks/useTemplatePreview'
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
import { Plus, X, Eye, Save, AlertCircle } from 'lucide-react'
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
  { value: 'checkbox', label: 'Sim/Não' }
]

export const AdvancedTemplateEditor = ({ 
  isOpen, 
  template, 
  onClose, 
  onSuccess 
}: AdvancedTemplateEditorProps) => {
  const { createTemplate, updateTemplate } = useAdvancedTemplates()
  const { generatePreview } = useTemplatePreview()
  
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
  
  const [previewData, setPreviewData] = useState<Record<string, any>>({})
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

  const handlePreview = () => {
    generatePreview(formData.template_content, formData.fields as TemplateField[], previewData)
    setActiveTab('preview')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Editar Template' : 'Novo Template'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="fields">Campos</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              {/* Editor Tab */}
              <TabsContent value="editor" className="h-full space-y-4">
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

                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="template-content">Conteúdo do Template</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handlePreview}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                  
                  <Textarea
                    id="template-content"
                    value={formData.template_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, template_content: e.target.value }))}
                    placeholder="Digite o conteúdo da petição usando variáveis como {{cliente_nome}}, {{data_hoje}}, etc..."
                    className="min-h-[300px] font-mono text-sm"
                    required
                  />
                  
                  <div className="mt-2 text-xs text-gray-500">
                    💡 Use variáveis como {{`{cliente_nome}`}} para campos dinâmicos
                  </div>
                </div>
              </TabsContent>

              {/* Fields Tab */}
              <TabsContent value="fields" className="h-full space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Campos Configuráveis</h3>
                  <Button type="button" onClick={addField} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Campo
                  </Button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {formData.fields.map((field, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-12 gap-3 items-end">
                          <div className="col-span-3">
                            <Label className="text-xs">Chave da Variável</Label>
                            <Input
                              value={field.field_key}
                              onChange={(e) => updateField(index, { field_key: e.target.value })}
                              placeholder="cliente_nome"
                              className="text-sm"
                            />
                          </div>
                          
                          <div className="col-span-3">
                            <Label className="text-xs">Label do Campo</Label>
                            <Input
                              value={field.field_label}
                              onChange={(e) => updateField(index, { field_label: e.target.value })}
                              placeholder="Nome do Cliente"
                              className="text-sm"
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <Label className="text-xs">Tipo</Label>
                            <Select 
                              value={field.field_type} 
                              onValueChange={(value: any) => updateField(index, { field_type: value })}
                            >
                              <SelectTrigger className="text-sm">
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
                          
                          <div className="col-span-2 flex items-center space-x-2">
                            <Switch
                              checked={field.is_required}
                              onCheckedChange={(checked) => updateField(index, { is_required: checked })}
                            />
                            <Label className="text-xs">Obrigatório</Label>
                          </div>
                          
                          <div className="col-span-1 flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => insertVariable(field.field_key)}
                              className="h-8 w-8 p-0"
                            >
                              +
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeField(index)}
                              className="h-8 w-8 p-0 text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="h-full">
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div>
                    <h4 className="font-medium mb-2">Dados de Teste</h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {formData.fields.map((field, index) => (
                        <div key={index}>
                          <Label className="text-xs">{field.field_label}</Label>
                          <Input
                            value={previewData[field.field_key] || ''}
                            onChange={(e) => setPreviewData(prev => ({
                              ...prev,
                              [field.field_key]: e.target.value
                            }))}
                            placeholder={`Ex: valor para ${field.field_key}`}
                            className="text-sm"
                          />
                        </div>
                      ))}
                    </div>
                    <Button 
                      type="button" 
                      onClick={handlePreview} 
                      className="w-full mt-4"
                      variant="outline"
                    >
                      Atualizar Preview
                    </Button>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Preview da Petição</h4>
                    <div className="border rounded p-4 min-h-[300px] bg-gray-50 text-sm whitespace-pre-wrap">
                      {formData.template_content || 'Digite o conteúdo do template na aba Editor...'}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
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

          <div className="flex justify-end gap-2 pt-4 border-t">
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
