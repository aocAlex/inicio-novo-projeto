
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContractsList } from '@/components/contracts/ContractsList';
import { ContractFilters } from '@/components/contracts/ContractFilters';
import { ContractStats } from '@/components/contracts/ContractStats';
import { ContractModal } from '@/components/contracts/ContractModal';
import { ContractTemplatesList } from '@/components/contracts/ContractTemplatesList';
import { useContracts } from '@/hooks/useContracts';
import { useContractTemplates } from '@/hooks/useContractTemplates';
import { Contract, ContractFilters as IContractFilters, CreateContractData } from '@/types/contract';

export const ContractsPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const { loadContracts, createContract } = useContracts();
  const { getTemplate } = useContractTemplates();

  const handleFilterChange = (filters: IContractFilters) => {
    loadContracts(filters);
  };

  const handleCreateClick = () => {
    setSelectedContract(null);
    setSelectedTemplateId(null);
    setShowCreateModal(true);
  };

  const handleContractClick = (contract: Contract) => {
    setSelectedContract(contract);
    setSelectedTemplateId(null);
    setShowCreateModal(true);
  };

  const handleUseTemplate = async (templateId: string) => {
    setSelectedTemplateId(templateId);
    setSelectedContract(null);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setSelectedContract(null);
    setSelectedTemplateId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contratos</h1> {/* Adjusted text size */}
            <p className="text-gray-600"> {/* Adjusted text color */}
              Gerencie contratos de assinatura eletrônica e templates
            </p>
          </div>
          <Button onClick={handleCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Contrato
          </Button>
        </div>

        <ContractStats />

        <Tabs defaultValue="contracts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="contracts" className="space-y-6">
            <div className="grid gap-6"> {/* Keep grid gap for now, adjust within components if needed */}
              <ContractFilters onFilterChange={handleFilterChange} />
              <ContractsList onContractClick={handleContractClick} />
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <ContractTemplatesList onUseTemplate={handleUseTemplate} />
          </TabsContent>
        </Tabs>

        <ContractModal
          open={showCreateModal}
          onClose={handleCloseModal}
          contract={selectedContract}
          templateId={selectedTemplateId}
        />
      </div>
    </div>
  );
};
