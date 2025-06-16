
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useProcesses } from '@/hooks/useProcesses';
import { useClients } from '@/hooks/useClients';
import { Process, CreateProcessData, UpdateProcessData } from '@/types/process';
import { ProcessClientModal } from './ProcessClientModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Plus, Trash2 } from 'lucide-react';

interface ProcessModalProps {
  open: boolean;
  onClose: () => void;
  process: Process | null;
}

interface ProcessClient {
  id: string;
  client_id: string;
  role: 'plaintiff' | 'defendant' | 'witness' | 'other';
  client: {
    id: string;
    name: string;
    email?: string;
  };
}

export const ProcessModal: React.FC<ProcessModalProps> = ({ open, onClose, process }) => {
  const { createProcess, updateProcess } = useProcesses();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [processClients, setProcessClients] = useState<ProcessClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [clientRole, setClientRole] = useState<'plaintiff' | 'defendant' | 'witness' | 'other'>('plaintiff');
  const { clients, loadClients } = useClients();

  const [formData, setFormData] = useState({
    title: '',
    process_number: '',
    description: '',
    status: 'active' as Process['status'],
    priority: 'medium' as Process['priority'],
    court: '',
    judge: '',
    assigned_lawyer: '',
    case_value: '',
    deadline_date: ''
  });

  useEffect(() => {
    if (process) {
      setFormData({
        title: process.title,
        process_number: process.process_number,
        description: process.description || '',
        status: process.status,
        priority: process.priority,
        court: process.court || '',
        judge: process.judge || '',
        assigned_lawyer: process.assigned_lawyer || '',
        case_value: process.case_value ? process.case_value.toString() : '',
        deadline_date: process.deadline_date ? new Date(process.deadline_date).toISOString().split('T')[0] : ''
      });

      if (open) {
        loadProcessClients();
      }
    } else {
      setFormData({
        title: '',
        process_number: '',
        description: '',
        status: 'active',
        priority: 'medium',
        court: '',
        judge: '',
        assigned_lawyer: '',
        case_value: '',
        deadline_date: ''
      });
      setProcessClients([]);
      setSelectedClient('');
      setClientRole('plaintiff');
    }
    
    // Carregar a lista de clientes quando o modal for aberto
    if (open) {
      loadClients();
    }
  }, [process, open, loadClients]);

  const loadProcessClients = async () => {
    if (!process) return;

    try {
      const { data, error } = await supabase
        .from('process_clients')
        .select(`
          id,
          client_id,
          role,
          client:clients(id, name, email)
        `)
        .eq('process_id', process.id);

      if (error) throw error;

      // Tipo assertion segura para garantir que role seja do tipo correto
      const typedData: ProcessClient[] = (data || []).map(item => ({
        ...item,
        role: item.role as 'plaintiff' | 'defendant' | 'witness' | 'other'
      }));

      setProcessClients(typedData);
    } catch (error) {
      console.error('Erro ao carregar clientes do processo:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.process_number.trim()) {
      toast({
        title: "Erro",
        description: "Título e número do processo são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      if (process) {
        const updateData: UpdateProcessData = {
          title: formData.title,
          process_number: formData.process_number,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          court: formData.court,
          judge: formData.judge,
          assigned_lawyer: formData.assigned_lawyer,
          case_value: formData.case_value ? parseFloat(formData.case_value) : undefined,
          deadline_date: formData.deadline_date ? new Date(formData.deadline_date).toISOString() : undefined
        };

        await updateProcess(process.id, updateData);
      } else {
        const createData: CreateProcessData = {
          title: formData.title,
          process_number: formData.process_number,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          court: formData.court,
          judge: formData.judge,
          assigned_lawyer: formData.assigned_lawyer,
          case_value: formData.case_value ? parseFloat(formData.case_value) : undefined,
          deadline_date: formData.deadline_date ? new Date(formData.deadline_date).toISOString() : undefined
        };

        const newProcess = await createProcess(createData);
        
        // Se um cliente foi selecionado e o processo foi criado com sucesso, vincular o cliente ao processo
        if (newProcess && selectedClient) {
          try {
            await supabase
              .from('process_clients')
              .insert({
                process_id: newProcess.id,
                client_id: selectedClient,
                role: clientRole
              });
              
            toast({
              title: "Cliente vinculado",
              description: "Cliente foi vinculado ao processo com sucesso.",
            });
          } catch (error: any) {
            console.error('Erro ao vincular cliente ao processo:', error);
            toast({
              title: "Erro ao vincular cliente",
              description: error.message,
              variant: "destructive",
            });
          }
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar processo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveClient = async (processClientId: string) => {
    try {
      const { error } = await supabase
        .from('process_clients')
        .delete()
        .eq('id', processClientId);

      if (error) throw error;

      toast({
        title: "Cliente removido",
        description: "Cliente foi removido do processo com sucesso.",
      });

      loadProcessClients();
    } catch (error: any) {
      toast({
        title: "Erro ao remover cliente",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'plaintiff': return 'Requerente';
      case 'defendant': return 'Requerido';
      case 'witness': return 'Testemunha';
      case 'other': return 'Outro';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'plaintiff': return 'default';
      case 'defendant': return 'destructive';
      case 'witness': return 'secondary';
      case 'other': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {process ? 'Editar Processo' : 'Novo Processo'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Ação de Cobrança"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="process_number">Número do Processo *</Label>
                <Input
                  id="process_number"
                  value={formData.process_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, process_number: e.target.value }))}
                  placeholder="Ex: 1234567-89.2024.8.26.0001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Process['status']) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: Process['priority']) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="court">Tribunal</Label>
                <Input
                  id="court"
                  value={formData.court}
                  onChange={(e) => setFormData(prev => ({ ...prev, court: e.target.value }))}
                  placeholder="Ex: 1ª Vara Cível"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="judge">Juiz</Label>
                <Input
                  id="judge"
                  value={formData.judge}
                  onChange={(e) => setFormData(prev => ({ ...prev, judge: e.target.value }))}
                  placeholder="Ex: Dr. João Silva"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="case_value">Valor da Causa (R$)</Label>
                <Input
                  id="case_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.case_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, case_value: e.target.value }))}
                  placeholder="Ex: 10000.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline_date">Data Limite</Label>
                <Input
                  id="deadline_date"
                  type="date"
                  value={formData.deadline_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição detalhada do processo..."
                rows={3}
              />
            </div>

            {!process && (
              <div className="space-y-4 pt-4">
                <Separator />
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <h3 className="text-lg font-medium">Cliente Vinculado</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client">Cliente</Label>
                    <Select
                      value={selectedClient}
                      onValueChange={setSelectedClient}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Papel no Processo</Label>
                    <Select
                      value={clientRole}
                      onValueChange={(value: 'plaintiff' | 'defendant' | 'witness' | 'other') => setClientRole(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plaintiff">{getRoleLabel('plaintiff')}</SelectItem>
                        <SelectItem value="defendant">{getRoleLabel('defendant')}</SelectItem>
                        <SelectItem value="witness">{getRoleLabel('witness')}</SelectItem>
                        <SelectItem value="other">{getRoleLabel('other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {process && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <h3 className="text-lg font-medium">Clientes Vinculados</h3>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowClientModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Vincular Cliente
                    </Button>
                  </div>

                  {processClients.length > 0 ? (
                    <div className="space-y-2">
                      {processClients.map((pc) => (
                        <div key={pc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{pc.client.name}</p>
                              {pc.client.email && (
                                <p className="text-sm text-gray-600">{pc.client.email}</p>
                              )}
                            </div>
                            <Badge variant={getRoleBadgeVariant(pc.role)}>
                              {getRoleLabel(pc.role)}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveClient(pc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Nenhum cliente vinculado a este processo
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : process ? 'Atualizar' : 'Criar Processo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {process && (
        <ProcessClientModal
          open={showClientModal}
          onClose={() => setShowClientModal(false)}
          processId={process.id}
          onSuccess={loadProcessClients}
        />
      )}
    </>
  );
};
