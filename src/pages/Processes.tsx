
import { useState, useEffect } from 'react';
import { useProcesses } from '@/hooks/useProcesses';
import { useSimplifiedPermissions } from '@/hooks/useSimplifiedPermissions';
import { ProcessList } from '@/components/processes/ProcessList';
import { ProcessModal } from '@/components/processes/ProcessModal';
import { ProcessFilters } from '@/components/processes/ProcessFilters';
import { ProcessStats } from '@/components/processes/ProcessStats';
import { Process, CreateProcessData, UpdateProcessData, ProcessFilters as FilterTypes } from '@/types/process';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Plus, RefreshCw } from 'lucide-react';

export const Processes = () => {
  const { can } = useSimplifiedPermissions();
  const {
    processes,
    isLoading,
    error,
    loadProcesses,
    createProcess,
    updateProcess,
    deleteProcess,
  } = useProcesses();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [processToDelete, setProcessToDelete] = useState<Process | null>(null);
  const [currentFilters, setCurrentFilters] = useState<FilterTypes>({});

  // Calcular estatísticas de forma mais robusta
  const stats = {
    total: processes.length,
    active: processes.filter(p => p.status === 'active').length,
    pending: processes.filter(p => p.status === 'pending').length,
    suspended: processes.filter(p => p.status === 'suspended').length,
    archived: processes.filter(p => p.status === 'archived').length,
    withDeadlineThisWeek: processes.filter(p => {
      if (!p.deadline_date) return false;
      try {
        const deadline = new Date(p.deadline_date);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return deadline <= nextWeek && deadline >= new Date();
      } catch {
        return false;
      }
    }).length,
  };

  const handleFilter = async (filters: FilterTypes) => {
    setCurrentFilters(filters);
    await loadProcesses(filters);
  };

  const handleClearFilters = async () => {
    setCurrentFilters({});
    await loadProcesses();
  };

  const handleCreateNew = () => {
    if (!can.createProcess()) {
      return;
    }
    setEditingProcess(null);
    setIsModalOpen(true);
  };

  const handleEdit = (process: Process) => {
    if (!can.updateProcess()) {
      return;
    }
    setEditingProcess(process);
    setIsModalOpen(true);
  };

  const handleDelete = (process: Process) => {
    if (!can.deleteProcess()) {
      return;
    }
    setProcessToDelete(process);
    setIsConfirmDeleteOpen(true);
  };

  const handleSave = async (data: CreateProcessData | UpdateProcessData) => {
    try {
      if (editingProcess) {
        const success = await updateProcess(editingProcess.id, data as UpdateProcessData);
        if (success) {
          setIsModalOpen(false);
          setEditingProcess(null);
        }
      } else {
        const result = await createProcess(data as CreateProcessData);
        if (result) {
          setIsModalOpen(false);
          setEditingProcess(null);
        }
      }
    } catch (error) {
      console.error('Error saving process:', error);
    }
  };

  const confirmDelete = async () => {
    if (processToDelete) {
      try {
        const success = await deleteProcess(processToDelete.id);
        if (success) {
          setIsConfirmDeleteOpen(false);
          setProcessToDelete(null);
        }
      } catch (error) {
        console.error('Error deleting process:', error);
      }
    }
  };

  const handleRefresh = async () => {
    await loadProcesses(currentFilters);
  };

  if (!can.readProcess) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para visualizar processos.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Processos</h1>
          <p className="text-gray-600">Gerencie seus processos jurídicos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {can.createProcess() && (
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Processo
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Estatísticas */}
      <ProcessStats stats={stats} isLoading={isLoading} />

      {/* Filtros */}
      <ProcessFilters onFilter={handleFilter} onClear={handleClearFilters} />

      {/* Lista de Processos */}
      <ProcessList
        processes={processes}
        isLoading={isLoading}
        onFilter={handleFilter}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateNew={handleCreateNew}
      />

      {/* Modal de Criar/Editar */}
      <ProcessModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProcess(null);
        }}
        onSave={handleSave}
        process={editingProcess}
      />

      {/* Confirmação de exclusão */}
      {isConfirmDeleteOpen && processToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o processo <strong>{processToDelete.title}</strong>?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => {
                  setIsConfirmDeleteOpen(false);
                  setProcessToDelete(null);
                }}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmDelete}
                variant="destructive"
                disabled={isLoading}
              >
                {isLoading ? 'Excluindo...' : 'Excluir'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
