
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { CreateFieldData, TemplateField } from '@/hooks/useTemplateFields';
import { Loader2, Plus, Info } from 'lucide-react';

interface CreateFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fieldData: CreateFieldData) => Promise<TemplateField | null>;
  isLoading: boolean;
  editField?: TemplateField;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texto Simples', description: 'Uma linha de texto' },
  { value: 'textarea', label: 'Texto Longo', description: 'Múltiplas linhas de texto' },
  { value: 'number', label: 'Número', description: 'Valores numéricos' },
  { value: 'date', label: 'Data', description: 'Seleção de data' },
  { value: 'email', label: 'E-mail', description: 'Endereço de e-mail' },
  { value: 'phone', label: 'Telefone', description: 'Número de telefone' },
  { value: 'cpf', label: 'CPF', description: 'Documento CPF' },
  { value: 'cnpj', label: 'CNPJ', description: 'Documento CNPJ' },
  { value: 'select', label: 'Lista Suspensa', description: 'Seleção única de opções' },
  { value: 'multiselect', label: 'Múltipla Escolha', description: 'Seleção múltipla de opções' },
  { value: 'checkbox', label: 'Checkbox', description: 'Verdadeiro ou falso' },
] as const;

export const CreateFieldModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editField,
}: CreateFieldModalProps) => {
  const [formData, setFormData] = useState<CreateFieldData>({
    field_title: editField?.field_title || '',
    field_type: editField?.field_type || 'text',
    default_value: editField?.default_value || '',
    field_description: editField?.field_description || '',
    is_required: editField?.is_required || false,
    validation_rules: editField?.validation_rules || {},
    field_options: editField?.field_options || {},
  });

  const [options, setOptions] = useState<string[]>(
    editField?.field_options?.options || ['']
  );

  const isEdit = !!editField;
  const selectedFieldType = FIELD_TYPES.find(type => type.value === formData.field_type);
  const needsOptions = ['select', 'multiselect'].includes(formData.field_type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.field_title.trim()) {
      return;
    }
    if (!formData.field_description.trim()) {
      return;
    }

    // Preparar opções para campos que precisam
    let finalFieldOptions = formData.field_options;
    if (needsOptions) {
      const validOptions = options.filter(opt => opt.trim() !== '');
      if (validOptions.length === 0) {
        return;
      }
      finalFieldOptions = { ...formData.field_options, options: validOptions };
    }

    const fieldData: CreateFieldData = {
      ...formData,
      field_options: finalFieldOptions,
    };

    const result = await onSubmit(fieldData);
    if (result) {
      onClose();
      // Reset form
      setFormData({
        field_title: '',
        field_type: 'text',
        default_value: '',
        field_description: '',
        is_required: false,
        validation_rules: {},
        field_options: {},
      });
      setOptions(['']);
    }
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    if (options.length > 1) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Campo' : 'Adicionar Campo Personalizado'}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Modifique as informações do campo personalizado.'
              : 'Crie um novo campo personalizado para este template.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título do Campo */}
          <div className="space-y-2">
            <Label htmlFor="field_title">Título do Campo *</Label>
            <Input
              id="field_title"
              value={formData.field_title}
              onChange={(e) => setFormData(prev => ({ ...prev, field_title: e.target.value }))}
              placeholder="Ex: Nome do Cliente"
              required
            />
          </div>

          {/* Tipo de Campo */}
          <div className="space-y-2">
            <Label htmlFor="field_type">Tipo de Campo *</Label>
            <Select 
              value={formData.field_type} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                field_type: value as TemplateField['field_type'] 
              }))}
              disabled={isEdit} // Não permitir alterar tipo em edição
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFieldType && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Info className="h-4 w-4" />
                {selectedFieldType.description}
              </div>
            )}
          </div>

          {/* Valor Predefinido */}
          <div className="space-y-2">
            <Label htmlFor="default_value">Valor Predefinido</Label>
            <Input
              id="default_value"
              value={formData.default_value}
              onChange={(e) => setFormData(prev => ({ ...prev, default_value: e.target.value }))}
              placeholder="Ex: Não informado"
            />
            <p className="text-xs text-gray-500">
              Valor que aparecerá como padrão no campo durante o preenchimento
            </p>
          </div>

          {/* Opções para Select/Multiselect */}
          {needsOptions && (
            <div className="space-y-2">
              <Label>Opções *</Label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Opção ${index + 1}`}
                      required
                    />
                    {options.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOption}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Opção
                </Button>
              </div>
            </div>
          )}

          {/* Descrição do Campo */}
          <div className="space-y-2">
            <Label htmlFor="field_description">Descrição do Campo *</Label>
            <Textarea
              id="field_description"
              value={formData.field_description}
              onChange={(e) => setFormData(prev => ({ ...prev, field_description: e.target.value }))}
              placeholder="Ex: Digite o nome completo do cliente conforme consta no documento de identidade"
              rows={3}
              required
            />
            <p className="text-xs text-gray-500">
              Orientação que aparecerá para ajudar no preenchimento do campo
            </p>
          </div>

          {/* Campo Obrigatório */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_required"
              checked={formData.is_required}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_required: checked as boolean }))
              }
            />
            <Label htmlFor="is_required">Campo obrigatório</Label>
          </div>

          {/* Preview da Variável */}
          {formData.field_title && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <Label className="text-sm font-medium">Variável gerada:</Label>
              <code className="block mt-1 text-sm bg-white px-2 py-1 rounded border">
                {`{{${formData.field_title
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/[^a-z0-9\s]/g, '')
                  .trim()
                  .replace(/\s+/g, '_')
                  .substring(0, 50)
                }}}`}
              </code>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? 'Salvando...' : 'Criando...'}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {isEdit ? 'Salvar Alterações' : 'Adicionar Campo'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
