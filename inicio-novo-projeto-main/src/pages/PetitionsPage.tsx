
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePetitions } from '@/hooks/usePetitions';
import { useAdvancedTemplates } from '@/hooks/useAdvancedTemplates';
import { PetitionList } from '@/components/petitions/PetitionList';
import { AdvancedTemplateExecutor } from '@/components/templates/AdvancedTemplateExecutor';
import { 
  Search, 
  FileText,
  Play,
  Plus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CATEGORIES = [
  { value: 'all', label: 'Todas as Categorias', color: 'bg-gray-100 text-gray-800' },
  { value: 'civil', label: 'Civil', color: 'bg-blue-100 text-blue-800' },
  { value: 'criminal', label: 'Criminal', color: 'bg-red-100 text-red-800' },
  { value: 'trabalhista', label: 'Trabalhista', color: 'bg-green-100 text-green-800' },
  { value: 'tributario', label: 'Tributário', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'empresarial', label: 'Empresarial', color: 'bg-purple-100 text-purple-800' },
  { value: 'familia', label: 'Família', color: 'bg-pink-100 text-pink-800' }
];

export const PetitionsPage = () => {
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [templateFilters, setTemplateFilters] = useState({ search: '', category: 'all' });
  const [executingTemplate, setExecutingTemplate] = useState<any>(null);

  const {
    executions,
    isLoading,
    error,
    loadExecutions,
    retryWebhook,
    deleteExecution,
  } = usePetitions();

  const {
    templates,
    isLoading: templatesLoading,
    error: templatesError,
    loadTemplates,
  } = useAdvancedTemplates();

  const handleSearch = (search: string) => {
    const newFilters = { ...filters, search };
    setFilters(newFilters);
    loadExecutions(newFilters);
  };

  const handleStatusFilter = (status: string) => {
    const newFilters = { 
      ...filters, 
      status: status === 'all' ? '' : status 
    };
    setFilters(newFilters);
    loadExecutions(newFilters);
  };

  const handleTemplateSearch = (search: string) => {
    const newFilters = { ...templateFilters, search };
    setTemplateFilters(newFilters);
    loadTemplates({ 
      search: search || undefined,
      category: newFilters.category === 'all' ? undefined : newFilters.category
    });
  };

  const handleTemplateCategoryFilter = (category: string) => {
    const newFilters = { 
      ...templateFilters, 
      category 
    };
    setTemplateFilters(newFilters);
    loadTemplates({ 
      search: newFilters.search || undefined,
      category: category === 'all' ? undefined : category
    });
  };

  const getCategoryData = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[0];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Petições</h1>
          <p className="text-gray-600">
            Crie novas petições a partir de templates ou visualize execuções anteriores
          </p>
        </div>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Templates Disponíveis</TabsTrigger>
          <TabsTrigger value="executions">Petições Executadas</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* Filtros para Templates */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar templates..."
                      className="pl-10"
                      value={templateFilters.search}
                      onChange={(e) => handleTemplateSearch(e.target.value)}
                    />
                  </div>
                </div>
                <Select 
                  value={templateFilters.category} 
                  onValueChange={handleTemplateCategoryFilter}
                >
                  <SelectTrigger className="w-48">
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

          {/* Lista de Templates */}
          {templatesLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Carregando templates...</p>
            </div>
          ) : templatesError ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-red-600 mb-4">❌ Erro ao carregar templates</div>
                <p className="text-gray-600">{templatesError}</p>
                <Button 
                  variant="outline" 
                  onClick={() => loadTemplates()} 
                  className="mt-4"
                >
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum template encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  Crie templates primeiro para poder gerar petições a partir deles
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => {
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
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {/* Category and Fields */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={categoryData.color}>
                            {categoryData.label}
                          </Badge>
                          
                          {template.fields && template.fields.length > 0 && (
                            <Badge variant="secondary">
                              {template.fields.length} campos
                            </Badge>
                          )}
                        </div>
                        
                        {/* Template Preview */}
                        {template.template_content && (
                          <div className="p-3 bg-gray-50 rounded text-xs">
                            <p className="font-medium mb-1">Preview:</p>
                            <p className="text-gray-600 line-clamp-3">
                              {template.template_content.substring(0, 150)}...
                            </p>
                          </div>
                        )}

                        {/* Fields Summary */}
                        {template.fields && template.fields.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Campos configurados:</p>
                            <div className="space-y-1">
                              {template.fields.slice(0, 3).map((field: any) => (
                                <div key={field.id} className="flex items-center gap-2 text-xs">
                                  <Badge variant="outline" className="text-xs">
                                    {field.field_type}
                                  </Badge>
                                  <span className="text-gray-600">{field.field_label}</span>
                                  {field.is_required && (
                                    <span className="text-red-500">*</span>
                                  )}
                                </div>
                              ))}
                              {template.fields.length > 3 && (
                                <p className="text-xs text-gray-500">
                                  +{template.fields.length - 3} campos adicionais
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        
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
                        
                        {/* Action Button */}
                        <Button 
                          className="w-full" 
                          onClick={() => setExecutingTemplate(template)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Gerar Petição
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          {/* Filtros para Execuções */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por template, processo ou cliente..."
                      className="pl-10"
                      value={filters.search}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                </div>
                <Select onValueChange={handleStatusFilter} defaultValue="all">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="sent">Enviada</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="failed">Falhada</SelectItem>
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
                  onClick={() => loadExecutions(filters)}
                  className="mt-2"
                >
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Lista de Petições */}
          <PetitionList
            executions={executions}
            isLoading={isLoading}
            onRetry={retryWebhook}
            onDelete={deleteExecution}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Execução */}
      {executingTemplate && (
        <AdvancedTemplateExecutor 
          isOpen={!!executingTemplate}
          template={executingTemplate}
          onClose={() => setExecutingTemplate(null)}
          onSuccess={() => {
            setExecutingTemplate(null);
            // Recarregar templates para atualizar contador de execuções
            loadTemplates({
              search: templateFilters.search || undefined,
              category: templateFilters.category === 'all' ? undefined : templateFilters.category
            });
          }}
        />
      )}
    </div>
  );
};
