
import { useState } from 'react';
import { Process, ProcessFilters } from '@/types/process';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, MoreHorizontal, Plus, FileText, AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProcessListProps {
  processes: Process[];
  isLoading: boolean;
  onFilter: (filters: ProcessFilters) => void;
  onEdit: (process: Process) => void;
  onDelete: (process: Process) => void;
  onCreateNew: () => void;
}

export const ProcessList = ({
  processes,
  isLoading,
  onFilter,
  onEdit,
  onDelete,
  onCreateNew,
}: ProcessListProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Process['status'] | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<Process['priority'] | ''>('');

  const handleSearch = (value: string) => {
    setSearch(value);
    onFilter({
      search: value || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
    });
  };

  const handleStatusFilter = (value: string) => {
    const statusValue = value as Process['status'] | '';
    setStatusFilter(statusValue);
    onFilter({
      search: search || undefined,
      status: statusValue || undefined,
      priority: priorityFilter || undefined,
    });
  };

  const handlePriorityFilter = (value: string) => {
    const priorityValue = value as Process['priority'] | '';
    setPriorityFilter(priorityValue);
    onFilter({
      search: search || undefined,
      status: statusFilter || undefined,
      priority: priorityValue || undefined,
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      case 'archived':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'outline';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-3 w-3" />;
      case 'high':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    return format(new Date(deadline), 'dd/MM/yyyy', { locale: ptBR });
  };

  const isDeadlineNear = (deadline: string | null) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando processos...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Processos</h1>
          <p className="text-gray-600">Gerencie seus processos jurídicos</p>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Processo
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por título ou número..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={handlePriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as prioridades</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Processos */}
      <Card>
        <CardContent className="p-0">
          {processes.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhum processo encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece criando seu primeiro processo.
              </p>
              <div className="mt-6">
                <Button onClick={onCreateNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Processo
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Processo</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Tribunal</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processes.map((process) => (
                  <TableRow key={process.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{process.title}</div>
                          {process.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {process.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{process.process_number}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(process.status)}>
                        {process.status === 'active' ? 'Ativo' :
                         process.status === 'pending' ? 'Pendente' :
                         process.status === 'suspended' ? 'Suspenso' :
                         process.status === 'archived' ? 'Arquivado' : process.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getPriorityBadgeVariant(process.priority)}
                        className="flex items-center gap-1 w-fit"
                      >
                        {getPriorityIcon(process.priority)}
                        {process.priority === 'urgent' ? 'Urgente' :
                         process.priority === 'high' ? 'Alta' :
                         process.priority === 'medium' ? 'Média' :
                         process.priority === 'low' ? 'Baixa' : process.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {process.court || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {process.deadline_date ? (
                        <div className={`flex items-center gap-1 ${isDeadlineNear(process.deadline_date) ? 'text-red-600' : ''}`}>
                          {isDeadlineNear(process.deadline_date) && <Clock className="h-3 w-3" />}
                          <span className="text-sm">{formatDeadline(process.deadline_date)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {format(new Date(process.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(process)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(process)}
                            className="text-red-600"
                          >
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
