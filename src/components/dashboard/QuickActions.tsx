
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Briefcase, 
  FileText, 
  Zap,
  Plus
} from 'lucide-react';

interface QuickActionsProps {
  onCreateClient: () => void;
  onCreateProcess: () => void;
  onCreateTemplate: () => void;
  onExecutePetition: () => void;
}

export const QuickActions = ({ 
  onCreateClient, 
  onCreateProcess, 
  onCreateTemplate, 
  onExecutePetition 
}: QuickActionsProps) => {
  const actions = [
    {
      title: 'Novo Cliente',
      description: 'Cadastrar cliente no CRM',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      onClick: onCreateClient,
    },
    {
      title: 'Novo Processo',
      description: 'Criar processo jurídico',
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      onClick: onCreateProcess,
    },
    {
      title: 'Novo Template',
      description: 'Criar template de petição',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      onClick: onCreateTemplate,
    },
    {
      title: 'Executar Petição',
      description: 'Gerar documento automaticamente',
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      onClick: onExecutePetition,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-shadow"
                onClick={action.onClick}
              >
                <div className={`p-2 rounded-lg ${action.bgColor}`}>
                  <Icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{action.title}</p>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
