
import { Deadline } from '@/types/deadline';
import { isAfter } from 'date-fns';

export const getUpcomingDeadlines = (deadlines: Deadline[], days: number = 7) => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + days);
  
  return deadlines.filter(deadline => {
    const dueDate = new Date(deadline.due_date);
    return dueDate <= targetDate && deadline.status === 'PENDENTE';
  });
};

export const getOverdueDeadlines = (deadlines: Deadline[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return deadlines.filter(deadline => {
    const dueDate = new Date(deadline.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return isAfter(today, dueDate) && deadline.status === 'PENDENTE';
  });
};
