
import { useState } from 'react';
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
import { CreateTemplateData, Template } from '@/hooks/useTemplates';
import { Loader2 } from 'lucide-react';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTemplateData) => Promise<Template | null>;
  editingTemplate?: Template;
}

export const CreateTemplateModal = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  editingTemplate
}: CreateTemplateModalProps) => {
  const [formData, setFormData] = useState({
    name: editingTemplate?.name || '',
    description: editingTemplate?.description || '',
    category: editingTemplate?.category || 'civil',
    template_content: editingTemplate?.template_content || '',
    is_shared: editingTemplate?.is_shared || false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await onSubmit(formData);
      if (result) {
        onClose();
        // Reset form
        setFormData({
          name: '',
          description: '',
          category: 'civil',
          template_content: '',
          is_shared: false,
        });
      }
    } catch (error) {
      console.error('Error submitting template:', error);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTemplate ? 'Editar Template' : 'Novo Template'}
          </DialogTitle>
          <DialogDescription>
            {editingTemplate 
              ? 'Modifique as informações do template de petição.'
              : 'Crie um novo template de petição para usar nas execuções.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              rows={12}
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
                  {editingTemplate ? 'Salvando...' : 'Criando...'}
                </>
              ) : (
                editingTemplate ? 'Salvar Alterações' : 'Criar Template'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
