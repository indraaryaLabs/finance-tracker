import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, Plus, Trash2, Edit2, Search, X, CheckCircle, Inbox, Wrench, Package, Layers } from "lucide-react";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { supabase } from "../lib/supabaseClient";
import { rupiah, formatAngka, parseAngka, formatTanggal, todayISO, labelSubTipePemasukan } from "../lib/formatters";
import DatePicker from "../components/DatePicker";
import ExportButtons from "../components/shared/ExportButtons";
import PrintHeader, { PrintFooter } from "../components/shared/PrintHeader";
import type { IncomeRecord, IncomeSubType } from "../types";

const SUB_TYPES: { value: IncomeSubType; label: string; icon: React.ElementType; color: string; badge: string }[] = [
  { value: "unit_order", label: "Pemesanan Unit", icon: Package, color: "text-[#b87352]", badge: "text-[#b87352] bg-[#b87352]/8 border-[#b87352]/20" },
  { value: "maintenance", label: "Perbaikan", icon: Wrench, color: "text-[#cf8a68]", badge: "text-[#cf8a68] bg-[#cf8a68]/8 border-[#cf8a68]/20" },
  { value: "service_other", label: "Jasa Lainnya", icon: Layers, color: "text-[#8B6DAF]", badge: "text-[#8B6DAF] bg-[#8B6DAF]/8 border-[#8B6DAF]/20" },
];

export default function PemasukanPage() {
  const { workspace, isAdmin } = useWorkspace();
  const [records, setRecords] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [formSubType, setFormSubType] = useState<IncomeSubType>("unit_order");
  const [formDesc, setFormDesc] = useState("");
  const [formClient, setFormClient] = useState("");
  const [formQty, setFormQty] = useState<number | "">(1);
  const [formUnitPrice, setFormUnitPrice] = useState<number | "">(0);
  const [formTotal, setFormTotal] = useState<number | "">(0);
  const [formDate, setFormDate] = useState(todayISO());
  const [formNotes, setFormNotes] = useState("");
  const [useAutoCalc, setUseAutoCalc] = useState(true);

  useEffect(() => { if (useAutoCalc) setFormTotal((Number(formQty) || 0) * (Number(formUnitPrice) || 0)); }, [formQty, formUnitPrice, useAutoCalc]);
  useEffect(() => { if (workspace) fetchData(); }, [workspace]);

  const fetchData = async () => {
    if (!workspace) return; setLoading(true);
    try { const { data } = await supabase.from("income_records").select("*").eq("workspace_id", workspace.id).order("income_date", { ascending: false }); setRecords((data || []) as IncomeRecord[]); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const resetForm = () => { setFormSubType("unit_order"); setFormDesc(""); setFormClient(""); setFormQty(1); setFormUnitPrice(0); setFormTotal(0); setFormDate(todayISO()); setFormNotes(""); setUseAutoCalc(true); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!workspace || !formDesc.trim() || !formDate) return;
    const user = (await supabase.auth.getUser()).data.user; if (!user) return;
    const payload = { workspace_id: workspace.id, recorded_by: user.id, sub_type: formSubType, description: formDesc.trim(), client_name: formClient.trim() || null, quantity: Number(formQty) || 1, unit_price: Number(formUnitPrice) || 0, total_amount: Number(formTotal) || 0, income_date: formDate, notes: formNotes.trim() || null };
    if (editingId) { const { error } = await supabase.from("income_records").update(payload).eq("id", editingId); if (error) { alert("Gagal: " + error.message); return; } }
    else { const { error } = await supabase.from("income_records").insert(payload); if (error) { alert("Gagal: " + error.message); return; } }
    setIsFormOpen(false); resetForm(); fetchData();
  };

  const handleEdit = (r: IncomeRecord) => { setEditingId(r.id); setFormSubType(r.sub_type); setFormDesc(r.description); setFormClient(r.client_name || ""); setFormQty(r.quantity); setFormUnitPrice(r.unit_price); setFormTotal(Number(r.total_amount)); setFormDate(r.income_date); setFormNotes(r.notes || ""); setUseAutoCalc(false); setIsFormOpen(true); };
  const handleDelete = async (id: string) => { if (!window.confirm("Hapus?")) return; await supabase.from("income_records").delete().eq("id", id); fetchData(); };

  const filtered = records.filter((r) => { if (filterType !== "all" && r.sub_type !== filterType) return false; if (!searchQuery) return true; const q = searchQuery.toLowerCase(); return r.description.toLowerCase().includes(q) || (r.client_name || "").toLowerCase().includes(q); });
  const totalPemasukan = filtered.reduce((s, r) => s + Number(r.total_amount), 0);

  const handleExport = () => {
    const html = `<html><head><meta charset="utf-8"><style>table{border-collapse:collapse;width:100%;font-family:Arial}th{background:#f0f0f0;border:1px solid #333;padding:6px 8px;font-size:10px;text-transform:uppercase}td{border:1px solid #555;padding:5px 8px;font-size:11px}.mono{font-family:Courier,monospace;font-weight:bold}</style></head><body><h2>${workspace?.name || "Bengkel"} — Catatan Pemasukan</h2><table><thead><tr><th>No</th><th>Tanggal</th><th>Jenis</th><th>Keterangan</th><th>Klien</th><th>Qty</th><th>Harga Satuan</th><th>Total</th></tr></thead><tbody>${filtered.map((r, i) => `<tr><td>${i + 1}</td><td>${r.income_date}</td><td>${labelSubTipePemasukan(r.sub_type)}</td><td>${r.description}</td><td>${r.client_name || "-"}</td><td class="mono">${r.quantity}</td><td class="mono">${rupiah(r.unit_price)}</td><td class="mono">${rupiah(Number(r.total_amount))}</td></tr>`).join("")}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `Pemasukan_${todayISO()}.xls`; a.click();
  };

  const inputCls = "w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#e6dfd5] rounded-xl text-sm text-[#2d1d14] placeholder:text-[#b0a69c] focus:border-[#b87352] focus:ring-2 focus:ring-[#b87352]/10 outline-none transition";

  return (
    <div className="space-y-6">
      <PrintHeader title="Catatan Pemasukan" subtitle={`Total: ${rupiah(totalPemasukan)}`} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-[#2d1d14] tracking-tight flex items-center gap-2"><TrendingUp size={22} className="text-[#5B8C5A]" />Pemasukan</h2>
          <p className="text-xs text-[#8B7E74] mt-0.5">Pencatatan pemasukan dari pemesanan, perbaikan, dan jasa</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons onExportExcel={handleExport} onPrint={() => window.print()} />
          <button type="button" onClick={() => { resetForm(); setIsFormOpen(true); }} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#5B8C5A] to-[#4a7a49] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#5B8C5A]/15 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"><Plus size={14} />Catat Pemasukan</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 no-print">
        <div className="relative flex-1"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0a69c]" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari keterangan atau nama klien..." className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-[#e6dfd5] rounded-xl text-sm text-[#2d1d14] placeholder:text-[#b0a69c] focus:border-[#b87352]/50 outline-none transition" /></div>
        <div className="flex gap-1.5 flex-wrap">
          <button type="button" onClick={() => setFilterType("all")} className={`px-3 py-2 text-[11px] font-semibold rounded-xl border transition cursor-pointer ${filterType === "all" ? "bg-white text-[#2d1d14] border-[#e6dfd5] shadow-sm" : "text-[#8B7E74] border-transparent hover:text-[#2d1d14] hover:bg-white/60"}`}>Semua</button>
          {SUB_TYPES.map((st) => (<button key={st.value} type="button" onClick={() => setFilterType(st.value)} className={`px-3 py-2 text-[11px] font-semibold rounded-xl border transition cursor-pointer ${filterType === st.value ? `${st.badge} border` : "text-[#8B7E74] border-transparent hover:text-[#2d1d14] hover:bg-white/60"}`}>{st.label}</button>))}
        </div>
      </div>

      <div className="bg-white/80 border border-[#e6dfd5] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center"><div className="w-6 h-6 border-2 border-[#5B8C5A] border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-xs text-[#8B7E74]">Memuat data...</p></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center"><Inbox size={40} className="text-[#e6dfd5] mb-3" /><p className="text-sm text-[#8B7E74] font-semibold">{searchQuery || filterType !== "all" ? "Tidak ditemukan" : "Belum ada pemasukan"}</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[650px]">
              <thead><tr className="border-b border-[#e6dfd5] text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest font-mono bg-[#FAF6F0]/60">
                <th className="px-4 py-3 text-center w-12">No</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Jenis</th><th className="px-4 py-3">Keterangan</th><th className="px-4 py-3">Klien</th><th className="px-4 py-3 text-right">Nominal</th><th className="px-4 py-3 text-center no-print">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-[#e6dfd5]/50 text-xs">
                {filtered.map((r, idx) => {
                  const st = SUB_TYPES.find((s) => s.value === r.sub_type);
                  return (
                    <tr key={r.id} className="hover:bg-[#FAF6F0]/60 transition-colors">
                      <td className="px-4 py-3 text-center font-mono text-[#b0a69c]">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-[#8B7E74] whitespace-nowrap">{formatTanggal(r.income_date, "short")}</td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${st?.badge || ""}`}>{labelSubTipePemasukan(r.sub_type)}</span></td>
                      <td className="px-4 py-3 text-[#2d1d14] font-semibold max-w-[200px] truncate">{r.description}</td>
                      <td className="px-4 py-3 text-[#8B7E74]">{r.client_name || "—"}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[#5B8C5A]">+{rupiah(Number(r.total_amount))}</td>
                      <td className="px-4 py-3 text-center no-print">{!r.is_locked && (
                        <div className="flex items-center justify-center gap-1">
                          <button type="button" onClick={() => handleEdit(r)} className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#b87352] hover:bg-[#FAF6F0] transition cursor-pointer"><Edit2 size={13} /></button>
                          {isAdmin && <button type="button" onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#C75B3F] hover:bg-[#FAF6F0] transition cursor-pointer"><Trash2 size={13} /></button>}
                        </div>
                      )}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr className="border-t border-[#e6dfd5] bg-[#FAF6F0]/40"><td colSpan={5} className="px-4 py-3 text-right text-xs font-bold text-[#8B7E74] uppercase tracking-widest">Total</td><td className="px-4 py-3 text-right font-mono font-bold text-[#5B8C5A] text-sm">{rupiah(totalPemasukan)}</td><td className="no-print" /></tr></tfoot>
            </table>
          </div>
        )}
      </div>
      <PrintFooter />

      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm no-print">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FCFAF7] border border-[#e6dfd5] rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#e6dfd5]/50 pb-3 mb-5">
                <div className="flex items-center gap-2"><TrendingUp size={16} className="text-[#5B8C5A]" /><h3 className="text-sm font-bold text-[#2d1d14]">{editingId ? "Edit Pemasukan" : "Catat Pemasukan Baru"}</h3></div>
                <button type="button" onClick={() => { setIsFormOpen(false); resetForm(); }} className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#2d1d14] hover:bg-[#FAF6F0] transition cursor-pointer"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <DatePicker value={formDate} onChange={setFormDate} label="Tanggal Pemasukan" />
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-2">Jenis Pemasukan</label>
                  <div className="grid grid-cols-3 gap-2">
                    {SUB_TYPES.map((st) => { const Icon = st.icon; const isActive = formSubType === st.value; return (
                      <button key={st.value} type="button" onClick={() => setFormSubType(st.value)} className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-[10px] font-bold transition cursor-pointer ${isActive ? `${st.badge} border shadow-sm` : "text-[#8B7E74] border-[#e6dfd5] hover:border-[#b87352]/30 bg-white/60"}`}><Icon size={16} />{st.label}</button>
                    ); })}
                  </div>
                </div>
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Keterangan</label><input type="text" required value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder={formSubType === "unit_order" ? "Contoh: Pesanan SAB Tipe Heavy-Duty" : formSubType === "maintenance" ? "Contoh: Perbaikan Motor Pompa" : "Contoh: Jasa Pengelasan"} className={inputCls} autoFocus /></div>
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Nama Klien <span className="text-[#b0a69c]">(Opsional)</span></label><input type="text" value={formClient} onChange={(e) => setFormClient(e.target.value)} placeholder="Contoh: PT ANTAM" className={inputCls} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Jumlah Unit</label><input type="number" min="0" value={formQty} onChange={(e) => setFormQty(e.target.value === "" ? "" : Number(e.target.value))} className={`${inputCls} font-mono`} /></div>
                  <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Harga Satuan (Rp)</label><div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#b0a69c]">Rp</span><input type="text" inputMode="numeric" value={formUnitPrice === 0 ? "" : formatAngka(Number(formUnitPrice))} onChange={(e) => { setFormUnitPrice(parseAngka(e.target.value)); setUseAutoCalc(true); }} className={`${inputCls} pl-9 font-mono`} /></div></div>
                </div>
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Total Nominal (Rp)</label><div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#b0a69c]">Rp</span><input type="text" inputMode="numeric" value={Number(formTotal) === 0 ? "" : formatAngka(Number(formTotal))} onChange={(e) => { setFormTotal(parseAngka(e.target.value)); setUseAutoCalc(false); }} className={`${inputCls} pl-9 font-mono`} /></div>
                  {useAutoCalc && (Number(formQty) || 0) > 0 && (Number(formUnitPrice) || 0) > 0 && <p className="text-[10px] text-[#b87352] mt-1 font-mono">Auto: {Number(formQty)} × {rupiah(Number(formUnitPrice))} = {rupiah(Number(formTotal))}</p>}
                </div>
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Catatan <span className="text-[#b0a69c]">(Opsional)</span></label><input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Catatan tambahan..." className={inputCls} /></div>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#5B8C5A] to-[#4a7a49] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#5B8C5A]/15 hover:shadow-xl hover:-translate-y-0.5 transition-all mt-2"><CheckCircle size={15} />{editingId ? "Simpan Perubahan" : "Simpan Pemasukan"}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
