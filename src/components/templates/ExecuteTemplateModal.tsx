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
import { usePetitionTemplates } from '@/hooks/usePetitionTemplates';
import { usePetitionExecutions } from '@/hooks/usePetitionExecutions';
import { useProcesses } from '@/hooks/useProcesses';
import { useClients } from '@/hooks/useClients';
import { useTemplateFields } from '@/hooks/useTemplateFields';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';
import { CreateExecutionData } from '@/types/petition';
import { Loader2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ExecuteTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  templateId?: string;
}

export const ExecuteTemplateModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  templateId 
}: ExecuteTemplateModalProps) => {
  const [template, setTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    process_id: '',
    client_id: '',
    webhook_url: '',
    filled_data: {} as Record<string, any>,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [processClients, setProcessClients] = useState<any[]>([]);

  const { getTemplate } = usePetitionTemplates();
  const { createExecution } = usePetitionExecutions();
  const { processes } = useProcesses();
  const { clients } = useClients();
  const { fields, loadFields } = useTemplateFields(templateId);

  useEffect(() => {
    if (isOpen && templateId) {
      loadTemplate();
    } else if (isOpen) {
      setFormData({
        process_id: '',
        client_id: '',
        webhook_url: '',
        filled_data: {},
      });
      setTemplate(null);
      setFieldErrors({});
    }
  }, [isOpen, templateId]);

  useEffect(() => {
    if (templateId) {
      loadFields();
    }
  }, [templateId, loadFields]);

  // Inicializar dados dos campos com valores padrão
  useEffect(() => {
    if (fields.length > 0) {
      const initialData: Record<string, any> = {};
      fields.forEach(field => {
        if (field.default_value) {
          initialData[field.field_key] = field.default_value;
        }
      });
      setFormData(prev => ({
        ...prev,
        filled_data: { ...prev.filled_data, ...initialData },
      }));
    }
  }, [fields]);

  const loadTemplate = async () => {
    if (!templateId) return;
    
    setLoadingTemplate(true);
    try {
      const templateData = await getTemplate(templateId);
      if (templateData) {
        setTemplate(templateData);
      }
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const validateFields = () => {
    const errors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.is_required) {
        const value = formData.filled_data[field.field_key];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          errors[field.field_key] = `${field.field_title} é obrigatório`;
        }
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Novo useEffect para carregar clientes do processo selecionado
  useEffect(() => {
    const loadProcessClients = async () => {
      if (formData.process_id && formData.process_id !== 'none') {
        try {
          const { data, error } = await supabase
            .from('process_clients')
            .select(`
              id,
              client_id,
              role,
              client:clients(id, name, email)
            `)
            .eq('process_id', formData.process_id);

          if (error) throw error;

          setProcessClients(data || []);
        } catch (error) {
          console.error('Erro ao carregar clientes do processo:', error);
          setProcessClients([]);
        }
      } else {
        setProcessClients([]);
      }
    };

    loadProcessClients();
  }, [formData.process_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateId) return;

    // Validar campos obrigatórios
    if (!validateFields()) {
      return;
    }

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
        template_id: templateId,
        process_id: formData.process_id && formData.process_id !== 'none' ? formData.process_id : undefined,
        client_id: formData.client_id && formData.client_id !== 'none' ? formData.client_id : undefined,
        filled_data: enhancedData,
        webhook_url: formData.webhook_url || undefined,
      };

      await createExecution(executionData);
      onSuccess();
    } catch (error) {
      console.error('Error executing template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      filled_data: {
        ...prev.filled_data,
        [fieldKey]: value,
      },
    }));

    // Limpar erro do campo se existir
    if (fieldErrors[fieldKey]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  const renderPreview = () => {
    if (!template) return '';
    
    let preview = template.template_content;
    
    // Substituir campos personalizados
    fields.forEach(field => {
      const value = formData.filled_data[field.field_key];
      const displayValue = value || `[${field.field_title}]`;
      const regex = new RegExp(`\\{\\{\\s*${field.field_key}\\s*\\}\\}`, 'g');
      preview = preview.replace(regex, displayValue);
    });

    // Substituir dados padrão do sistema
    Object.entries(formData.filled_data).forEach(([key, value]) => {
      if (!fields.find(f => f.field_key === key)) {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        preview = preview.replace(regex, value || `[${key}]`);
      }
    });
    
    return preview;
  };

  // Função para determinar quais clientes mostrar
  const getAvailableClients = () => {
    if (formData.process_id && formData.process_id !== 'none' && processClients.length > 0) {
      // Mostrar apenas clientes vinculados ao processo
      return processClients.map(pc => pc.client);
    }
    // Mostrar todos os clientes
    return clients;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Executar Template</DialogTitle>
          <DialogDescription>
            Preencha os dados para executar o template de petição.
          </DialogDescription>
        </DialogHeader>

        {loadingTemplate ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando template...</span>
          </div>
        ) : template ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção de Processo e Cliente */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="process_id">Processo (opcional)</Label>
                <Select 
                  value={formData.process_id || 'none'} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      process_id: value === 'none' ? '' : value,
                      client_id: '' // Reset client selection when process changes
                    }));
                  }}
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
                <Label htmlFor="client_id">
                  Cliente (opcional)
                  {formData.process_id && formData.process_id !== 'none' && processClients.length > 0 && (
                    <span className="text-xs text-gray-500 ml-1">
                      - Apenas clientes vinculados ao processo
                    </span>
                  )}
                </Label>
                <Select 
                  value={formData.client_id || 'none'} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum cliente</SelectItem>
                    {getAvailableClients().map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.process_id && formData.process_id !== 'none' && processClients.length === 0 && (
                  <p className="text-xs text-gray-500">
                    Nenhum cliente vinculado a este processo
                  </p>
                )}
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

            {/* Campos Personalizados */}
            {fields.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Dados para preenchimento:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map((field) => (
                    <DynamicFieldRenderer
                      key={field.id}
                      field={field}
                      value={formData.filled_data[field.field_key]}
                      onChange={(value) => handleFieldChange(field.field_key, value)}
                      error={fieldErrors[field.field_key]}
                    />
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
