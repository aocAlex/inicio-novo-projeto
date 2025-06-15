import React, { useState, useEffect } from 'react';
import { useAdvancedTemplates } from '@/hooks/useAdvancedTemplates';
import { useToast } from '@/hooks/use-toast';
import { useSimplifiedPermissions } from '@/hooks/useSimplifiedPermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Play,
  FileText,
  Filter
} from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'Todas as Categorias', color: 'bg-gray-100 text-gray-800' },
  { value: 'civil', label: 'Civil', color: 'bg-blue-100 text-blue-800' },
  { value: 'criminal', label: 'Criminal', color: 'bg-red-100 text-red-800' },
  { value: 'trabalhista', label: 'Trabalhista', color: 'bg-green-100 text-green-800' },
  { value: 'tributario', label: 'Tributário', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'empresarial', label: 'Empresarial', color: 'bg-purple-100 text-purple-800' },
  { value: 'familia', label: 'Família', color: 'bg-pink-100 text-pink-800' }
];

export const AdvancedTemplatesList = () => {
  const navigate = useNavigate();
  const { 
    templates, 
    isLoading, 
    error, 
    loadTemplates, 
    deleteTemplate, 
    duplicateTemplate 
  } = useAdvancedTemplates();
  
  const { can } = useSimplifiedPermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [executingTemplate, setExecutingTemplate] = useState<any>(null);
  const [previewingTemplate, setPreviewingTemplate] = useState<any>(null);

  useEffect(() => {
    loadTemplates({ 
      search: searchTerm || undefined,
      category: selectedCategory === 'all' ? undefined : selectedCategory
    });
  }, [loadTemplates, searchTerm, selectedCategory]);

  const handleDeleteTemplate = async (template: any) => {
    if (window.confirm(`Tem certeza que deseja excluir o template "${template.name}"?\n\nEsta ação não pode ser desfeita.`)) {
      try {
        await deleteTemplate(template.id);
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const handleDuplicateTemplate = async (template: any) => {
    try {
      await duplicateTemplate(template.id);
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  const getCategoryData = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[0];
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatsForCategory = (category: string) => {
    if (category === 'all') return templates.length;
    return templates.filter(t => t.category === category).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates Avançados</h1>
          <p className="text-gray-600">Sistema completo de criação e execução de petições</p>
        </div>
        
        {can.createTemplate && (
          <Button onClick={() => navigate('/templates/new')} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Novo Template Avançado
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {CATEGORIES.map(category => (
          <Card 
            key={category.value}
            className={`cursor-pointer transition-all ${
              selectedCategory === category.value ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedCategory(category.value)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{category.label}</p>
                  <p className="text-2xl font-bold">{getStatsForCategory(category.value)}</p>
                </div>
                <div className={`h-3 w-3 rounded-full ${category.color.split(' ')[0]}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar templates por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Additional Filters */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${category.color.split(' ')[0]}`} />
                      {category.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Carregando templates...</p>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-600 mb-4">❌ Erro ao carregar</div>
            <p className="text-gray-600">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => loadTemplates()} 
              className="mt-4"
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhum template encontrado' : 'Comece criando templates'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Tente ajustar sua busca ou criar um novo template'
                : 'Templates avançados permitem criar petições dinâmicas com campos configuráveis'
              }
            </p>
            {can.createTemplate && (
              <Button onClick={() => navigate('/templates/new')} size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const categoryData = getCategoryData(template.category);
            
            return (
              <Card key={template.id} className="hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{template.name}</CardTitle>
                      {template.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setExecutingTemplate(template)}>
                          <Play className="mr-2 h-4 w-4" />
                          Executar
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => setPreviewingTemplate(template)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        
                        {can.updateTemplate && (
                          <DropdownMenuItem onClick={() => navigate(`/templates/edit/${template.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        {can.deleteTemplate && (
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTemplate(template)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Category and Shared Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={categoryData.color}>
                        {categoryData.label}
                      </Badge>
                      
                      {template.is_shared && (
                        <Badge variant="outline">
                          <Share2 className="mr-1 h-3 w-3" />
                          Compartilhado
                        </Badge>
                      )}
                      
                      {template.fields && template.fields.length > 0 && (
                        <Badge variant="secondary">
                          <Settings className="mr-1 h-3 w-3" />
                          {template.fields.length} campos
                        </Badge>
                      )}
                    </div>
                    
                    {/* Statistics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-semibold text-gray-900">
                          {template.fields?.length || 0}
                        </div>
                        <div className="text-gray-600">Campos</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-semibold text-gray-900">
                          {template.execution_count}
                        </div>
                        <div className="text-gray-600">Execuções</div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        onClick={() => setExecutingTemplate(template)}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Executar
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={() => setPreviewingTemplate(template)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {can.updateTemplate && (
                        <Button 
                          variant="outline"
                          onClick={() => navigate(`/templates/edit/${template.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {executingTemplate && (
        <AdvancedTemplateExecutor 
          isOpen={!!executingTemplate}
          template={executingTemplate}
          onClose={() => setExecutingTemplate(null)}
          onSuccess={() => {
            setExecutingTemplate(null);
            loadTemplates(); // Refresh to update execution count
          }}
        />
      )}

      {/* Preview Modal */}
      {previewingTemplate && (
        <Dialog open={!!previewingTemplate} onOpenChange={() => setPreviewingTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Preview: {previewingTemplate.name}</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto">
              <div className="p-4 bg-gray-50 rounded">
                <h4 className="font-medium mb-2">Conteúdo do Template:</h4>
                <pre className="whitespace-pre-wrap text-sm">{previewingTemplate.template_content}</pre>
              </div>
              {previewingTemplate.fields && previewingTemplate.fields.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Campos Configurados ({previewingTemplate.fields.length}):</h4>
                  <div className="space-y-2">
                    {previewingTemplate.fields.map((field: any) => (
                      <div key={field.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Badge variant="outline">{field.field_type}</Badge>
                        <span className="font-medium">{field.field_label}</span>
                        <span className="text-gray-600">({field.field_key})</span>
                        {field.is_required && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
