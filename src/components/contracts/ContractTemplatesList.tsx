
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContractTemplates } from '@/hooks/useContractTemplates';
import { ContractTemplateModal } from './ContractTemplateModal';
import { formatCurrency } from '@/utils/formatters';
import { FileText, Edit, Trash2, Plus, Copy } from 'lucide-react';
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

interface ContractTemplatesListProps {
  onUseTemplate?: (templateId: string) => void;
}

export const ContractTemplatesList: React.FC<ContractTemplatesListProps> = ({ 
  onUseTemplate 
}) => {
  const { templates, isLoading, deleteTemplate } = useContractTemplates();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const handleDelete = async (templateId: string) => {
    await deleteTemplate(templateId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'signed': return 'Assinado';
      case 'pending': return 'Pendente';
      case 'rejected': return 'Rejeitado';
      case 'expired': return 'Expirado';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
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

  return (
    <div className="space-y-6"> {/* Adjusted space-y */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8"> {/* Applied new header classes */}
        <div>
          <h3 className="text-lg font-semibold">Templates de Contratos</h3>
          <p className="text-sm text-gray-600">
            Templates pré-configurados para agilizar a criação de contratos
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="p-4 sm:p-6"> {/* Applied responsive padding */}
            <div className="text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h4 className="text-lg font-medium mb-2">Nenhum template encontrado</h4>
              <p className="text-sm mb-4">
                Crie templates de contratos para agilizar o processo de criação
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Template
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6"> {/* Applied new responsive grid classes */}
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.template_name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{template.contract_name}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {template.contract_type && (
                    <Badge variant="outline">
                      {template.contract_type}
                    </Badge>
                  )}
                  <Badge className={getStatusColor(template.default_status)}>
                    {getStatusLabel(template.default_status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6"> {/* Applied responsive padding */}
                <div className="space-y-3">
                  {template.contract_value && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Valor Padrão</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(template.contract_value)}
                      </p>
                    </div>
                  )}

                  {template.notes && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Observações</p>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {template.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    {onUseTemplate && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onUseTemplate(template.id)}
                        className="flex-1"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Usar Template
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o template "{template.template_name}"?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(template.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ContractTemplateModal
        open={showCreateModal || !!editingTemplate}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTemplate(null);
        }}
        template={editingTemplate}
      />
    </div>
  );
};
