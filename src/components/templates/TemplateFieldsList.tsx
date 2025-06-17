
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TemplateField, useTemplateFields } from '@/hooks/useTemplateFields';
import { CreateFieldModal } from './CreateFieldModal';
import { Plus, Edit, Trash2, GripVertical, Type, Hash, Calendar, Mail, Phone, CreditCard, Building, List, CheckSquare, FileText } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TemplateFieldsListProps {
  templateId: string;
}

const getFieldIcon = (type: TemplateField['field_type']) => {
  const iconMap = {
    text: Type,
    textarea: FileText,
    number: Hash,
    date: Calendar,
    email: Mail,
    phone: Phone,
    cpf: CreditCard,
    cnpj: Building,
    select: List,
    multiselect: List,
    checkbox: CheckSquare,
  };
  
  const Icon = iconMap[type] || Type;
  return <Icon className="h-4 w-4" />;
};

const getFieldTypeLabel = (type: TemplateField['field_type']) => {
  const labelMap = {
    text: 'Texto',
    textarea: 'Texto Longo',
    number: 'Número',
    date: 'Data',
    email: 'E-mail',
    phone: 'Telefone',
    cpf: 'CPF',
    cnpj: 'CNPJ',
    select: 'Lista',
    multiselect: 'Múltipla Escolha',
    checkbox: 'Checkbox',
  };
  
  return labelMap[type] || type;
};

export const TemplateFieldsList = ({ templateId }: TemplateFieldsListProps) => {
  const { fields, isLoading, createField, updateField, deleteField } = useTemplateFields(templateId);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<TemplateField | null>(null);

  const handleCreateField = async (fieldData: any) => {
    return await createField(fieldData);
  };

  const handleUpdateField = async (fieldData: any) => {
    if (!editingField) return null;
    const success = await updateField(editingField.id, fieldData);
    if (success) {
      setEditingField(null);
      return { ...editingField, ...fieldData };
    }
    return null;
  };

  const handleDeleteField = async (fieldId: string) => {
    await deleteField(fieldId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Campos Personalizados</h3>
          <p className="text-sm text-gray-600">
            Configure os campos que aparecerão no formulário de preenchimento
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Campo
        </Button>
      </div>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Type className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h4 className="text-lg font-medium mb-2">Nenhum campo personalizado</h4>
              <p className="text-sm mb-4">
                Adicione campos personalizados para tornar seus templates mais dinâmicos
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Campo
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {fields.map((field) => (
            <Card key={field.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      {getFieldIcon(field.field_type)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{field.field_title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          {getFieldTypeLabel(field.field_type)}
                        </Badge>
                        {field.is_required && (
                          <Badge variant="destructive" className="text-xs">
                            Obrigatório
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingField(field)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o campo "{field.field_title}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteField(field.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Valor Predefinido */}
                  {field.default_value && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Valor Predefinido
                      </label>
                      <div className="mt-1 p-2 bg-gray-50 rounded text-sm font-mono">
                        "{field.default_value}"
                      </div>
                    </div>
                  )}

                  {/* Descrição */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Descrição
                    </label>
                    <p className="mt-1 text-sm text-gray-700">
                      {field.field_description}
                    </p>
                  </div>

                  {/* Opções (para select/multiselect) */}
                  {field.field_options?.options && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Opções
                      </label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {field.field_options.options.map((option: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {option}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Variável */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Variável
                    </label>
                    <code className="block mt-1 text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      {`{{${field.field_key}}}`}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação/Edição */}
      <CreateFieldModal
        isOpen={isCreateModalOpen || !!editingField}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingField(null);
        }}
        onSubmit={editingField ? handleUpdateField : handleCreateField}
        isLoading={isLoading}
        editField={editingField || undefined}
      />
    </div>
  );
};
