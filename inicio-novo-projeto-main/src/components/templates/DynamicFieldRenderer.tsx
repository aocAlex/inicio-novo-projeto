
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TemplateField } from '@/hooks/useTemplateFields';

interface DynamicFieldRendererProps {
  field: TemplateField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export const DynamicFieldRenderer = ({
  field,
  value,
  onChange,
  error,
}: DynamicFieldRendererProps) => {
  const [date, setDate] = useState<Date | undefined>(
    value ? new Date(value) : undefined
  );

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }
    return cleaned;
  };

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}/${match[4]}-${match[5]}`;
    }
    return cleaned;
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) {
      const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
      }
    } else if (cleaned.length === 10) {
      const match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/);
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
      }
    }
    return cleaned;
  };

  const handleInputChange = (newValue: string) => {
    let formattedValue = newValue;
    
    switch (field.field_type) {
      case 'cpf':
        formattedValue = formatCPF(newValue);
        break;
      case 'cnpj':
        formattedValue = formatCNPJ(newValue);
        break;
      case 'phone':
        formattedValue = formatPhone(newValue);
        break;
      default:
        formattedValue = newValue;
    }
    
    onChange(formattedValue);
  };

  const handleDateChange = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    onChange(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '');
  };

  const renderField = () => {
    switch (field.field_type) {
      case 'text':
      case 'email':
        return (
          <Input
            type={field.field_type}
            value={value || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={field.default_value || ''}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.default_value || ''}
            rows={3}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.default_value || ''}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'phone':
      case 'cpf':
      case 'cnpj':
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={field.default_value || ''}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal ${
                  !date && "text-muted-foreground"
                } ${error ? 'border-red-500' : ''}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: ptBR }) : 
                  (field.default_value || "Selecione uma data")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.default_value || "Selecione uma opção"} />
            </SelectTrigger>
            <SelectContent>
              {field.field_options?.options?.map((option: string, index: number) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {field.field_options?.options?.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${index}`}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, option]);
                    } else {
                      onChange(selectedValues.filter((v: string) => v !== option));
                    }
                  }}
                />
                <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value === true || value === 'true'}
              onCheckedChange={(checked) => onChange(checked)}
            />
            <Label htmlFor={field.id}>
              {field.default_value || field.field_title}
            </Label>
          </div>
        );

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.default_value || ''}
            className={error ? 'border-red-500' : ''}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id} className="flex items-center gap-2">
        {field.field_title}
        {field.is_required && <span className="text-red-500">*</span>}
      </Label>
      
      {renderField()}
      
      {field.field_description && (
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>{field.field_description}</p>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
