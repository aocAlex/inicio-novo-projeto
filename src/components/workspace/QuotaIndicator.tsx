
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Infinity, AlertTriangle, CheckCircle } from 'lucide-react';

interface QuotaIndicatorProps {
  used: number;
  total: number;
  isUnlimited?: boolean;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const QuotaIndicator: React.FC<QuotaIndicatorProps> = ({ 
  used, 
  total, 
  isUnlimited = false, 
  showDetails = true,
  size = 'md'
}) => {
  if (isUnlimited) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1">
              <Infinity className="h-3 w-3" />
              Ilimitado
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Você tem workspaces ilimitadas</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const percentage = (used / total) * 100;
  const available = total - used;
  
  const getStatusIcon = () => {
    if (percentage >= 100) return <AlertTriangle className="h-3 w-3 text-red-500" />;
    if (percentage >= 80) return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
    return <CheckCircle className="h-3 w-3 text-green-500" />;
  };

  const getStatusColor = () => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1">
              {getStatusIcon()}
              {used}/{total}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">Workspaces utilizadas</p>
              <p>{used} de {total} workspaces</p>
              <p className="text-sm text-gray-500">
                {available} disponíveis
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className={getStatusColor()}>
          Workspaces: {used}/{total}
        </span>
        <span className="text-gray-500">
          {available} disponíveis
        </span>
      </div>
      <Progress 
        value={percentage} 
        className={`h-2 ${size === 'sm' ? 'h-1' : size === 'lg' ? 'h-3' : 'h-2'}`}
      />
      {percentage >= 80 && (
        <div className="flex items-center gap-1 text-xs">
          {getStatusIcon()}
          <span className={getStatusColor()}>
            {percentage >= 100 ? 'Limite atingido' : 'Próximo do limite'}
          </span>
        </div>
      )}
    </div>
  );
};
