import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Plus, Trash2, Edit2, Store, Package, Search, X, CheckCircle, Inbox, Phone, MapPin, Calendar, Info, FileText, ChevronRight } from "lucide-react";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { supabase } from "../lib/supabaseClient";
import { rupiah, formatAngka, parseAngka, formatTanggal, todayISO } from "../lib/formatters";
import DatePicker from "../components/DatePicker";
import ExportButtons from "../components/shared/ExportButtons";
import PrintHeader, { PrintFooter } from "../components/shared/PrintHeader";
import type { MaterialPurchase, Supplier } from "../types";

export default function BelanjaPage() {
  const { workspace, isAdmin } = useWorkspace();
  const [purchases, setPurchases] = useState<MaterialPurchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formSupplier, setFormSupplier] = useState("");
  const [formNewSupplier, setFormNewSupplier] = useState("");
  const [formIsNewSupplier, setFormIsNewSupplier] = useState(false);
  const [formItemName, setFormItemName] = useState("");
  const [formSpec, setFormSpec] = useState("");
  const [formQty, setFormQty] = useState<number | "">(1);
  const [formUnit, setFormUnit] = useState("pcs");
  const [formUnitPrice, setFormUnitPrice] = useState<number | "">(0);
  const [formDate, setFormDate] = useState(todayISO());
  const [formNotes, setFormNotes] = useState("");
  const totalPrice = (Number(formQty) || 0) * (Number(formUnitPrice) || 0);

  // States for store-centric archive feature
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  // Memoized data processing for the selected store
  const storeDetails = useMemo(() => {
    if (!selectedStoreId) return null;

    const supplierInfo = suppliers.find((s) => s.id === selectedStoreId) || {
      id: "tanpa-toko",
      workspace_id: workspace?.id || "",
      name: selectedStoreId === "tanpa-toko" ? "Tanpa Toko" : "Toko Tidak Dikenal",
      address: "",
      phone: "",
      notes: "",
      created_at: "",
    };

    const storePurchases = purchases.filter((p) => {
      if (selectedStoreId === "tanpa-toko") {
        return !p.supplier_id;
      }
      return p.supplier_id === selectedStoreId;
    });

    const totalSpend = storePurchases.reduce((sum, p) => sum + (Number(p.total_price) || 0), 0);

    return {
      supplierInfo,
      storePurchases,
      totalSpend,
    };
  }, [purchases, suppliers, selectedStoreId, workspace]);

  useEffect(() => { if (workspace) fetchData(); }, [workspace]);

  const fetchData = async () => {
    if (!workspace) return; setLoading(true);
    try {
      const [purRes, supRes] = await Promise.all([
        supabase.from("material_purchases").select("*, supplier:suppliers(*)").eq("workspace_id", workspace.id).order("purchase_date", { ascending: false }),
        supabase.from("suppliers").select("*").eq("workspace_id", workspace.id).order("name"),
      ]);
      setPurchases((purRes.data || []) as MaterialPurchase[]); setSuppliers((supRes.data || []) as Supplier[]);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const resetForm = () => { setFormSupplier(""); setFormNewSupplier(""); setFormIsNewSupplier(false); setFormItemName(""); setFormSpec(""); setFormQty(1); setFormUnit("pcs"); setFormUnitPrice(0); setFormDate(todayISO()); setFormNotes(""); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!workspace || !formItemName.trim() || !formDate) return;
    const user = (await supabase.auth.getUser()).data.user; if (!user) return;
    let supplierId: string | null = null;
    if (formIsNewSupplier && formNewSupplier.trim()) {
      const { data: newSup, error } = await supabase.from("suppliers").insert({ workspace_id: workspace.id, name: formNewSupplier.trim() }).select().single();
      if (error) { alert("Gagal membuat supplier: " + error.message); return; }
      supplierId = newSup.id; setSuppliers([...suppliers, newSup as Supplier]);
    } else if (formSupplier) { supplierId = formSupplier; }
    const payload = { workspace_id: workspace.id, recorded_by: user.id, supplier_id: supplierId, item_name: formItemName.trim(), specification: formSpec.trim() || null, quantity: Number(formQty) || 1, unit: formUnit, unit_price: Number(formUnitPrice) || 0, total_price: totalPrice, purchase_date: formDate, notes: formNotes.trim() || null };
    if (editingId) { const { error } = await supabase.from("material_purchases").update(payload).eq("id", editingId); if (error) { alert("Gagal: " + error.message); return; } }
    else { const { error } = await supabase.from("material_purchases").insert(payload); if (error) { alert("Gagal: " + error.message); return; } }
    setIsFormOpen(false); resetForm(); fetchData();
  };

  const handleEdit = (p: MaterialPurchase) => { setEditingId(p.id); setFormSupplier(p.supplier_id || ""); setFormIsNewSupplier(false); setFormNewSupplier(""); setFormItemName(p.item_name); setFormSpec(p.specification || ""); setFormQty(p.quantity); setFormUnit(p.unit); setFormUnitPrice(p.unit_price); setFormDate(p.purchase_date); setFormNotes(p.notes || ""); setIsFormOpen(true); };
  const handleDelete = async (id: string) => { if (!window.confirm("Hapus data belanja ini?")) return; await supabase.from("material_purchases").delete().eq("id", id); fetchData(); };

  const filtered = purchases.filter((p) => { if (!searchQuery) return true; const q = searchQuery.toLowerCase(); return p.item_name.toLowerCase().includes(q) || (p.specification || "").toLowerCase().includes(q) || (p.supplier?.name || "").toLowerCase().includes(q); });
  const totalBelanja = filtered.reduce((s, p) => s + Number(p.total_price), 0);
  const supplierSummary: Record<string, { name: string; total: number; count: number }> = {};
  filtered.forEach((p) => { const key = p.supplier_id || "tanpa-toko"; const name = p.supplier?.name || "Tanpa Toko"; if (!supplierSummary[key]) supplierSummary[key] = { name, total: 0, count: 0 }; supplierSummary[key].total += Number(p.total_price); supplierSummary[key].count++; });

  const handleExport = () => {
    const html = `<html><head><meta charset="utf-8"><style>table{border-collapse:collapse;width:100%;font-family:Arial}th{background:#f0f0f0;border:1px solid #333;padding:6px 8px;font-size:10px;text-transform:uppercase}td{border:1px solid #555;padding:5px 8px;font-size:11px}.mono{font-family:Courier,monospace;font-weight:bold}</style></head><body><h2>${workspace?.name || "Bengkel"} — Catatan Belanja Material</h2><table><thead><tr><th>No</th><th>Tanggal</th><th>Barang</th><th>Spesifikasi</th><th>Qty</th><th>Satuan</th><th>Harga Satuan</th><th>Total</th><th>Toko</th></tr></thead><tbody>${filtered.map((p, i) => `<tr><td>${i + 1}</td><td>${p.purchase_date}</td><td>${p.item_name}</td><td>${p.specification || "-"}</td><td class="mono">${p.quantity}</td><td>${p.unit}</td><td class="mono">${rupiah(p.unit_price)}</td><td class="mono">${rupiah(Number(p.total_price))}</td><td>${p.supplier?.name || "-"}</td></tr>`).join("")}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `Belanja_Material_${todayISO()}.xls`; a.click();
  };



  const UNITS = ["pcs", "kg", "meter", "batang", "roll", "set", "lembar", "liter", "unit", "box", "pak"];
  const inputCls = "w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#e6dfd5] rounded-xl text-sm text-[#2d1d14] placeholder:text-[#b0a69c] focus:border-[#b87352] focus:ring-2 focus:ring-[#b87352]/10 outline-none transition";

  return (
    <div className="space-y-6">
      <PrintHeader title="Catatan Belanja Material" subtitle={`Total: ${rupiah(totalBelanja)}`} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-[#2d1d14] tracking-tight flex items-center gap-2"><ShoppingCart size={22} className="text-[#b87352]" />Belanja Material</h2>
          <p className="text-xs text-[#8B7E74] mt-0.5">Pencatatan pembelian material per toko/supplier</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons onExportExcel={handleExport} onPrint={() => window.print()} />
          <button type="button" onClick={() => { resetForm(); setIsFormOpen(true); }} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#b87352] to-[#a0613f] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#b87352]/15 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"><Plus size={14} />Catat Belanja</button>
        </div>
      </div>

      <div className="relative no-print">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0a69c]" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari barang, spesifikasi, atau nama toko..." className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-[#e6dfd5] rounded-xl text-sm text-[#2d1d14] placeholder:text-[#b0a69c] focus:border-[#b87352]/50 focus:ring-2 focus:ring-[#b87352]/10 outline-none transition" />
      </div>

      {Object.keys(supplierSummary).length > 0 && (
        <div className="space-y-2 no-print">
          <span className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest">Pilih Toko · Lihat Log Belanja</span>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1">
            {Object.entries(supplierSummary).sort(([,a],[,b]) => b.total - a.total).map(([key, data]) => {
              const isActive = selectedStoreId === key;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setSelectedStoreId(isActive ? null : key)}
                  className={`flex-shrink-0 flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-br from-[#b87352] to-[#9a5d3d] border-[#a0613f] shadow-lg shadow-[#b87352]/25"
                      : "bg-white/90 border-[#e6dfd5] hover:border-[#d4c4b0] hover:shadow-sm"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? "bg-white/15" : "bg-[#FAF6F0] border border-[#e6dfd5]/60"}`}>
                    <Store size={14} className={isActive ? "text-white/90" : "text-[#b87352]"} />
                  </div>
                  <div className="text-left min-w-0">
                    <span className={`block text-[11px] font-bold leading-tight whitespace-nowrap ${isActive ? "text-white" : "text-[#3d2e24]"}`}>{data.name}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-mono whitespace-nowrap ${isActive ? "text-white/75" : "text-[#b0a69c]"}`}>{rupiah(data.total)}</span>
                      <span className={`w-[3px] h-[3px] rounded-full ${isActive ? "bg-white/40" : "bg-[#d4c4b0]"}`} />
                      <span className={`text-[9px] font-mono whitespace-nowrap ${isActive ? "text-white/60" : "text-[#b0a69c]"}`}>{data.count} trx</span>
                    </div>
                  </div>
                  <ChevronRight size={13} className={`ml-1 flex-shrink-0 transition-transform ${isActive ? "text-white/50 rotate-90" : "text-[#e6dfd5]"}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white/80 border border-[#e6dfd5] rounded-2xl p-10 text-center">
          <div className="w-6 h-6 border-2 border-[#b87352] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-[#8B7E74]">Memuat data...</p>
        </div>
      ) : (
        <div className="bg-white/80 border border-[#e6dfd5] rounded-2xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox size={40} className="text-[#e6dfd5] mb-3" />
              <p className="text-sm text-[#8B7E74] font-semibold">
                {searchQuery ? "Tidak ditemukan" : "Belum ada catatan belanja"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#e6dfd5] text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest font-mono bg-[#FAF6F0]/60">
                    <th className="px-4 py-3 text-center w-12">No</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Barang</th>
                    <th className="px-4 py-3">Spesifikasi</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Harga Satuan</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Toko</th>
                    <th className="px-4 py-3 text-center no-print">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6dfd5]/50 text-xs">
                  {filtered.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-[#FAF6F0]/60 transition-colors">
                      <td className="px-4 py-3 text-center font-mono text-[#b0a69c]">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-[#8B7E74] whitespace-nowrap">
                        {formatTanggal(p.purchase_date, "short")}
                      </td>
                      <td className="px-4 py-3 text-[#2d1d14] font-semibold">{p.item_name}</td>
                      <td className="px-4 py-3 text-[#8B7E74]">{p.specification || "—"}</td>
                      <td className="px-4 py-3 text-center font-mono text-[#4a3f36]">
                        {p.quantity} {p.unit}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#8B7E74]">{rupiah(p.unit_price)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[#2d1d14]">
                        {rupiah(Number(p.total_price))}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[#b87352] text-[11px] font-semibold">
                          <Store size={11} />
                          {p.supplier?.name || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center no-print">
                        {!p.is_locked && (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(p)}
                              className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#b87352] hover:bg-[#FAF6F0] transition cursor-pointer"
                            >
                              <Edit2 size={13} />
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDelete(p.id)}
                                className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#C75B3F] hover:bg-[#FAF6F0] transition cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#e6dfd5] bg-[#FAF6F0]/40">
                    <td colSpan={6} className="px-4 py-3 text-right text-xs font-bold text-[#8B7E74] uppercase tracking-widest">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#2d1d14] text-sm">
                      {rupiah(totalBelanja)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
      <PrintFooter />

      {/* Side Drawer — Log Toko */}
      <AnimatePresence>
        {selectedStoreId && storeDetails && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedStoreId(null)}
              className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[2px] no-print"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[480px] bg-[#FCFAF7] border-l border-[#e6dfd5] shadow-2xl flex flex-col no-print"
            >
              {/* Drawer Header */}
              <div className="flex items-start justify-between gap-3 p-5 border-b border-[#e6dfd5]/80">
                <div className="min-w-0 space-y-1.5">
                  <h3 className="text-base font-display font-bold text-[#2d1d14] flex items-center gap-2">
                    <Store size={16} className="text-[#b87352] flex-shrink-0" />
                    <span className="truncate">{storeDetails.supplierInfo.name}</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#8B7E74]">
                    {storeDetails.supplierInfo.phone && (
                      <span className="flex items-center gap-1"><Phone size={11} className="text-[#b0a69c]" /> {storeDetails.supplierInfo.phone}</span>
                    )}
                    {storeDetails.supplierInfo.address && (
                      <span className="flex items-center gap-1"><MapPin size={11} className="text-[#b0a69c]" /> {storeDetails.supplierInfo.address}</span>
                    )}
                    {storeDetails.supplierInfo.notes && (
                      <span className="flex items-center gap-1"><Info size={11} className="text-[#b0a69c]" /> {storeDetails.supplierInfo.notes}</span>
                    )}
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedStoreId(null)} className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#2d1d14] hover:bg-[#FAF6F0] transition cursor-pointer flex-shrink-0">
                  <X size={16} />
                </button>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3 px-5 py-4 border-b border-[#e6dfd5]/50">
                <div className="bg-[#FAF6F0] rounded-xl p-3 border border-[#e6dfd5]/60">
                  <span className="block text-[9px] font-bold text-[#8B7E74] uppercase tracking-widest mb-0.5">Total Belanja</span>
                  <span className="block text-base font-mono font-bold text-[#2d1d14]">{rupiah(storeDetails.totalSpend)}</span>
                </div>
                <div className="bg-[#FAF6F0] rounded-xl p-3 border border-[#e6dfd5]/60">
                  <span className="block text-[9px] font-bold text-[#8B7E74] uppercase tracking-widest mb-0.5">Transaksi</span>
                  <span className="block text-base font-mono font-bold text-[#2d1d14]">{storeDetails.storePurchases.length} item</span>
                </div>
              </div>

              {/* Transaction Log */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-5 py-2.5 bg-[#FAF6F0]/60 border-b border-[#e6dfd5]/50 sticky top-0 z-10">
                  <h4 className="text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest flex items-center gap-1.5">
                    <FileText size={12} className="text-[#b87352]" />
                    Log Transaksi
                  </h4>
                </div>
                {storeDetails.storePurchases.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Inbox size={32} className="text-[#e6dfd5] mb-2" />
                    <p className="text-xs text-[#8B7E74]">Belum ada transaksi</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#e6dfd5]/40">
                    {storeDetails.storePurchases.map((p, idx) => (
                      <div key={p.id} className="px-5 py-3.5 hover:bg-[#FAF6F0]/60 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-mono text-[#b0a69c] tabular-nums w-4 text-right flex-shrink-0">{idx + 1}.</span>
                              <span className="text-xs font-semibold text-[#2d1d14] truncate">{p.item_name}</span>
                            </div>
                            {p.specification && <p className="text-[11px] text-[#8B7E74] ml-6 truncate">{p.specification}</p>}
                            <div className="flex items-center gap-2 mt-1 ml-6 text-[10px] font-mono text-[#b0a69c]">
                              <span>{formatTanggal(p.purchase_date, "short")}</span>
                              <span className="text-[#e6dfd5]">·</span>
                              <span className="text-[#8B7E74]">{p.quantity} {p.unit} × {rupiah(p.unit_price)}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="block text-xs font-mono font-bold text-[#2d1d14]">{rupiah(Number(p.total_price))}</span>
                            {!p.is_locked && (
                              <div className="flex items-center justify-end gap-0.5 mt-1.5">
                                <button type="button" onClick={() => { handleEdit(p); setSelectedStoreId(null); }} className="p-1 rounded-md text-[#b0a69c] hover:text-[#b87352] hover:bg-[#FAF6F0] transition cursor-pointer"><Edit2 size={11} /></button>
                                {isAdmin && <button type="button" onClick={() => handleDelete(p.id)} className="p-1 rounded-md text-[#b0a69c] hover:text-[#C75B3F] hover:bg-[#FAF6F0] transition cursor-pointer"><Trash2 size={11} /></button>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="border-t border-[#e6dfd5] px-5 py-3.5 bg-[#FAF6F0]/80 flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest">Total di Toko Ini</span>
                <span className="text-sm font-mono font-bold text-[#2d1d14]">{rupiah(storeDetails.totalSpend)}</span>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm no-print">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FCFAF7] border border-[#e6dfd5] rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#e6dfd5]/50 pb-3 mb-5">
                <div className="flex items-center gap-2"><Package size={16} className="text-[#b87352]" /><h3 className="text-sm font-bold text-[#2d1d14]">{editingId ? "Edit Belanja" : "Catat Belanja Baru"}</h3></div>
                <button type="button" onClick={() => { setIsFormOpen(false); resetForm(); }} className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#2d1d14] hover:bg-[#FAF6F0] transition cursor-pointer"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <DatePicker value={formDate} onChange={setFormDate} label="Tanggal Beli" />
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest">Toko / Supplier</label>
                  {!formIsNewSupplier ? (
                    <div className="flex gap-2">
                      <select value={formSupplier} onChange={(e) => setFormSupplier(e.target.value)} className={`${inputCls} flex-1 cursor-pointer`}><option value="">— Pilih Toko —</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                      <button type="button" onClick={() => setFormIsNewSupplier(true)} className="px-3 py-2.5 bg-[#FAF6F0] border border-[#e6dfd5] rounded-xl text-xs text-[#b87352] hover:bg-white transition cursor-pointer font-semibold whitespace-nowrap">+ Baru</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input type="text" value={formNewSupplier} onChange={(e) => setFormNewSupplier(e.target.value)} placeholder="Nama toko baru..." className={`${inputCls} flex-1`} autoFocus />
                      <button type="button" onClick={() => { setFormIsNewSupplier(false); setFormNewSupplier(""); }} className="px-3 py-2.5 bg-[#FAF6F0] border border-[#e6dfd5] rounded-xl text-xs text-[#8B7E74] hover:text-[#2d1d14] transition cursor-pointer">Batal</button>
                    </div>
                  )}
                </div>
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Nama Barang</label><input type="text" required value={formItemName} onChange={(e) => setFormItemName(e.target.value)} placeholder="Contoh: Kawat Las" className={inputCls} /></div>
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Tipe / Spesifikasi <span className="text-[#b0a69c]">(Opsional)</span></label><input type="text" value={formSpec} onChange={(e) => setFormSpec(e.target.value)} placeholder="Contoh: AWS E6013 2.6mm" className={inputCls} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Jumlah</label><input type="number" min="0" step="any" value={formQty} onChange={(e) => setFormQty(e.target.value === "" ? "" : Number(e.target.value))} className={`${inputCls} font-mono`} /></div>
                  <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Satuan</label><select value={formUnit} onChange={(e) => setFormUnit(e.target.value)} className={`${inputCls} cursor-pointer`}>{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select></div>
                </div>
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Harga Satuan (Rp)</label>
                  <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#b0a69c]">Rp</span><input type="text" inputMode="numeric" value={formUnitPrice === 0 ? "" : formatAngka(Number(formUnitPrice))} onChange={(e) => setFormUnitPrice(parseAngka(e.target.value))} placeholder="0" className={`${inputCls} pl-9 font-mono`} /></div>
                </div>
                <div className="bg-[#FAF6F0] border border-[#e6dfd5]/60 rounded-xl p-3 flex items-center justify-between"><span className="text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest">Total Harga</span><span className="text-lg font-mono font-bold text-[#2d1d14]">{rupiah(totalPrice)}</span></div>
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Catatan <span className="text-[#b0a69c]">(Opsional)</span></label><input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Catatan tambahan..." className={inputCls} /></div>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#b87352] to-[#a0613f] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#b87352]/15 hover:shadow-xl hover:-translate-y-0.5 transition-all mt-2"><CheckCircle size={15} />{editingId ? "Simpan Perubahan" : "Simpan Belanja"}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
