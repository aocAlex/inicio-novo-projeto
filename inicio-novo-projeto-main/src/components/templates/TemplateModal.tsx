
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { CreateTemplateData, UpdateTemplateData } from '@/types/petition';
import { Loader2 } from 'lucide-react';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  templateId?: string;
}

export const TemplateModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  templateId 
}: TemplateModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'civil' as 'civil' | 'criminal' | 'trabalhista' | 'tributario' | 'empresarial' | 'familia',
    template_content: '',
    is_shared: false,
    webhook_url: '',
    webhook_enabled: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const { createTemplate, updateTemplate, getTemplate } = usePetitionTemplates();

  const isEditing = !!templateId;

  useEffect(() => {
    if (isOpen && templateId) {
      loadTemplate();
    } else if (isOpen) {
      // Reset form for new template
      setFormData({
        name: '',
        description: '',
        category: 'civil',
        template_content: '',
        is_shared: false,
        webhook_url: '',
        webhook_enabled: false,
      });
    }
  }, [isOpen, templateId]);

  const loadTemplate = async () => {
    if (!templateId) return;
    
    setLoadingTemplate(true);
    try {
      const template = await getTemplate(templateId);
      if (template) {
        setFormData({
          name: template.name,
          description: template.description || '',
          category: template.category,
          template_content: template.template_content,
          is_shared: template.is_shared,
          webhook_url: template.webhook_url || '',
          webhook_enabled: template.webhook_enabled || false,
        });
      }
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing && templateId) {
        const updateData: UpdateTemplateData = {
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category,
          template_content: formData.template_content,
          is_shared: formData.is_shared,
          webhook_url: formData.webhook_url || undefined,
          webhook_enabled: formData.webhook_enabled,
        };
        await updateTemplate(templateId, updateData);
      } else {
        const createData: CreateTemplateData = {
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category,
          template_content: formData.template_content,
          is_shared: formData.is_shared,
          webhook_url: formData.webhook_url || undefined,
          webhook_enabled: formData.webhook_enabled,
        };
        await createTemplate(createData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Template' : 'Novo Template'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifique as informações do template de petição.'
              : 'Crie um novo template de petição para usar nas execuções.'
            }
          </DialogDescription>
        </DialogHeader>

        {loadingTemplate ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando template...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Template</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: Petição Inicial - Ação de Cobrança"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="criminal">Criminal</SelectItem>
                    <SelectItem value="trabalhista">Trabalhista</SelectItem>
                    <SelectItem value="tributario">Tributário</SelectItem>
                    <SelectItem value="familia">Família</SelectItem>
                    <SelectItem value="empresarial">Empresarial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descreva para que serve este template..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template_content">Conteúdo do Template</Label>
              <Textarea
                id="template_content"
                value={formData.template_content}
                onChange={(e) => handleChange('template_content', e.target.value)}
                placeholder="Digite o conteúdo da petição. Use variáveis como {{cliente_nome}}, {{processo_numero}}, etc."
                rows={10}
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-500">
                Dica: Use variáveis como {`{{cliente_nome}}`}, {`{{processo_numero}}`}, {`{{valor_causa}}`} que serão substituídas na execução.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_shared"
                checked={formData.is_shared}
                onCheckedChange={(checked) => handleChange('is_shared', checked)}
              />
              <Label htmlFor="is_shared">
                Compartilhar com outros usuários do workspace
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Salvando...' : 'Criando...'}
                  </>
                ) : (
                  isEditing ? 'Salvar Alterações' : 'Criar Template'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
