
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTemplates, Template } from '@/hooks/useTemplates';
import { TemplateList } from '@/components/templates/TemplateList';
import { CreateTemplateModal } from '@/components/templates/CreateTemplateModal';
import { ExecuteModal } from '@/components/petitions/ExecuteModal';
import { usePetitions } from '@/hooks/usePetitions';
import { 
  Plus, 
  Search, 
  FileText
} from 'lucide-react';

export const TemplatesPage = () => {
  const [filters, setFilters] = useState({ search: '', category: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [executingTemplate, setExecutingTemplate] = useState<Template | null>(null);

  const {
    templates,
    isLoading,
    error,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  } = useTemplates();

  const { createExecution } = usePetitions();

  const handleSearch = (search: string) => {
    const newFilters = { ...filters, search };
    setFilters(newFilters);
    loadTemplates(newFilters);
  };

  const handleCategoryFilter = (category: string) => {
    const newFilters = { 
      ...filters, 
      category: category === 'all' ? '' : category 
    };
    setFilters(newFilters);
    loadTemplates(newFilters);
  };

  const handleCreateTemplate = async (data: any) => {
    const result = await createTemplate(data);
    if (result) {
      setShowCreateModal(false);
    }
    return result;
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
  };

  const handleUpdateTemplate = async (data: any) => {
    if (!editingTemplate) return null;
    
    const success = await updateTemplate(editingTemplate.id, data);
    if (success) {
      setEditingTemplate(null);
    }
    return success ? editingTemplate : null;
  };

  const handleExecuteTemplate = (template: Template) => {
    setExecutingTemplate(template);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
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
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar templates..."
                  className="pl-10"
                  value={filters.search}
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
                <SelectItem value="familia">Família</SelectItem>
                <SelectItem value="empresarial">Empresarial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
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
      <TemplateList
        templates={templates}
        isLoading={isLoading}
        onEdit={handleEditTemplate}
        onDelete={deleteTemplate}
        onExecute={handleExecuteTemplate}
      />

      {/* Modals */}
      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTemplate}
      />

      <CreateTemplateModal
        isOpen={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        onSubmit={handleUpdateTemplate}
        editingTemplate={editingTemplate || undefined}
      />

      <ExecuteModal
        isOpen={!!executingTemplate}
        onClose={() => setExecutingTemplate(null)}
        onSubmit={createExecution}
        template={executingTemplate}
      />
    </div>
  );
};
