import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FolderOpen, Plus, Trash2, Edit2, X, CheckCircle, Inbox, Building2, ClipboardList, Package, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { supabase } from "../lib/supabaseClient";
import { rupiah, formatAngka, parseAngka, formatTanggal, todayISO } from "../lib/formatters";
import DatePicker from "../components/DatePicker";
import ExportButtons from "../components/shared/ExportButtons";
import PrintHeader, { PrintFooter } from "../components/shared/PrintHeader";
import type { Project, Client, BOMItem, BOMTemplate } from "../types";

type ViewMode = "projects" | "clients";

export default function ProyekPage() {
  const { workspace, isAdmin } = useWorkspace();
  const [view, setView] = useState<ViewMode>("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Project form
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projName, setProjName] = useState("");
  const [projUnitType, setProjUnitType] = useState("");
  const [projClientId, setProjClientId] = useState("");
  const [projNewClient, setProjNewClient] = useState("");
  const [projIsNewClient, setProjIsNewClient] = useState(false);
  const [projDesc, setProjDesc] = useState("");
  const [projQty, setProjQty] = useState<number | "">(1);
  const [projContractValue, setProjContractValue] = useState<number | "">(0);
  const [projStartDate, setProjStartDate] = useState(todayISO());
  const [projEndDate, setProjEndDate] = useState("");
  const [projStatus, setProjStatus] = useState<string>("in_progress");

  // BOM form
  const [isBOMFormOpen, setIsBOMFormOpen] = useState(false);
  const [bomTemplateForProject, setBomTemplateForProject] = useState<Record<string, string>>({}); // projectId -> bomTemplateId
  const [bomLoading, setBomLoading] = useState(false);
  const [bomItemName, setBomItemName] = useState("");
  const [bomSpec, setBomSpec] = useState("");
  const [bomQty, setBomQty] = useState<number | "">(1);
  const [bomUnit, setBomUnit] = useState("pcs");
  const [bomPrice, setBomPrice] = useState<number | "">(0);

  // Expanded project IDs
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [expandedBOM, setExpandedBOM] = useState<Record<string, BOMItem[]>>({});

  // Client form
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  useEffect(() => { if (workspace) fetchAll(); }, [workspace]);

  const fetchAll = async () => {
    if (!workspace) return; setLoading(true);
    try {
      const [projRes, clientRes] = await Promise.all([
        supabase.from("projects").select("*, client:clients(company_name, pic_name)").eq("workspace_id", workspace.id).order("created_at", { ascending: false }),
        supabase.from("clients").select("*").eq("workspace_id", workspace.id).order("company_name"),
      ]);
      setProjects((projRes.data || []) as Project[]);
      setClients((clientRes.data || []) as Client[]);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchBOM = async (projectId: string) => {
    setBomLoading(true);
    try {
      // Find or create a BOM template for this project
      let templateId = bomTemplateForProject[projectId];
      if (!templateId) {
        const { data: templates } = await supabase.from("bom_templates").select("id").eq("workspace_id", workspace!.id);
        // Use the project name as a key — find a template matching this project
        const proj = projects.find(p => p.id === projectId);
        const { data: matchingTemplate } = await supabase.from("bom_templates").select("id").eq("workspace_id", workspace!.id).eq("product_name", `BOM-${proj?.name || projectId}`).maybeSingle();
        if (matchingTemplate) {
          templateId = matchingTemplate.id;
        } else {
          // Create one
          const { data: newTemplate } = await supabase.from("bom_templates").insert({ workspace_id: workspace!.id, product_name: `BOM-${proj?.name || projectId}`, description: `Bill of Materials untuk proyek: ${proj?.name}` }).select().single();
          templateId = newTemplate?.id;
        }
        if (templateId) setBomTemplateForProject(prev => ({ ...prev, [projectId]: templateId! }));
      }
      if (templateId) {
        const { data } = await supabase.from("bom_items").select("*").eq("bom_id", templateId).order("sort_order");
        setExpandedBOM(prev => ({ ...prev, [projectId]: (data || []) as BOMItem[] }));
      }
    } catch (err) { console.error(err); } finally { setBomLoading(false); }
  };

  const toggleExpandProject = (id: string) => {
    if (expandedProject === id) { setExpandedProject(null); }
    else { setExpandedProject(id); if (!expandedBOM[id]) fetchBOM(id); }
  };

  // ---- Project CRUD ----
  const resetProjectForm = () => { setProjName(""); setProjUnitType(""); setProjClientId(""); setProjNewClient(""); setProjIsNewClient(false); setProjDesc(""); setProjQty(1); setProjContractValue(0); setProjStartDate(todayISO()); setProjEndDate(""); setProjStatus("in_progress"); setEditingProjectId(null); };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault(); if (!workspace || !projName.trim()) return;
    const user = (await supabase.auth.getUser()).data.user; if (!user) return;

    let clientId: string | null = null;
    if (projIsNewClient && projNewClient.trim()) {
      const { data: newClient, error } = await supabase.from("clients").insert({ workspace_id: workspace.id, company_name: projNewClient.trim() }).select().single();

      if (error) { alert("Gagal buat klien: " + error.message); return; }
      clientId = newClient.id; setClients([...clients, newClient as Client]);
    } else if (projClientId) { clientId = projClientId; }

    const payload = {
      workspace_id: workspace.id, client_id: clientId,
      name: projName.trim(), description: projDesc.trim() || null,
      unit_type: projUnitType.trim() || null,
      quantity: Number(projQty) || 1, contract_value: Number(projContractValue) || 0,
      start_date: projStartDate || null, end_date: projEndDate || null, status: projStatus,
    };

    if (editingProjectId) { await supabase.from("projects").update(payload).eq("id", editingProjectId); }
    else { const { error } = await supabase.from("projects").insert(payload); if (error) { alert("Gagal: " + error.message); return; } }
    setIsProjectFormOpen(false); resetProjectForm(); fetchAll();
  };

  const handleEditProject = (p: Project) => {
    setEditingProjectId(p.id); setProjName(p.name); setProjUnitType(p.unit_type || ""); setProjClientId(p.client_id || ""); setProjIsNewClient(false);
    setProjDesc(p.description || ""); setProjQty(p.quantity); setProjContractValue(p.contract_value);
    setProjStartDate(p.start_date || todayISO()); setProjEndDate(p.end_date || ""); setProjStatus(p.status);
    setIsProjectFormOpen(true);
  };

  const handleDeleteProject = async (id: string) => { if (!window.confirm("Hapus proyek beserta seluruh BOM-nya?")) return; await supabase.from("projects").delete().eq("id", id); fetchAll(); };

  // ---- BOM CRUD ----
  const handleAddBOMItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeProjectId = (e.target as HTMLFormElement).dataset.projectId;
    if (!activeProjectId || !bomItemName.trim()) return;
    const templateId = bomTemplateForProject[activeProjectId];
    if (!templateId) return;
    const payload = { bom_id: templateId, item_name: bomItemName.trim(), specification: bomSpec.trim() || null, quantity: Number(bomQty) || 1, unit: bomUnit, estimated_price: Number(bomPrice) || 0 };
    const { error } = await supabase.from("bom_items").insert(payload);
    if (error) { alert("Gagal: " + error.message); return; }
    setBomItemName(""); setBomSpec(""); setBomQty(1); setBomUnit("pcs"); setBomPrice(0);
    fetchBOM(activeProjectId);
  };

  const handleDeleteBOMItem = async (itemId: string, projectId: string) => {
    if (!window.confirm("Hapus item BOM ini?")) return;
    await supabase.from("bom_items").delete().eq("id", itemId);
    fetchBOM(projectId);
  };

  // ---- Client CRUD ----
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault(); if (!workspace || !clientName.trim()) return;
    const payload = { workspace_id: workspace.id, company_name: clientName.trim(), pic_name: clientContact.trim() || null, address: clientAddress.trim() || null };
    if (editingClientId) await supabase.from("clients").update(payload).eq("id", editingClientId);
    else await supabase.from("clients").insert(payload);
    setIsClientFormOpen(false); setEditingClientId(null); setClientName(""); setClientContact(""); setClientAddress(""); fetchAll();
  };

  const handleDeleteClient = async (id: string) => { if (!window.confirm("Hapus klien ini?")) return; await supabase.from("clients").delete().eq("id", id); fetchAll(); };

  const statusLabel = (s: string) => ({ in_progress: "Dalam Pengerjaan", completed: "Selesai", cancelled: "Dibatalkan" }[s] || s);
  const statusBadge = (s: string) => ({ in_progress: "text-[#b87352] bg-[#b87352]/8 border-[#b87352]/20", completed: "text-[#5B8C5A] bg-[#5B8C5A]/8 border-[#5B8C5A]/20", cancelled: "text-[#C75B3F] bg-[#C75B3F]/8 border-[#C75B3F]/20" }[s] || "text-[#8B7E74] bg-[#FAF6F0] border-[#e6dfd5]");
  const totalContract = projects.reduce((s, p) => s + Number(p.contract_value), 0);
  const inputCls = "w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#e6dfd5] rounded-xl text-sm text-[#2d1d14] placeholder:text-[#b0a69c] focus:border-[#b87352] focus:ring-2 focus:ring-[#b87352]/10 outline-none transition";
  const UNITS = ["pcs", "kg", "meter", "batang", "roll", "set", "lembar", "liter", "unit", "box", "pak"];

  return (
    <div className="space-y-6">
      <PrintHeader title="Daftar Proyek & Klien" subtitle={`Total Kontrak: ${rupiah(totalContract)}`} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div><h2 className="text-xl sm:text-2xl font-display font-bold text-[#2d1d14] tracking-tight flex items-center gap-2"><FolderOpen size={22} className="text-[#b87352]" />Proyek & Klien</h2><p className="text-xs text-[#8B7E74] mt-0.5">Pencatatan proyek pesanan, daftar klien, dan Bill of Materials (BOM)</p></div>
        <div className="flex items-center gap-2">
          <ExportButtons onPrint={() => window.print()} />
          <button type="button" onClick={() => { if (view === "projects") { resetProjectForm(); setIsProjectFormOpen(true); } else { setEditingClientId(null); setClientName(""); setClientContact(""); setClientAddress(""); setIsClientFormOpen(true); } }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#b87352] to-[#a0613f] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#b87352]/15 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"><Plus size={14} />{view === "projects" ? "Proyek Baru" : "Klien Baru"}</button>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-1.5 bg-white/60 p-1.5 rounded-2xl border border-[#e6dfd5]/50 no-print">
        {([{ id: "projects" as ViewMode, label: "Daftar Proyek", icon: ClipboardList },{ id: "clients" as ViewMode, label: "Daftar Klien", icon: Building2 }]).map((tab) => {
          const Icon = tab.icon; const isActive = view === tab.id;
          return (<button key={tab.id} type="button" onClick={() => setView(tab.id)} className={`relative flex items-center gap-1.5 py-2 px-4 rounded-xl cursor-pointer transition-all text-[11px] font-semibold flex-1 justify-center z-10 ${isActive ? "text-[#b87352]" : "text-[#8B7E74] hover:text-[#2d1d14]"}`}>
            {isActive && <motion.div layoutId="proyekViewTab" className="absolute inset-0 bg-white border border-[#e6dfd5]/50 shadow-sm rounded-xl -z-10" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
            <Icon size={14} />{tab.label}
          </button>);
        })}
      </div>

      {/* PROJECTS VIEW */}
      {view === "projects" && (
        <div className="space-y-4">
          {loading ? <div className="p-10 text-center"><div className="w-6 h-6 border-2 border-[#b87352] border-t-transparent rounded-full animate-spin mx-auto" /></div> : projects.length === 0 ? (
            <div className="bg-white/80 border border-[#e6dfd5] rounded-2xl py-16 flex flex-col items-center justify-center text-center"><Inbox size={40} className="text-[#e6dfd5] mb-3" /><p className="text-sm text-[#8B7E74] font-semibold">Belum ada proyek</p><p className="text-xs text-[#b0a69c] mt-1">Klik 'Proyek Baru' untuk mulai mencatat</p></div>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => {
                const isExpanded = expandedProject === p.id;
                const items = expandedBOM[p.id] || [];
                const bomTotal = items.reduce((s, i) => s + Number(i.estimated_price) * i.quantity, 0);
                return (
                  <div key={p.id} className="bg-white/80 border border-[#e6dfd5] rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                    {/* Project header */}
                    <div className="p-4 sm:p-5 flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-bold text-[#2d1d14] tracking-tight">{p.name}</h3>
                          <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold border ${statusBadge(p.status)}`}>{statusLabel(p.status)}</span>
                        </div>
                        {p.description && <p className="text-xs text-[#8B7E74] mb-2 line-clamp-2">{p.description}</p>}
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px]">
                          {p.client && <span className="text-[#8B7E74] flex items-center gap-1"><Building2 size={11} className="text-[#b87352]" />{p.client.company_name}</span>}
                          <span className="text-[#8B7E74]">Qty: <span className="font-mono font-semibold text-[#4a3f36]">{p.quantity}</span></span>
                          <span className="text-[#8B7E74]">Kontrak: <span className="font-mono font-bold text-[#5B8C5A]">{rupiah(p.contract_value)}</span></span>
                          {p.start_date && <span className="text-[#b0a69c] font-mono">{formatTanggal(p.start_date, "short")}{p.end_date ? ` → ${formatTanggal(p.end_date, "short")}` : ""}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 no-print">
                        <button type="button" onClick={() => toggleExpandProject(p.id)} title="Lihat BOM" className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#b87352] hover:bg-[#FAF6F0] transition cursor-pointer">
                          {isExpanded ? <ChevronUp size={16} /> : <Eye size={16} />}
                        </button>
                        <button type="button" onClick={() => handleEditProject(p)} className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#b87352] hover:bg-[#FAF6F0] transition cursor-pointer"><Edit2 size={13} /></button>
                        {isAdmin && <button type="button" onClick={() => handleDeleteProject(p.id)} className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#C75B3F] hover:bg-[#FAF6F0] transition cursor-pointer"><Trash2 size={13} /></button>}
                      </div>
                    </div>

                    {/* BOM Section (expanded) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                          <div className="border-t border-[#e6dfd5] bg-[#FAF6F0]/40 p-4 sm:p-5">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2"><Package size={14} className="text-[#b87352]" /><span className="text-xs font-bold text-[#2d1d14]">Bill of Materials (BOM)</span></div>
                              {bomTotal > 0 && <span className="text-xs font-mono font-bold text-[#b87352]">Est: {rupiah(bomTotal)}</span>}
                            </div>

                            {bomLoading && expandedBOM[p.id] === undefined ? (
                              <div className="py-4 text-center"><div className="w-4 h-4 border-2 border-[#b87352] border-t-transparent rounded-full animate-spin mx-auto" /></div>
                            ) : items.length === 0 ? (
                              <p className="text-xs text-[#b0a69c] py-2">Belum ada item BOM</p>
                            ) : (
                              <div className="overflow-x-auto mb-3">
                                <table className="w-full text-left min-w-[450px]">
                                  <thead><tr className="border-b border-[#e6dfd5] text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest font-mono">
                                    <th className="pb-2 pr-3">Bahan</th><th className="pb-2 pr-3">Spesifikasi</th><th className="pb-2 pr-3 text-center">Qty</th><th className="pb-2 pr-3 text-right">Harga Est.</th><th className="pb-2 text-right">Subtotal</th><th className="pb-2 w-8 no-print" />
                                  </tr></thead>
                                  <tbody className="divide-y divide-[#e6dfd5]/40 text-xs">
                                    {items.map((item) => (
                                      <tr key={item.id} className="hover:bg-white/60 transition-colors">
                                        <td className="py-2 pr-3 text-[#2d1d14] font-semibold">{item.item_name}</td>
                                        <td className="py-2 pr-3 text-[#8B7E74]">{item.specification || "—"}</td>
                                        <td className="py-2 pr-3 text-center font-mono text-[#4a3f36]">{item.quantity} {item.unit}</td>
                                        <td className="py-2 pr-3 text-right font-mono text-[#8B7E74]">{rupiah(Number(item.estimated_price))}</td>
                                        <td className="py-2 text-right font-mono font-bold text-[#2d1d14]">{rupiah(Number(item.estimated_price) * item.quantity)}</td>
                                        <td className="py-2 text-center no-print">
                                          {isAdmin && <button type="button" onClick={() => handleDeleteBOMItem(item.id, p.id)} className="p-1 rounded text-[#b0a69c] hover:text-[#C75B3F] cursor-pointer"><Trash2 size={11} /></button>}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Quick add BOM item */}
                            <form data-project-id={p.id} onSubmit={handleAddBOMItem} className="flex flex-col sm:flex-row gap-2 mt-2 no-print">
                              <input type="text" value={bomItemName} onChange={(e) => { setBomItemName(e.target.value); }} placeholder="Nama bahan..." className="flex-1 px-3 py-2 bg-white border border-[#e6dfd5] rounded-lg text-xs text-[#2d1d14] placeholder:text-[#b0a69c] focus:border-[#b87352] outline-none" />
                              <input type="text" value={bomSpec} onChange={(e) => { setBomSpec(e.target.value); }} placeholder="Tipe/Spek" className="w-28 px-3 py-2 bg-white border border-[#e6dfd5] rounded-lg text-xs text-[#2d1d14] placeholder:text-[#b0a69c] focus:border-[#b87352] outline-none" />
                              <input type="number" min="1" value={bomQty} onChange={(e) => { setBomQty(Number(e.target.value)); }} className="w-16 px-3 py-2 bg-white border border-[#e6dfd5] rounded-lg text-xs font-mono text-[#2d1d14] focus:border-[#b87352] outline-none" />
                              <input type="text" inputMode="numeric" value={Number(bomPrice) > 0 ? formatAngka(Number(bomPrice)) : ""} onChange={(e) => { setBomPrice(parseAngka(e.target.value)); }} placeholder="Harga" className="w-28 px-3 py-2 bg-white border border-[#e6dfd5] rounded-lg text-xs font-mono text-[#2d1d14] placeholder:text-[#b0a69c] focus:border-[#b87352] outline-none" />
                              <button type="submit" disabled={!bomItemName.trim()} className="px-3 py-2 bg-[#b87352] text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-40 hover:bg-[#a0613f] transition"><Plus size={14} /></button>
                            </form>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CLIENTS VIEW */}
      {view === "clients" && (
        <div className="bg-white/80 border border-[#e6dfd5] rounded-2xl overflow-hidden">
          {loading ? <div className="p-10 text-center"><div className="w-6 h-6 border-2 border-[#b87352] border-t-transparent rounded-full animate-spin mx-auto" /></div> : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center"><Inbox size={40} className="text-[#e6dfd5] mb-3" /><p className="text-sm text-[#8B7E74] font-semibold">Belum ada data klien</p></div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-left min-w-[400px]">
              <thead><tr className="border-b border-[#e6dfd5] text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest font-mono bg-[#FAF6F0]/60">
                <th className="px-4 py-3 text-center w-12">No</th><th className="px-4 py-3">Nama Perusahaan</th><th className="px-4 py-3">Kontak</th><th className="px-4 py-3">Alamat</th><th className="px-4 py-3 text-center no-print">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-[#e6dfd5]/50 text-xs">{clients.map((c, idx) => (
                <tr key={c.id} className="hover:bg-[#FAF6F0]/60 transition-colors">
                  <td className="px-4 py-3 text-center font-mono text-[#b0a69c]">{idx + 1}</td>
                  <td className="px-4 py-3 text-[#2d1d14] font-semibold">{c.company_name}</td>
                  <td className="px-4 py-3 text-[#8B7E74]">{c.pic_name || "—"}</td>
                  <td className="px-4 py-3 text-[#8B7E74] max-w-[200px] truncate">{c.address || "—"}</td>
                  <td className="px-4 py-3 text-center no-print">{isAdmin && (
                    <div className="flex items-center justify-center gap-1">
                      <button type="button" onClick={() => { setEditingClientId(c.id); setClientName(c.company_name); setClientContact(c.pic_name || ""); setClientAddress(c.address || ""); setIsClientFormOpen(true); }} className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#b87352] hover:bg-[#FAF6F0] transition cursor-pointer"><Edit2 size={13} /></button>
                      <button type="button" onClick={() => handleDeleteClient(c.id)} className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#C75B3F] hover:bg-[#FAF6F0] transition cursor-pointer"><Trash2 size={13} /></button>
                    </div>
                  )}</td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      )}
      <PrintFooter />

      {/* PROJECT MODAL */}
      <AnimatePresence>
        {isProjectFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm no-print">
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}} className="bg-[#FCFAF7] border border-[#e6dfd5] rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#e6dfd5]/50 pb-3 mb-5"><h3 className="text-sm font-bold text-[#2d1d14] flex items-center gap-2"><ClipboardList size={16} className="text-[#b87352]" />{editingProjectId ? "Edit Proyek" : "Proyek Baru"}</h3><button type="button" onClick={() => { setIsProjectFormOpen(false); resetProjectForm(); }} className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#2d1d14] hover:bg-[#FAF6F0] transition cursor-pointer"><X size={16} /></button></div>
              <form onSubmit={handleSaveProject} className="space-y-4">
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Nama Proyek / Pesanan</label><input type="text" required value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="Contoh: Pesanan SAB Tipe Heavy-Duty 20 unit" className={inputCls} autoFocus /></div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest">Klien / Perusahaan</label>
                  {!projIsNewClient ? (
                    <div className="flex gap-2"><select value={projClientId} onChange={(e) => setProjClientId(e.target.value)} className={`${inputCls} flex-1 cursor-pointer`}><option value="">— Pilih Klien —</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}</select><button type="button" onClick={() => setProjIsNewClient(true)} className="px-3 py-2.5 bg-[#FAF6F0] border border-[#e6dfd5] rounded-xl text-xs text-[#b87352] font-semibold cursor-pointer hover:bg-white transition whitespace-nowrap">+ Baru</button></div>
                  ) : (
                    <div className="flex gap-2"><input type="text" value={projNewClient} onChange={(e) => setProjNewClient(e.target.value)} placeholder="Nama perusahaan baru..." className={`${inputCls} flex-1`} autoFocus /><button type="button" onClick={() => { setProjIsNewClient(false); setProjNewClient(""); }} className="px-3 py-2.5 bg-[#FAF6F0] border border-[#e6dfd5] rounded-xl text-xs text-[#8B7E74] cursor-pointer hover:text-[#2d1d14] transition">Batal</button></div>
                  )}
                </div>
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Deskripsi <span className="text-[#b0a69c]">(Opsional)</span></label><textarea value={projDesc} onChange={(e) => setProjDesc(e.target.value)} rows={2} placeholder="Detail pekerjaan..." className={`${inputCls} resize-none`} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Qty Pesanan</label><input type="number" min="1" value={projQty} onChange={(e) => setProjQty(Number(e.target.value))} className={`${inputCls} font-mono`} /></div>
                  <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Nilai Kontrak (Rp)</label><div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#b0a69c]">Rp</span><input type="text" inputMode="numeric" value={Number(projContractValue) === 0 ? "" : formatAngka(Number(projContractValue))} onChange={(e) => setProjContractValue(parseAngka(e.target.value))} className={`${inputCls} pl-9 font-mono`} /></div></div>
                </div>
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Tipe Unit <span className="text-[#b0a69c]">(Opsional)</span></label><input type="text" value={projUnitType} onChange={(e) => setProjUnitType(e.target.value)} placeholder="Contoh: Heavy-Duty" className={inputCls} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <DatePicker value={projStartDate} onChange={setProjStartDate} label="Tanggal Mulai" />
                  <DatePicker value={projEndDate} onChange={setProjEndDate} label="Target Selesai" />
                </div>
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Status</label><select value={projStatus} onChange={(e) => setProjStatus(e.target.value)} className={`${inputCls} cursor-pointer`}><option value="in_progress">Dalam Pengerjaan</option><option value="completed">Selesai</option><option value="cancelled">Dibatalkan</option></select></div>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#b87352] to-[#a0613f] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#b87352]/15 hover:shadow-xl hover:-translate-y-0.5 transition-all mt-2"><CheckCircle size={15} />{editingProjectId ? "Simpan Perubahan" : "Buat Proyek"}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLIENT MODAL */}
      <AnimatePresence>
        {isClientFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm no-print">
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}} className="bg-[#FCFAF7] border border-[#e6dfd5] rounded-2xl max-w-lg w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#e6dfd5]/50 pb-3 mb-5"><h3 className="text-sm font-bold text-[#2d1d14] flex items-center gap-2"><Building2 size={16} className="text-[#b87352]" />{editingClientId ? "Edit Klien" : "Klien Baru"}</h3><button type="button" onClick={() => setIsClientFormOpen(false)} className="p-1.5 rounded-lg text-[#b0a69c] hover:text-[#2d1d14] hover:bg-[#FAF6F0] transition cursor-pointer"><X size={16} /></button></div>
              <form onSubmit={handleSaveClient} className="space-y-4">
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Nama Perusahaan / Klien</label><input type="text" required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Contoh: PT ANTAM" className={inputCls} autoFocus /></div>
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Kontak Person <span className="text-[#b0a69c]">(Opsional)</span></label><input type="text" value={clientContact} onChange={(e) => setClientContact(e.target.value)} placeholder="Nama kontak atau telepon" className={inputCls} /></div>
                <div><label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">Alamat <span className="text-[#b0a69c]">(Opsional)</span></label><input type="text" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="Alamat perusahaan" className={inputCls} /></div>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#b87352] to-[#a0613f] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#b87352]/15 hover:shadow-xl hover:-translate-y-0.5 transition-all mt-2"><CheckCircle size={15} />{editingClientId ? "Simpan" : "Tambah Klien"}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
