import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Wallet, TrendingUp, TrendingDown, Activity, ShoppingCart, Users, Calendar, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, RotateCcw, Inbox } from "lucide-react";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { supabase } from "../lib/supabaseClient";
import { rupiah, formatBulanTahun, currentMonthISO, labelSubTipePemasukan } from "../lib/formatters";
import StatCard from "../components/shared/StatCard";
import type { IncomeRecord, MaterialPurchase, OperationalExpense, Payroll } from "../types";

export default function DashboardPage() {
  const { workspace } = useWorkspace();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthISO());
  const [loading, setLoading] = useState(true);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [materialPurchases, setMaterialPurchases] = useState<MaterialPurchase[]>([]);
  const [operationalExpenses, setOperationalExpenses] = useState<OperationalExpense[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<Payroll[]>([]);

  useEffect(() => { if (workspace) fetchData(); }, [workspace, selectedMonth]);

  const fetchData = async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const [incRes, matRes, opRes, payRes] = await Promise.all([
        supabase.from("income_records").select("*").eq("workspace_id", workspace.id).gte("income_date", `${selectedMonth}-01`).lte("income_date", `${selectedMonth}-31`),
        supabase.from("material_purchases").select("*").eq("workspace_id", workspace.id).gte("purchase_date", `${selectedMonth}-01`).lte("purchase_date", `${selectedMonth}-31`),
        supabase.from("operational_expenses").select("*").eq("workspace_id", workspace.id).gte("expense_date", `${selectedMonth}-01`).lte("expense_date", `${selectedMonth}-31`),
        supabase.from("payroll").select("*").eq("workspace_id", workspace.id).eq("period_month", selectedMonth),
      ]);
      setIncomeRecords((incRes.data || []) as IncomeRecord[]);
      setMaterialPurchases((matRes.data || []) as MaterialPurchase[]);
      setOperationalExpenses((opRes.data || []) as OperationalExpense[]);
      setPayrollRecords((payRes.data || []) as Payroll[]);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const totalIncome = incomeRecords.reduce((s, r) => s + Number(r.total_amount), 0);
  const totalMaterial = materialPurchases.reduce((s, r) => s + Number(r.total_price), 0);
  const totalOpex = operationalExpenses.reduce((s, r) => s + Number(r.amount), 0);
  const totalPayroll = payrollRecords.reduce((s, r) => s + Number(r.net_amount), 0);
  const totalExpense = totalMaterial + totalOpex + totalPayroll;
  const netBalance = totalIncome - totalExpense;

  const incomeByType: Record<string, number> = {};
  incomeRecords.forEach((r) => { incomeByType[r.sub_type] = (incomeByType[r.sub_type] || 0) + Number(r.total_amount); });

  const handlePrevMonth = () => { const [y, m] = selectedMonth.split("-").map(Number); const d = new Date(y, m - 2, 1); setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); };
  const handleNextMonth = () => { const [y, m] = selectedMonth.split("-").map(Number); const d = new Date(y, m, 1); setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-[#2d1d14] tracking-tight">Ringkasan Keuangan</h2>
          <p className="text-xs text-[#8B7E74] mt-0.5">Gambaran umum arus kas bengkel {workspace?.name}</p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button type="button" onClick={handlePrevMonth} className="p-2 rounded-xl bg-white/80 border border-[#e6dfd5] text-[#8B7E74] hover:text-[#2d1d14] hover:bg-white transition cursor-pointer"><ChevronLeft size={16} /></button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 border border-[#e6dfd5] rounded-xl min-w-[160px] justify-center">
            <Calendar size={14} className="text-[#b87352]" />
            <span className="text-sm font-bold text-[#2d1d14]">{formatBulanTahun(selectedMonth)}</span>
          </div>
          <button type="button" onClick={handleNextMonth} className="p-2 rounded-xl bg-white/80 border border-[#e6dfd5] text-[#8B7E74] hover:text-[#2d1d14] hover:bg-white transition cursor-pointer"><ChevronRight size={16} /></button>
          <button type="button" onClick={() => setSelectedMonth(currentMonthISO())} title="Bulan ini" className="p-2 rounded-xl bg-white/80 border border-[#e6dfd5] text-[#8B7E74] hover:text-[#b87352] hover:bg-white transition cursor-pointer"><RotateCcw size={14} /></button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <div key={i} className="h-32 rounded-2xl bg-white/60 animate-pulse border border-[#e6dfd5]" />)}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Kas Bersih" value={rupiah(netBalance)} icon={Wallet} trend={netBalance >= 0 ? "up" : "down"} trendLabel={netBalance >= 0 ? "Positif" : "Defisit"} accentColor="text-[#b87352]" />
            <StatCard title="Total Pemasukan" value={rupiah(totalIncome)} subtitle={`${incomeRecords.length} transaksi`} icon={TrendingUp} trend={totalIncome > 0 ? "up" : "neutral"} trendLabel={totalIncome > 0 ? "Ada pemasukan" : "Belum ada"} accentColor="text-[#5B8C5A]" />
            <StatCard title="Total Pengeluaran" value={rupiah(totalExpense)} subtitle="Material + Operasional + Gaji" icon={TrendingDown} accentColor="text-[#C75B3F]" />
            <StatCard title="Rasio Pengeluaran" value={totalIncome > 0 ? `${Math.round((totalExpense / totalIncome) * 100)}%` : "—"} subtitle="dari total pemasukan" icon={Activity}
              trend={totalIncome === 0 ? "neutral" : totalExpense / totalIncome > 0.9 ? "down" : "up"} trendLabel={totalIncome === 0 ? "Belum ada data" : totalExpense / totalIncome > 0.9 ? "Perlu perhatian" : "Sehat"} accentColor="text-[#cf8a68]" />
          </div>

          {/* Detail breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income */}
            <div className="bg-white/80 border border-[#e6dfd5] rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 rounded-xl bg-[#5B8C5A]/8 border border-[#5B8C5A]/15 text-[#5B8C5A]"><ArrowUpRight size={15} /></div>
                <div><h3 className="text-sm font-bold text-[#2d1d14]">Rincian Pemasukan</h3><p className="text-[10px] text-[#b0a69c] font-mono uppercase tracking-widest">Per Jenis Layanan</p></div>
              </div>
              {incomeRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center"><Inbox size={32} className="text-[#e6dfd5] mb-3" /><p className="text-xs text-[#8B7E74]">Belum ada pemasukan bulan ini</p></div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(incomeByType).sort(([,a],[,b])=>b-a).map(([type, amount]) => {
                    const pct = totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0;
                    return (
                      <div key={type} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs"><span className="font-semibold text-[#4a3f36]">{labelSubTipePemasukan(type)}</span><span className="font-mono font-bold text-[#5B8C5A]">{rupiah(amount)}</span></div>
                        <div className="w-full h-2 bg-[#FAF6F0] rounded-full overflow-hidden">
                          <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.8,ease:"easeOut"}} className="h-full bg-gradient-to-r from-[#5B8C5A] to-[#7c9473] rounded-full" />
                        </div>
                        <p className="text-[10px] text-[#b0a69c] font-mono">{pct}% dari total</p>
                      </div>
                    );
                  })}
                  <div className="border-t border-[#e6dfd5]/60 pt-3 mt-3 flex justify-between text-xs font-bold"><span className="text-[#8B7E74]">Total</span><span className="text-[#5B8C5A] font-mono">{rupiah(totalIncome)}</span></div>
                </div>
              )}
            </div>

            {/* Expense */}
            <div className="bg-white/80 border border-[#e6dfd5] rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 rounded-xl bg-[#C75B3F]/8 border border-[#C75B3F]/15 text-[#C75B3F]"><ArrowDownRight size={15} /></div>
                <div><h3 className="text-sm font-bold text-[#2d1d14]">Rincian Pengeluaran</h3><p className="text-[10px] text-[#b0a69c] font-mono uppercase tracking-widest">Per Kategori</p></div>
              </div>
              {totalExpense === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center"><Inbox size={32} className="text-[#e6dfd5] mb-3" /><p className="text-xs text-[#8B7E74]">Belum ada pengeluaran bulan ini</p></div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: "Belanja Material", amount: totalMaterial, icon: ShoppingCart, grad: "from-[#b87352] to-[#cf8a68]", tc: "text-[#b87352]" },
                    { label: "Gaji Karyawan", amount: totalPayroll, icon: Users, grad: "from-[#cf8a68] to-[#b87352]", tc: "text-[#cf8a68]" },
                    { label: "Operasional", amount: totalOpex, icon: Activity, grad: "from-[#8B6DAF] to-[#a88bc7]", tc: "text-[#8B6DAF]" },
                  ].filter(i => i.amount > 0).sort((a,b) => b.amount - a.amount).map((item) => {
                    const Icon = item.icon; const pct = totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0;
                    return (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs"><span className="font-semibold text-[#4a3f36] flex items-center gap-1.5"><Icon size={12} className={item.tc} />{item.label}</span><span className={`font-mono font-bold ${item.tc}`}>{rupiah(item.amount)}</span></div>
                        <div className="w-full h-2 bg-[#FAF6F0] rounded-full overflow-hidden">
                          <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.8,ease:"easeOut"}} className={`h-full bg-gradient-to-r ${item.grad} rounded-full`} />
                        </div>
                        <p className="text-[10px] text-[#b0a69c] font-mono">{pct}% dari total</p>
                      </div>
                    );
                  })}
                  <div className="border-t border-[#e6dfd5]/60 pt-3 mt-3 flex justify-between text-xs font-bold"><span className="text-[#8B7E74]">Total</span><span className="text-[#C75B3F] font-mono">{rupiah(totalExpense)}</span></div>
                </div>
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-white/80 border border-[#e6dfd5] rounded-2xl p-5 sm:p-6">
            <h3 className="text-sm font-bold text-[#2d1d14] mb-4">Aktivitas Terbaru</h3>
            {incomeRecords.length === 0 && materialPurchases.length === 0 && operationalExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center"><Inbox size={40} className="text-[#e6dfd5] mb-3" /><p className="text-sm text-[#8B7E74] font-semibold">Belum ada pencatatan</p><p className="text-xs text-[#b0a69c] mt-1 max-w-xs">Mulai catat keuangan bengkel melalui tab Pemasukan, Belanja, atau Operasional.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[500px]">
                  <thead><tr className="border-b border-[#e6dfd5] text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest font-mono">
                    <th className="pb-3 pr-4">Tanggal</th><th className="pb-3 pr-4">Keterangan</th><th className="pb-3 pr-4">Jenis</th><th className="pb-3 text-right">Nominal</th>
                  </tr></thead>
                  <tbody className="divide-y divide-[#e6dfd5]/50 text-xs">
                    {[
                      ...incomeRecords.map(r => ({ date: r.income_date, desc: r.description, type: "Pemasukan" as const, amount: Number(r.total_amount), isIncome: true })),
                      ...materialPurchases.map(r => ({ date: r.purchase_date, desc: `${r.item_name}${r.specification ? ` — ${r.specification}` : ""}`, type: "Belanja" as const, amount: Number(r.total_price), isIncome: false })),
                      ...operationalExpenses.map(r => ({ date: r.expense_date, desc: r.description, type: "Operasional" as const, amount: Number(r.amount), isIncome: false })),
                    ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0,10).map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF6F0]/60 transition-colors">
                        <td className="py-3 pr-4 font-mono text-[#8B7E74] whitespace-nowrap">{item.date}</td>
                        <td className="py-3 pr-4 text-[#4a3f36] font-medium max-w-[200px] truncate">{item.desc}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                            item.isIncome ? "text-[#5B8C5A] bg-[#5B8C5A]/8 border-[#5B8C5A]/20" : item.type === "Belanja" ? "text-[#b87352] bg-[#b87352]/8 border-[#b87352]/20" : "text-[#8B6DAF] bg-[#8B6DAF]/8 border-[#8B6DAF]/20"
                          }`}>{item.type}</span>
                        </td>
                        <td className={`py-3 text-right font-mono font-bold ${item.isIncome ? "text-[#5B8C5A]" : "text-[#C75B3F]"}`}>{item.isIncome ? "+" : "−"}{rupiah(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
