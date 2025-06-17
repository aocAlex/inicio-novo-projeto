
import { useState } from 'react';
import { useClients } from '@/hooks/useClients';
import { useSimplifiedPermissions } from '@/hooks/useSimplifiedPermissions';
import { ClientList } from '@/components/clients/ClientList';
import { ClientModal } from '@/components/clients/ClientModal';
import { Client, CreateClientData, UpdateClientData, ClientFilters } from '@/types/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export const Clients = () => {
  const { can } = useSimplifiedPermissions();
  const {
    clients,
    isLoading,
    error,
    loadClients,
    createClient,
    updateClient,
    deleteClient,
  } = useClients();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const handleFilter = (filters: ClientFilters) => {
    loadClients(filters);
  };

  const handleCreateNew = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDelete = (client: Client) => {
    setClientToDelete(client);
    setIsConfirmDeleteOpen(true);
  };

  const handleSave = async (data: CreateClientData | UpdateClientData) => {
    if (editingClient) {
      await updateClient(editingClient.id, data as UpdateClientData);
    } else {
      await createClient(data as CreateClientData);
    }
  };

  const confirmDelete = async () => {
    if (clientToDelete) {
      await deleteClient(clientToDelete.id);
      setIsConfirmDeleteOpen(false);
      setClientToDelete(null);
    }
  };

  if (!can.readClient()) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para visualizar clientes.
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

      <ClientList
        clients={clients}
        isLoading={isLoading}
        onFilter={handleFilter}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateNew={handleCreateNew}
      />

      {/* Modal de Criar/Editar */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        client={editingClient}
      />

      {/* Confirmação de exclusão */}
      {isConfirmDeleteOpen && clientToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o cliente <strong>{clientToDelete.name}</strong>?
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
