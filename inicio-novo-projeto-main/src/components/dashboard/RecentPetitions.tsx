
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PetitionActivity } from '@/types/dashboard';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecentPetitionsProps {
  petitions: PetitionActivity[];
  isLoading?: boolean;
}

export const RecentPetitions = ({ petitions, isLoading }: RecentPetitionsProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Sucesso';
      case 'failed':
        return 'Falhou';
      case 'pending':
        return 'Pendente';
      default:
        return 'Desconhecido';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Petições Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Petições Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {petitions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma petição encontrada
            </div>
          ) : (
            petitions.map((petition) => (
              <div key={petition.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {petition.templateName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {petition.templateName}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    Cliente: {petition.clientName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(petition.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <Badge className={getStatusColor(petition.status)}>
                  {getStatusText(petition.status)}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
