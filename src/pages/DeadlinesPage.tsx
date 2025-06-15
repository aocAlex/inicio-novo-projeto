import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useDeadlines } from '@/hooks/useDeadlines';
import { DeadlinesList } from '@/components/deadlines/DeadlinesList';
import { DeadlineModal } from '@/components/deadlines/DeadlineModal';
import { DeadlinesFilters } from '@/components/deadlines/DeadlinesFilters';
import { Deadline, DeadlineFilters, DeadlineFormData } from '@/types/deadline';

export const DeadlinesPage = () => {
  const {
    deadlines,
    isLoading,
    createDeadline,
    updateDeadline,
    completeDeadline,
    deleteDeadline,
    getUpcomingDeadlines,
    getOverdueDeadlines,
    loadDeadlines
  } = useDeadlines();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | undefined>();
  const [filters, setFilters] = useState<DeadlineFilters>({});

  const upcomingDeadlines = getUpcomingDeadlines(7);
  const overdueDeadlines = getOverdueDeadlines();
  const completedDeadlines = deadlines.filter(d => d.status === 'CUMPRIDO');
  const totalDeadlines = deadlines.length;

  const handleCreateDeadline = async (data: DeadlineFormData): Promise<Deadline> => {
    const result = await createDeadline(data);
    setShowCreateModal(false);
    
    // Converter o resultado para o tipo Deadline com verificações de null
    const convertedResult: Deadline = {
      ...result,
      deadline_type: result.deadline_type as 'processual' | 'administrativo' | 'contratual' | 'fiscal' | 'personalizado',
      status: result.status as 'PENDENTE' | 'EM_ANDAMENTO' | 'CUMPRIDO' | 'PERDIDO' | 'SUSPENSO',
      priority: result.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      attachments: Array.isArray(result.attachments) ? result.attachments : [],
      custom_fields: typeof result.custom_fields === 'object' && result.custom_fields !== null ? result.custom_fields : {},
      process: result.process && typeof result.process === 'object' && 'id' in result.process && result.process.id && typeof result.process.id === 'string' ? {
        id: result.process.id,
        title: result.process.title || '',
        process_number: result.process.process_number || ''
      } : undefined,
      client: result.client && typeof result.client === 'object' && 'id' in result.client && result.client.id && typeof result.client.id === 'string' ? {
        id: result.client.id,
        name: result.client.name || ''
      } : undefined,
      assigned_user: result.assigned_user && typeof result.assigned_user === 'object' && 'id' in result.assigned_user ? result.assigned_user : undefined,
      petition: result.petition && typeof result.petition === 'object' && 'id' in result.petition ? result.petition : undefined,
      petition_execution: result.petition_execution && typeof result.petition_execution === 'object' && 'id' in result.petition_execution ? result.petition_execution : undefined,
    };
    return convertedResult;
  };

  const handleEditDeadline = async (data: DeadlineFormData): Promise<Deadline | null> => {
    if (editingDeadline) {
      const result = await updateDeadline(editingDeadline.id, data);
      setEditingDeadline(undefined);
      
      // Converter o resultado para o tipo Deadline com verificações de null
      const convertedResult: Deadline = {
        ...result,
        deadline_type: result.deadline_type as 'processual' | 'administrativo' | 'contratual' | 'fiscal' | 'personalizado',
        status: result.status as 'PENDENTE' | 'EM_ANDAMENTO' | 'CUMPRIDO' | 'PERDIDO' | 'SUSPENSO',
        priority: result.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        attachments: Array.isArray(result.attachments) ? result.attachments : [],
        custom_fields: typeof result.custom_fields === 'object' && result.custom_fields !== null ? result.custom_fields : {},
        process: result.process && typeof result.process === 'object' && 'id' in result.process && result.process.id && typeof result.process.id === 'string' ? {
          id: result.process.id,
          title: result.process.title || '',
          process_number: result.process.process_number || ''
        } : undefined,
        client: result.client && typeof result.client === 'object' && 'id' in result.client && result.client.id && typeof result.client.id === 'string' ? {
          id: result.client.id,
          name: result.client.name || ''
        } : undefined,
        assigned_user: result.assigned_user && typeof result.assigned_user === 'object' && 'id' in result.assigned_user ? result.assigned_user : undefined,
        petition: result.petition && typeof result.petition === 'object' && 'id' in result.petition ? result.petition : undefined,
        petition_execution: result.petition_execution && typeof result.petition_execution === 'object' && 'id' in result.petition_execution ? result.petition_execution : undefined,
      };
      return convertedResult;
    }
    return null;
  };

  const handleCompleteDeadline = async (id: string) => {
    const notes = prompt('Observações sobre o cumprimento do prazo (opcional):');
    await completeDeadline(id, notes || undefined);
  };

  const handleFiltersChange = (newFilters: DeadlineFilters) => {
    setFilters(newFilters);
    loadDeadlines(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    loadDeadlines();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Prazos</h1>
          <p className="text-gray-600 mt-2">
            Gerencie e acompanhe todos os prazos jurídicos
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Prazo
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Prazos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeadlines}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos 7 Dias</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{upcomingDeadlines.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueDeadlines.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cumpridos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedDeadlines.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros para encontrar prazos específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeadlinesFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
        </CardContent>
      </Card>

      {/* Lista de Prazos */}
      <DeadlinesList
        deadlines={deadlines}
        isLoading={isLoading}
        onEdit={setEditingDeadline}
        onComplete={handleCompleteDeadline}
        onDelete={deleteDeadline}
      />

      {/* Modal de Criar Prazo */}
      <DeadlineModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateDeadline}
      />

      {/* Modal de Editar Prazo */}
      <DeadlineModal
        open={!!editingDeadline}
        onClose={() => setEditingDeadline(undefined)}
        onSave={handleEditDeadline}
        deadline={editingDeadline}
      />
    </div>
  );
};
