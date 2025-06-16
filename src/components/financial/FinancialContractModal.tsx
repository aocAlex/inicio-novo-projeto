
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancialContracts } from '@/hooks/useFinancialContracts';
import { useClients } from '@/hooks/useClients';
import { useProcesses } from '@/hooks/useProcesses';
import { FinancialContract, CreateFinancialContractData } from '@/types/financial';
import { formatCurrency } from '@/utils/formatters';

interface FinancialContractModalProps {
  open: boolean;
  onClose: () => void;
  contract?: FinancialContract | null;
}

export const FinancialContractModal: React.FC<FinancialContractModalProps> = ({ 
  open, 
  onClose, 
  contract 
}) => {
  const { createContract, updateContract } = useFinancialContracts();
  const { clients } = useClients();
  const { processes } = useProcesses();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<CreateFinancialContractData>({
    client_id: '',
    process_id: '',
    contract_type: 'fixed',
    fixed_amount: 0,
    hourly_rate: 0,
    success_percentage: 0,
    estimated_hours: 0,
    contract_value: 0,
    payment_schedule: 'upfront',
    installments: 1,
    signed_date: '',
    start_date: '',
    end_date: '',
    notes: ''
  });

  useEffect(() => {
    if (contract) {
      setFormData({
        client_id: contract.client_id || '',
        process_id: contract.process_id || '',
        contract_type: contract.contract_type,
        fixed_amount: contract.fixed_amount || 0,
        hourly_rate: contract.hourly_rate || 0,
        success_percentage: contract.success_percentage || 0,
        estimated_hours: contract.estimated_hours || 0,
        contract_value: contract.contract_value || 0,
        payment_schedule: contract.payment_schedule,
        installments: contract.installments,
        signed_date: contract.signed_date || '',
        start_date: contract.start_date || '',
        end_date: contract.end_date || '',
        notes: contract.notes || ''
      });
    } else {
      setFormData({
        client_id: '',
        process_id: '',
        contract_type: 'fixed',
        fixed_amount: 0,
        hourly_rate: 0,
        success_percentage: 0,
        estimated_hours: 0,
        contract_value: 0,
        payment_schedule: 'upfront',
        installments: 1,
        signed_date: '',
        start_date: '',
        end_date: '',
        notes: ''
      });
    }
  }, [contract, open]);

  // Calculate contract value based on type
  useEffect(() => {
    let calculatedValue = 0;
    
    switch (formData.contract_type) {
      case 'fixed':
        calculatedValue = formData.fixed_amount || 0;
        break;
      case 'hourly':
        calculatedValue = (formData.hourly_rate || 0) * (formData.estimated_hours || 0);
        break;
      case 'ad_exitum':
        // For ad exitum, we can't calculate until we know the case result
        calculatedValue = 0;
        break;
      case 'hybrid':
        calculatedValue = (formData.fixed_amount || 0) + 
          ((formData.hourly_rate || 0) * (formData.estimated_hours || 0));
        break;
    }
    
    if (calculatedValue !== formData.contract_value) {
      setFormData(prev => ({ ...prev, contract_value: calculatedValue }));
    }
  }, [formData.contract_type, formData.fixed_amount, formData.hourly_rate, formData.estimated_hours]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id) {
      return;
    }

    setIsLoading(true);
    
    try {
      if (contract) {
        await updateContract(contract.id, formData);
      } else {
        await createContract(formData);
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContractTypeFields = () => {
    switch (formData.contract_type) {
      case 'fixed':
        return (
          <div className="space-y-2">
            <Label htmlFor="fixed_amount">Valor Fixo *</Label>
            <Input
              id="fixed_amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.fixed_amount}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                fixed_amount: parseFloat(e.target.value) || 0 
              }))}
              placeholder="Ex: 15000.00"
              required
            />
          </div>
        );

      case 'hourly':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Valor por Hora *</Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                min="0"
                value={formData.hourly_rate}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  hourly_rate: parseFloat(e.target.value) || 0 
                }))}
                placeholder="Ex: 350.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Horas Estimadas</Label>
              <Input
                id="estimated_hours"
                type="number"
                min="0"
                value={formData.estimated_hours}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  estimated_hours: parseInt(e.target.value) || 0 
                }))}
                placeholder="Ex: 50"
              />
            </div>
          </>
        );

      case 'ad_exitum':
        return (
          <div className="space-y-2">
            <Label htmlFor="success_percentage">Percentual sobre o Êxito (%)</Label>
            <Input
              id="success_percentage"
              type="number"
              step="0.01"
              min="0"
              max="50"
              value={formData.success_percentage}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                success_percentage: parseFloat(e.target.value) || 0 
              }))}
              placeholder="Ex: 30"
            />
          </div>
        );

      case 'hybrid':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="fixed_amount">Valor Fixo Mínimo</Label>
              <Input
                id="fixed_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.fixed_amount}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  fixed_amount: parseFloat(e.target.value) || 0 
                }))}
                placeholder="Ex: 5000.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="success_percentage">Percentual sobre o Êxito (%)</Label>
              <Input
                id="success_percentage"
                type="number"
                step="0.01"
                min="0"
                max="50"
                value={formData.success_percentage}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  success_percentage: parseFloat(e.target.value) || 0 
                }))}
                placeholder="Ex: 20"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contract ? 'Editar Contrato' : 'Novo Contrato de Honorários'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
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

            <div className="space-y-2">
              <Label htmlFor="process_id">Processo (opcional)</Label>
              <Select
                value={formData.process_id}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  process_id: value === 'none' ? '' : value 
                }))}
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
              <Label htmlFor="contract_type">Tipo de Honorário *</Label>
              <Select
                value={formData.contract_type}
                onValueChange={(value: any) => setFormData(prev => ({ 
                  ...prev, 
                  contract_type: value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Honorários Fixos</SelectItem>
                  <SelectItem value="hourly">Por Hora</SelectItem>
                  <SelectItem value="ad_exitum">Ad Exitum</SelectItem>
                  <SelectItem value="hybrid">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_schedule">Forma de Pagamento</Label>
              <Select
                value={formData.payment_schedule}
                onValueChange={(value: any) => setFormData(prev => ({ 
                  ...prev, 
                  payment_schedule: value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upfront">À Vista</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="milestone">Por Etapas</SelectItem>
                  <SelectItem value="success">Após Êxito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Campos específicos por tipo de contrato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderContractTypeFields()}
          </div>

          {formData.payment_schedule !== 'upfront' && (
            <div className="space-y-2">
              <Label htmlFor="installments">Número de Parcelas</Label>
              <Input
                id="installments"
                type="number"
                min="1"
                value={formData.installments}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  installments: parseInt(e.target.value) || 1 
                }))}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signed_date">Data de Assinatura</Label>
              <Input
                id="signed_date"
                type="date"
                value={formData.signed_date}
                onChange={(e) => setFormData(prev => ({ ...prev, signed_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>

          {formData.contract_value > 0 && (
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-800">
                Valor Total Estimado: {formatCurrency(formData.contract_value)}
              </div>
              {formData.installments > 1 && (
                <div className="text-sm text-green-600">
                  {formData.installments}x de {formatCurrency(formData.contract_value / formData.installments)}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações sobre o contrato..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : contract ? 'Atualizar' : 'Criar Contrato'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
