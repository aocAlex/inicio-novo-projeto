import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Deadline, DeadlineFormData } from '@/types/deadline';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useWorkspaceOptions } from '@/hooks/useWorkspaceOptions';

interface DeadlineModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: DeadlineFormData) => Promise<Deadline | null>;
  deadline?: Deadline;
  processId?: string;
  clientId?: string;
}

export const DeadlineModal: React.FC<DeadlineModalProps> = ({
  open,
  onClose,
  onSave,
  deadline,
  processId,
  clientId
}) => {
  const { toast } = useToast();
  const { processes, clients, petitionTemplates, workspaceUsers } = useWorkspaceOptions();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<DeadlineFormData>({
    title: '',
    description: '',
    deadline_type: 'processual',
    due_date: new Date(),
    process_id: processId,
    client_id: clientId,
    petition_id: '',
    petition_execution_id: '',
    assigned_to: '',
    priority: 'MEDIUM',
    business_days_only: true,
    anticipation_days: 7,
    is_critical: false,
    custom_fields: {}
  });

  useEffect(() => {
    if (deadline) {
      setFormData({
        title: deadline.title,
        description: deadline.description || '',
        deadline_type: deadline.deadline_type,
        due_date: new Date(deadline.due_date),
        process_id: deadline.process_id,
        client_id: deadline.client_id,
        petition_id: deadline.petition_id || '',
        petition_execution_id: deadline.petition_execution_id || '',
        assigned_to: deadline.assigned_to || '',
        priority: deadline.priority,
        business_days_only: deadline.business_days_only,
        anticipation_days: deadline.anticipation_days,
        is_critical: deadline.is_critical,
        custom_fields: deadline.custom_fields || {}
      });
    } else {
      setFormData({
        title: '',
        description: '',
        deadline_type: 'processual',
        due_date: new Date(),
        process_id: processId,
        client_id: clientId,
        petition_id: '',
        petition_execution_id: '',
        assigned_to: '',
        priority: 'MEDIUM',
        business_days_only: true,
        anticipation_days: 7,
        is_critical: false,
        custom_fields: {}
      });
    }
  }, [deadline, processId, clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "Título é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error: any) {
      console.error('Error saving deadline:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {deadline ? 'Editar Prazo' : 'Criar Novo Prazo'}
          </DialogTitle>
          <DialogDescription>
            {deadline ? 'Edite as informações do prazo.' : 'Preencha as informações do novo prazo.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ex: Contestação - Processo 123"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição opcional do prazo"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="deadline_type">Tipo de Prazo</Label>
                <Select
                  value={formData.deadline_type}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, deadline_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="processual">Processual</SelectItem>
                    <SelectItem value="administrativo">Administrativo</SelectItem>
                    <SelectItem value="contratual">Contratual</SelectItem>
                    <SelectItem value="fiscal">Fiscal</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Baixa</SelectItem>
                    <SelectItem value="MEDIUM">Média</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="CRITICAL">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Seção de Vinculações */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Vinculações</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="process_id">Processo</Label>
                  <Select
                    value={formData.process_id || "none"}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      process_id: value === "none" ? undefined : value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar processo" />
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

                <div className="grid gap-2">
                  <Label htmlFor="client_id">Cliente</Label>
                  <Select
                    value={formData.client_id || "none"}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      client_id: value === "none" ? undefined : value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar cliente" />
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

                <div className="grid gap-2">
                  <Label htmlFor="petition_id">Template de Petição</Label>
                  <Select
                    value={formData.petition_id || "none"}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      petition_id: value === "none" ? undefined : value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar petição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma petição</SelectItem>
                      {petitionTemplates.map((petition) => (
                        <SelectItem key={petition.id} value={petition.id}>
                          {petition.name} ({petition.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="assigned_to">Responsável</Label>
                  <Select
                    value={formData.assigned_to || "none"}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      assigned_to: value === "none" ? undefined : value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum responsável</SelectItem>
                      {workspaceUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Data de Vencimento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.due_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? (
                      format(formData.due_date, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, due_date: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="business_days_only"
                  checked={formData.business_days_only}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, business_days_only: checked }))}
                />
                <Label htmlFor="business_days_only">Apenas dias úteis</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_critical"
                  checked={formData.is_critical}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_critical: checked }))}
                />
                <Label htmlFor="is_critical">Prazo crítico</Label>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="anticipation_days">Dias de Antecedência para Notificação</Label>
              <Input
                id="anticipation_days"
                type="number"
                min="1"
                max="30"
                value={formData.anticipation_days}
                onChange={(e) => setFormData(prev => ({ ...prev, anticipation_days: parseInt(e.target.value) || 7 }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deadline ? 'Atualizar' : 'Criar'} Prazo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
