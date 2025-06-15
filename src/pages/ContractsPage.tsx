
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContractsList } from '@/components/contracts/ContractsList';
import { ContractFilters } from '@/components/contracts/ContractFilters';
import { ContractStats } from '@/components/contracts/ContractStats';
import { ContractModal } from '@/components/contracts/ContractModal';
import { useContracts } from '@/hooks/useContracts';
import { Contract, ContractFilters as IContractFilters } from '@/types/contract';

export const ContractsPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const { loadContracts } = useContracts();

  const handleFilterChange = (filters: IContractFilters) => {
    loadContracts(filters);
  };

  const handleCreateClick = () => {
    setSelectedContract(null);
    setShowCreateModal(true);
  };

  const handleContractClick = (contract: Contract) => {
    setSelectedContract(contract);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setSelectedContract(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contratos</h1>
          <p className="text-muted-foreground">
            Gerencie contratos de assinatura eletrônica
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Contrato
        </Button>
      </div>

      <ContractStats />

      <div className="grid gap-6">
        <ContractFilters onFilterChange={handleFilterChange} />
        <ContractsList onContractClick={handleContractClick} />
      </div>

      <ContractModal
        open={showCreateModal}
        onClose={handleCloseModal}
        contract={selectedContract}
      />
    </div>
  );
};
