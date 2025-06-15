
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
import { usePetitions } from '@/hooks/usePetitions';
import { PetitionList } from '@/components/petitions/PetitionList';
import { 
  Search, 
  FileText
} from 'lucide-react';

export const PetitionsPage = () => {
  const [filters, setFilters] = useState({ search: '', status: '' });

  const {
    executions,
    isLoading,
    error,
    loadExecutions,
    retryWebhook,
    deleteExecution,
  } = usePetitions();

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Petições Executadas</h1>
          <p className="text-gray-600">
            Histórico de execuções de templates
          </p>
        </div>
      </div>

      {/* Filtros */}
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
    </div>
  );
};
