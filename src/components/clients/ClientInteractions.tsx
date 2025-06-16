
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClientInteractions } from '@/hooks/useClientInteractions';
import { ClientInteraction } from '@/types/client';
import { Plus, Phone, Mail, Calendar, FileText, ClipboardList, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientInteractionsProps {
  clientId: string;
  onAddInteraction: () => void;
}

export const ClientInteractions = ({ clientId, onAddInteraction }: ClientInteractionsProps) => {
  const { interactions, isLoading, loadInteractions } = useClientInteractions(clientId);

  useEffect(() => {
    if (clientId) {
      loadInteractions(clientId);
    }
  }, [clientId, loadInteractions]);

  const getInteractionIcon = (type: string) => {
    const icons = {
      call: Phone,
      email: Mail,
      meeting: Calendar,
      note: FileText,
      task: ClipboardList,
      document: FolderOpen,
    };
    const Icon = icons[type as keyof typeof icons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getInteractionColor = (type: string) => {
    const colors = {
      call: 'bg-green-100 text-green-800',
      email: 'bg-blue-100 text-blue-800',
      meeting: 'bg-purple-100 text-purple-800',
      note: 'bg-gray-100 text-gray-800',
      task: 'bg-orange-100 text-orange-800',
      document: 'bg-indigo-100 text-indigo-800',
    };
    return colors[type as keyof typeof colors] || colors.note;
  };

  const getInteractionLabel = (type: string) => {
    const labels = {
      call: 'Ligação',
      email: 'Email',
      meeting: 'Reunião',
      note: 'Anotação',
      task: 'Tarefa',
      document: 'Documento',
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Histórico de Interações</CardTitle>
          <Button onClick={onAddInteraction} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nova Interação
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {interactions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">Nenhuma interação registrada</p>
            <Button onClick={onAddInteraction} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeira Interação
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {interactions.map((interaction) => (
              <div key={interaction.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-full ${getInteractionColor(interaction.interaction_type)}`}>
                      {getInteractionIcon(interaction.interaction_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getInteractionColor(interaction.interaction_type)}>
                          {getInteractionLabel(interaction.interaction_type)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {format(new Date(interaction.interaction_date), 'PPP à p', { locale: ptBR })}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        {interaction.subject}
                      </h4>
                      {interaction.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {interaction.description}
                        </p>
                      )}
                      {interaction.creator && (
                        <p className="text-xs text-gray-500">
                          Por {interaction.creator.full_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
