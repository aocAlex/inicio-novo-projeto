
import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePetitionTemplates } from '@/hooks/usePetitionTemplates';
import { TemplateFieldsList } from './TemplateFieldsList';
import { CreateTemplateData, PetitionTemplate } from '@/types/templates';
import { Loader2, FileText, Settings } from 'lucide-react';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTemplate?: PetitionTemplate;
}

const CATEGORIES = [
  { value: 'civil', label: 'Cível' },
  { value: 'criminal', label: 'Criminal' },
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'tributario', label: 'Tributário' },
  { value: 'empresarial', label: 'Empresarial' },
  { value: 'familia', label: 'Família' },
];

export const CreateTemplateModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editTemplate 
}: CreateTemplateModalProps) => {
  const [formData, setFormData] = useState<CreateTemplateData>({
    name: '',
    description: '',
    category: 'civil',
    template_content: '',
    is_shared: false,
    webhook_url: '',
    webhook_enabled: false,
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [templateId, setTemplateId] = useState<string | null>(null);

  const { createTemplate, updateTemplate, isLoading } = usePetitionTemplates();

  const isEdit = !!editTemplate;

  useEffect(() => {
    if (editTemplate) {
      setFormData({
        name: editTemplate.name,
        description: editTemplate.description || '',
        category: editTemplate.category as any,
        template_content: editTemplate.template_content,
        is_shared: editTemplate.is_shared,
        webhook_url: editTemplate.webhook_url || '',
        webhook_enabled: editTemplate.webhook_enabled || false,
      });
      setTemplateId(editTemplate.id);
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'civil',
        template_content: '',
        is_shared: false,
        webhook_url: '',
        webhook_enabled: false,
      });
      setTemplateId(null);
    }
  }, [editTemplate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEdit && editTemplate) {
        const success = await updateTemplate(editTemplate.id, formData);
        if (success) {
          onSuccess();
        }
      } else {
        const newTemplate = await createTemplate(formData);
        if (newTemplate) {
          setTemplateId(newTemplate.id);
          setActiveTab('fields');
        }
      }
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleClose = () => {
    setActiveTab('basic');
    setTemplateId(null);
    onClose();
  };

  const canNavigateToFields = templateId || isEdit;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Template' : 'Criar Novo Template'}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Modifique as informações do template de petição.'
              : 'Configure um novo template de petição com campos personalizados.'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Informações Básicas
            </TabsTrigger>
            <TabsTrigger 
              value="fields" 
              disabled={!canNavigateToFields}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Campos Personalizados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 mt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome do Template */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Template *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Petição Inicial de Cobrança"
                  required
                />
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o propósito e uso deste template"
                  rows={3}
                />
              </div>

              {/* Conteúdo do Template */}
              <div className="space-y-2">
                <Label htmlFor="template_content">Conteúdo do Template *</Label>
                <Textarea
                  id="template_content"
                  value={formData.template_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_content: e.target.value }))}
                  placeholder="Digite o conteúdo do template. Use {{nome_variavel}} para campos dinâmicos."
                  rows={8}
                  required
                />
                <p className="text-xs text-gray-500">
                  Use variáveis no formato {`{{nome_campo}}`} para criar campos dinâmicos. 
                  Você poderá configurar estes campos na próxima etapa.
                </p>
              </div>

              {/* Configurações de Webhook */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="webhook_enabled"
                    checked={formData.webhook_enabled}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, webhook_enabled: checked as boolean }))
                    }
                  />
                  <Label htmlFor="webhook_enabled">Habilitar Webhook</Label>
                </div>

                {formData.webhook_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="webhook_url">URL do Webhook</Label>
                    <Input
                      id="webhook_url"
                      value={formData.webhook_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                      placeholder="https://sua-instancia.n8n.cloud/webhook/seu-webhook"
                    />
                    <p className="text-xs text-gray-500">
                      URL para onde os dados serão enviados automaticamente após a execução
                    </p>
                  </div>
                )}
              </div>

              {/* Template Compartilhado */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_shared"
                  checked={formData.is_shared}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_shared: checked as boolean }))
                  }
                />
                <Label htmlFor="is_shared">Template compartilhado</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
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
                      <FileText className="mr-2 h-4 w-4" />
                      {isEdit ? 'Salvar Alterações' : 'Criar Template'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="fields" className="mt-6">
            {canNavigateToFields && templateId && (
              <div className="space-y-6">
                <TemplateFieldsList templateId={templateId} />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Fechar
                  </Button>
                  <Button onClick={onSuccess}>
                    Concluir
                  </Button>
                </DialogFooter>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
