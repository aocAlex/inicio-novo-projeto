
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClientFilters as IClientFilters } from '@/types/client';
import { Search, Filter, X } from 'lucide-react';

interface ClientFiltersProps {
  filters: IClientFilters;
  onFiltersChange: (filters: IClientFilters) => void;
  availableTags: string[];
}

export const ClientFilters = ({ filters, onFiltersChange, availableTags }: ClientFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof IClientFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof IClientFilters] !== undefined && 
    filters[key as keyof IClientFilters] !== ''
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filtros</CardTitle>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showAdvanced ? 'Menos' : 'Mais'} Filtros
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Basic Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, email ou documento..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => 
                handleFilterChange('status', value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Type Filter */}
            <Select
              value={filters.client_type || 'all'}
              onValueChange={(value) => 
                handleFilterChange('client_type', value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="individual">Pessoa Física</SelectItem>
                <SelectItem value="company">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              {/* Lead Score Range */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Lead Score Mínimo
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={filters.lead_score_min || ''}
                  onChange={(e) => handleFilterChange('lead_score_min', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Lead Score Máximo
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="100"
                  value={filters.lead_score_max || ''}
                  onChange={(e) => handleFilterChange('lead_score_max', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
              
              {/* Date Range */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Criado Após
                </label>
                <Input
                  type="date"
                  value={filters.created_after || ''}
                  onChange={(e) => handleFilterChange('created_after', e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Criado Antes
                </label>
                <Input
                  type="date"
                  value={filters.created_before || ''}
                  onChange={(e) => handleFilterChange('created_before', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
