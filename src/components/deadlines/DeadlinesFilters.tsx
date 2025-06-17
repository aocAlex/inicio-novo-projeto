
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { DeadlineFilters } from '@/types/deadline';

interface DeadlinesFiltersProps {
  filters: DeadlineFilters;
  onFiltersChange: (filters: DeadlineFilters) => void;
  onClearFilters: () => void;
}

export const DeadlinesFilters: React.FC<DeadlinesFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const handleFilterChange = (key: keyof DeadlineFilters, value: string) => {
    // Convert special "all" values back to undefined
    const actualValue = value === 'all' ? undefined : value;
    onFiltersChange({
      ...filters,
      [key]: actualValue
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value);

  return (
    <div className="space-y-6"> {/* Adjusted space-y */}
      <div className="flex flex-wrap gap-4 sm:gap-6"> {/* Applied responsive gap classes */}
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Buscar por título ou descrição..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PENDENTE">Pendente</SelectItem>
            <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
            <SelectItem value="CUMPRIDO">Cumprido</SelectItem>
            <SelectItem value="PERDIDO">Perdido</SelectItem>
            <SelectItem value="SUSPENSO">Suspenso</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.priority || 'all'}
          onValueChange={(value) => handleFilterChange('priority', value)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="CRITICAL">Crítica</SelectItem>
            <SelectItem value="HIGH">Alta</SelectItem>
            <SelectItem value="MEDIUM">Média</SelectItem>
            <SelectItem value="LOW">Baixa</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.deadline_type || 'all'}
          onValueChange={(value) => handleFilterChange('deadline_type', value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="processual">Processual</SelectItem>
            <SelectItem value="administrativo">Administrativo</SelectItem>
            <SelectItem value="contratual">Contratual</SelectItem>
            <SelectItem value="fiscal">Fiscal</SelectItem>
            <SelectItem value="personalizado">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
};
