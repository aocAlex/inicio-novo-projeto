
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';
import { ProcessFilters as FilterTypes } from '@/types/process';

interface ProcessFiltersProps {
  onFilter: (filters: FilterTypes) => void;
  onClear: () => void;
}

export const ProcessFilters = ({ onFilter, onClear }: ProcessFiltersProps) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [priority, setPriority] = useState<string>('all');
  const [court, setCourt] = useState('');

  const handleFilter = () => {
    const filters: FilterTypes = {};
    
    if (search.trim()) filters.search = search.trim();
    if (status && status !== 'all') filters.status = status as any;
    if (priority && priority !== 'all') filters.priority = priority as any;
    if (court.trim()) filters.court = court.trim();
    
    onFilter(filters);
  };

  const handleClear = () => {
    setSearch('');
    setStatus('all');
    setPriority('all');
    setCourt('');
    onClear();
  };

  const hasFilters = search || (status && status !== 'all') || (priority && priority !== 'all') || court;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por título ou número..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
              />
            </div>
          </div>

          {/* Status */}
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="suspended">Suspenso</SelectItem>
              <SelectItem value="archived">Arquivado</SelectItem>
            </SelectContent>
          </Select>

          {/* Prioridade */}
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as prioridades</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tribunal */}
        <div className="mt-4">
          <Input
            placeholder="Filtrar por tribunal..."
            value={court}
            onChange={(e) => setCourt(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
          />
        </div>

        {/* Botões */}
        <div className="flex gap-2 mt-4">
          <Button onClick={handleFilter} className="flex-1">
            <Filter className="h-4 w-4 mr-2" />
            Aplicar Filtros
          </Button>
          {hasFilters && (
            <Button onClick={handleClear} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
