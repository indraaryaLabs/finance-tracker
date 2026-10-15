import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase credentials not found in env!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Memulai proses seeding data uji coba...");

  // 1. Dapatkan workspace pertama yang terdaftar
  const { data: workspaces, error: wsError } = await supabase
    .from("workspaces")
    .select("*")
    .limit(1);

  if (wsError || !workspaces || workspaces.length === 0) {
    console.error("Gagal mendapatkan workspace. Pastikan Anda telah login dan membuat bengkel pertama terlebih dahulu di UI.");
    process.exit(1);
  }

  const workspace = workspaces[0];
  console.log(`Menggunakan Workspace: "${workspace.name}" (ID: ${workspace.id})`);

  // Dapatkan member untuk dijadikan recorded_by
  const { data: members, error: memError } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspace.id)
    .limit(1);

  if (memError || !members || members.length === 0) {
    console.error("Gagal mendapatkan member workspace.");
    process.exit(1);
  }

  const member = members[0];
  const userId = member.user_id;
  console.log(`Menggunakan User: "${member.display_name}" (ID: ${userId})`);

  // 2. Seed Suppliers
  console.log("\n1. Seeding Suppliers...");
  const supplierData = [
    { workspace_id: workspace.id, name: "Toko Las Jaya Utama", address: "Jl. Logam No. 12, Kendari", phone: "0812-4444-1111" },
    { workspace_id: workspace.id, name: "Sumber Makmur Teknik", address: "Kawasan Industri Blok C", phone: "0813-5555-2222" },
    { workspace_id: workspace.id, name: "Multi Baja Perkasa", address: "Jl. Raya Bypass No. 8", phone: "0852-7777-3333" }
  ];

  const { data: dbSuppliers, error: supErr } = await supabase
    .from("suppliers")
    .insert(supplierData)
    .select();

  if (supErr) {
    console.error("Gagal insert suppliers:", supErr);
  } else {
    console.log(`Berhasil menambahkan ${dbSuppliers.length} supplier.`);
  }

  // 3. Seed Material Purchases (Belanja)
  console.log("\n2. Seeding Material Purchases...");
  const jayaId = dbSuppliers?.find(s => s.name.includes("Jaya Utama"))?.id;
  const makmurId = dbSuppliers?.find(s => s.name.includes("Sumber Makmur"))?.id;
  const bajaId = dbSuppliers?.find(s => s.name.includes("Multi Baja"))?.id;

  const purchaseData = [
    {
      workspace_id: workspace.id,
      recorded_by: userId,
      supplier_id: jayaId || null,
      item_name: "Kawat Las AWS E6013",
      specification: "Ukuran 2.6mm - Box isi 5kg",
      quantity: 5,
      unit: "box",
      unit_price: 125000,
      total_price: 625000,
      purchase_date: "2026-06-05",
      notes: "Stok las pengerjaan kanopi"
    },
    {
      workspace_id: workspace.id,
      recorded_by: userId,
      supplier_id: bajaId || null,
      item_name: "Plat Besi Mild Steel",
      specification: "Ketebalan 3mm (1.2m x 2.4m)",
      quantity: 12,
      unit: "lembar",
      unit_price: 480000,
      total_price: 5760000,
      purchase_date: "2026-06-10",
      notes: "Bahan fabrikasi box mesin"
    },
    {
      workspace_id: workspace.id,
      recorded_by: userId,
      supplier_id: makmurId || null,
      item_name: "Batu Gerinda Potong WD",
      specification: "Ukuran 4 inch - Super Thin",
      quantity: 100,
      unit: "pcs",
      unit_price: 8500,
      total_price: 850000,
      purchase_date: "2026-06-12",
      notes: "Stok habis di bengkel"
    },
    {
      workspace_id: workspace.id,
      recorded_by: userId,
      supplier_id: jayaId || null,
      item_name: "Cat Zinc Chromate Anti Karat",
      specification: "Pail Grey 5 Liter",
      quantity: 4,
      unit: "liter", // diisi liter sesuai data
      unit_price: 175000,
      total_price: 700000,
      purchase_date: "2026-06-18",
      notes: "Pengecatan dasar mesin bor"
    }
  ];

  const { data: dbPurchases, error: purErr } = await supabase
    .from("material_purchases")
    .insert(purchaseData)
    .select();

  if (purErr) {
    console.error("Gagal insert purchases:", purErr);
  } else {
    console.log(`Berhasil menambahkan ${dbPurchases.length} data belanja material.`);
  }

  // 4. Seed Income Records
  console.log("\n3. Seeding Income Records...");
  const incomeData = [
    {
      workspace_id: workspace.id,
      recorded_by: userId,
      sub_type: "unit_order",
      description: "Pesanan Mesin Bor Tambang Portable Tipe Mini-01",
      client_name: "PT ANTAM Tbk",
      quantity: 1,
      unit_price: 85000000,
      total_amount: 85000000,
      income_date: "2026-06-15",
      notes: "DP pengerjaan unit pertama"
    },
    {
      workspace_id: workspace.id,
      recorded_by: userId,
      sub_type: "maintenance",
      description: "Overhaul Excavator Bucket & Pin",
      client_name: "CV Harapan Jaya Mandiri",
      quantity: 2,
      unit_price: 7500000,
      total_amount: 15000000,
      income_date: "2026-06-20",
      notes: "Selesai perbaikan dan penyerahan unit"
    },
    {
      workspace_id: workspace.id,
      recorded_by: userId,
      sub_type: "service_other",
      description: "Jasa Roll Plat & Fabrikasi Tiang Pendukung",
      client_name: "Toko Sinar Berkah",
      quantity: 1,
      unit_price: 4500000,
      total_amount: 4500000,
      income_date: "2026-06-25",
      notes: "Tunai setelah pengerjaan selesai"
    }
  ];

  const { data: dbIncomes, error: incErr } = await supabase
    .from("income_records")
    .insert(incomeData)
    .select();

  if (incErr) {
    console.error("Gagal insert incomes:", incErr);
  } else {
    console.log(`Berhasil menambahkan ${dbIncomes.length} catatan pemasukan.`);
  }

  // 5. Seed Employees
  console.log("\n4. Seeding Employees...");
  const employeeData = [
    { workspace_id: workspace.id, name: "Budi Santoso", position: "Master Welder / Fitter", start_date: "2025-01-10", is_active: true, salary_min: 4500000, salary_max: 6500000 },
    { workspace_id: workspace.id, name: "Joko Widodo", position: "Operator Bubut & Bubut CNC", start_date: "2025-03-15", is_active: true, salary_min: 5000000, salary_max: 7000000 },
    { workspace_id: workspace.id, name: "Rian Hidayat", position: "Helper Umum", start_date: "2026-02-01", is_active: true, salary_min: 3000000, salary_max: 4500000 }
  ];

  const { data: dbEmployees, error: empErr } = await supabase
    .from("employees")
    .insert(employeeData)
    .select();

  if (empErr) {
    console.error("Gagal insert employees:", empErr);
  } else {
    console.log(`Berhasil menambahkan ${dbEmployees.length} karyawan.`);
  }

  // 6. Seed Payroll
  console.log("\n5. Seeding Payroll (Gaji Bulan Juni 2026)...");
  const budi = dbEmployees?.find(e => e.name.includes("Budi"));
  const joko = dbEmployees?.find(e => e.name.includes("Joko"));
  const rian = dbEmployees?.find(e => e.name.includes("Rian"));

  const payrollData = [];
  if (budi) {
    payrollData.push({
      workspace_id: workspace.id,
      recorded_by: userId,
      employee_id: budi.id,
      period_month: "2026-06",
      base_amount: 5000000,
      allowance: 750000, // Tunjangan lembur pengerjaan Antam
      deduction: 150000, // Kasbon
      net_amount: 5600000,
      paid_date: "2026-06-30",
      notes: "Gaji Juni + Lembur Antam"
    });
  }
  if (joko) {
    payrollData.push({
      workspace_id: workspace.id,
      recorded_by: userId,
      employee_id: joko.id,
      period_month: "2026-06",
      base_amount: 5500000,
      allowance: 500000,
      deduction: 0,
      net_amount: 6000000,
      paid_date: "2026-06-30",
      notes: "Gaji pokok Juni"
    });
  }
  if (rian) {
    payrollData.push({
      workspace_id: workspace.id,
      recorded_by: userId,
      employee_id: rian.id,
      period_month: "2026-06",
      base_amount: 3200000,
      allowance: 200000,
      deduction: 50000,
      net_amount: 3350000,
      paid_date: "2026-06-30",
      notes: "Gaji pokok Juni"
    });
  }

  if (payrollData.length > 0) {
    const { data: dbPayrolls, error: payErr } = await supabase
      .from("payroll")
      .insert(payrollData)
      .select();

    if (payErr) {
      console.error("Gagal insert payroll:", payErr);
    } else {
      console.log(`Berhasil menambahkan ${dbPayrolls.length} catatan payroll karyawan.`);
    }
  }

  // 7. Seed Operational Expenses
  console.log("\n6. Seeding Operational Expenses...");
  const opexData = [
    {
      workspace_id: workspace.id,
      recorded_by: userId,
      description: "Bayar Tagihan Listrik PLN 3-Phase",
      amount: 1650000,
      expense_date: "2026-06-25",
      expense_category: "listrik",
      notes: "Pemakaian tinggi mesin las & bubut"
    },
    {
      workspace_id: workspace.id,
      recorded_by: userId,
      description: "Sewa Tabung Gas Argon & Oksigen Bulanan",
      amount: 550000,
      expense_date: "2026-06-28",
      expense_category: "peralatan",
      notes: "Sewa 2 tabung Argon, 1 Oksigen"
    },
    {
      workspace_id: workspace.id,
      recorded_by: userId,
      description: "Bensin & Tol Mobil Pickup Operasional",
      amount: 420000,
      expense_date: "2026-06-29",
      expense_category: "transportasi",
      notes: "Pengiriman material dan kunjungan site"
    }
  ];

  const { data: dbOpex, error: opexErr } = await supabase
    .from("operational_expenses")
    .insert(opexData)
    .select();

  if (opexErr) {
    console.error("Gagal insert opex:", opexErr);
  } else {
    console.log(`Berhasil menambahkan ${dbOpex.length} catatan biaya operasional.`);
  }

  // 8. Seed Clients
  console.log("\n7. Seeding Clients...");
  const clientData = [
    { workspace_id: workspace.id, company_name: "PT ANTAM Tbk Unit Kendari", pic_name: "Bpk. Hermawan", phone: "0811-222-333", address: "Kawasan Tambang Pomalaa" },
    { workspace_id: workspace.id, company_name: "CV Harapan Jaya Mandiri", pic_name: "Ibu Siska", phone: "0821-333-444", address: "Kota Kendari" },
    { workspace_id: workspace.id, company_name: "PT Vale Indonesia", pic_name: "Bpk. Rudy", phone: "0812-555-666", address: "Sorowako" }
  ];

  const { data: dbClients, error: cliErr } = await supabase
    .from("clients")
    .insert(clientData)
    .select();

  if (cliErr) {
    console.error("Gagal insert clients:", cliErr);
  } else {
    console.log(`Berhasil menambahkan ${dbClients.length} klien.`);
  }

  // 9. Seed Projects
  console.log("\n8. Seeding Projects...");
  const antam = dbClients?.find(c => c.company_name.includes("ANTAM"));
  const vale = dbClients?.find(c => c.company_name.includes("Vale"));

  const projectData = [];
  if (antam) {
    projectData.push({
      workspace_id: workspace.id,
      client_id: antam.id,
      name: "Pembuatan Mesin Bor Tambang Nikel",
      description: "Fabrikasi unit portable rig bor eksplorasi",
      unit_type: "Rig Bor Portable Rig-02",
      quantity: 1,
      contract_value: 120000000,
      status: "in_progress",
      start_date: "2026-06-01",
      end_date: "2026-08-15"
    });
  }
  if (vale) {
    projectData.push({
      workspace_id: workspace.id,
      client_id: vale.id,
      name: "Maintenance Conveyor Roller Belt Line 3",
      description: "Rekondisi dan penggantian bearing/roller",
      unit_type: "Conveyor Line",
      quantity: 3,
      contract_value: 45000000,
      status: "in_progress",
      start_date: "2026-06-15",
      end_date: "2026-07-25"
    });
  }

  const { data: dbProjects, error: projErr } = await supabase
    .from("projects")
    .insert(projectData)
    .select();

  if (projErr) {
    console.error("Gagal insert projects:", projErr);
  } else {
    console.log(`Berhasil menambahkan ${dbProjects.length} proyek pengerjaan barang.`);

    // 10. Seed BOM Items for the projects
    console.log("\n9. Seeding BOM Items...");
    const borProj = dbProjects?.find(p => p.name.includes("Mesin Bor"));
    const convProj = dbProjects?.find(p => p.name.includes("Conveyor"));

    if (borProj) {
      // Buat bom template dulu
      const { data: template, error: tErr } = await supabase
        .from("bom_templates")
        .insert({
          workspace_id: workspace.id,
          product_name: `BOM-${borProj.name}`,
          description: `Bill of Materials untuk: ${borProj.name}`
        })
        .select()
        .single();

      if (tErr) {
        console.error("Gagal buat template BOM:", tErr);
      } else if (template) {
        const bomItemsData = [
          { bom_id: template.id, item_name: "Mesin Engine Yanmar TF 85", specification: "8.5 PK Diesel Engine", quantity: 1, unit: "unit", estimated_price: 18500000 },
          { bom_id: template.id, item_name: "Besi UNP 100", specification: "Besi Canal U ketebalan SNI", quantity: 8, unit: "batang", estimated_price: 295000 },
          { bom_id: template.id, item_name: "Gearbox WPA 80", specification: "Rasio 1:30 Heavy Duty", quantity: 1, unit: "unit", estimated_price: 3400000 },
          { bom_id: template.id, item_name: "Piston Pump Hidrolik", specification: "Kapasitas 22cc/rev", quantity: 1, unit: "unit", estimated_price: 8500000 }
        ];
        const { error: itemErr } = await supabase.from("bom_items").insert(bomItemsData);
        if (itemErr) console.error("Gagal insert BOM items untuk Mesin Bor:", itemErr);
        else console.log("Berhasil menambahkan item BOM untuk proyek Mesin Bor.");
      }
    }

    if (convProj) {
      const { data: template, error: tErr } = await supabase
        .from("bom_templates")
        .insert({
          workspace_id: workspace.id,
          product_name: `BOM-${convProj.name}`,
          description: `Bill of Materials untuk: ${convProj.name}`
        })
        .select()
        .single();

      if (tErr) {
        console.error("Gagal buat template BOM:", tErr);
      } else if (template) {
        const bomItemsData = [
          { bom_id: template.id, item_name: "Bearing Pillow Block UCP 208", specification: "As diameter 40mm NTN Japan", quantity: 6, unit: "pcs", estimated_price: 320000 },
          { bom_id: template.id, item_name: "Pipa Seamless Steel 4\"", specification: "Ketebalan Sch 40 diameter luar", quantity: 3, unit: "batang", estimated_price: 1450000 }
        ];
        const { error: itemErr } = await supabase.from("bom_items").insert(bomItemsData);
        if (itemErr) console.error("Gagal insert BOM items untuk Conveyor:", itemErr);
        else console.log("Berhasil menambahkan item BOM untuk proyek Conveyor.");
      }
    }
  }

  console.log("\nProses seeding selesai dengan sukses!");
}

run();
