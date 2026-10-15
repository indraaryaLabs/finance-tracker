import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Plus, Trash2, Edit2, X, CheckCircle, Inbox, UserPlus, DollarSign, Zap, AlertTriangle } from "lucide-react";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { supabase } from "../lib/supabaseClient";
import { rupiah, formatAngka, parseAngka, formatTanggal, todayISO, currentMonthISO, formatBulanTahun, labelKategoriOperasional } from "../lib/formatters";
import DatePicker from "../components/DatePicker";
import ExportButtons from "../components/shared/ExportButtons";
import PrintHeader, { PrintFooter } from "../components/shared/PrintHeader";
import type { Employee, Payroll, OperationalExpense, OpexCategory } from "../types";

type SubTab = "karyawan" | "gaji" | "operasional";
const OPEX_CATEGORIES: { value: OpexCategory; label: string }[] = [{ value: "listrik", label: "Listrik & Air" },{ value: "sewa", label: "Sewa Tempat" },{ value: "peralatan", label: "Peralatan" },{ value: "transportasi", label: "Transportasi" },{ value: "umum", label: "Umum" }];

export default function OperasionalPage() {
  const { workspace, isAdmin } = useWorkspace();
  const [subTab, setSubTab] = useState<SubTab>("karyawan");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [opexList, setOpexList] = useState<OperationalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEmpFormOpen, setIsEmpFormOpen] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [empName, setEmpName] = useState(""); const [empPosition, setEmpPosition] = useState(""); const [empStartDate, setEmpStartDate] = useState(todayISO()); const [empSalaryMin, setEmpSalaryMin] = useState<number|"">(0); const [empSalaryMax, setEmpSalaryMax] = useState<number|"">(0);
  const [isPayFormOpen, setIsPayFormOpen] = useState(false);
  const [editingPayId, setEditingPayId] = useState<string | null>(null);
  const [payEmployeeId, setPayEmployeeId] = useState(""); const [payPeriod, setPayPeriod] = useState(currentMonthISO()); const [payBase, setPayBase] = useState<number|"">(0); const [payAllowance, setPayAllowance] = useState<number|"">(0); const [payDeduction, setPayDeduction] = useState<number|"">(0); const [payDate, setPayDate] = useState(todayISO()); const [payNotes, setPayNotes] = useState("");
  const [isOpexFormOpen, setIsOpexFormOpen] = useState(false);
  const [editingOpexId, setEditingOpexId] = useState<string | null>(null);
  const [opexDesc, setOpexDesc] = useState(""); const [opexAmount, setOpexAmount] = useState<number|"">(0); const [opexDate, setOpexDate] = useState(todayISO()); const [opexCategory, setOpexCategory] = useState<OpexCategory>("umum"); const [opexNotes, setOpexNotes] = useState("");
  const payNet = (Number(payBase)||0) + (Number(payAllowance)||0) - (Number(payDeduction)||0);

  useEffect(() => { if (workspace) fetchAll(); }, [workspace]);

  const fetchAll = async () => {
    if (!workspace) return; setLoading(true);
    try {
      const [empRes, payRes, opexRes] = await Promise.all([
        supabase.from("employees").select("*").eq("workspace_id", workspace.id).order("name"),
        supabase.from("payroll").select("*, employee:employees(name, position)").eq("workspace_id", workspace.id).order("period_month", { ascending: false }),
        supabase.from("operational_expenses").select("*").eq("workspace_id", workspace.id).order("expense_date", { ascending: false }),
      ]);
      setEmployees((empRes.data || []) as Employee[]); setPayrolls((payRes.data || []) as any[]); setOpexList((opexRes.data || []) as OperationalExpense[]);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault(); if (!workspace || !empName.trim()) return;
    const payload = { workspace_id: workspace.id, name: empName.trim(), position: empPosition.trim() || null, start_date: empStartDate || null, salary_min: Number(empSalaryMin) || 0, salary_max: Number(empSalaryMax) || 0 };
    if (editingEmpId) await supabase.from("employees").update(payload).eq("id", editingEmpId);
    else await supabase.from("employees").insert(payload);
    setIsEmpFormOpen(false); setEditingEmpId(null); setEmpName(""); setEmpPosition(""); setEmpStartDate(todayISO()); setEmpSalaryMin(0); setEmpSalaryMax(0); fetchAll();
  };

  const handleEditEmployee = (emp: Employee) => { setEditingEmpId(emp.id); setEmpName(emp.name); setEmpPosition(emp.position || ""); setEmpStartDate(emp.start_date || todayISO()); setEmpSalaryMin(emp.salary_min); setEmpSalaryMax(emp.salary_max); setIsEmpFormOpen(true); };
  const handleToggleActive = async (emp: Employee) => { await supabase.from("employees").update({ is_active: !emp.is_active }).eq("id", emp.id); fetchAll(); };

  const handleSavePayroll = async (e: React.FormEvent) => {
    e.preventDefault(); if (!workspace || !payEmployeeId || !payPeriod) return;
    const user = (await supabase.auth.getUser()).data.user; if (!user) return;
    const payload = { workspace_id: workspace.id, recorded_by: user.id, employee_id: payEmployeeId, period_month: payPeriod, base_amount: Number(payBase)||0, allowance: Number(payAllowance)||0, deduction: Number(payDeduction)||0, net_amount: payNet, paid_date: payDate || null, notes: payNotes.trim() || null };
    if (editingPayId) await supabase.from("payroll").update(payload).eq("id", editingPayId);
    else { const { error } = await supabase.from("payroll").insert(payload); if (error) { alert("Gagal: " + error.message); return; } }
    setIsPayFormOpen(false); setEditingPayId(null); setPayEmployeeId(""); setPayBase(0); setPayAllowance(0); setPayDeduction(0); setPayDate(todayISO()); setPayNotes(""); fetchAll();
  };

  const handleSaveOpex = async (e: React.FormEvent) => {
    e.preventDefault(); if (!workspace || !opexDesc.trim() || !opexDate) return;
    const user = (await supabase.auth.getUser()).data.user; if (!user) return;
    const payload = { workspace_id: workspace.id, recorded_by: user.id, description: opexDesc.trim(), amount: Number(opexAmount)||0, expense_date: opexDate, expense_category: opexCategory, notes: opexNotes.trim() || null };
    if (editingOpexId) await supabase.from("operational_expenses").update(payload).eq("id", editingOpexId);
    else await supabase.from("operational_expenses").insert(payload);
    setIsOpexFormOpen(false); setEditingOpexId(null); setOpexDesc(""); setOpexAmount(0); setOpexDate(todayISO()); setOpexCategory("umum"); setOpexNotes(""); fetchAll();
  };

  const handleDeleteOpex = async (id: string) => { if (!window.confirm("Hapus?")) return; await supabase.from("operational_expenses").delete().eq("id", id); fetchAll(); };
  const totalGaji = payrolls.reduce((s, p) => s + Number(p.net_amount), 0);
  const totalOpex = opexList.reduce((s, o) => s + Number(o.amount), 0);
  const getSalaryWarning = (empId: string, net: number): string | null => { const emp = employees.find(e => e.id === empId); if (!emp) return null; if (emp.salary_max > 0 && net > emp.salary_max) return "Di atas batas max"; if (emp.salary_min > 0 && net < emp.salary_min) return "Di bawah batas min"; return null; };

  const SUB_TABS: { id: SubTab; label: string; icon: React.ElementType }[] = [{ id: "karyawan", label: "Daftar Karyawan", icon: Users },{ id: "gaji", label: "Gaji Bulanan", icon: DollarSign },{ id: "operasional", label: "Biaya Operasional", icon: Zap }];
  const inputCls = "w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#e6dfd5] rounded-xl text-sm text-[#2d1d14] placeholder:text-[#b0a69c] focus:border-[#b87352] focus:ring-2 focus:ring-[#b87352]/10 outline-none transition";

  return (
    <div className="space-y-6">
      <PrintHeader title="Catatan Operasional" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div><h2 className="text-xl sm:text-2xl font-display font-bold text-[#2d1d14] tracking-tight flex items-center gap-2"><Users size={22} className="text-[#cf8a68]" />Operasional</h2><p className="text-xs text-[#8B7E74] mt-0.5">Karyawan, gaji, dan biaya operasional bengkel</p></div>
        <ExportButtons onPrint={() => window.print()} />
      </div>

      <div className="flex gap-1.5 bg-white/60 p-1.5 rounded-2xl border border-[#e6dfd5]/50 no-print">
        {SUB_TABS.map((tab) => { const Icon = tab.icon; const isActive = subTab === tab.id; return (
          <button key={tab.id} type="button" onClick={() => setSubTab(tab.id)} className={`relative flex items-center gap-1.5 py-2 px-3.5 rounded-xl cursor-pointer transition-all text-[11px] font-semibold flex-1 justify-center z-10 ${isActive ? "text-[#b87352]" : "text-[#8B7E74] hover:text-[#2d1d14]"}`}>
            {isActive && <motion.div layoutId="activeOpSubTab" className="absolute inset-0 bg-white border border-[#e6dfd5]/50 shadow-sm rounded-xl -z-10" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
            <Icon size={14} /><span className="hidden sm:inline">{tab.label}</span>
          </button>
        ); })}
      </div>

      {/* KARYAWAN */}
      {subTab === "karyawan" && (
        <div className="space-y-4">
          {isAdmin && <div className="flex justify-end no-print"><button type="button" onClick={() => { setEditingEmpId(null); setEmpName(""); setEmpPosition(""); setEmpStartDate(todayISO()); setEmpSalaryMin(0); setEmpSalaryMax(0); setIsEmpFormOpen(true); }} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#cf8a68] to-[#b87352] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#cf8a68]/15 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"><UserPlus size={14} />Tambah Karyawan</button></div>}
          <div className="bg-white/80 border border-[#e6dfd5] rounded-2xl overflow-hidden">
            {loading ? <div className="p-10 text-center"><div className="w-6 h-6 border-2 border-[#cf8a68] border-t-transparent rounded-full animate-spin mx-auto" /></div> : employees.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center"><Inbox size={40} className="text-[#e6dfd5] mb-3" /><p className="text-sm text-[#8B7E74] font-semibold">Belum ada data karyawan</p></div> : (
              <div className="overflow-x-auto"><table className="w-full text-left min-w-[550px]">
                <thead><tr className="border-b border-[#e6dfd5] text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest font-mono bg-[#FAF6F0]/60"><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Posisi</th><th className="px-4 py-3">Mulai Kerja</th><th className="px-4 py-3 text-right">Batas Gaji</th><th className="px-4 py-3 text-center">Status</th>{isAdmin && <th className="px-4 py-3 text-center no-print">Aksi</th>}</tr></thead>
                <tbody className="divide-y divide-[#e6dfd5]/50 text-xs">{employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#FAF6F0]/60 transition-colors">
                    <td className="px-4 py-3 text-[#2d1d14] font-semibold">{emp.name}</td>
                    <td className="px-4 py-3 text-[#8B7E74]">{emp.position || "—"}</td>
                    <td className="px-4 py-3 font-mono text-[#b0a69c]">{emp.start_date ? formatTanggal(emp.start_date, "short") : "—"}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#8B7E74] text-[11px]">{emp.salary_min > 0 || emp.salary_max > 0 ? `${rupiah(emp.salary_min)} — ${rupiah(emp.salary_max)}` : "Belum diatur"}</td>
                    <td className="px-4 py-3 text-center"><span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold border ${emp.is_active ? "text-[#5B8C5A] bg-[#5B8C5A]/8 border-[#5B8C5A]/20" : "text-[#b0a69c] bg-[#FAF6F0] border-[#e6dfd5]"}`}>{emp.is_active ? "Aktif" : "Non-aktif"}</span></td>
                    {isAdmin && <td className="px-4 py-3 text-center no-print"><div className="flex items-center justify-center gap-1"><button type="button" onClick={() => handleEditEmployee(emp)} className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#b87352] hover:bg-[#FAF6F0] transition cursor-pointer"><Edit2 size={13} /></button><button type="button" onClick={() => handleToggleActive(emp)} className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#cf8a68] hover:bg-[#FAF6F0] transition cursor-pointer text-[10px] font-bold">{emp.is_active ? "Nonaktifkan" : "Aktifkan"}</button></div></td>}
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
        </div>
      )}

      {/* GAJI */}
      {subTab === "gaji" && (
        <div className="space-y-4">
          {isAdmin && <div className="flex justify-end no-print"><button type="button" onClick={() => { setEditingPayId(null); setPayEmployeeId(""); setPayBase(0); setPayAllowance(0); setPayDeduction(0); setPayDate(todayISO()); setPayNotes(""); setIsPayFormOpen(true); }} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#cf8a68] to-[#b87352] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#cf8a68]/15 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"><Plus size={14} />Catat Gaji</button></div>}
          <div className="bg-white/80 border border-[#e6dfd5] rounded-2xl overflow-hidden">
            {payrolls.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center"><Inbox size={40} className="text-[#e6dfd5] mb-3" /><p className="text-sm text-[#8B7E74] font-semibold">Belum ada catatan gaji</p></div> : (
              <div className="overflow-x-auto"><table className="w-full text-left min-w-[600px]">
                <thead><tr className="border-b border-[#e6dfd5] text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest font-mono bg-[#FAF6F0]/60"><th className="px-4 py-3">Karyawan</th><th className="px-4 py-3">Periode</th><th className="px-4 py-3 text-right">Gaji Pokok</th><th className="px-4 py-3 text-right">Tunjangan</th><th className="px-4 py-3 text-right">Potongan</th><th className="px-4 py-3 text-right">Gaji Bersih</th><th className="px-4 py-3 text-center">Status</th></tr></thead>
                <tbody className="divide-y divide-[#e6dfd5]/50 text-xs">{payrolls.map((p: any) => {
                  const warning = getSalaryWarning(p.employee_id, Number(p.net_amount));
                  return (
                    <tr key={p.id} className="hover:bg-[#FAF6F0]/60 transition-colors">
                      <td className="px-4 py-3"><div className="text-[#2d1d14] font-semibold">{p.employee?.name || "—"}</div><div className="text-[10px] text-[#b0a69c]">{p.employee?.position || ""}</div></td>
                      <td className="px-4 py-3 font-mono text-[#8B7E74]">{formatBulanTahun(p.period_month)}</td>
                      <td className="px-4 py-3 text-right font-mono text-[#4a3f36]">{rupiah(Number(p.base_amount))}</td>
                      <td className="px-4 py-3 text-right font-mono text-[#5B8C5A]">+{rupiah(Number(p.allowance))}</td>
                      <td className="px-4 py-3 text-right font-mono text-[#C75B3F]">-{rupiah(Number(p.deduction))}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[#2d1d14]">{rupiah(Number(p.net_amount))}</td>
                      <td className="px-4 py-3 text-center">{warning ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-[#cf8a68] bg-[#cf8a68]/8 border border-[#cf8a68]/20"><AlertTriangle size={10} />{warning}</span> : <span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold text-[#5B8C5A] bg-[#5B8C5A]/8 border border-[#5B8C5A]/20">Normal</span>}</td>
                    </tr>
                  );
                })}</tbody>
                <tfoot><tr className="border-t border-[#e6dfd5] bg-[#FAF6F0]/40"><td colSpan={5} className="px-4 py-3 text-right text-xs font-bold text-[#8B7E74] uppercase">Total Gaji</td><td className="px-4 py-3 text-right font-mono font-bold text-[#2d1d14] text-sm">{rupiah(totalGaji)}</td><td /></tr></tfoot>
              </table></div>
            )}
          </div>
        </div>
      )}

      {/* OPERASIONAL */}
      {subTab === "operasional" && (
        <div className="space-y-4">
          <div className="flex justify-end no-print"><button type="button" onClick={() => { setEditingOpexId(null); setOpexDesc(""); setOpexAmount(0); setOpexDate(todayISO()); setOpexCategory("umum"); setOpexNotes(""); setIsOpexFormOpen(true); }} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#8B6DAF] to-[#7A5C9E] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#8B6DAF]/15 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"><Plus size={14} />Catat Biaya</button></div>
          <div className="bg-white/80 border border-[#e6dfd5] rounded-2xl overflow-hidden">
            {opexList.length === 0 ? <div className="flex flex-col items-center justify-center py-16 text-center"><Inbox size={40} className="text-[#e6dfd5] mb-3" /><p className="text-sm text-[#8B7E74] font-semibold">Belum ada biaya operasional</p></div> : (
              <div className="overflow-x-auto"><table className="w-full text-left min-w-[500px]">
                <thead><tr className="border-b border-[#e6dfd5] text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest font-mono bg-[#FAF6F0]/60"><th className="px-4 py-3 text-center w-12">No</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Keterangan</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3 text-right">Nominal</th><th className="px-4 py-3 text-center no-print">Aksi</th></tr></thead>
                <tbody className="divide-y divide-[#e6dfd5]/50 text-xs">{opexList.map((o, idx) => (
                  <tr key={o.id} className="hover:bg-[#FAF6F0]/60 transition-colors">
                    <td className="px-4 py-3 text-center font-mono text-[#b0a69c]">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-[#8B7E74] whitespace-nowrap">{formatTanggal(o.expense_date, "short")}</td>
                    <td className="px-4 py-3 text-[#2d1d14] font-semibold">{o.description}</td>
                    <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold text-[#8B6DAF] bg-[#8B6DAF]/8 border border-[#8B6DAF]/20">{labelKategoriOperasional(o.expense_category)}</span></td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#C75B3F]">{rupiah(Number(o.amount))}</td>
                    <td className="px-4 py-3 text-center no-print">{!o.is_locked && isAdmin && <button type="button" onClick={() => handleDeleteOpex(o.id)} className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#C75B3F] hover:bg-[#FAF6F0] transition cursor-pointer"><Trash2 size={13} /></button>}</td>
                  </tr>
                ))}</tbody>
                <tfoot><tr className="border-t border-[#e6dfd5] bg-[#FAF6F0]/40"><td colSpan={4} className="px-4 py-3 text-right text-xs font-bold text-[#8B7E74] uppercase">Total</td><td className="px-4 py-3 text-right font-mono font-bold text-[#2d1d14] text-sm">{rupiah(totalOpex)}</td><td className="no-print" /></tr></tfoot>
              </table></div>
            )}
          </div>
        </div>
      )}
      <PrintFooter />

      {/* MODALS */}
      <AnimatePresence>
        {isEmpFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm no-print">
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}} className="bg-[#FCFAF7] border border-[#e6dfd5] rounded-2xl max-w-lg w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#e6dfd5]/50 pb-3 mb-5"><h3 className="text-sm font-bold text-[#2d1d14] flex items-center gap-2"><UserPlus size={16} className="text-[#cf8a68]" />{editingEmpId ? "Edit Karyawan" : "Tambah Karyawan"}</h3><button type="button" onClick={() => setIsEmpFormOpen(false)} className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#2d1d14] hover:bg-[#FAF6F0] transition cursor-pointer"><X size={16} /></button></div>
              <form onSubmit={handleSaveEmployee} className="space-y-4">
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Nama Karyawan</label><input type="text" required value={empName} onChange={(e) => setEmpName(e.target.value)} placeholder="Nama lengkap" className={inputCls} autoFocus /></div>
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Posisi / Jabatan</label><input type="text" value={empPosition} onChange={(e) => setEmpPosition(e.target.value)} placeholder="Contoh: Tukang Las" className={inputCls} /></div>
                <DatePicker value={empStartDate} onChange={setEmpStartDate} label="Tanggal Mulai Kerja" />
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Batas Gaji Min</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#b0a69c]">Rp</span><input type="text" inputMode="numeric" value={Number(empSalaryMin)===0?"":formatAngka(Number(empSalaryMin))} onChange={(e)=>setEmpSalaryMin(parseAngka(e.target.value))} className={`${inputCls} pl-9 font-mono`} /></div></div>
                  <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Batas Gaji Max</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#b0a69c]">Rp</span><input type="text" inputMode="numeric" value={Number(empSalaryMax)===0?"":formatAngka(Number(empSalaryMax))} onChange={(e)=>setEmpSalaryMax(parseAngka(e.target.value))} className={`${inputCls} pl-9 font-mono`} /></div></div>
                </div>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#cf8a68] to-[#b87352] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#cf8a68]/15 hover:shadow-xl transition-all mt-2"><CheckCircle size={15} />{editingEmpId ? "Simpan" : "Tambah Karyawan"}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPayFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm no-print">
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}} className="bg-[#FCFAF7] border border-[#e6dfd5] rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#e6dfd5]/50 pb-3 mb-5"><h3 className="text-sm font-bold text-[#2d1d14] flex items-center gap-2"><DollarSign size={16} className="text-[#cf8a68]" />Catat Gaji</h3><button type="button" onClick={() => setIsPayFormOpen(false)} className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#2d1d14] hover:bg-[#FAF6F0] transition cursor-pointer"><X size={16} /></button></div>
              <form onSubmit={handleSavePayroll} className="space-y-4">
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Karyawan</label><select required value={payEmployeeId} onChange={(e)=>setPayEmployeeId(e.target.value)} className={`${inputCls} cursor-pointer`}><option value="">— Pilih Karyawan —</option>{employees.filter(e=>e.is_active).map((e)=><option key={e.id} value={e.id}>{e.name} — {e.position||"Tanpa posisi"}</option>)}</select></div>
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Periode Bulan</label><input type="month" value={payPeriod} onChange={(e)=>setPayPeriod(e.target.value)} className={inputCls} /></div>
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Gaji Pokok (Rp)</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#b0a69c]">Rp</span><input type="text" inputMode="numeric" value={Number(payBase)===0?"":formatAngka(Number(payBase))} onChange={(e)=>setPayBase(parseAngka(e.target.value))} className={`${inputCls} pl-9 font-mono`} /></div></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Tunjangan</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#b0a69c]">Rp</span><input type="text" inputMode="numeric" value={Number(payAllowance)===0?"":formatAngka(Number(payAllowance))} onChange={(e)=>setPayAllowance(parseAngka(e.target.value))} className={`${inputCls} pl-9 font-mono`} /></div></div>
                  <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Potongan</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#b0a69c]">Rp</span><input type="text" inputMode="numeric" value={Number(payDeduction)===0?"":formatAngka(Number(payDeduction))} onChange={(e)=>setPayDeduction(parseAngka(e.target.value))} className={`${inputCls} pl-9 font-mono`} /></div></div>
                </div>
                <div className="bg-[#FAF6F0] border border-[#e6dfd5]/60 rounded-xl p-3 flex items-center justify-between"><span className="text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest">Gaji Bersih</span><span className="text-lg font-mono font-bold text-[#2d1d14]">{rupiah(payNet)}</span></div>
                {payEmployeeId && payNet > 0 && getSalaryWarning(payEmployeeId, payNet) && <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#cf8a68]/8 border border-[#cf8a68]/20 text-[#cf8a68] text-xs font-semibold"><AlertTriangle size={14} />{getSalaryWarning(payEmployeeId, payNet)}</div>}
                <DatePicker value={payDate} onChange={setPayDate} label="Tanggal Pembayaran" />
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Catatan</label><input type="text" value={payNotes} onChange={(e)=>setPayNotes(e.target.value)} placeholder="Opsional..." className={inputCls} /></div>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#cf8a68] to-[#b87352] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#cf8a68]/15 transition-all mt-2"><CheckCircle size={15} />Simpan Gaji</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpexFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm no-print">
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}} className="bg-[#FCFAF7] border border-[#e6dfd5] rounded-2xl max-w-lg w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#e6dfd5]/50 pb-3 mb-5"><h3 className="text-sm font-bold text-[#2d1d14] flex items-center gap-2"><Zap size={16} className="text-[#8B6DAF]" />Catat Biaya Operasional</h3><button type="button" onClick={() => setIsOpexFormOpen(false)} className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#2d1d14] hover:bg-[#FAF6F0] transition cursor-pointer"><X size={16} /></button></div>
              <form onSubmit={handleSaveOpex} className="space-y-4">
                <DatePicker value={opexDate} onChange={setOpexDate} label="Tanggal" />
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Keterangan</label><input type="text" required value={opexDesc} onChange={(e)=>setOpexDesc(e.target.value)} placeholder="Contoh: Bayar listrik" className={inputCls} autoFocus /></div>
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Nominal (Rp)</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#b0a69c]">Rp</span><input type="text" inputMode="numeric" value={Number(opexAmount)===0?"":formatAngka(Number(opexAmount))} onChange={(e)=>setOpexAmount(parseAngka(e.target.value))} className={`${inputCls} pl-9 font-mono`} /></div></div>
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Kategori</label><select value={opexCategory} onChange={(e)=>setOpexCategory(e.target.value as OpexCategory)} className={`${inputCls} cursor-pointer`}>{OPEX_CATEGORIES.map((c)=><option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Catatan</label><input type="text" value={opexNotes} onChange={(e)=>setOpexNotes(e.target.value)} placeholder="Opsional..." className={inputCls} /></div>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#8B6DAF] to-[#7A5C9E] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#8B6DAF]/15 transition-all mt-2"><CheckCircle size={15} />Simpan</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
