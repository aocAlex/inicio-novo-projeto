
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAdvancedTemplates } from '@/hooks/useAdvancedTemplates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, X, Save, ArrowLeft } from 'lucide-react'
import { PetitionTemplate, CreateTemplateData, TemplateField } from '@/types/templates'

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

export const TemplateEditorPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { createTemplate, updateTemplate, getTemplate } = useAdvancedTemplates()
  
  const [template, setTemplate] = useState<PetitionTemplate | null>(null)
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
    if (id) {
      // Load existing template for editing
      const loadTemplate = async () => {
        try {
          const templateData = await getTemplate(id)
          if (templateData) {
            setTemplate(templateData)
            setFormData({
              name: templateData.name,
              description: templateData.description || '',
              category: templateData.category,
              template_content: templateData.template_content,
              is_shared: templateData.is_shared,
              webhook_url: templateData.webhook_url || '',
              webhook_enabled: templateData.webhook_enabled,
              fields: templateData.fields?.map(field => ({
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
        } catch (error) {
          console.error('Error loading template:', error)
        }
      }
      loadTemplate()
    }
  }, [id, getTemplate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsLoading(true)
      
      if (template) {
        await updateTemplate(template.id, formData)
      } else {
        await createTemplate(formData)
      }
      
      navigate('/templates')
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
    const newOptions = [...currentOptions, { title: '', value: '' }]
    updateFieldOptions(fieldIndex, { ...field.field_options, options: newOptions })
  }

  const updateSelectOption = (fieldIndex: number, optionIndex: number, key: 'title' | 'value', newValue: string) => {
    const field = formData.fields[fieldIndex]
    const currentOptions = field.field_options.options || []
    const newOptions = currentOptions.map((opt: any, i: number) => 
      i === optionIndex ? { ...opt, [key]: newValue } : opt
    )
    updateFieldOptions(fieldIndex, { ...field.field_options, options: newOptions })
  }

  const removeSelectOption = (fieldIndex: number, optionIndex: number) => {
    const field = formData.fields[fieldIndex]
    const currentOptions = field.field_options.options || []
    const newOptions = currentOptions.filter((_: any, i: number) => i !== optionIndex)
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
            {options.map((option: any, optionIndex: number) => (
              <div key={optionIndex} className="border rounded p-2 space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Título (visível)</Label>
                    <Input
                      value={option.title || ''}
                      onChange={(e) => updateSelectOption(index, optionIndex, 'title', e.target.value)}
                      placeholder="Ex: Pessoa Física"
                      className="text-sm h-8"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Valor (interno)</Label>
                    <Input
                      value={option.value || ''}
                      onChange={(e) => updateSelectOption(index, optionIndex, 'value', e.target.value)}
                      placeholder="Ex: pessoa_fisica"
                      className="text-sm h-8"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSelectOption(index, optionIndex)}
                    className="h-8 w-8 p-0 text-red-600 self-end"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/templates')}
                className="text-gray-600"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {template ? 'Editar Template' : 'Novo Template'}
                </h1>
                <p className="text-gray-600">
                  {template ? `Editando: ${template.name}` : 'Criar um novo template de petição'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/templates')}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Salvando...' : (template ? 'Atualizar' : 'Criar Template')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            {/* Editor Tab */}
            <TabsContent value="editor" className="space-y-6 mt-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>

              {/* Template Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Conteúdo do Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Textarea
                      id="template-content"
                      value={formData.template_content}
                      onChange={(e) => setFormData(prev => ({ ...prev, template_content: e.target.value }))}
                      placeholder="Digite o conteúdo da petição usando variáveis como {{cliente_nome}}, {{data_hoje}}, etc..."
                      className="h-[300px] font-mono text-sm"
                      required
                    />
                    <div className="text-xs text-gray-500">
                      💡 Use variáveis como {`{{cliente_nome}}`} para campos dinâmicos
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configurable Fields */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Campos Configuráveis</CardTitle>
                    <Button type="button" onClick={addField} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Campo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
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

                              {/* Field-specific options */}
                              {renderFieldSpecificOptions(field, index)}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    
                    {formData.fields.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Nenhum campo configurado. Clique em "Adicionar Campo" para começar.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Avançadas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </div>
  )
}
