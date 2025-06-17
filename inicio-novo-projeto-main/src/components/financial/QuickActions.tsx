
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Receipt, FileText, CreditCard } from 'lucide-react';
import { FinancialContractModal } from './FinancialContractModal';
import { FinancialTransactionModal } from './FinancialTransactionModal';

export const QuickActions = () => {
  const [showContractModal, setShowContractModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');

  const actions = [
    {
      title: 'Novo Contrato',
      description: 'Criar contrato de honorários',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      onClick: () => setShowContractModal(true)
    },
    {
      title: 'Registrar Receita',
      description: 'Lançar recebimento',
      icon: CreditCard,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      onClick: () => {
        setTransactionType('income');
        setShowTransactionModal(true);
      }
    },
    {
      title: 'Registrar Despesa',
      description: 'Lançar gasto processual',
      icon: Receipt,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      onClick: () => {
        setTransactionType('expense');
        setShowTransactionModal(true);
      }
    }
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={action.onClick}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${action.bgColor}`}>
                    <Icon className={`h-4 w-4 ${action.color}`} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <FinancialContractModal
        open={showContractModal}
        onClose={() => setShowContractModal(false)}
      />

      <FinancialTransactionModal
        open={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        defaultType={transactionType}
      />
    </>
  );
};
