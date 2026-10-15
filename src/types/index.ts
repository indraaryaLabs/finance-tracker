// ============================================================
// Type Definitions — Sistem Pencatatan Keuangan Bengkel
// ============================================================

// ---- Auth & Workspace ----

export type UserRole = "admin" | "secretary";

export interface Workspace {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  owner_id: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: UserRole;
  display_name: string;
  invited_at: string;
}

export interface WorkspaceSetupState {
  completed: boolean;
  workspaceName: string;
  address: string;
  ownerName: string;
}

// ---- Supplier ----

export interface Supplier {
  id: string;
  workspace_id: string;
  name: string;
  address?: string;
  phone?: string;
  notes?: string;
  created_at: string;
}

// ---- Material Purchase (Belanja) ----

export interface MaterialPurchase {
  id: string;
  workspace_id: string;
  recorded_by: string;
  supplier_id: string;
  item_name: string;
  specification?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  purchase_date: string;
  notes?: string;
  is_locked: boolean;
  created_at: string;
  // Joined data (optional, from query)
  supplier?: Supplier;
}

// ---- Income (Pemasukan) ----

export type IncomeSubType = "unit_order" | "maintenance" | "service_other";

export interface IncomeRecord {
  id: string;
  workspace_id: string;
  recorded_by: string;
  sub_type: IncomeSubType;
  description: string;
  client_name?: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  income_date: string;
  notes?: string;
  is_locked: boolean;
  created_at: string;
}

// ---- Employee ----

export interface Employee {
  id: string;
  workspace_id: string;
  name: string;
  position?: string;
  start_date?: string;
  is_active: boolean;
  salary_min: number;
  salary_max: number;
  notes?: string;
  created_at: string;
}

// ---- Payroll (Gaji) ----

export interface Payroll {
  id: string;
  workspace_id: string;
  recorded_by: string;
  employee_id: string;
  period_month: string;
  base_amount: number;
  allowance: number;
  deduction: number;
  net_amount: number;
  paid_date?: string;
  notes?: string;
  is_locked: boolean;
  created_at: string;
  // Joined data
  employee?: Employee;
}

// ---- Operational Expense ----

export type OpexCategory = "listrik" | "sewa" | "peralatan" | "transportasi" | "umum";

export interface OperationalExpense {
  id: string;
  workspace_id: string;
  recorded_by: string;
  description: string;
  amount: number;
  expense_date: string;
  expense_category: OpexCategory;
  notes?: string;
  is_locked: boolean;
  created_at: string;
}

// ---- Client ----

export interface Client {
  id: string;
  workspace_id: string;
  company_name: string;
  pic_name?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

// ---- Project ----

export type ProjectStatus = "draft" | "in_progress" | "completed" | "paid";

export interface Project {
  id: string;
  workspace_id: string;
  client_id: string;
  name: string;
  description?: string;
  unit_type?: string;
  quantity: number;
  contract_value: number;
  status: ProjectStatus;
  start_date?: string;
  end_date?: string;
  notes?: string;
  is_locked: boolean;
  created_at: string;
  // Joined data
  client?: Client;
}

// ---- BOM ----

export interface BOMTemplate {
  id: string;
  workspace_id: string;
  product_name: string;
  description?: string;
  created_at: string;
  items?: BOMItem[];
}

export interface BOMItem {
  id: string;
  bom_id: string;
  item_name: string;
  specification?: string;
  quantity: number;
  unit: string;
  estimated_price: number;
  sort_order: number;
}

// ---- Closing Period (Tutup Buku) ----

export interface ClosingPeriod {
  id: string;
  workspace_id: string;
  closed_by: string;
  name: string;
  start_date: string;
  end_date: string;
  status: "closed" | "reopened";
  total_income: number;
  total_material_expense: number;
  total_salary_expense: number;
  total_operational_expense: number;
  net_balance: number;
  admin_notes?: string;
  closed_at: string;
  created_at: string;
}

// ---- AI (Optional) ----

export interface AIInsight {
  title: string;
  desc: string;
  type: "critical" | "warning" | "info" | "achievement";
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

// ---- UI Navigation ----

export type AppTab =
  | "ringkasan"
  | "pemasukan"
  | "belanja"
  | "operasional"
  | "proyek"
  | "tutup-buku";
