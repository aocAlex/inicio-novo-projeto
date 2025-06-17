
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Client } from '@/types/client';
import { MoreHorizontal, Eye, Edit, Trash2, Mail, Phone, MapPin, Building, User } from 'lucide-react';

interface ClientTableProps {
  clients: Client[];
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const ClientTable = ({ 
  clients, 
  onView, 
  onEdit, 
  onDelete, 
  canEdit, 
  canDelete 
}: ClientTableProps) => {
  const getStatusColor = (status: string) => {
    const colors = {
      lead: 'bg-yellow-100 text-yellow-800',
      prospect: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      archived: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      lead: 'Lead',
      prospect: 'Prospect',
      active: 'Ativo',
      inactive: 'Inativo',
      archived: 'Arquivado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 font-semibold';
    if (score >= 60) return 'text-yellow-600 font-medium';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Contato</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Lead Score</TableHead>
          <TableHead>Interações</TableHead>
          <TableHead>Criado em</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {client.client_type === 'individual' ? (
                    <User className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Building className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 truncate">
                    {client.name}
                  </div>
                  {client.document_number && (
                    <div className="text-sm text-gray-600">
                      {client.document_number}
                    </div>
                  )}
                  {client.tags && client.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {client.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {client.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{client.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TableCell>
            
            <TableCell>
              <Badge variant="outline">
                {client.client_type === 'individual' ? 'PF' : 'PJ'}
              </Badge>
            </TableCell>
            
            <TableCell>
              <div className="space-y-1">
                {client.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="mr-2 h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="mr-2 h-3 w-3 flex-shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.address?.city && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="mr-2 h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {client.address.city}
                      {client.address.state && `, ${client.address.state}`}
                    </span>
                  </div>
                )}
              </div>
            </TableCell>
            
            <TableCell>
              <Badge className={getStatusColor(client.status)}>
                {getStatusLabel(client.status)}
              </Badge>
            </TableCell>
            
            <TableCell>
              <div className="text-center">
                <span className={`text-lg font-semibold ${getLeadScoreColor(client.lead_score)}`}>
                  {client.lead_score}
                </span>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className={`h-1.5 rounded-full ${
                      client.lead_score >= 80 ? 'bg-green-600' :
                      client.lead_score >= 60 ? 'bg-yellow-600' :
                      client.lead_score >= 40 ? 'bg-orange-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${client.lead_score}%` }}
                  ></div>
                </div>
              </div>
            </TableCell>
            
            <TableCell>
              <div className="text-center">
                <div className="text-sm font-medium">
                  {client.interactions_count || 0}
                </div>
                {client.last_interaction && (
                  <div className="text-xs text-gray-500">
                    {new Date(client.last_interaction).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            </TableCell>
            
            <TableCell>
              <div className="text-sm text-gray-600">
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
                  <DropdownMenuItem onClick={() => onView(client)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar
                  </DropdownMenuItem>
                  {canEdit && (
                    <DropdownMenuItem onClick={() => onEdit(client)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(client)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
