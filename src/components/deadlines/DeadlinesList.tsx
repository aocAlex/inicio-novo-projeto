import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  FileText,
  Trash2,
  Edit,
  MoreHorizontal,
  Building,
  Users,
  Scroll
} from 'lucide-react';
import { Deadline } from '@/types/deadline';
import { format, isAfter, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DeadlinesListProps {
  deadlines: Deadline[];
  isLoading: boolean;
  onEdit: (deadline: Deadline) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export const DeadlinesList = ({ 
  deadlines, 
  isLoading, 
  onEdit, 
  onComplete, 
  onDelete 
}: DeadlinesListProps) => {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'CUMPRIDO': return 'default';
      case 'EM_ANDAMENTO': return 'secondary';
      case 'PENDENTE': return 'outline';
      case 'PERDIDO': return 'destructive';
      case 'SUSPENSO': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CUMPRIDO': return 'Cumprido';
      case 'EM_ANDAMENTO': return 'Em Andamento';
      case 'PENDENTE': return 'Pendente';
      case 'PERDIDO': return 'Perdido';
      case 'SUSPENSO': return 'Suspenso';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'Crítica';
      case 'HIGH': return 'Alta';
      case 'MEDIUM': return 'Média';
      case 'LOW': return 'Baixa';
      default: return priority;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'processual': return 'Processual';
      case 'administrativo': return 'Administrativo';
      case 'contratual': return 'Contratual';
      case 'fiscal': return 'Fiscal';
      case 'personalizado': return 'Personalizado';
      default: return type;
    }
  };

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const days = differenceInDays(due, today);
    
    if (days < 0) {
      return `${Math.abs(days)} dias em atraso`;
    } else if (days === 0) {
      return 'Vence hoje';
    } else {
      return `${days} dias restantes`;
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status !== 'PENDENTE') return false;
    const today = new Date();
    const due = new Date(dueDate);
    return isAfter(today, due);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este prazo?')) {
      onDelete(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-10 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (deadlines.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6 text-center"> {/* Applied responsive padding */}
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum prazo encontrado
          </h3>
          <p className="text-gray-600">
            Crie seu primeiro prazo para começar a organizar sua agenda jurídica.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6"> {/* Adjusted space-y */}
      {deadlines.map((deadline) => (
        <Card key={deadline.id} className={`${isOverdue(deadline.due_date, deadline.status) ? 'border-red-500 bg-red-50' : ''}`}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {deadline.is_critical && <AlertTriangle className="h-5 w-5 text-red-500" />}
                  {deadline.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(deadline.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {getDaysRemaining(deadline.due_date)}
                  </span>
                  {deadline.process && (
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {deadline.process.process_number}
                    </span>
                  )}
                  {deadline.client && (
                    <span className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {deadline.client.name}
                    </span>
                  )}
                  {deadline.petition && (
                    <span className="flex items-center gap-1">
                      <Scroll className="h-4 w-4" />
                      {deadline.petition.name}
                    </span>
                  )}
                  {deadline.assigned_user && (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {deadline.assigned_user.full_name}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2 items-center">
                <Badge variant={getStatusBadgeVariant(deadline.status)}>
                  {getStatusLabel(deadline.status)}
                </Badge>
                <Badge variant={getPriorityBadgeVariant(deadline.priority)}>
                  {getPriorityLabel(deadline.priority)}
                </Badge>
                <Badge variant="outline">
                  {getTypeLabel(deadline.deadline_type)}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(deadline)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    {deadline.status === 'PENDENTE' && (
                      <DropdownMenuItem onClick={() => onComplete(deadline.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Marcar como Cumprido
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleDelete(deadline.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          {deadline.description && (
            <CardContent className="p-4 sm:p-6"> {/* Applied responsive padding */}
              <p className="text-gray-600">{deadline.description}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};
