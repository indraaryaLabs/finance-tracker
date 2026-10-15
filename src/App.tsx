import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LayoutDashboard, TrendingUp, ShoppingCart, Users, FolderOpen, BookOpen, Wrench, LogOut, Menu, X, ChevronRight, Shield, UserCircle } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { WorkspaceProvider, useWorkspace } from "./contexts/WorkspaceContext";
import WorkspaceSetup from "./components/WorkspaceSetup";
import Auth from "./components/Auth";
import DashboardPage from "./pages/DashboardPage";
import PemasukanPage from "./pages/PemasukanPage";
import BelanjaPage from "./pages/BelanjaPage";
import OperasionalPage from "./pages/OperasionalPage";
import ProyekPage from "./pages/ProyekPage";
import TutupBukuPage from "./pages/TutupBukuPage";
import type { Session } from "@supabase/supabase-js";
import type { AppTab } from "./types";
import { labelRole } from "./lib/formatters";
import "./styles/print.css";

const NAV_ITEMS: { id: AppTab; label: string; icon: React.ElementType; shortLabel: string }[] = [
  { id: "ringkasan", label: "Ringkasan", icon: LayoutDashboard, shortLabel: "Home" },
  { id: "pemasukan", label: "Pemasukan", icon: TrendingUp, shortLabel: "Masuk" },
  { id: "belanja", label: "Belanja Material", icon: ShoppingCart, shortLabel: "Belanja" },
  { id: "operasional", label: "Operasional", icon: Users, shortLabel: "Gaji" },
  { id: "proyek", label: "Proyek & Klien", icon: FolderOpen, shortLabel: "Proyek" },
  { id: "tutup-buku", label: "Tutup Buku", icon: BookOpen, shortLabel: "Tutup" },
];

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [hasWorkspace, setHasWorkspace] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if (!session) setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => { setSession(session); if (!session) { setHasWorkspace(null); setLoading(false); } });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const check = async () => {
      const isInitial = hasWorkspace === null;
      if (isInitial) setLoading(true);
      try { const { data } = await supabase.from("workspace_members").select("id").eq("user_id", session.user.id).maybeSingle(); setHasWorkspace(!!data); }
      catch { setHasWorkspace(false); }
      finally { if (isInitial) setLoading(false); }
    };
    check();
  }, [session]);

  const handleWorkspaceSetup = async (data: { workspaceName: string; address: string; phone: string; ownerName: string }) => {
    if (!session) return;
    try {
      const { data: ws, error: wsErr } = await supabase.from("workspaces").insert({ name: data.workspaceName, address: data.address || null, phone: data.phone || null, owner_id: session.user.id }).select().single();
      if (wsErr) throw wsErr;
      const { error: memErr } = await supabase.from("workspace_members").insert({ workspace_id: ws.id, user_id: session.user.id, role: "admin", display_name: data.ownerName });
      if (memErr) throw memErr;
      setHasWorkspace(true);
    } catch (err: any) { alert("Gagal membuat workspace: " + (err.message || "Unknown error")); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center font-sans">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-3 border-[#b87352] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[10px] font-bold text-[#b87352] uppercase tracking-widest animate-pulse font-mono">Menghubungkan...</p>
      </div>
    </div>
  );
  if (!session) return <Auth />;
  if (!hasWorkspace) return <WorkspaceSetup userId={session.user.id} onComplete={handleWorkspaceSetup} />;
  return <WorkspaceProvider userId={session.user.id}><AppShell session={session} /></WorkspaceProvider>;
}

function AppShell({ session }: { session: Session }) {
  const { workspace, member, role, isAdmin } = useWorkspace();
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    const saved = localStorage.getItem("activeTab");
    const isValid = saved && NAV_ITEMS.some((item) => item.id === saved);
    return isValid ? (saved as AppTab) : "ringkasan";
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    localStorage.setItem("activeTab", tab);
  };

  const handleLogout = async () => { if (window.confirm("Apakah Anda yakin ingin keluar?")) await supabase.auth.signOut(); };

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col font-sans text-[#2d1d14]">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[#FCFAF7]/90 backdrop-blur-xl border-b border-[#e6dfd5] px-4 sm:px-6 py-3 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 rounded-xl text-[#8B7E74] hover:text-[#2d1d14] hover:bg-[#FAF6F0] transition cursor-pointer">
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#b87352] to-[#a0613f] text-white shadow-md shadow-[#b87352]/15">
                <Wrench size={15} />
              </div>
              <div className="hidden sm:block">
                <span className="block text-[8px] font-bold text-[#b87352] uppercase tracking-[0.2em] font-mono">Workshop Finance</span>
                <h1 className="text-sm font-display font-bold text-[#2d1d14] tracking-tight leading-tight">{workspace?.name || "BengkelBooks"}</h1>
              </div>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center bg-white/60 p-1.5 rounded-2xl border border-[#e6dfd5]/50 text-xs font-semibold gap-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button key={item.id} type="button" onClick={() => handleTabChange(item.id)}
                  className={`relative flex items-center gap-1.5 py-2 px-3.5 rounded-xl cursor-pointer transition-all z-10 text-[11px] font-semibold ${isActive ? "text-[#b87352]" : "text-[#8B7E74] hover:text-[#2d1d14]"}`}>
                  {isActive && <motion.div layoutId="activeDesktopTab" className="absolute inset-0 bg-white border border-[#e6dfd5]/50 shadow-sm rounded-xl -z-10" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                  <Icon size={14} />{item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <span className="flex items-center gap-1 text-[10px] text-[#b0a69c] font-medium justify-end">{isAdmin ? <Shield size={9} /> : <UserCircle size={9} />}{labelRole(role)}</span>
              <span className="text-xs font-semibold text-[#2d1d14] block leading-tight">{member?.display_name || "User"}</span>
            </div>
            <button type="button" onClick={handleLogout} title="Keluar" className="p-2 rounded-xl border border-[#e6dfd5] bg-white/60 hover:border-[#C75B3F]/30 hover:text-[#C75B3F] cursor-pointer transition text-[#8B7E74]">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-[57px] z-30 bg-[#FCFAF7]/95 backdrop-blur-xl border-b border-[#e6dfd5] p-4 lg:hidden no-print">
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button key={item.id} type="button" onClick={() => { handleTabChange(item.id); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition cursor-pointer ${isActive ? "bg-[#b87352]/8 text-[#b87352] border border-[#b87352]/15" : "text-[#8B7E74] hover:bg-[#FAF6F0] hover:text-[#2d1d14] border border-transparent"}`}>
                    <Icon size={16} />{item.label}{isActive && <ChevronRight size={14} className="ml-auto" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-6" id="main-content">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {activeTab === "ringkasan" && <DashboardPage />}
            {activeTab === "pemasukan" && <PemasukanPage />}
            {activeTab === "belanja" && <BelanjaPage />}
            {activeTab === "operasional" && <OperasionalPage />}
            {activeTab === "proyek" && <ProyekPage />}
            {activeTab === "tutup-buku" && <TutupBukuPage />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom nav */}
      <footer className="fixed bottom-0 inset-x-0 z-30 bg-[#FCFAF7]/90 backdrop-blur-xl border-t border-[#e6dfd5] flex items-center justify-around py-2 px-2 lg:hidden no-print" id="mobile-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} type="button" onClick={() => handleTabChange(item.id)} className="relative flex flex-col items-center gap-0.5 cursor-pointer py-1.5 px-3 min-w-[50px]">
              {isActive && <motion.div layoutId="activeMobileTab" className="absolute -top-2 left-2 right-2 h-[2.5px] bg-[#b87352] rounded-full" transition={{ type: "spring", stiffness: 400, damping: 25 }} />}
              <Icon size={18} className={`transition-colors ${isActive ? "text-[#b87352]" : "text-[#b0a69c]"}`} />
              <span className={`text-[9px] font-semibold tracking-tight transition-colors ${isActive ? "text-[#b87352]" : "text-[#b0a69c]"}`}>{item.shortLabel}</span>
            </button>
          );
        })}
      </footer>
    </div>
  );
}
