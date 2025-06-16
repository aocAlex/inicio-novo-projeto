
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePetitionTemplates } from '@/hooks/usePetitionTemplates';
import { PetitionFilters } from '@/types/petition';
import { 
  Plus, 
  Search, 
  FileText, 
  Eye, 
  Edit, 
  Trash2, 
  Share2,
  Play
} from 'lucide-react';
import { TemplateModal } from '@/components/templates/TemplateModal';
import { ExecuteTemplateModal } from '@/components/templates/ExecuteTemplateModal';

export const Templates = () => {
  const [filters, setFilters] = useState<PetitionFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [executingTemplate, setExecutingTemplate] = useState<string | null>(null);

  const {
    templates,
    isLoading,
    error,
    loadTemplates,
    deleteTemplate,
  } = usePetitionTemplates();

  const handleSearch = (search: string) => {
    const newFilters = { ...filters, search: search || undefined };
    setFilters(newFilters);
    loadTemplates(newFilters);
  };

  const handleCategoryFilter = (category: string) => {
    const newFilters = { 
      ...filters, 
      category: category === 'all' ? undefined : category 
    };
    setFilters(newFilters);
    loadTemplates(newFilters);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este template?')) {
      await deleteTemplate(id);
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'civil': return 'default';
      case 'criminal': return 'destructive';
      case 'trabalhista': return 'secondary';
      case 'tributario': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Templates de Petição</h1>
            <p className="text-gray-600">
              Gerencie seus modelos de documentos jurídicos
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar templates..."
                    className="pl-10"
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </div>
              <Select onValueChange={handleCategoryFilter} defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="civil">Civil</SelectItem>
                  <SelectItem value="criminal">Criminal</SelectItem>
                  <SelectItem value="trabalhista">Trabalhista</SelectItem>
                  <SelectItem value="tributario">Tributário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading e Error States */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando templates...</p>
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-600">Erro: {error}</p>
              <Button
                variant="outline"
                onClick={() => loadTemplates(filters)}
                className="mt-2"
              >
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lista de Templates */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
            {templates.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-6 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Nenhum template encontrado
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {template.description || 'Sem descrição'}
                        </CardDescription>
                      </div>
                      {template.is_shared && (
                        <Share2 className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getCategoryBadgeVariant(template.category)}>
                        {template.category}
                      </Badge>
                      <Badge variant="outline">
                        {template.execution_count} execuções
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExecutingTemplate(template.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Executar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTemplate(template.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Modals */}
        <TemplateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadTemplates(filters);
          }}
        />

        <TemplateModal
          isOpen={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          templateId={editingTemplate || undefined}
          onSuccess={() => {
            setEditingTemplate(null);
            loadTemplates(filters);
          }}
        />

        <ExecuteTemplateModal
          isOpen={!!executingTemplate}
          onClose={() => setExecutingTemplate(null)}
          templateId={executingTemplate || undefined}
          onSuccess={() => {
            setExecutingTemplate(null);
          }}
        />
      </div>
    </div>
  );
};
