
import { useState, useEffect } from 'react';
import { Process, CreateProcessData, UpdateProcessData } from '@/types/process';
import { Client } from '@/types/client';
import { useClients } from '@/hooks/useClients';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, Plus } from 'lucide-react';

interface ProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateProcessData | UpdateProcessData) => Promise<void>;
  process?: Process | null;
}

interface SelectedClient {
  client_id: string;
  role: 'plaintiff' | 'defendant' | 'witness' | 'other';
  client?: Client;
}

export const ProcessModal = ({
  isOpen,
  onClose,
  onSave,
  process,
}: ProcessModalProps) => {
  const { clients } = useClients();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClients, setSelectedClients] = useState<SelectedClient[]>([]);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [processNumber, setProcessNumber] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Process['status']>('active');
  const [priority, setPriority] = useState<Process['priority']>('medium');
  const [court, setCourt] = useState('');
  const [judge, setJudge] = useState('');
  const [assignedLawyer, setAssignedLawyer] = useState('');
  const [caseValue, setCaseValue] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (process) {
        // Editing existing process
        setTitle(process.title);
        setProcessNumber(process.process_number);
        setDescription(process.description || '');
        setStatus(process.status);
        setPriority(process.priority);
        setCourt(process.court || '');
        setJudge(process.judge || '');
        setAssignedLawyer(process.assigned_lawyer || '');
        setCaseValue(process.case_value?.toString() || '');
        setDeadlineDate(process.deadline_date?.split('T')[0] || '');
        setSelectedClients([]);
      } else {
        // Creating new process
        setTitle('');
        setProcessNumber('');
        setDescription('');
        setStatus('active');
        setPriority('medium');
        setCourt('');
        setJudge('');
        setAssignedLawyer('');
        setCaseValue('');
        setDeadlineDate('');
        setSelectedClients([]);
      }
    }
  }, [isOpen, process]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const baseData = {
        title,
        process_number: processNumber,
        description: description || undefined,
        status,
        priority,
        court: court || undefined,
        judge: judge || undefined,
        assigned_lawyer: assignedLawyer || undefined,
        case_value: caseValue ? parseFloat(caseValue) : undefined,
        deadline_date: deadlineDate || undefined,
      };

      if (process) {
        // Update existing process
        await onSave(baseData as UpdateProcessData);
      } else {
        // Create new process
        const createData: CreateProcessData = {
          ...baseData,
          clients: selectedClients.length > 0 ? selectedClients : undefined,
        };
        await onSave(createData);
      }

      onClose();
    } catch (error) {
      console.error('Error saving process:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addClient = () => {
    setSelectedClients(prev => [
      ...prev,
      { client_id: '', role: 'plaintiff' }
    ]);
  };

  const updateSelectedClient = (index: number, field: keyof SelectedClient, value: string) => {
    setSelectedClients(prev => 
      prev.map((client, i) => 
        i === index 
          ? { 
              ...client, 
              [field]: value,
              ...(field === 'client_id' && value ? { 
                client: clients.find(c => c.id === value) 
              } : {})
            }
          : client
      )
    );
  };

  const removeSelectedClient = (index: number) => {
    setSelectedClients(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {process ? 'Editar Processo' : 'Novo Processo'}
          </DialogTitle>
          <DialogDescription>
            {process 
              ? 'Edite as informações do processo jurídico.'
              : 'Preencha as informações para criar um novo processo jurídico.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Processo *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Ação de Cobrança - João Silva"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="processNumber">Número do Processo *</Label>
              <Input
                id="processNumber"
                value={processNumber}
                onChange={(e) => setProcessNumber(e.target.value)}
                placeholder="Ex: 1234567-89.2023.8.26.0001"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição detalhada do processo..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: Process['status']) => setStatus(value)}>
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
              <Select value={priority} onValueChange={(value: Process['priority']) => setPriority(value)}>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="court">Tribunal</Label>
              <Input
                id="court"
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                placeholder="Ex: 1ª Vara Cível de São Paulo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="judge">Juiz(a)</Label>
              <Input
                id="judge"
                value={judge}
                onChange={(e) => setJudge(e.target.value)}
                placeholder="Nome do(a) juiz(a)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="caseValue">Valor da Causa</Label>
              <Input
                id="caseValue"
                type="number"
                step="0.01"
                value={caseValue}
                onChange={(e) => setCaseValue(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadlineDate">Prazo</Label>
              <Input
                id="deadlineDate"
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
              />
            </div>
          </div>

          {!process && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Clientes Envolvidos</Label>
                <Button type="button" variant="outline" size="sm" onClick={addClient}>
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar Cliente
                </Button>
              </div>

              {selectedClients.map((selectedClient, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Select 
                      value={selectedClient.client_id}
                      onValueChange={(value) => updateSelectedClient(index, 'client_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-32">
                    <Select 
                      value={selectedClient.role}
                      onValueChange={(value: 'plaintiff' | 'defendant' | 'witness' | 'other') => 
                        updateSelectedClient(index, 'role', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plaintiff">Autor</SelectItem>
                        <SelectItem value="defendant">Réu</SelectItem>
                        <SelectItem value="witness">Testemunha</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSelectedClient(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                process ? 'Atualizar' : 'Criar Processo'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
