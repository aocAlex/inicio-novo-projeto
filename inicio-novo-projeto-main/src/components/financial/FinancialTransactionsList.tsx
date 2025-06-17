
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt } from 'lucide-react';

export const FinancialTransactionsList = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Transações Financeiras
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Lista de transações será implementada após a criação das tabelas</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
