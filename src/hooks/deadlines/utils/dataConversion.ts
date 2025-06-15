
import { Deadline } from '@/types/deadline';

export const convertSupabaseDataToDeadline = (item: any): Deadline => {
  return {
    id: item.id,
    workspace_id: item.workspace_id,
    process_id: item.process_id,
    client_id: item.client_id,
    template_id: item.template_id,
    petition_id: item.petition_id,
    petition_execution_id: item.petition_execution_id,
    title: item.title,
    description: item.description,
    deadline_type: item.deadline_type,
    due_date: item.due_date,
    created_date: item.created_date,
    completed_date: item.completed_date,
    business_days_only: item.business_days_only,
    anticipation_days: item.anticipation_days,
    is_critical: item.is_critical,
    assigned_to: item.assigned_to,
    created_by: item.created_by,
    status: item.status,
    priority: item.priority,
    completion_notes: item.completion_notes,
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
    custom_fields: item.custom_fields && typeof item.custom_fields === 'object' ? item.custom_fields : {},
    created_at: item.created_at,
    updated_at: item.updated_at,
    // Converter relacionamentos com verificação de tipos
    process: convertProcessRelation(item.process),
    client: convertClientRelation(item.client),
    assigned_user: convertAssignedUserRelation(item.assigned_user),
    petition: convertPetitionRelation(item.petition),
    petition_execution: convertPetitionExecutionRelation(item.petition_execution)
  };
};

const convertProcessRelation = (process: any) => {
  if (!process || typeof process !== 'object' || !process.id || typeof process.id !== 'string') {
    return undefined;
  }
  return {
    id: process.id,
    title: process.title || '',
    process_number: process.process_number || ''
  };
};

const convertClientRelation = (client: any) => {
  if (!client || typeof client !== 'object' || !client.id || typeof client.id !== 'string') {
    return undefined;
  }
  return {
    id: client.id,
    name: client.name || ''
  };
};

const convertAssignedUserRelation = (user: any) => {
  if (!user || typeof user !== 'object' || !user.id || typeof user.id !== 'string') {
    return undefined;
  }
  return {
    id: user.id,
    full_name: user.full_name || '',
    email: user.email || ''
  };
};

const convertPetitionRelation = (petition: any) => {
  if (!petition || typeof petition !== 'object' || !petition.id || typeof petition.id !== 'string') {
    return undefined;
  }
  return {
    id: petition.id,
    name: petition.name || '',
    category: petition.category || ''
  };
};

const convertPetitionExecutionRelation = (execution: any) => {
  if (!execution || typeof execution !== 'object' || !execution.id || typeof execution.id !== 'string') {
    return undefined;
  }
  return {
    id: execution.id,
    created_at: execution.created_at || '',
    filled_data: execution.filled_data || {}
  };
};
