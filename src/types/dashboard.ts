
export interface DashboardMetrics {
  clients: {
    total: number;
    activeToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  processes: {
    total: number;
    active: number;
    pending: number;
    archived: number;
    withDeadlineThisWeek: number;
  };
  petitions: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    successRate: number;
  };
  templates: {
    total: number;
    mostUsed: TemplateUsage[];
  };
  webhooks: {
    successRate: number;
    averageResponseTime: number;
    totalSent: number;
    failed: number;
  };
  members: {
    total: number;
    activeToday: number;
  };
}

export interface TemplateUsage {
  id: string;
  name: string;
  category: string;
  executionCount: number;
  lastUsed: string;
}

export interface PetitionActivity {
  id: string;
  templateName: string;
  clientName: string;
  status: 'success' | 'failed' | 'pending';
  createdAt: string;
  createdBy: string;
}

export interface ChartData {
  date: string;
  value: number;
  label?: string;
}
