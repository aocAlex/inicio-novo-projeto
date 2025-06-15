
import { useState, useEffect, useCallback } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { 
  PetitionTemplate, 
  CreateTemplateData, 
  UpdateTemplateData,
  PetitionFilters,
  PetitionExecution 
} from '@/types/petition'

export const useAdvancedTemplates = () => {
  const { currentWorkspace } = useWorkspace()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<PetitionTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTemplates = useCallback(async (filters?: PetitionFilters) => {
    if (!currentWorkspace) return

    try {
      setIsLoading(true)
      setError(null)

      let query = supabase
        .from('petition_templates')
        .select('*')
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

      setTemplates((data || []).map(template => ({
        ...template,
        category: template.category as 'civil' | 'criminal' | 'trabalhista' | 'tributario' | 'empresarial' | 'familia'
      })))

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

      // Create fields if provided
      if (data.fields && data.fields.length > 0) {
        const fieldsToInsert = data.fields.map((field, index) => ({
          template_id: templateData.id,
          field_key: field.field_key,
          field_title: field.field_title,
          field_type: field.field_type,
          field_options: field.field_options || {},
          is_required: field.is_required || false,
          display_order: field.display_order || index,
          validation_rules: field.validation_rules || {},
          field_description: ''
        }))

        const { error: fieldsError } = await supabase
          .from('template_fields')
          .insert(fieldsToInsert)

        if (fieldsError) {
          console.error('Error creating fields:', fieldsError)
        }
      }

      toast({
        title: "Template criado",
        description: `${templateData.name} foi criado com sucesso.`,
      })

      await loadTemplates()

      return {
        ...templateData,
        category: templateData.category as 'civil' | 'criminal' | 'trabalhista' | 'tributario' | 'empresarial' | 'familia'
      }

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

      // Update fields if provided
      if (data.fields) {
        // Delete existing fields
        await supabase
          .from('template_fields')
          .delete()
          .eq('template_id', id)

        // Insert new fields
        if (data.fields.length > 0) {
          const fieldsToInsert = data.fields.map((field, index) => ({
            template_id: id,
            field_key: field.field_key,
            field_title: field.field_title,
            field_type: field.field_type,
            field_options: field.field_options || {},
            is_required: field.is_required || false,
            display_order: field.display_order || index,
            validation_rules: field.validation_rules || {},
            field_description: ''
          }))

          const { error: fieldsError } = await supabase
            .from('template_fields')
            .insert(fieldsToInsert)

          if (fieldsError) {
            console.error('Error updating fields:', fieldsError)
          }
        }
      }

      toast({
        title: "Template atualizado",
        description: "Template foi atualizado com sucesso.",
      })

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

      return {
        ...data,
        category: data.category as 'civil' | 'criminal' | 'trabalhista' | 'tributario' | 'empresarial' | 'familia',
        fields: data.fields || []
      }

    } catch (err: any) {
      console.error('Error getting template:', err)
      return null
    }
  }, [])

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
    getTemplate
  }
}
