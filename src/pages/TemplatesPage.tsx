
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTemplates, Template } from '@/hooks/useTemplates';
import { useContractTemplates } from '@/hooks/useContractTemplates';
import { TemplateList } from '@/components/templates/TemplateList';
import { ContractTemplatesList } from '@/components/contracts/ContractTemplatesList';
import { ExecuteModal } from '@/components/petitions/ExecuteModal';
import { ContractTemplateModal } from '@/components/contracts/ContractTemplateModal';
import { usePetitions } from '@/hooks/usePetitions';
import { 
  Plus, 
  Search, 
  FileText,
  File
} from 'lucide-react';

export const TemplatesPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: '', category: '' });
  const [executingTemplate, setExecutingTemplate] = useState<Template | null>(null);
  const [showContractTemplateModal, setShowContractTemplateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('petition');

  const {
    templates,
    isLoading: isPetitionLoading,
    error: petitionError,
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

  const handleEditTemplate = (template: Template) => {
    navigate(`/templates/edit/${template.id}`);
  };

  const handleExecuteTemplate = (template: Template) => {
    setExecutingTemplate(template);
  };

  const handleCreatePetitionTemplate = () => {
    navigate('/templates/new');
  };

  const handleCreateContractTemplate = () => {
    setShowContractTemplateModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
            <p className="text-gray-600">
              Gerencie seus modelos de documentos jurídicos e contratos
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="petition" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates de Petição
            </TabsTrigger>
            <TabsTrigger value="contract" className="flex items-center gap-2">
              <File className="h-4 w-4" />
              Templates de Contrato
            </TabsTrigger>
          </TabsList>

          <TabsContent value="petition" className="space-y-6">
            {/* Header for Petition Templates */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <div>
                <h3 className="text-lg font-semibold">Templates de Petição</h3>
                <p className="text-sm text-gray-600">
                  Modelos de documentos jurídicos com campos personalizados
                </p>
              </div>
              <Button onClick={handleCreatePetitionTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Template de Petição
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
            {petitionError && (
              <Card className="mb-6">
                <CardContent className="p-4 sm:p-6 text-center">
                  <p className="text-red-600">Erro: {petitionError}</p>
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

            {/* Lista de Templates de Petição */}
            <TemplateList
              templates={templates}
              isLoading={isPetitionLoading}
              onEdit={handleEditTemplate}
              onDelete={deleteTemplate}
              onExecute={handleExecuteTemplate}
            />
          </TabsContent>

          <TabsContent value="contract" className="space-y-6">
            {/* Header for Contract Templates */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <div>
                <h3 className="text-lg font-semibold">Templates de Contrato</h3>
                <p className="text-sm text-gray-600">
                  Templates pré-configurados para agilizar a criação de contratos
                </p>
              </div>
              <Button onClick={handleCreateContractTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Template de Contrato
              </Button>
            </div>

            <ContractTemplatesList />
          </TabsContent>
        </Tabs>

        {/* Execute Modal */}
        <ExecuteModal
          isOpen={!!executingTemplate}
          onClose={() => setExecutingTemplate(null)}
          onSubmit={createExecution}
          template={executingTemplate}
        />

        {/* Contract Template Modal */}
        <ContractTemplateModal
          open={showContractTemplateModal}
          onClose={() => setShowContractTemplateModal(false)}
        />
      </div>
    </div>
  );
};
