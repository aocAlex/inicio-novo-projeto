import React from 'react';
import { format } from 'date-fns';
import { FileText, Download, User, Clock, CheckCircle, XCircle, AlertCircle, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useContracts } from '@/hooks/useContracts';
import { Contract } from '@/types/contract';

interface ContractsListProps {
  onContractClick: (contract: Contract) => void;
}

export const ContractsList: React.FC<ContractsListProps> = ({ onContractClick }) => {
  const { contracts, isLoading } = useContracts();

  const getStatusBadge = (status: Contract['status']) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      signed: { label: 'Assinado', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'Rejeitado', variant: 'destructive' as const, icon: XCircle },
      expired: { label: 'Expirado', variant: 'outline' as const, icon: AlertCircle },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getConfidenceBadge = (confidence?: number, matchType?: string) => {
    if (!confidence || !matchType) return null;

    const confidenceColor = confidence >= 0.95 ? 'bg-green-100 text-green-800' 
      : confidence >= 0.8 ? 'bg-yellow-100 text-yellow-800' 
      : 'bg-gray-100 text-gray-800';

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${confidenceColor}`}>
        {Math.round(confidence * 100)}% ({matchType})
      </span>
    );
  };

  const formatCurrency = (value?: number) => {
    if (!value) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhum contrato encontrado</h3>
        <p className="text-muted-foreground">
          Os contratos aparecerão aqui quando forem recebidos via webhook.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6"> {/* Adjusted space-y */}
      {contracts.map((contract) => (
        <Card key={contract.id} className="p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer" {/* Applied responsive padding */}
              onClick={() => onContractClick(contract)}>
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-lg">{contract.contract_name}</h3>
                {getStatusBadge(contract.status)}
                {contract.contract_type && (
                  <Badge variant="outline">{contract.contract_type}</Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {contract.client ? (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{contract.client.name}</span>
                    {getConfidenceBadge(contract.matching_confidence, contract.matched_by)}
                  </div>
                ) : (
                  <span className="text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Cliente não vinculado
                  </span>
                )}

                {contract.contract_value && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium text-green-600">
                      {formatCurrency(contract.contract_value)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span>
                  Criado em {format(new Date(contract.created_at), 'dd/MM/yyyy HH:mm')}
                </span>
                {contract.signed_at && (
                  <span>
                    Assinado em {format(new Date(contract.signed_at), 'dd/MM/yyyy HH:mm')}
                  </span>
                )}
                {contract.signers && (
                  <span>
                    {contract.signers.filter(s => s.status === 'signed').length} de {contract.signers.length} assinado(s)
                  </span>
                )}
              </div>

              {contract.contract_code && (
                <div className="text-sm text-muted-foreground">
                  Código: {contract.contract_code}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {contract.signed_file_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(contract.signed_file_url, '_blank');
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
