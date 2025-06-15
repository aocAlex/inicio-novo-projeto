
export interface FinancialContract {
  id: string;
  workspace_id: string;
  client_id?: string;
  process_id?: string;
  contract_type: 'fixed' | 'hourly' | 'ad_exitum' | 'hybrid';
  fixed_amount?: number;
  hourly_rate?: number;
  success_percentage?: number;
  estimated_hours?: number;
  contract_value?: number;
  payment_schedule: 'upfront' | 'monthly' | 'milestone' | 'success';
  installments: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  signed_date?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  client?: {
    id: string;
    name: string;
    email?: string;
  };
  process?: {
    id: string;
    title: string;
    process_number: string;
  };
  installments_list?: FinancialInstallment[];
}

export interface FinancialTransaction {
  id: string;
  workspace_id: string;
  transaction_type: 'income' | 'expense';
  category: 'honorarios' | 'custas' | 'pericia' | 'despesas_gerais' | 'reembolso' | 'outros';
  client_id?: string;
  process_id?: string;
  contract_id?: string;
  amount: number;
  description: string;
  due_date?: string;
  payment_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: 'money' | 'pix' | 'credit_card' | 'bank_transfer' | 'check' | 'boleto';
  receipt_url?: string;
  invoice_number?: string;
  tax_percentage?: number;
  tax_amount?: number;
  net_amount?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  client?: {
    id: string;
    name: string;
  };
  process?: {
    id: string;
    title: string;
    process_number: string;
  };
  contract?: {
    id: string;
    contract_type: string;
  };
}

export interface FinancialInstallment {
  id: string;
  workspace_id: string;
  contract_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_date?: string;
  transaction_id?: string;
  created_at: string;
}

export interface FinancialBudget {
  id: string;
  workspace_id: string;
  budget_type: 'monthly' | 'quarterly' | 'yearly' | 'project';
  period_start: string;
  period_end: string;
  target_revenue: number;
  target_expenses: number;
  actual_revenue: number;
  actual_expenses: number;
  created_by?: string;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  is_billable: boolean;
  default_tax_rate: number;
  created_at: string;
}

export interface FinancialDashboardMetrics {
  current_month_revenue: number;
  previous_month_revenue: number;
  total_to_receive_today: number;
  total_to_receive_7_days: number;
  total_to_receive_30_days: number;
  total_expenses_month: number;
  profit_margin: number;
  overdue_amount: number;
  active_contracts: number;
  pending_payments: number;
}

export interface CashFlowProjection {
  date: string;
  projected_income: number;
  projected_expenses: number;
  net_flow: number;
  accumulated_balance: number;
}

export interface ClientFinancialSummary {
  client_id: string;
  total_contracted: number;
  total_received: number;
  total_pending: number;
  average_payment_time: number;
  credit_score: number;
  active_contracts: number;
  overdue_amount: number;
  last_payment_date?: string;
}

export interface ProcessFinancialSummary {
  process_id: string;
  case_value?: number;
  total_expenses: number;
  expected_success_fee: number;
  roi_projection: number;
  break_even_point: number;
  contracted_amount: number;
  actual_received: number;
}

export interface FinancialFilters {
  client_id?: string;
  process_id?: string;
  contract_type?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  transaction_type?: string;
  category?: string;
  payment_status?: string;
}

export interface CreateFinancialContractData {
  client_id?: string;
  process_id?: string;
  contract_type: FinancialContract['contract_type'];
  fixed_amount?: number;
  hourly_rate?: number;
  success_percentage?: number;
  estimated_hours?: number;
  contract_value?: number;
  payment_schedule: FinancialContract['payment_schedule'];
  installments: number;
  signed_date?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export interface CreateFinancialTransactionData {
  transaction_type: FinancialTransaction['transaction_type'];
  category: FinancialTransaction['category'];
  client_id?: string;
  process_id?: string;
  contract_id?: string;
  amount: number;
  description: string;
  due_date?: string;
  payment_date?: string;
  payment_method?: FinancialTransaction['payment_method'];
  receipt_url?: string;
  invoice_number?: string;
  tax_percentage?: number;
}
