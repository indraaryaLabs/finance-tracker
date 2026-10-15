import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabaseClient";
import { Wrench, Sparkles, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setErrorMsg("Email dan password tidak boleh kosong."); return; }
    setLoading(true); setErrorMsg(""); setSuccessMsg("");
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password: password.trim() });
        if (error) throw error;
        setSuccessMsg("Pendaftaran berhasil! Silakan periksa kotak masuk email Anda untuk verifikasi.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: password.trim() });
        if (error) throw error;
      }
    } catch (err: any) { setErrorMsg(err.message || "Terjadi kesalahan."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#b87352]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-[#cf8a68]/6 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-[#e6dfd5] shadow-xl shadow-[#2d1d14]/5 rounded-3xl p-8 relative z-10"
      >
        <div className="text-center space-y-2 mb-7">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-[#b87352] to-[#a0613f] text-white shadow-lg shadow-[#b87352]/20 mb-2">
            <Wrench size={22} />
          </div>
          <div>
            <span className="block text-[9px] font-bold text-[#b87352] uppercase tracking-[0.2em] font-mono mb-0.5">Workshop Finance</span>
            <h2 className="font-display font-bold text-2xl text-[#2d1d14] tracking-tight">BengkelBooks</h2>
          </div>
          <p className="text-[11px] text-[#8B7E74] max-w-xs mx-auto">Pencatatan keuangan profesional untuk bengkel & workshop</p>
        </div>

        <div className="bg-[#FAF6F0] p-1.5 rounded-2xl border border-[#e6dfd5]/60 flex items-center mb-6 relative">
          {[false, true].map((val) => (
            <button key={String(val)} type="button"
              onClick={() => { setIsSignUp(val); setErrorMsg(""); setSuccessMsg(""); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl relative transition cursor-pointer z-10 ${isSignUp === val ? "text-[#b87352]" : "text-[#8B7E74]"}`}>
              {isSignUp === val && (
                <motion.div layoutId="active-tab-indicator" className="absolute inset-0 bg-white border border-[#e6dfd5]/40 rounded-xl shadow-sm" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
              )}
              <span className="relative z-10">{val ? "Daftar Baru" : "Masuk Akun"}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-[#C75B3F]/8 border border-[#C75B3F]/20 rounded-xl flex items-start gap-2 mb-4 text-[#C75B3F] text-xs font-medium">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /><span>{errorMsg}</span>
            </motion.div>
          )}
          {successMsg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-[#5B8C5A]/8 border border-[#5B8C5A]/20 rounded-xl flex items-start gap-2 mb-4 text-[#5B8C5A] text-xs font-medium">
              <Sparkles size={14} className="mt-0.5 flex-shrink-0" /><span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="auth-email" className="text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest block">Alamat Email</label>
            <div className="relative">
              <input id="auth-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-3 bg-[#FAF6F0] border border-[#e6dfd5] hover:border-[#b87352]/30 focus:border-[#b87352] focus:ring-2 focus:ring-[#b87352]/10 text-sm font-semibold rounded-xl text-[#2d1d14] placeholder:text-[#b0a69c] outline-none transition" />
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0a69c]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="auth-pass" className="text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest block">Kata Sandi</label>
            <div className="relative">
              <input id="auth-pass" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter"
                className="w-full pl-10 pr-11 py-3 bg-[#FAF6F0] border border-[#e6dfd5] hover:border-[#b87352]/30 focus:border-[#b87352] focus:ring-2 focus:ring-[#b87352]/10 text-sm font-semibold rounded-xl text-[#2d1d14] placeholder:text-[#b0a69c] outline-none transition" />
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0a69c]" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#b0a69c] hover:text-[#b87352] transition cursor-pointer">
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[#b87352] to-[#a0613f] hover:shadow-xl hover:shadow-[#b87352]/15 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#b87352]/15 transition-all active:scale-[0.98] mt-3">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Sparkles size={14} />{isSignUp ? "Daftar Akun Baru" : "Masuk ke Aplikasi"}</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
