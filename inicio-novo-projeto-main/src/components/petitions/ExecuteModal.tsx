
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Template } from '@/hooks/useTemplates';
import { CreateExecutionData } from '@/hooks/usePetitions';
import { useProcesses } from '@/hooks/useProcesses';
import { useClients } from '@/hooks/useClients';
import { Loader2, FileText } from 'lucide-react';

interface ExecuteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateExecutionData) => Promise<any>;
  template: Template | null;
}

export const ExecuteModal = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  template
}: ExecuteModalProps) => {
  const [formData, setFormData] = useState({
    process_id: '',
    client_id: '',
    webhook_url: '',
    filled_data: {} as Record<string, any>,
  });
  const [isLoading, setIsLoading] = useState(false);

  const { processes } = useProcesses();
  const { clients } = useClients();

  useEffect(() => {
    if (isOpen && template) {
      // Extrair variáveis do template para criar campos de preenchimento
      const variables = extractVariables(template.template_content);
      const initialData: Record<string, any> = {};
      variables.forEach(variable => {
        initialData[variable] = '';
      });
      setFormData(prev => ({
        ...prev,
        filled_data: initialData,
      }));
    } else if (!isOpen) {
      setFormData({
        process_id: '',
        client_id: '',
        webhook_url: '',
        filled_data: {},
      });
    }
  }, [isOpen, template]);

  // Extrair variáveis do template ({{variavel}})
  const extractVariables = (content: string): string[] => {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const variable = match[1].trim();
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }
    
    return variables;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;

    setIsLoading(true);

    try {
      // Preparar dados preenchidos incluindo dados do processo/cliente selecionados
      let enhancedData = { ...formData.filled_data };

      // Se processo selecionado, adicionar dados do processo
      if (formData.process_id && formData.process_id !== 'none') {
        const selectedProcess = processes.find(p => p.id === formData.process_id);
        if (selectedProcess) {
          enhancedData = {
            ...enhancedData,
            processo_numero: selectedProcess.process_number,
            processo_titulo: selectedProcess.title,
            processo_descricao: selectedProcess.description || '',
            valor_causa: selectedProcess.case_value || '',
            tribunal: selectedProcess.court || '',
            juiz: selectedProcess.judge || '',
          };
        }
      }

      // Se cliente selecionado, adicionar dados do cliente
      if (formData.client_id && formData.client_id !== 'none') {
        const selectedClient = clients.find(c => c.id === formData.client_id);
        if (selectedClient) {
          enhancedData = {
            ...enhancedData,
            cliente_nome: selectedClient.name,
            cliente_email: selectedClient.email || '',
            cliente_telefone: selectedClient.phone || '',
            cliente_documento: selectedClient.document_number || '',
            cliente_tipo: selectedClient.client_type === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica',
          };
        }
      }

      const executionData: CreateExecutionData = {
        template_id: template.id,
        process_id: formData.process_id && formData.process_id !== 'none' ? formData.process_id : undefined,
        client_id: formData.client_id && formData.client_id !== 'none' ? formData.client_id : undefined,
        filled_data: enhancedData,
        webhook_url: formData.webhook_url || undefined,
      };

      await onSubmit(executionData);
      onClose();
    } catch (error) {
      console.error('Error executing template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      filled_data: {
        ...prev.filled_data,
        [field]: value,
      },
    }));
  };

  const renderPreview = () => {
    if (!template) return '';
    
    let preview = template.template_content;
    Object.entries(formData.filled_data).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      preview = preview.replace(regex, value || `[${key}]`);
    });
    
    return preview;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Executar Template</DialogTitle>
          <DialogDescription>
            Preencha os dados para executar o template: {template?.name}
          </DialogDescription>
        </DialogHeader>

        {template ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção de Processo e Cliente */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="process_id">Processo (opcional)</Label>
                <Select 
                  value={formData.process_id || 'none'} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, process_id: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um processo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum processo</SelectItem>
                    {processes.map((process) => (
                      <SelectItem key={process.id} value={process.id}>
                        {process.process_number} - {process.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_id">Cliente (opcional)</Label>
                <Select 
                  value={formData.client_id || 'none'} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum cliente</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* URL do Webhook N8n */}
            <div className="space-y-2">
              <Label htmlFor="webhook_url">URL do Webhook N8n (opcional)</Label>
              <Input
                id="webhook_url"
                value={formData.webhook_url}
                onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                placeholder="https://sua-instancia.n8n.cloud/webhook/seu-webhook"
              />
              <p className="text-xs text-gray-500">
                Se informado, os dados serão enviados para este webhook após a execução.
              </p>
            </div>

            {/* Campos dinâmicos baseados nas variáveis do template */}
            {Object.keys(formData.filled_data).length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Dados para preenchimento:</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(formData.filled_data).map((field) => (
                    <div key={field} className="space-y-2">
                      <Label htmlFor={field}>
                        {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      <Input
                        id={field}
                        value={formData.filled_data[field]}
                        onChange={(e) => handleDataChange(field, e.target.value)}
                        placeholder={`Digite ${field.replace(/_/g, ' ')}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview do conteúdo */}
            <div className="space-y-2">
              <Label>Preview do documento:</Label>
              <div className="p-4 border rounded-lg bg-gray-50 max-h-60 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {renderPreview()}
                </pre>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executando...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Executar Template
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">Template não encontrado.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
