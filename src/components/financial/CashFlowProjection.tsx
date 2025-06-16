
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export const CashFlowProjection = () => {
  return (
    <Card className="mb-6"> {/* Added mb-6 */}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Projeção de Fluxo de Caixa
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6"> {/* Applied responsive padding */}
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Projeção de fluxo de caixa será implementada após a criação das tabelas</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
