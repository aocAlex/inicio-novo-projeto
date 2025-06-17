
import { useState, useEffect } from 'react'
import { useAdvancedTemplates } from '@/hooks/useAdvancedTemplates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Play,
  Share2
} from 'lucide-react'
import { AdvancedTemplateEditor } from './AdvancedTemplateEditor'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { PetitionTemplate, PetitionFilters } from '@/types/petition'

const CATEGORIES = [
  { value: 'all', label: 'Todas as Categorias' },
  { value: 'civil', label: 'Civil' },
  { value: 'criminal', label: 'Criminal' },
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'tributario', label: 'Tributário' },
  { value: 'empresarial', label: 'Empresarial' },
  { value: 'familia', label: 'Família' }
]

export const AdvancedTemplatesList = () => {
  const { 
    templates, 
    isLoading, 
    loadTemplates, 
    deleteTemplate 
  } = useAdvancedTemplates()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState<PetitionTemplate | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<PetitionTemplate | null>(null)

  // Filtros aplicados
  const filters: PetitionFilters = {
    search: searchTerm || undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
  }

  useEffect(() => {
    loadTemplates(filters)
  }, [searchTerm, selectedCategory])

  const handleCreateNew = () => {
    setSelectedTemplate(null)
    setIsEditorOpen(true)
  }

  const handleEdit = (template: PetitionTemplate) => {
    setSelectedTemplate(template)
    setIsEditorOpen(true)
  }

  const handleDelete = async (template: PetitionTemplate) => {
    setTemplateToDelete(template)
  }

  const confirmDelete = async () => {
    if (templateToDelete) {
      await deleteTemplate(templateToDelete.id)
      setTemplateToDelete(null)
    }
  }

  const getCategoryLabel = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category)
    return cat?.label || category
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      civil: 'bg-blue-100 text-blue-800',
      criminal: 'bg-red-100 text-red-800',
      trabalhista: 'bg-green-100 text-green-800',
      tributario: 'bg-yellow-100 text-yellow-800',
      empresarial: 'bg-purple-100 text-purple-800',
      familia: 'bg-pink-100 text-pink-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header e Filtros */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates Avançados</h1>
          <p className="text-gray-600">Gerencie seus templates de petições com campos personalizados</p>
        </div>
        
        <Button onClick={handleCreateNew} className="lg:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Templates */}
      {templates.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum template encontrado</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Tente ajustar os filtros ou criar um novo template.'
              : 'Comece criando seu primeiro template de petição.'
            }
          </p>
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold truncate">
                      {template.name}
                    </CardTitle>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(template)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(template)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Categoria e Status */}
                  <div className="flex items-center justify-between">
                    <Badge className={getCategoryColor(template.category)}>
                      {getCategoryLabel(template.category)}
                    </Badge>
                    
                    {template.is_shared && (
                      <Badge variant="outline" className="text-xs">
                        <Share2 className="mr-1 h-3 w-3" />
                        Compartilhado
                      </Badge>
                    )}
                  </div>

                  {/* Estatísticas */}
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Execuções:</span>
                      <span className="font-medium">{template.execution_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Campos:</span>
                      <span className="font-medium">0</span>
                    </div>
                  </div>

                  {/* Webhook Status */}
                  {template.webhook_enabled && (
                    <div className="flex items-center text-xs text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Webhook ativo
                    </div>
                  )}

                  {/* Data de criação */}
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Criado em {new Date(template.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Edição */}
      <AdvancedTemplateEditor
        isOpen={isEditorOpen}
        template={selectedTemplate || undefined}
        onClose={() => {
          setIsEditorOpen(false)
          setSelectedTemplate(null)
        }}
        onSuccess={() => {
          setIsEditorOpen(false)
          setSelectedTemplate(null)
          loadTemplates(filters)
        }}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{templateToDelete?.name}"? 
              Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
