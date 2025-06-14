
import { useState } from 'react';
import { useProcesses } from '@/hooks/useProcesses';
import { usePermissions } from '@/hooks/usePermissions';
import { ProcessList } from '@/components/processes/ProcessList';
import { ProcessModal } from '@/components/processes/ProcessModal';
import { Process, CreateProcessData, UpdateProcessData, ProcessFilters } from '@/types/process';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export const Processes = () => {
  const { can } = usePermissions();
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

  const handleFilter = (filters: ProcessFilters) => {
    loadProcesses(filters);
  };

  const handleCreateNew = () => {
    setEditingProcess(null);
    setIsModalOpen(true);
  };

  const handleEdit = (process: Process) => {
    setEditingProcess(process);
    setIsModalOpen(true);
  };

  const handleDelete = (process: Process) => {
    setProcessToDelete(process);
    setIsConfirmDeleteOpen(true);
  };

  const handleSave = async (data: CreateProcessData | UpdateProcessData) => {
    if (editingProcess) {
      await updateProcess(editingProcess.id, data as UpdateProcessData);
    } else {
      await createProcess(data as CreateProcessData);
    }
  };

  const confirmDelete = async () => {
    if (processToDelete) {
      await deleteProcess(processToDelete.id);
      setIsConfirmDeleteOpen(false);
      setProcessToDelete(null);
    }
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
    <div className="p-6">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
        onClose={() => setIsModalOpen(false)}
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
              <button
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
