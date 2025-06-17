import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePetitionExecutions } from '@/hooks/usePetitionExecutions';
import { ExecutionFilters } from '@/types/petition';
import { 
  Search, 
  FileText, 
  Eye, 
  Trash2, 
  RefreshCw,
  Download,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Petitions = () => {
  const [filters, setFilters] = useState<ExecutionFilters>({});

  const {
    executions,
    isLoading,
    error,
    loadExecutions,
    retryWebhook,
    deleteExecution,
  } = usePetitionExecutions();

  const handleSearch = (search: string) => {
    const newFilters = { ...filters, search: search || undefined };
    setFilters(newFilters);
    loadExecutions(newFilters);
  };

  const handleStatusFilter = (status: string) => {
    const newFilters = { 
      ...filters, 
      webhook_status: status === 'all' ? undefined : status 
    };
    setFilters(newFilters);
    loadExecutions(newFilters);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta execução?')) {
      await deleteExecution(id);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Petições Executadas</h1>
            <p className="text-gray-600">
              Histórico de execuções de templates
            </p>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por template, processo ou cliente..."
                    className="pl-10"
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </div>
              <Select onValueChange={handleStatusFilter} defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="sent">Enviada</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="failed">Falhada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading e Error States */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando execuções...</p>
          </div>
        )}

        {error && (
          <Card className="mb-6">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-red-600">Erro: {error}</p>
              <Button
                variant="outline"
                onClick={() => loadExecutions(filters)}
                className="mt-2"
              >
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lista de Execuções */}
        {!isLoading && !error && (
          <div className="space-y-6">
            {executions.length === 0 ? (
              <Card>
                <CardContent className="p-4 sm:p-6 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Nenhuma execução encontrada
                  </p>
                </CardContent>
              </Card>
            ) : (
              executions.map((execution) => (
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
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex gap-2">
                      {execution.webhook_status === 'failed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => retryWebhook(execution.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Reenviar
                        </Button>
                      )}

                      {execution.final_document_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(execution.final_document_url, '_blank')}
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
                            // Abrir modal com conteúdo gerado
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
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
