
import { useState } from 'react';
import { DeadlineFilters, DeadlineFormData } from '@/types/deadline';
import { useDeadlinesQuery } from './deadlines/useDeadlinesQuery';
import { useCreateDeadline } from './deadlines/useCreateDeadline';
import { useUpdateDeadline } from './deadlines/useUpdateDeadline';
import { useCompleteDeadline } from './deadlines/useCompleteDeadline';
import { useDeleteDeadline } from './deadlines/useDeleteDeadline';
import { getUpcomingDeadlines, getOverdueDeadlines } from './deadlines/utils/deadlineHelpers';

export const useDeadlines = () => {
  const [filters, setFilters] = useState<DeadlineFilters>({});

  const {
    data: deadlines = [],
    isLoading,
    error,
    refetch
  } = useDeadlinesQuery(filters);

  const createDeadlineMutation = useCreateDeadline();
  const updateDeadlineMutation = useUpdateDeadline();
  const completeDeadlineMutation = useCompleteDeadline();
  const deleteDeadlineMutation = useDeleteDeadline();

  const loadDeadlines = (newFilters?: DeadlineFilters) => {
    if (newFilters) {
      setFilters(newFilters);
    }
    refetch();
  };

  return {
    deadlines,
    isLoading,
    error,
    createDeadline: createDeadlineMutation.mutateAsync,
    updateDeadline: (id: string, data: Partial<DeadlineFormData>) => 
      updateDeadlineMutation.mutateAsync({ id, data }),
    completeDeadline: (id: string, notes?: string) => 
      completeDeadlineMutation.mutateAsync({ id, notes }),
    deleteDeadline: deleteDeadlineMutation.mutateAsync,
    getUpcomingDeadlines: (days?: number) => getUpcomingDeadlines(deadlines, days),
    getOverdueDeadlines: () => getOverdueDeadlines(deadlines),
    loadDeadlines,
    refetch,
  };
};
