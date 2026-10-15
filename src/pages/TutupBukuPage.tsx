import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Plus, Trash2, X, CheckCircle, Inbox, Calendar, DollarSign, ArrowUpRight, ArrowDownRight, Printer, AlertCircle } from "lucide-react";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { supabase } from "../lib/supabaseClient";
import { rupiah, formatTanggal, todayISO } from "../lib/formatters";
import DatePicker from "../components/DatePicker";
import ExportButtons from "../components/shared/ExportButtons";
import PrintHeader, { PrintFooter } from "../components/shared/PrintHeader";
import type { ClosingPeriod } from "../types";

export default function TutupBukuPage() {
  const { workspace, isAdmin } = useWorkspace();
  const [periods, setPeriods] = useState<ClosingPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<ClosingPeriod | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formStartDate, setFormStartDate] = useState(() => {
    const d = new Date();
    // Default to 1st of current month
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [formEndDate, setFormEndDate] = useState(todayISO());
  const [formNotes, setFormNotes] = useState("");

  // Preview values
  const [previewLoading, setPreviewLoading] = useState(false);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalMaterial, setTotalMaterial] = useState(0);
  const [totalPayroll, setTotalPayroll] = useState(0);
  const [totalOpex, setTotalOpex] = useState(0);

  useEffect(() => {
    if (workspace) fetchPeriods();
  }, [workspace]);

  // Fetch preview sums when dates change
  useEffect(() => {
    if (isFormOpen && workspace && formStartDate && formEndDate) {
      fetchPreviewData();
    }
  }, [isFormOpen, formStartDate, formEndDate, workspace]);

  const fetchPeriods = async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("closing_periods")
        .select("*")
        .eq("workspace_id", workspace.id)
        .order("end_date", { ascending: false });
      if (error) throw error;
      setPeriods((data || []) as ClosingPeriod[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviewData = async () => {
    if (!workspace) return;
    setPreviewLoading(true);
    try {
      const [incRes, matRes, opRes, payRes] = await Promise.all([
        supabase
          .from("income_records")
          .select("total_amount")
          .eq("workspace_id", workspace.id)
          .gte("income_date", formStartDate)
          .lte("income_date", formEndDate),
        supabase
          .from("material_purchases")
          .select("total_price")
          .eq("workspace_id", workspace.id)
          .gte("purchase_date", formStartDate)
          .lte("purchase_date", formEndDate),
        supabase
          .from("operational_expenses")
          .select("amount")
          .eq("workspace_id", workspace.id)
          .gte("expense_date", formStartDate)
          .lte("expense_date", formEndDate),
        supabase
          .from("payroll")
          .select("net_amount")
          .eq("workspace_id", workspace.id)
          .gte("paid_date", formStartDate)
          .lte("paid_date", formEndDate),
      ]);

      const sumInc = (incRes.data || []).reduce((s, r) => s + Number(r.total_amount), 0);
      const sumMat = (matRes.data || []).reduce((s, r) => s + Number(r.total_price), 0);
      const sumOpex = (opRes.data || []).reduce((s, r) => s + Number(r.amount), 0);
      const sumPay = (payRes.data || []).reduce((s, r) => s + Number(r.net_amount), 0);

      setTotalIncome(sumInc);
      setTotalMaterial(sumMat);
      setTotalOpex(sumOpex);
      setTotalPayroll(sumPay);
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    const d = new Date();
    setFormStartDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
    setFormEndDate(todayISO());
    setFormNotes("");
    setTotalIncome(0);
    setTotalMaterial(0);
    setTotalOpex(0);
    setTotalPayroll(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !formName.trim() || !formStartDate || !formEndDate) return;
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const totalExpense = totalMaterial + totalPayroll + totalOpex;
    const netBalance = totalIncome - totalExpense;

    try {
      // 1. Insert closing period
      const { data, error } = await supabase.from("closing_periods").insert({
        workspace_id: workspace.id,
        closed_by: user.id,
        name: formName.trim(),
        start_date: formStartDate,
        end_date: formEndDate,
        status: "closed",
        total_income: totalIncome,
        total_material_expense: totalMaterial,
        total_salary_expense: totalPayroll,
        total_operational_expense: totalOpex,
        net_balance: netBalance,
        admin_notes: formNotes.trim() || null,
      }).select().single();

      if (error) throw error;

      // 2. Lock the transactions in this period
      await Promise.all([
        supabase
          .from("income_records")
          .update({ is_locked: true })
          .eq("workspace_id", workspace.id)
          .gte("income_date", formStartDate)
          .lte("income_date", formEndDate),
        supabase
          .from("material_purchases")
          .update({ is_locked: true })
          .eq("workspace_id", workspace.id)
          .gte("purchase_date", formStartDate)
          .lte("purchase_date", formEndDate),
        supabase
          .from("operational_expenses")
          .update({ is_locked: true })
          .eq("workspace_id", workspace.id)
          .gte("expense_date", formStartDate)
          .lte("expense_date", formEndDate),
        supabase
          .from("payroll")
          .update({ is_locked: true })
          .eq("workspace_id", workspace.id)
          .gte("paid_date", formStartDate)
          .lte("paid_date", formEndDate),
      ]);

      setIsFormOpen(false);
      resetForm();
      fetchPeriods();
    } catch (err: any) {
      alert("Gagal melakukan tutup buku: " + err.message);
    }
  };

  const handleDelete = async (period: ClosingPeriod) => {
    if (!window.confirm(`Hapus catatan tutup buku "${period.name}"? Transaksi pada periode ini akan tetap terkunci.`)) return;
    try {
      const { error } = await supabase.from("closing_periods").delete().eq("id", period.id);
      if (error) throw error;
      fetchPeriods();
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const totalExpensePreview = totalMaterial + totalPayroll + totalOpex;
  const netBalancePreview = totalIncome - totalExpensePreview;

  const handlePrint = (p: ClosingPeriod) => {
    setSelectedPeriod(p);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const inputCls = "w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#e6dfd5] rounded-xl text-sm text-[#2d1d14] placeholder:text-[#b0a69c] focus:border-[#b87352] focus:ring-2 focus:ring-[#b87352]/10 outline-none transition";

  return (
    <div className="space-y-6">
      {/* Hide the normal view when printing the specific selected period details */}
      <div className="no-print space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-[#2d1d14] tracking-tight flex items-center gap-2">
              <BookOpen size={22} className="text-[#b87352]" />
              Tutup Buku
            </h2>
            <p className="text-xs text-[#8B7E74] mt-0.5">Laporan pembukuan akhir periode dan penguncian transaksi</p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#b87352] to-[#a0613f] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#b87352]/15 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Plus size={14} />
              Tutup Buku Baru
            </button>
          )}
        </div>

        {/* Warning alert */}
        <div className="p-4 bg-[#b87352]/5 border border-[#e6dfd5] rounded-2xl flex items-start gap-3">
          <AlertCircle size={16} className="text-[#b87352] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#8B7E74] leading-relaxed">
            <strong className="text-[#2d1d14] block mb-0.5">Tentang Tutup Buku</strong>
            Tutup Buku berfungsi untuk merangkum seluruh transaksi dalam rentang tanggal tertentu menjadi patokan keuangan permanen. Setelah tutup buku berhasil disimpan, seluruh transaksi (Pemasukan, Belanja, Payroll, Operasional) pada rentang tanggal tersebut akan **dikunci (Locked)** secara otomatis untuk menjaga integritas data keuangan fisik Anda.
          </div>
        </div>

        {/* Periods List */}
        <div className="bg-white/80 border border-[#e6dfd5] rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-10 text-center">
              <div className="w-6 h-6 border-2 border-[#b87352] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-[#8B7E74]">Memuat data pembukuan...</p>
            </div>
          ) : periods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox size={40} className="text-[#e6dfd5] mb-3" />
              <p className="text-sm text-[#8B7E74] font-semibold">Belum ada periode tutup buku</p>
              <p className="text-xs text-[#b0a69c] mt-1">Lakukan tutup buku pertama untuk mengunci pembukuan Anda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[750px]">
                <thead>
                  <tr className="border-b border-[#e6dfd5] text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest font-mono bg-[#FAF6F0]/60">
                    <th className="px-4 py-3 text-center w-12">No</th>
                    <th className="px-4 py-3">Nama Laporan / Periode</th>
                    <th className="px-4 py-3">Rentang Tanggal</th>
                    <th className="px-4 py-3 text-right">Pemasukan</th>
                    <th className="px-4 py-3 text-right">Pengeluaran</th>
                    <th className="px-4 py-3 text-right">Saldo Bersih</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6dfd5]/50 text-xs">
                  {periods.map((p, idx) => {
                    const totalExp =
                      Number(p.total_material_expense) +
                      Number(p.total_salary_expense) +
                      Number(p.total_operational_expense);
                    return (
                      <tr key={p.id} className="hover:bg-[#FAF6F0]/60 transition-colors">
                        <td className="px-4 py-3 text-center font-mono text-[#b0a69c]">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-[#2d1d14]">{p.name}</td>
                        <td className="px-4 py-3 font-mono text-[#8B7E74] whitespace-nowrap">
                          {formatTanggal(p.start_date, "short")} s/d {formatTanggal(p.end_date, "short")}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[#5B8C5A]">
                          {rupiah(Number(p.total_income))}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[#C75B3F]">
                          {rupiah(totalExp)}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${Number(p.net_balance) >= 0 ? "text-[#5B8C5A]" : "text-[#C75B3F]"}`}>
                          {rupiah(Number(p.net_balance))}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold border text-[#5B8C5A] bg-[#5B8C5A]/8 border-[#5B8C5A]/20">
                            Closed
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handlePrint(p)}
                              title="Print Buku Fisik"
                              className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#b87352] hover:bg-[#FAF6F0] transition cursor-pointer"
                            >
                              <Printer size={13} />
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDelete(p)}
                                title="Hapus Catatan Laporan"
                                className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#C75B3F] hover:bg-[#FAF6F0] transition cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* PRINT-FRIENDLY SELECTED PERIOD DETAIL DISPLAY (Hidden in screen, shows only when printing) */}
      {selectedPeriod && (
        <div className="hidden print:block font-serif text-black p-6 space-y-6">
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-2xl font-bold uppercase tracking-wide">{workspace?.name || "BENGKELBOOKS"}</h1>
            {workspace?.address && <p className="text-sm mt-0.5">{workspace.address}</p>}
            {workspace?.phone && <p className="text-sm">Telp: {workspace.phone}</p>}
            <div className="mt-4">
              <h2 className="text-lg font-bold uppercase tracking-wider">Laporan Pertanggungjawaban Tutup Buku</h2>
              <p className="text-sm italic">Periode: {formatTanggal(selectedPeriod.start_date, "long")} s/d {formatTanggal(selectedPeriod.end_date, "long")}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Identitas Laporan</span>
              <table className="w-full text-sm border-none">
                <tbody>
                  <tr className="border-none"><td className="py-1 font-bold w-40">Nama Pembukuan:</td><td className="py-1">{selectedPeriod.name}</td></tr>
                  <tr className="border-none"><td className="py-1 font-bold">Tanggal Penutupan:</td><td className="py-1">{formatTanggal(selectedPeriod.closed_at, "long")}</td></tr>
                  {selectedPeriod.admin_notes && (
                    <tr className="border-none"><td className="py-1 font-bold">Catatan Laporan:</td><td className="py-1 italic">"{selectedPeriod.admin_notes}"</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Ringkasan Arus Kas Masuk & Keluar</span>
              <table className="w-full text-sm border border-collapse border-black">
                <thead>
                  <tr className="bg-gray-100 border border-black">
                    <th className="p-2 text-left border border-black">Uraian Transaksi / Pos Keuangan</th>
                    <th className="p-2 text-right border border-black w-48">Nominal (Rupiah)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-black font-semibold text-green-700">1. Total Pendapatan / Pemasukan Kas</td>
                    <td className="p-2 text-right font-mono font-bold border border-black text-green-700">+{rupiah(Number(selectedPeriod.total_income))}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-black font-semibold text-red-700">2. Total Pengeluaran Kas</td>
                    <td className="p-2 text-right font-mono font-bold border border-black text-red-700">-{rupiah(Number(selectedPeriod.total_material_expense) + Number(selectedPeriod.total_salary_expense) + Number(selectedPeriod.total_operational_expense))}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-2 pl-6 border border-black italic text-gray-700">a. Belanja Bahan & Material</td>
                    <td className="p-2 text-right font-mono border border-black text-gray-700">{rupiah(Number(selectedPeriod.total_material_expense))}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-2 pl-6 border border-black italic text-gray-700">b. Gaji & Upah Karyawan</td>
                    <td className="p-2 text-right font-mono border border-black text-gray-700">{rupiah(Number(selectedPeriod.total_salary_expense))}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-2 pl-6 border border-black italic text-gray-700">c. Biaya Rutin Operasional</td>
                    <td className="p-2 text-right font-mono border border-black text-gray-700">{rupiah(Number(selectedPeriod.total_operational_expense))}</td>
                  </tr>
                  <tr className="bg-gray-100 font-bold">
                    <td className="p-2 border border-black text-lg">Saldo Bersih / Laba Bersih (Net Balance)</td>
                    <td className="p-2 text-right font-mono text-lg border border-black">{rupiah(Number(selectedPeriod.net_balance))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <PrintFooter />
        </div>
      )}

      {/* FORM MODAL */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FCFAF7] border border-[#e6dfd5] rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#e6dfd5]/50 pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-[#b87352]" />
                  <h3 className="text-sm font-bold text-[#2d1d14]">Tutup Buku Pembukuan</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                  className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#2d1d14] hover:bg-[#FAF6F0] transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Nama Laporan / Periode Tutup Buku</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Pembukuan Januari 2026 atau LPJ Q1 2026"
                    className={inputCls}
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <DatePicker value={formStartDate} onChange={setFormStartDate} label="Tanggal Mulai" />
                  <DatePicker value={formEndDate} onChange={setFormEndDate} label="Tanggal Selesai" />
                </div>

                {/* Live Preview Sums */}
                <div className="bg-[#FAF6F0] border border-[#e6dfd5] rounded-xl p-4 space-y-3">
                  <span className="text-[10px] font-bold text-[#b87352] uppercase tracking-widest block">Estimasi Arus Kas Posisi Periode Ini</span>
                  {previewLoading ? (
                    <div className="py-4 text-center">
                      <div className="w-4 h-4 border-2 border-[#b87352] border-t-transparent rounded-full animate-spin mx-auto mb-1" />
                      <p className="text-[10px] text-[#8B7E74]">Menghitung nominal...</p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center text-green-700">
                        <span className="flex items-center gap-1">
                          <ArrowUpRight size={12} />
                          Pemasukan:
                        </span>
                        <span className="font-mono font-semibold">+{rupiah(totalIncome)}</span>
                      </div>
                      <div className="flex justify-between items-center text-red-700">
                        <span className="flex items-center gap-1">
                          <ArrowDownRight size={12} />
                          Pengeluaran:
                        </span>
                        <span className="font-mono font-semibold">-{rupiah(totalExpensePreview)}</span>
                      </div>
                      <div className="pl-4 space-y-1 text-[11px] text-[#8B7E74] border-l border-[#e6dfd5]">
                        <div className="flex justify-between"><span>• Material:</span><span className="font-mono">{rupiah(totalMaterial)}</span></div>
                        <div className="flex justify-between"><span>• Gaji:</span><span className="font-mono">{rupiah(totalPayroll)}</span></div>
                        <div className="flex justify-between"><span>• Operasional:</span><span className="font-mono">{rupiah(totalOpex)}</span></div>
                      </div>
                      <div className="border-t border-[#e6dfd5]/60 pt-2 flex justify-between font-bold text-[#2d1d14]">
                        <span>Saldo Bersih:</span>
                        <span className="font-mono">{rupiah(netBalancePreview)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Catatan Laporan <span className="text-[#b0a69c]">(Opsional)</span></label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={2}
                    placeholder="Catatan tambahan mengenai laporan pembukuan ini..."
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={previewLoading || !formName.trim()}
                  className="w-full py-3 bg-gradient-to-r from-[#b87352] to-[#a0613f] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#b87352]/15 hover:shadow-xl hover:-translate-y-0.5 transition-all mt-2 disabled:opacity-50"
                >
                  <CheckCircle size={15} />
                  Simpan & Kunci Pembukuan
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
