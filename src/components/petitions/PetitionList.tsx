
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Eye, 
  Trash2, 
  RefreshCw,
  Download,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { PetitionExecution } from '@/hooks/usePetitions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PetitionListProps {
  executions: PetitionExecution[];
  isLoading: boolean;
  onRetry: (executionId: string) => void;
  onDelete: (executionId: string) => void;
}

export const PetitionList = ({ 
  executions, 
  isLoading, 
  onRetry, 
  onDelete 
}: PetitionListProps) => {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'sent': return 'secondary';
      case 'pending': return 'outline';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'sent': return 'Enviada';
      case 'pending': return 'Pendente';
      case 'failed': return 'Falhada';
      default: return status;
    }
  };

  const handleDelete = (executionId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta execução?')) {
      onDelete(executionId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-10 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma execução encontrada
          </h3>
          <p className="text-gray-600">
            Execute um template para ver o histórico aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {executions.map((execution) => (
        <Card key={execution.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg">
                  {execution.template?.name || 'Template removido'}
                </CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(execution.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                  {execution.process && (
                    <span>
                      Processo: {execution.process.process_number}
                    </span>
                  )}
                  {execution.client && (
                    <span>
                      Cliente: {execution.client.name}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2 items-center">
                <Badge variant={getStatusBadgeVariant(execution.webhook_status)}>
                  {getStatusLabel(execution.webhook_status)}
                </Badge>
                {execution.retry_count > 0 && (
                  <Badge variant="outline">
                    {execution.retry_count} tentativas
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {execution.webhook_status === 'failed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRetry(execution.id)}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reenviar
                </Button>
              )}
              
              {execution.final_document_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(execution.final_document_url!, '_blank')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Documento
                </Button>
              )}
              
              {execution.generated_content && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const win = window.open('', '_blank');
                    if (win) {
                      win.document.write(`
                        <html>
                          <head><title>Conteúdo Gerado</title></head>
                          <body style="font-family: Arial, sans-serif; padding: 20px;">
                            <h2>Conteúdo da Petição</h2>
                            <div style="white-space: pre-wrap;">${execution.generated_content}</div>
                          </body>
                        </html>
                      `);
                    }
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Conteúdo
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(execution.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Mostrar detalhes do webhook se houver erro */}
            {execution.webhook_status === 'failed' && execution.webhook_response?.error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-600">
                  <strong>Erro:</strong> {execution.webhook_response.error}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
