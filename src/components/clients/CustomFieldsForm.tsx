
import { Control, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CustomFieldDefinition } from '@/types/client';

interface CustomFieldsFormProps {
  control: Control<any>;
  customFields: CustomFieldDefinition[];
}

export const CustomFieldsForm = ({ control, customFields }: CustomFieldsFormProps) => {
  const renderField = (field: CustomFieldDefinition) => {
    const fieldName = `custom_fields.${field.field_key}`;

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'cpf':
      case 'cnpj':
        return (
          <Controller
            name={fieldName}
            control={control}
            rules={{ required: field.is_required }}
            render={({ field: formField, fieldState }) => (
              <div>
                <Label htmlFor={field.field_key}>
                  {field.field_label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  {...formField}
                  id={field.field_key}
                  type={field.field_type === 'email' ? 'email' : 'text'}
                  placeholder={field.field_options.placeholder}
                  className={fieldState.error ? 'border-red-500' : ''}
                />
                {fieldState.error && (
                  <p className="text-sm text-red-500 mt-1">Este campo é obrigatório</p>
                )}
              </div>
            )}
          />
        );

      case 'textarea':
        return (
          <Controller
            name={fieldName}
            control={control}
            rules={{ required: field.is_required }}
            render={({ field: formField, fieldState }) => (
              <div>
                <Label htmlFor={field.field_key}>
                  {field.field_label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Textarea
                  {...formField}
                  id={field.field_key}
                  placeholder={field.field_options.placeholder}
                  className={fieldState.error ? 'border-red-500' : ''}
                />
                {fieldState.error && (
                  <p className="text-sm text-red-500 mt-1">Este campo é obrigatório</p>
                )}
              </div>
            )}
          />
        );

      case 'number':
        return (
          <Controller
            name={fieldName}
            control={control}
            rules={{ 
              required: field.is_required,
              min: field.field_options.min,
              max: field.field_options.max
            }}
            render={({ field: formField, fieldState }) => (
              <div>
                <Label htmlFor={field.field_key}>
                  {field.field_label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  {...formField}
                  id={field.field_key}
                  type="number"
                  min={field.field_options.min}
                  max={field.field_options.max}
                  placeholder={field.field_options.placeholder}
                  className={fieldState.error ? 'border-red-500' : ''}
                />
                {fieldState.error && (
                  <p className="text-sm text-red-500 mt-1">
                    {fieldState.error.type === 'required' ? 'Este campo é obrigatório' :
                     fieldState.error.type === 'min' ? `Valor mínimo: ${field.field_options.min}` :
                     fieldState.error.type === 'max' ? `Valor máximo: ${field.field_options.max}` :
                     'Valor inválido'}
                  </p>
                )}
              </div>
            )}
          />
        );

      case 'date':
        return (
          <Controller
            name={fieldName}
            control={control}
            rules={{ required: field.is_required }}
            render={({ field: formField, fieldState }) => (
              <div>
                <Label htmlFor={field.field_key}>
                  {field.field_label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  {...formField}
                  id={field.field_key}
                  type="date"
                  className={fieldState.error ? 'border-red-500' : ''}
                />
                {fieldState.error && (
                  <p className="text-sm text-red-500 mt-1">Este campo é obrigatório</p>
                )}
              </div>
            )}
          />
        );

      case 'select':
        return (
          <Controller
            name={fieldName}
            control={control}
            rules={{ required: field.is_required }}
            render={({ field: formField, fieldState }) => (
              <div>
                <Label htmlFor={field.field_key}>
                  {field.field_label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Select
                  value={formField.value || ''}
                  onValueChange={formField.onChange}
                >
                  <SelectTrigger className={fieldState.error ? 'border-red-500' : ''}>
                    <SelectValue placeholder={field.field_options.placeholder || 'Selecione...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.field_options.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.error && (
                  <p className="text-sm text-red-500 mt-1">Este campo é obrigatório</p>
                )}
              </div>
            )}
          />
        );

      case 'checkbox':
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field: formField }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={field.field_key}
                  checked={formField.value || false}
                  onCheckedChange={formField.onChange}
                />
                <Label htmlFor={field.field_key}>
                  {field.field_label}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </Label>
              </div>
            )}
          />
        );

      default:
        return null;
    }
  };

  if (customFields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Campos Personalizados</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {customFields.map((field) => (
          <div key={field.id}>
            {renderField(field)}
          </div>
        ))}
      </div>
    </div>
  );
};
