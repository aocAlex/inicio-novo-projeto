
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Edit, 
  Trash2, 
  Play,
  Share2,
  Copy
} from 'lucide-react';
import { Template } from '@/hooks/useTemplates';

interface TemplateListProps {
  templates: Template[];
  isLoading: boolean;
  onEdit: (template: Template) => void;
  onDelete: (templateId: string) => void;
  onExecute: (template: Template) => void;
}

export const TemplateList = ({ 
  templates, 
  isLoading, 
  onEdit, 
  onDelete, 
  onExecute 
}: TemplateListProps) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'civil': return 'bg-blue-100 text-blue-800';
      case 'criminal': return 'bg-red-100 text-red-800';
      case 'trabalhista': return 'bg-green-100 text-green-800';
      case 'tributario': return 'bg-yellow-100 text-yellow-800';
      case 'familia': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = (templateId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este template?')) {
      onDelete(templateId);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum template encontrado
          </h3>
          <p className="text-gray-600">
            Crie seu primeiro template de petição para começar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <Card key={template.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="mt-1">
                  {template.description || 'Sem descrição'}
                </CardDescription>
              </div>
              {template.is_shared && (
                <Share2 className="h-4 w-4 text-blue-600" />
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <Badge className={getCategoryColor(template.category)}>
                {template.category}
              </Badge>
              <Badge variant="outline">
                {template.execution_count} execuções
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => onExecute(template)}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-1" />
                Executar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(template)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(template.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Preview do conteúdo */}
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs font-mono">
              {template.template_content.slice(0, 100)}...
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
