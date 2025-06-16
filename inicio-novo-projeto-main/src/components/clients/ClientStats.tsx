
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Star, TrendingUp } from 'lucide-react';

interface ClientStatsProps {
  totalClients: number;
  leadCount: number;
  prospectCount: number;
  activeCount: number;
  avgLeadScore: number;
}

export const ClientStats = ({
  totalClients,
  leadCount,
  prospectCount,
  activeCount,
  avgLeadScore
}: ClientStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold">{totalClients}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Leads</p>
              <p className="text-2xl font-bold">{leadCount}</p>
            </div>
            <Star className="h-8 w-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Prospects</p>
              <p className="text-2xl font-bold">{prospectCount}</p>
            </div>
            <UserCheck className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ativos</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Score Médio</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{avgLeadScore.toFixed(0)}</p>
                <Badge variant={avgLeadScore >= 70 ? 'default' : avgLeadScore >= 50 ? 'secondary' : 'destructive'}>
                  {avgLeadScore >= 70 ? 'Alto' : avgLeadScore >= 50 ? 'Médio' : 'Baixo'}
                </Badge>
              </div>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
