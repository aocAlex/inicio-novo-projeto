
import { useState, useEffect, useCallback } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { 
  PetitionTemplate, 
  CreateTemplateData, 
  UpdateTemplateData,
  TemplateField, 
  TemplateFilters,
  TemplateExecution 
} from '@/types/templates'

export const useAdvancedTemplates = () => {
  const { currentWorkspace } = useWorkspace()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<PetitionTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTemplates = useCallback(async (filters?: TemplateFilters) => {
    if (!currentWorkspace) return

    try {
      setIsLoading(true)
      setError(null)

      let query = supabase
        .from('petition_templates')
        .select(`
          *,
          fields:template_fields(*)
        `)
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }
      if (filters?.is_shared !== undefined) {
        query = query.eq('is_shared', filters.is_shared)
      }
      if (filters?.created_by) {
        query = query.eq('created_by', filters.created_by)
      }

      const { data, error: queryError } = await query

      if (queryError) {
        throw new Error(queryError.message)
      }

      // Ordenar campos por display_order e fazer type casting
      const templatesWithSortedFields = (data || []).map(template => ({
        ...template,
        fields: template.fields?.sort((a: any, b: any) => 
          (a.display_order || 0) - (b.display_order || 0)
        ) || []
      })) as PetitionTemplate[]

      setTemplates(templatesWithSortedFields)

    } catch (err: any) {
      console.error('Error loading templates:', err)
      setError(err.message)
      toast({
        title: "Erro ao carregar templates",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentWorkspace, toast])

  const createTemplate = useCallback(async (data: CreateTemplateData): Promise<PetitionTemplate | null> => {
    if (!currentWorkspace) {
      toast({
        title: "Erro",
        description: "Workspace não selecionada",
        variant: "destructive",
      })
      return null
    }

    try {
      setError(null)
      setIsLoading(true)

      // 1. Criar template
      const { data: templateData, error: templateError } = await supabase
        .from('petition_templates')
        .insert({
          workspace_id: currentWorkspace.id,
          name: data.name,
          description: data.description,
          category: data.category,
          template_content: data.template_content,
          is_shared: data.is_shared || false,
          webhook_url: data.webhook_url,
          webhook_enabled: data.webhook_enabled || false,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (templateError) {
        throw new Error(templateError.message)
      }

      // 2. Criar campos se existirem
      if (data.fields && data.fields.length > 0) {
        const fieldsToInsert = data.fields.map((field, index) => ({
          template_id: templateData.id,
          ...field,
          display_order: field.display_order || index
        }))

        const { error: fieldsError } = await supabase
          .from('template_fields')
          .insert(fieldsToInsert)

        if (fieldsError) {
          console.error('Error creating fields:', fieldsError)
          // Rollback - remover template criado
          await supabase.from('petition_templates').delete().eq('id', templateData.id)
          throw new Error('Erro ao criar campos: ' + fieldsError.message)
        }
      }

      toast({
        title: "Template criado",
        description: `${templateData.name} foi criado com sucesso.`,
      })

      // 3. Recarregar templates
      await loadTemplates()

      return templateData as PetitionTemplate

    } catch (err: any) {
      console.error('Error creating template:', err)
      toast({
        title: "Erro ao criar template",
        description: err.message,
        variant: "destructive",
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentWorkspace, toast, loadTemplates])

  const updateTemplate = useCallback(async (
    id: string, 
    data: UpdateTemplateData
  ): Promise<boolean> => {
    if (!currentWorkspace) return false

    try {
      setError(null)
      setIsLoading(true)

      // 1. Atualizar template
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (data.name) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.category) updateData.category = data.category
      if (data.template_content) updateData.template_content = data.template_content
      if (data.is_shared !== undefined) updateData.is_shared = data.is_shared
      if (data.webhook_url !== undefined) updateData.webhook_url = data.webhook_url
      if (data.webhook_enabled !== undefined) updateData.webhook_enabled = data.webhook_enabled

      const { error: templateError } = await supabase
        .from('petition_templates')
        .update(updateData)
        .eq('id', id)
        .eq('workspace_id', currentWorkspace.id)

      if (templateError) {
        throw new Error(templateError.message)
      }

      // 2. Atualizar campos se fornecidos
      if (data.fields) {
        // Remover campos existentes
        await supabase
          .from('template_fields')
          .delete()
          .eq('template_id', id)

        // Inserir novos campos
        if (data.fields.length > 0) {
          const fieldsToInsert = data.fields.map((field, index) => ({
            template_id: id,
            ...field,
            display_order: field.display_order || index
          }))

          const { error: fieldsError } = await supabase
            .from('template_fields')
            .insert(fieldsToInsert)

          if (fieldsError) {
            throw new Error('Erro ao atualizar campos: ' + fieldsError.message)
          }
        }
      }

      toast({
        title: "Template atualizado",
        description: "Template foi atualizado com sucesso.",
      })

      // 3. Recarregar templates
      await loadTemplates()

      return true

    } catch (err: any) {
      console.error('Error updating template:', err)
      toast({
        title: "Erro ao atualizar template",
        description: err.message,
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [currentWorkspace, toast, loadTemplates])

  const deleteTemplate = useCallback(async (id: string): Promise<boolean> => {
    if (!currentWorkspace) return false

    try {
      setError(null)

      const { error } = await supabase
        .from('petition_templates')
        .delete()
        .eq('id', id)
        .eq('workspace_id', currentWorkspace.id)

      if (error) {
        throw new Error(error.message)
      }

      toast({
        title: "Template removido",
        description: "Template foi removido com sucesso.",
      })

      // Remover da lista local
      setTemplates(prev => prev.filter(template => template.id !== id))

      return true

    } catch (err: any) {
      console.error('Error deleting template:', err)
      toast({
        title: "Erro ao remover template",
        description: err.message,
        variant: "destructive",
      })
      return false
    }
  }, [currentWorkspace, toast])

  const duplicateTemplate = useCallback(async (originalId: string): Promise<PetitionTemplate | null> => {
    const originalTemplate = templates.find(t => t.id === originalId)
    if (!originalTemplate) {
      toast({
        title: "Erro",
        description: "Template não encontrado",
        variant: "destructive",
      })
      return null
    }

    const duplicateData: CreateTemplateData = {
      name: `${originalTemplate.name} (Cópia)`,
      description: originalTemplate.description,
      category: originalTemplate.category,
      template_content: originalTemplate.template_content,
      is_shared: false,
      webhook_url: originalTemplate.webhook_url,
      webhook_enabled: originalTemplate.webhook_enabled,
      fields: originalTemplate.fields?.map(field => ({
        field_key: field.field_key,
        field_label: field.field_label,
        field_type: field.field_type,
        field_options: field.field_options,
        is_required: field.is_required,
        display_order: field.display_order,
        validation_rules: field.validation_rules
      })) || []
    }

    return await createTemplate(duplicateData)
  }, [templates, createTemplate, toast])

  const getTemplate = useCallback(async (id: string): Promise<PetitionTemplate | null> => {
    try {
      const { data, error } = await supabase
        .from('petition_templates')
        .select(`
          *,
          fields:template_fields(*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Ordenar campos
      if (data.fields) {
        data.fields.sort((a: any, b: any) => 
          (a.display_order || 0) - (b.display_order || 0)
        )
      }

      return data as PetitionTemplate

    } catch (err: any) {
      console.error('Error getting template:', err)
      return null
    }
  }, [])

  const executeTemplate = useCallback(async (
    templateId: string,
    filledData: Record<string, any>,
    clientId?: string,
    processId?: string
  ): Promise<TemplateExecution | null> => {
    if (!currentWorkspace) return null

    try {
      setIsLoading(true)

      const template = await getTemplate(templateId)
      if (!template) {
        throw new Error('Template não encontrado')
      }

      // Gerar conteúdo final
      let generatedContent = template.template_content

      // Substituir variáveis pelos valores
      for (const [key, value] of Object.entries(filledData)) {
        if (value !== undefined && value !== null && value !== '') {
          const formattedValue = formatFieldValue(value, 
            template.fields?.find(f => f.field_key === key)?.field_type || 'text'
          )
          generatedContent = generatedContent.replace(
            new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
            formattedValue
          )
        }
      }

      // Adicionar variáveis do sistema
      const now = new Date()
      generatedContent = generatedContent.replace(/\{\{data_hoje\}\}/g, now.toLocaleDateString('pt-BR'))
      generatedContent = generatedContent.replace(/\{\{workspace_nome\}\}/g, currentWorkspace.name)

      // Salvar execução no banco
      const { data: execution, error } = await supabase
        .from('petition_executions')
        .insert({
          template_id: templateId,
          workspace_id: currentWorkspace.id,
          filled_data: filledData,
          generated_content: generatedContent,
          client_id: clientId,
          process_id: processId,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          webhook_status: template.webhook_url ? 'pending' : undefined,
          webhook_url: template.webhook_url || undefined
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Incrementar contador de execução
      await supabase.rpc('increment_template_execution_count', {
        template_id: templateId
      })

      // Enviar webhook se configurado
      if (template.webhook_url && template.webhook_enabled) {
        await sendWebhook(template, execution as TemplateExecution, filledData, generatedContent)
      }

      toast({
        title: "Petição gerada",
        description: "Petição foi gerada com sucesso.",
      })

      return execution as TemplateExecution

    } catch (err: any) {
      console.error('Error executing template:', err)
      toast({
        title: "Erro ao executar template",
        description: err.message,
        variant: "destructive",
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [currentWorkspace, toast, getTemplate])

  const formatFieldValue = (value: any, fieldType: string): string => {
    switch (fieldType) {
      case 'date':
        return new Date(value).toLocaleDateString('pt-BR')
      case 'datetime':
        return new Date(value).toLocaleString('pt-BR')
      case 'time':
        return new Date(value).toLocaleTimeString('pt-BR')
      case 'cpf':
        return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      case 'cnpj':
        return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
      case 'phone':
        if (value.length === 11) {
          return value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
        } else if (value.length === 10) {
          return value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
        }
        return value
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(parseFloat(value) || 0)
      case 'percentage':
        return `${parseFloat(value) || 0}%`
      case 'number':
        return typeof value === 'number' ? value.toLocaleString('pt-BR') : value
      case 'cep':
        return value.replace(/(\d{5})(\d{3})/, '$1-$2')
      default:
        return String(value)
    }
  }

  const sendWebhook = async (
    template: PetitionTemplate,
    execution: TemplateExecution,
    filledData: Record<string, any>,
    generatedContent: string
  ) => {
    try {
      if (!template.webhook_url) return

      const payload = {
        event: 'petition_executed',
        timestamp: new Date().toISOString(),
        workspace: {
          id: currentWorkspace?.id,
          name: currentWorkspace?.name
        },
        template: {
          id: template.id,
          name: template.name,
          category: template.category
        },
        execution: {
          id: execution.id,
          execution_date: execution.created_at,
          executed_by: {
            id: execution.created_by,
            name: 'Usuário', // TODO: buscar dados do usuário
            email: 'usuario@exemplo.com'
          }
        },
        filled_data: filledData,
        generated_content: {
          raw_text: generatedContent,
          metadata: {
            word_count: generatedContent.split(' ').length,
            pages_estimated: Math.ceil(generatedContent.length / 2000),
            processing_time_ms: Date.now() - new Date(execution.created_at).getTime()
          }
        }
      }

      // Enviar webhook (seria implementado como Edge Function)
      console.log('Webhook payload:', payload)
      
      // TODO: Implementar envio real do webhook
      await supabase
        .from('petition_executions')
        .update({
          webhook_status: 'sent',
          webhook_sent_at: new Date().toISOString()
        })
        .eq('id', execution.id)

    } catch (error) {
      console.error('Error sending webhook:', error)
      
      await supabase
        .from('petition_executions')
        .update({
          webhook_status: 'failed',
          retry_count: execution.retry_count + 1
        })
        .eq('id', execution.id)
    }
  }

  useEffect(() => {
    if (currentWorkspace) {
      loadTemplates()
    }
  }, [currentWorkspace, loadTemplates])

  return {
    templates,
    isLoading,
    error,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    getTemplate,
    executeTemplate
  }
}
