import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CustomFieldDefinition } from '@/types/client';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface ContractCustomFieldsFormProps {
  customFields: CustomFieldDefinition[];
  onChange: (fields: CustomFieldDefinition[]) => void;
}

export const ContractCustomFieldsForm: React.FC<ContractCustomFieldsFormProps> = ({
  customFields,
  onChange
}) => {
  const { currentWorkspace } = useWorkspace();
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState<Partial<CustomFieldDefinition>>({
    field_key: '',
    field_label: '',
    field_type: 'text',
    is_required: false,
    field_options: {
      placeholder: '',
      options: []
    },
    display_order: customFields.length
  });
  const [optionInput, setOptionInput] = useState('');

  const handleAddField = () => {
    if (!newField.field_label || !newField.field_key) {
      return;
    }

    const fieldToAdd: CustomFieldDefinition = {
      id: uuidv4(),
      workspace_id: currentWorkspace?.id || '',
      field_key: newField.field_key || `field_${Date.now()}`,
      field_label: newField.field_label || 'Novo Campo',
      field_type: newField.field_type as CustomFieldDefinition['field_type'] || 'text',
      is_required: newField.is_required || false,
      field_options: {
        placeholder: newField.field_options?.placeholder || '',
        options: newField.field_options?.options || [],
        min: newField.field_options?.min,
        max: newField.field_options?.max
      },
      display_order: customFields.length,
      is_active: true,
      created_at: new Date().toISOString()
    };

    onChange([...customFields, fieldToAdd]);
    setNewField({
      field_key: '',
      field_label: '',
      field_type: 'text',
      is_required: false,
      field_options: {
        placeholder: '',
        options: []
      },
      display_order: customFields.length + 1
    });
    setOptionInput('');
    setShowAddField(false);
  };

  const handleRemoveField = (id: string) => {
    onChange(customFields.filter(field => field.id !== id));
  };

  const handleAddOption = () => {
    if (!optionInput.trim()) return;

    setNewField(prev => ({
      ...prev,
      field_options: {
        ...prev.field_options,
        options: [...(prev.field_options?.options || []), optionInput.trim()]
      }
    }));
    setOptionInput('');
  };

  const handleRemoveOption = (option: string) => {
    setNewField(prev => ({
      ...prev,
      field_options: {
        ...prev.field_options,
        options: (prev.field_options?.options || []).filter(opt => opt !== option)
      }
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Campos Personalizados</h3>
        {!showAddField && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddField(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Campo
          </Button>
        )}
      </div>

      {customFields.length > 0 ? (
        <div className="space-y-4">
          {customFields.map((field) => (
            <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{field.field_label}</p>
                <p className="text-sm text-gray-600">
                  Tipo: {field.field_type}
                  {field.is_required && ' (Obrigatório)'}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleRemoveField(field.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">
          Nenhum campo personalizado definido
        </p>
      )}

      {showAddField && (
        <>
          <Separator />
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium">Adicionar Novo Campo</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="field_label">Nome do Campo *</Label>
                <Input
                  id="field_label"
                  value={newField.field_label}
                  onChange={(e) => setNewField(prev => ({ ...prev, field_label: e.target.value }))}
                  placeholder="Ex: Número da Apólice"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field_key">Chave do Campo *</Label>
                <Input
                  id="field_key"
                  value={newField.field_key}
                  onChange={(e) => setNewField(prev => ({ ...prev, field_key: e.target.value.replace(/\s+/g, '_').toLowerCase() }))}
                  placeholder="Ex: numero_apolice"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field_type">Tipo de Campo</Label>
                <Select
                  value={newField.field_type}
                  onValueChange={(value: CustomFieldDefinition['field_type']) => setNewField(prev => ({ ...prev, field_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="textarea">Área de Texto</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="date">Data</SelectItem>
                    <SelectItem value="select">Seleção</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Telefone</SelectItem>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="placeholder">Placeholder</Label>
                <Input
                  id="placeholder"
                  value={newField.field_options?.placeholder || ''}
                  onChange={(e) => setNewField(prev => ({
                    ...prev,
                    field_options: {
                      ...prev.field_options,
                      placeholder: e.target.value
                    }
                  }))}
                  placeholder="Ex: Digite o número da apólice"
                />
              </div>

              {newField.field_type === 'number' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="min">Valor Mínimo</Label>
                    <Input
                      id="min"
                      type="number"
                      value={newField.field_options?.min || ''}
                      onChange={(e) => setNewField(prev => ({
                        ...prev,
                        field_options: {
                          ...prev.field_options,
                          min: e.target.value ? Number(e.target.value) : undefined
                        }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max">Valor Máximo</Label>
                    <Input
                      id="max"
                      type="number"
                      value={newField.field_options?.max || ''}
                      onChange={(e) => setNewField(prev => ({
                        ...prev,
                        field_options: {
                          ...prev.field_options,
                          max: e.target.value ? Number(e.target.value) : undefined
                        }
                      }))}
                    />
                  </div>
                </>
              )}

              {newField.field_type === 'select' && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Opções</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      placeholder="Adicionar opção"
                    />
                    <Button type="button" onClick={handleAddOption}>
                      Adicionar
                    </Button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {newField.field_options?.options?.map((option, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span>{option}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOption(option)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_required"
                    checked={newField.is_required}
                    onCheckedChange={(checked) => setNewField(prev => ({ ...prev, is_required: !!checked }))}
                  />
                  <Label htmlFor="is_required">Campo obrigatório</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddField(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleAddField}>
                Adicionar Campo
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
