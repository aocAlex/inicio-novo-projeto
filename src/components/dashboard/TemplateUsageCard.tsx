
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TemplateUsage } from '@/types/dashboard';

interface TemplateUsageCardProps {
  templates: TemplateUsage[];
  isLoading?: boolean;
}

export const TemplateUsageCard = ({ templates, isLoading }: TemplateUsageCardProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Templates Mais Usados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxExecutions = Math.max(...templates.map(t => t.executionCount), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Templates Mais Usados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum template encontrado
            </div>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {template.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {template.category}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {template.executionCount}
                  </span>
                </div>
                <Progress 
                  value={(template.executionCount / maxExecutions) * 100} 
                  className="h-2"
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
