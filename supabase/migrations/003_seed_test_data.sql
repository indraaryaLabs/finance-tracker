-- ============================================================
-- SQL SEED DATA: Jalankan SQL ini di Supabase SQL Editor
-- Untuk mengisi data uji coba (Pemasukan, Belanja, Payroll, Opex, Proyek, BOM)
-- ============================================================

DO $$
DECLARE
  v_workspace_id UUID;
  v_user_id UUID;
  v_supplier_jaya_id UUID;
  v_supplier_makmur_id UUID;
  v_supplier_baja_id UUID;
  v_budi_id UUID;
  v_joko_id UUID;
  v_rian_id UUID;
  v_client_antam_id UUID;
  v_client_harapan_id UUID;
  v_client_vale_id UUID;
  v_proj_bor_id UUID;
  v_proj_conv_id UUID;
  v_bom_bor_id UUID;
  v_bom_conv_id UUID;
BEGIN
  -- Dapatkan workspace pertama beserta owner_id-nya
  SELECT id, owner_id INTO v_workspace_id, v_user_id FROM workspaces LIMIT 1;
  
  IF v_workspace_id IS NULL THEN
    RAISE NOTICE 'Workspace tidak ditemukan. Silakan buat bengkel terlebih dahulu di UI aplikasi.';
    RETURN;
  END IF;
  
  -- Hapus data lama agar bersih sebelum seed ulang (Opsional untuk testing bersih)
  DELETE FROM closing_periods WHERE workspace_id = v_workspace_id;
  DELETE FROM bom_templates WHERE workspace_id = v_workspace_id;
  DELETE FROM projects WHERE workspace_id = v_workspace_id;
  DELETE FROM clients WHERE workspace_id = v_workspace_id;
  DELETE FROM operational_expenses WHERE workspace_id = v_workspace_id;
  DELETE FROM payroll WHERE workspace_id = v_workspace_id;
  DELETE FROM employees WHERE workspace_id = v_workspace_id;
  DELETE FROM income_records WHERE workspace_id = v_workspace_id;
  DELETE FROM material_purchases WHERE workspace_id = v_workspace_id;
  DELETE FROM suppliers WHERE workspace_id = v_workspace_id;

  -- 1. Insert Suppliers (Pemasok Material)
  INSERT INTO suppliers (workspace_id, name, address, phone)
  VALUES 
    (v_workspace_id, 'Toko Las Jaya Utama', 'Jl. Logam No. 12, Kendari', '0812-4444-1111'),
    (v_workspace_id, 'Sumber Makmur Teknik', 'Kawasan Industri Blok C, Kendari', '0813-5555-2222'),
    (v_workspace_id, 'Multi Baja Perkasa', 'Jl. Raya Bypass No. 8, Kendari', '0852-7777-3333');

  SELECT id INTO v_supplier_jaya_id FROM suppliers WHERE name = 'Toko Las Jaya Utama' LIMIT 1;
  SELECT id INTO v_supplier_makmur_id FROM suppliers WHERE name = 'Sumber Makmur Teknik' LIMIT 1;
  SELECT id INTO v_supplier_baja_id FROM suppliers WHERE name = 'Multi Baja Perkasa' LIMIT 1;

  -- 2. Insert Material Purchases (Belanja Material)
  INSERT INTO material_purchases (workspace_id, recorded_by, supplier_id, item_name, specification, quantity, unit, unit_price, total_price, purchase_date, notes)
  VALUES
    (v_workspace_id, v_user_id, v_supplier_jaya_id, 'Kawat Las AWS E6013', 'Ukuran 2.6mm - Box isi 5kg', 5, 'box', 125000, 625000, '2026-06-05', 'Stok las pengerjaan kanopi'),
    (v_workspace_id, v_user_id, v_supplier_baja_id, 'Plat Besi Mild Steel', 'Ketebalan 3mm (1.2m x 2.4m)', 12, 'lembar', 480000, 5760000, '2026-06-10', 'Bahan fabrikasi box mesin'),
    (v_workspace_id, v_user_id, v_supplier_makmur_id, 'Batu Gerinda Potong WD', 'Ukuran 4 inch - Super Thin', 100, 'pcs', 8500, 850000, '2026-06-12', 'Stok habis di bengkel'),
    (v_workspace_id, v_user_id, v_supplier_jaya_id, 'Cat Zinc Chromate Anti Karat', 'Pail Grey 5 Liter', 4, 'liter', 175000, 700000, '2026-06-18', 'Pengecatan dasar mesin bor');

  -- 3. Insert Income Records (Pemasukan Kas)
  INSERT INTO income_records (workspace_id, recorded_by, sub_type, description, client_name, quantity, unit_price, total_amount, income_date, notes)
  VALUES
    (v_workspace_id, v_user_id, 'unit_order', 'Pesanan Mesin Bor Tambang Portable Tipe Mini-01', 'PT ANTAM Tbk', 1, 85000000, 85000000, '2026-06-15', 'DP pengerjaan unit pertama'),
    (v_workspace_id, v_user_id, 'maintenance', 'Overhaul Excavator Bucket & Pin', 'CV Harapan Jaya Mandiri', 2, 7500000, 15000000, '2026-06-20', 'Selesai perbaikan dan penyerahan unit'),
    (v_workspace_id, v_user_id, 'service_other', 'Jasa Roll Plat & Fabrikasi Tiang Pendukung', 'Toko Sinar Berkah', 1, 4500000, 4500000, '2026-06-25', 'Tunai setelah pengerjaan selesai');

  -- 4. Insert Employees (Daftar Karyawan)
  INSERT INTO employees (workspace_id, name, position, start_date, is_active, salary_min, salary_max)
  VALUES
    (v_workspace_id, 'Budi Santoso', 'Master Welder / Fitter', '2025-01-10', true, 4500000, 6500000),
    (v_workspace_id, 'Joko Widodo', 'Operator Bubut & Bubut CNC', '2025-03-15', true, 5000000, 7000000),
    (v_workspace_id, 'Rian Hidayat', 'Helper Umum', '2026-02-01', true, 3000000, 4500000);

  SELECT id INTO v_budi_id FROM employees WHERE name = 'Budi Santoso' LIMIT 1;
  SELECT id INTO v_joko_id FROM employees WHERE name = 'Joko Widodo' LIMIT 1;
  SELECT id INTO v_rian_id FROM employees WHERE name = 'Rian Hidayat' LIMIT 1;

  -- 5. Insert Payroll (Gaji Karyawan Bulan Juni 2026)
  INSERT INTO payroll (workspace_id, recorded_by, employee_id, period_month, base_amount, allowance, deduction, net_amount, paid_date, notes)
  VALUES
    (v_workspace_id, v_user_id, v_budi_id, '2026-06', 5000000, 750000, 150000, 5600000, '2026-06-30', 'Gaji Juni + Tunjangan Lembur Antam'),
    (v_workspace_id, v_user_id, v_joko_id, '2026-06', 5500000, 500000, 0, 6000000, '2026-06-30', 'Gaji pokok Juni + Bonus Kerajinan'),
    (v_workspace_id, v_user_id, v_rian_id, '2026-06', 3200000, 200000, 50000, 3350000, '2026-06-30', 'Gaji pokok Juni - Potongan Kasbon');

  -- 6. Insert Operational Expenses (Biaya Operasional)
  INSERT INTO operational_expenses (workspace_id, recorded_by, description, amount, expense_date, expense_category, notes)
  VALUES
    (v_workspace_id, v_user_id, 'Bayar Tagihan Listrik PLN 3-Phase', 1650000, '2026-06-25', 'listrik', 'Pemakaian tinggi mesin bubut & compressor'),
    (v_workspace_id, v_user_id, 'Sewa Tabung Gas Argon & Oksigen Bulanan', 550000, '2026-06-28', 'peralatan', 'Sewa gas las Argon'),
    (v_workspace_id, v_user_id, 'Bensin & Tol Mobil Pickup Operasional', 420000, '2026-06-29', 'transportasi', 'Pengiriman material plat besi');

  -- 7. Insert Clients (Daftar Klien Bisnis)
  INSERT INTO clients (workspace_id, company_name, pic_name, phone, address)
  VALUES
    (v_workspace_id, 'PT ANTAM Tbk Unit Kendari', 'Bpk. Hermawan', '0811-222-333', 'Kawasan Tambang Pomalaa'),
    (v_workspace_id, 'CV Harapan Jaya Mandiri', 'Ibu Siska', '0821-333-444', 'Kota Kendari'),
    (v_workspace_id, 'PT Vale Indonesia', 'Bpk. Rudy', '0812-555-666', 'Sorowako');

  SELECT id INTO v_client_antam_id FROM clients WHERE company_name = 'PT ANTAM Tbk Unit Kendari' LIMIT 1;
  SELECT id INTO v_client_harapan_id FROM clients WHERE company_name = 'CV Harapan Jaya Mandiri' LIMIT 1;
  SELECT id INTO v_client_vale_id FROM clients WHERE company_name = 'PT Vale Indonesia' LIMIT 1;

  -- 8. Insert Projects (Pesanan Pengerjaan Barang)
  INSERT INTO projects (workspace_id, client_id, name, description, unit_type, quantity, contract_value, status, start_date, end_date)
  VALUES
    (v_workspace_id, v_client_antam_id, 'Pembuatan Mesin Bor Tambang Nikel', 'Fabrikasi unit portable rig bor eksplorasi', 'Rig Bor Portable Rig-02', 1, 120000000, 'in_progress', '2026-06-01', '2026-08-15'),
    (v_workspace_id, v_client_vale_id, 'Maintenance Conveyor Roller Belt Line 3', 'Rekondisi dan penggantian bearing/roller conveyor', 'Conveyor Line', 3, 45000000, 'in_progress', '2026-06-15', '2026-07-25');

  SELECT id INTO v_proj_bor_id FROM projects WHERE name = 'Pembuatan Mesin Bor Tambang Nikel' LIMIT 1;
  SELECT id INTO v_proj_conv_id FROM projects WHERE name = 'Maintenance Conveyor Roller Belt Line 3' LIMIT 1;

  -- 9. Insert BOM Templates (Bill of Materials)
  INSERT INTO bom_templates (workspace_id, product_name, description)
  VALUES
    (v_workspace_id, 'BOM-Pembuatan Mesin Bor Tambang Nikel', 'Bill of Materials untuk: Pembuatan Mesin Bor Tambang Nikel'),
    (v_workspace_id, 'BOM-Maintenance Conveyor Roller Belt Line 3', 'Bill of Materials untuk: Maintenance Conveyor Roller Belt Line 3');

  SELECT id INTO v_bom_bor_id FROM bom_templates WHERE product_name = 'BOM-Pembuatan Mesin Bor Tambang Nikel' LIMIT 1;
  SELECT id INTO v_bom_conv_id FROM bom_templates WHERE product_name = 'BOM-Maintenance Conveyor Roller Belt Line 3' LIMIT 1;

  -- 10. Insert BOM Items
  IF v_bom_bor_id IS NOT NULL THEN
    INSERT INTO bom_items (bom_id, item_name, specification, quantity, unit, estimated_price, sort_order)
    VALUES
      (v_bom_bor_id, 'Mesin Engine Yanmar TF 85', '8.5 PK Diesel Engine', 1, 'unit', 18500000, 0),
      (v_bom_bor_id, 'Besi UNP 100', 'Besi Canal U ketebalan SNI', 8, 'batang', 295000, 1),
      (v_bom_bor_id, 'Gearbox WPA 80', 'Rasio 1:30 Heavy Duty', 1, 'unit', 3400000, 2),
      (v_bom_bor_id, 'Piston Pump Hidrolik', 'Kapasitas 22cc/rev', 1, 'unit', 8500000, 3);
  END IF;

  IF v_bom_conv_id IS NOT NULL THEN
    INSERT INTO bom_items (bom_id, item_name, specification, quantity, unit, estimated_price, sort_order)
    VALUES
      (v_bom_conv_id, 'Bearing Pillow Block UCP 208', 'As diameter 40mm NTN Japan', 6, 'pcs', 320000, 0),
      (v_bom_conv_id, 'Pipa Seamless Steel 4"', 'Ketebalan Sch 40 diameter luar', 3, 'batang', 1450000, 1);
  END IF;

END $$;
