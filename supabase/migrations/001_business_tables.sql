-- ============================================================
-- MIGRASI DATABASE: Sistem Pencatatan Keuangan Bengkel
-- Jalankan SQL ini di Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ==========================================
-- WORKSPACE & MULTI-USER
-- ==========================================

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'secretary',
  display_name TEXT,
  invited_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- ==========================================
-- SUPPLIERS (Toko/Pemasok)
-- ==========================================

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- BELANJA MATERIAL
-- ==========================================

CREATE TABLE IF NOT EXISTS material_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES auth.users(id),
  supplier_id UUID REFERENCES suppliers(id),
  item_name TEXT NOT NULL,
  specification TEXT,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'pcs',
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  purchase_date DATE NOT NULL,
  notes TEXT,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- PEMASUKAN (Multi-Jenis)
-- ==========================================

CREATE TABLE IF NOT EXISTS income_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES auth.users(id),
  sub_type TEXT NOT NULL DEFAULT 'service_other',
  description TEXT NOT NULL,
  client_name TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  income_date DATE NOT NULL,
  notes TEXT,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- KARYAWAN
-- ==========================================

CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT,
  start_date DATE,
  is_active BOOLEAN DEFAULT true,
  salary_min NUMERIC DEFAULT 0,
  salary_max NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- PAYROLL (Gaji — Variabel per Bulan)
-- ==========================================

CREATE TABLE IF NOT EXISTS payroll (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES auth.users(id),
  employee_id UUID REFERENCES employees(id),
  period_month TEXT NOT NULL,
  base_amount NUMERIC DEFAULT 0,
  allowance NUMERIC DEFAULT 0,
  deduction NUMERIC DEFAULT 0,
  net_amount NUMERIC DEFAULT 0,
  paid_date DATE,
  notes TEXT,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, period_month)
);

-- ==========================================
-- PENGELUARAN OPERASIONAL
-- ==========================================

CREATE TABLE IF NOT EXISTS operational_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES auth.users(id),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  expense_date DATE NOT NULL,
  expense_category TEXT DEFAULT 'umum',
  notes TEXT,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- KLIEN
-- ==========================================

CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  pic_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- PROYEK
-- ==========================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  name TEXT NOT NULL,
  description TEXT,
  unit_type TEXT,
  quantity INTEGER DEFAULT 1,
  contract_value NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  notes TEXT,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- BOM (Bill of Materials)
-- ==========================================

CREATE TABLE IF NOT EXISTS bom_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bom_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bom_id UUID REFERENCES bom_templates(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  specification TEXT,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'pcs',
  estimated_price NUMERIC DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- ==========================================
-- TUTUP BUKU (Closing Periods — Fleksibel)
-- ==========================================

CREATE TABLE IF NOT EXISTS closing_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  closed_by UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'closed',
  total_income NUMERIC DEFAULT 0,
  total_material_expense NUMERIC DEFAULT 0,
  total_salary_expense NUMERIC DEFAULT 0,
  total_operational_expense NUMERIC DEFAULT 0,
  net_balance NUMERIC DEFAULT 0,
  admin_notes TEXT,
  closed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE closing_periods ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is member of workspace
CREATE OR REPLACE FUNCTION is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: check if user is admin of workspace
CREATE OR REPLACE FUNCTION is_workspace_admin(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Workspaces: owner can see their own workspaces
CREATE POLICY "workspace_select" ON workspaces FOR SELECT
  USING (owner_id = auth.uid() OR is_workspace_member(id));

CREATE POLICY "workspace_insert" ON workspaces FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "workspace_update" ON workspaces FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "workspace_delete" ON workspaces FOR DELETE
  USING (owner_id = auth.uid());

-- Workspace Members: members can see co-members
CREATE POLICY "members_select" ON workspace_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_workspace_member(workspace_id)
  );

CREATE POLICY "members_insert" ON workspace_members FOR INSERT
  WITH CHECK (
    -- Workspace owner can add members (including themselves during setup)
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = workspace_members.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
    OR
    -- Existing admin can invite new members
    is_workspace_admin(workspace_id)
  );

CREATE POLICY "members_update" ON workspace_members FOR UPDATE
  USING (is_workspace_admin(workspace_id));

CREATE POLICY "members_delete" ON workspace_members FOR DELETE
  USING (is_workspace_admin(workspace_id));

-- Generic policy for all data tables (member can read, member can insert)
-- Admin can delete, secretary can only delete own records

-- Suppliers
CREATE POLICY "suppliers_select" ON suppliers FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "suppliers_insert" ON suppliers FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "suppliers_update" ON suppliers FOR UPDATE
  USING (is_workspace_member(workspace_id));
CREATE POLICY "suppliers_delete" ON suppliers FOR DELETE
  USING (is_workspace_admin(workspace_id));

-- Material Purchases
CREATE POLICY "mat_select" ON material_purchases FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "mat_insert" ON material_purchases FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "mat_update" ON material_purchases FOR UPDATE
  USING (is_workspace_member(workspace_id) AND NOT is_locked);
CREATE POLICY "mat_delete" ON material_purchases FOR DELETE
  USING (is_workspace_admin(workspace_id) AND NOT is_locked);

-- Income Records
CREATE POLICY "income_select" ON income_records FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "income_insert" ON income_records FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "income_update" ON income_records FOR UPDATE
  USING (is_workspace_member(workspace_id) AND NOT is_locked);
CREATE POLICY "income_delete" ON income_records FOR DELETE
  USING (is_workspace_admin(workspace_id) AND NOT is_locked);

-- Employees
CREATE POLICY "emp_select" ON employees FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "emp_insert" ON employees FOR INSERT
  WITH CHECK (is_workspace_admin(workspace_id));
CREATE POLICY "emp_update" ON employees FOR UPDATE
  USING (is_workspace_admin(workspace_id));
CREATE POLICY "emp_delete" ON employees FOR DELETE
  USING (is_workspace_admin(workspace_id));

-- Payroll
CREATE POLICY "payroll_select" ON payroll FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "payroll_insert" ON payroll FOR INSERT
  WITH CHECK (is_workspace_admin(workspace_id));
CREATE POLICY "payroll_update" ON payroll FOR UPDATE
  USING (is_workspace_admin(workspace_id) AND NOT is_locked);
CREATE POLICY "payroll_delete" ON payroll FOR DELETE
  USING (is_workspace_admin(workspace_id) AND NOT is_locked);

-- Operational Expenses
CREATE POLICY "opex_select" ON operational_expenses FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "opex_insert" ON operational_expenses FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "opex_update" ON operational_expenses FOR UPDATE
  USING (is_workspace_member(workspace_id) AND NOT is_locked);
CREATE POLICY "opex_delete" ON operational_expenses FOR DELETE
  USING (is_workspace_admin(workspace_id) AND NOT is_locked);

-- Clients
CREATE POLICY "clients_select" ON clients FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "clients_insert" ON clients FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "clients_update" ON clients FOR UPDATE
  USING (is_workspace_member(workspace_id));
CREATE POLICY "clients_delete" ON clients FOR DELETE
  USING (is_workspace_admin(workspace_id));

-- Projects
CREATE POLICY "projects_select" ON projects FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "projects_insert" ON projects FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "projects_update" ON projects FOR UPDATE
  USING (is_workspace_member(workspace_id) AND NOT is_locked);
CREATE POLICY "projects_delete" ON projects FOR DELETE
  USING (is_workspace_admin(workspace_id) AND NOT is_locked);

-- BOM Templates
CREATE POLICY "bom_tmpl_select" ON bom_templates FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "bom_tmpl_insert" ON bom_templates FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "bom_tmpl_update" ON bom_templates FOR UPDATE
  USING (is_workspace_member(workspace_id));
CREATE POLICY "bom_tmpl_delete" ON bom_templates FOR DELETE
  USING (is_workspace_admin(workspace_id));

-- BOM Items (access through bom_templates join)
CREATE POLICY "bom_items_select" ON bom_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM bom_templates bt
    WHERE bt.id = bom_items.bom_id AND is_workspace_member(bt.workspace_id)
  ));
CREATE POLICY "bom_items_insert" ON bom_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM bom_templates bt
    WHERE bt.id = bom_items.bom_id AND is_workspace_member(bt.workspace_id)
  ));
CREATE POLICY "bom_items_update" ON bom_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM bom_templates bt
    WHERE bt.id = bom_items.bom_id AND is_workspace_member(bt.workspace_id)
  ));
CREATE POLICY "bom_items_delete" ON bom_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM bom_templates bt
    WHERE bt.id = bom_items.bom_id AND is_workspace_admin(bt.workspace_id)
  ));

-- Closing Periods (admin only)
CREATE POLICY "closing_select" ON closing_periods FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "closing_insert" ON closing_periods FOR INSERT
  WITH CHECK (is_workspace_admin(workspace_id));
CREATE POLICY "closing_update" ON closing_periods FOR UPDATE
  USING (is_workspace_admin(workspace_id));
CREATE POLICY "closing_delete" ON closing_periods FOR DELETE
  USING (is_workspace_admin(workspace_id));
