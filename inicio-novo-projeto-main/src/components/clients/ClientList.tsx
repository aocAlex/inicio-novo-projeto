import { useState } from 'react';
import { Client, ClientFilters } from '@/types/client';
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
import { Search, Filter, MoreHorizontal, Plus, User, Building, Phone, Mail } from 'lucide-react';

interface ClientListProps {
  clients: Client[];
  isLoading: boolean;
  onFilter: (filters: ClientFilters) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onCreateNew: () => void;
}

export const ClientList = ({
  clients,
  isLoading,
  onFilter,
  onEdit,
  onDelete,
  onCreateNew,
}: ClientListProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Client['status'] | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<Client['client_type'] | 'all'>('all');

  const handleSearch = (value: string) => {
    setSearch(value);
    onFilter({
      search: value || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      client_type: typeFilter === 'all' ? undefined : typeFilter,
    });
  };

  const handleStatusFilter = (value: string) => {
    const statusValue = value as Client['status'] | 'all';
    setStatusFilter(statusValue);
    onFilter({
      search: search || undefined,
      status: statusValue === 'all' ? undefined : statusValue,
      client_type: typeFilter === 'all' ? undefined : typeFilter,
    });
  };

  const handleTypeFilter = (value: string) => {
    const typeValue = value as Client['client_type'] | 'all';
    setTypeFilter(typeValue);
    onFilter({
      search: search || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      client_type: typeValue === 'all' ? undefined : typeValue,
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'lead':
        return 'secondary';
      case 'prospect':
        return 'outline';
      case 'inactive':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'lead':
        return 'Lead';
      case 'prospect':
        return 'Prospect';
      case 'inactive':
        return 'Inativo';
      case 'archived':
        return 'Arquivado';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando clientes...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gerencie seus clientes e prospects</p>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
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
                  placeholder="Buscar por nome..."
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
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={handleTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="individual">Pessoa Física</SelectItem>
                <SelectItem value="company">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <Card>
        <CardContent className="p-0">
          {clients.length === 0 ? (
            <div className="p-8 text-center">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhum cliente encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece criando seu primeiro cliente.
              </p>
              <div className="mt-6">
                <Button onClick={onCreateNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cliente
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {client.client_type === 'individual' ? (
                          <User className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Building className="h-4 w-4 text-gray-400" />
                        )}
                        <div>
                          <div className="font-medium">{client.name}</div>
                          {client.document_number && (
                            <div className="text-sm text-gray-500">
                              {client.document_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {client.client_type === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {client.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        client.status === 'active' ? 'default' :
                        client.status === 'lead' ? 'secondary' :
                        client.status === 'prospect' ? 'outline' :
                        client.status === 'inactive' ? 'destructive' : 'outline'
                      }>
                        {client.status === 'active' ? 'Ativo' :
                         client.status === 'lead' ? 'Lead' :
                         client.status === 'prospect' ? 'Prospect' :
                         client.status === 'inactive' ? 'Inativo' :
                         client.status === 'archived' ? 'Arquivado' : client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <span className="font-medium">{client.lead_score}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {new Date(client.created_at).toLocaleDateString('pt-BR')}
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
                          <DropdownMenuItem onClick={() => onEdit(client)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(client)}
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
