import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabaseClient";
import { Wallet, Sparkles, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

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
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Email dan password tidak boleh kosong.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        setSuccessMsg(
          "Pendaftaran berhasil! Silakan periksa kotak masuk email Anda untuk melakukan verifikasi."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setErrorMsg(err.message || "Terjadi kesalahan dalam proses autentikasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center p-4 relative overflow-hidden select-none font-sans" id="auth-page-container">
      {/* Premium Ambient Blur Background Shapes */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#b87352]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#ab5a37]/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8 relative z-10 coffee-card-shadow"
        id="auth-card"
      >
        {/* Header / Logo */}
        <div className="text-center space-y-2 mb-6" id="auth-header">
          <div className="inline-flex p-3 rounded-2xl bg-[#b87352]/10 text-[#b87352] mb-1">
            <Wallet size={24} />
          </div>
          <h2 className="font-display font-bold text-2xl text-[#2d1d14] tracking-tight">
            Kala Kas
          </h2>
          <p className="text-[11px] font-bold text-[#804A30] uppercase tracking-widest leading-none">
            Kuasai Aliran Keuangan Anda
          </p>
        </div>

        {/* Tab Toggle (Sliding Pill Control) */}
        <div className="bg-[#FAF6F0] p-1 rounded-2xl border border-[#e6dfd5]/40 flex items-center mb-6 relative" id="auth-tabs">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl relative transition cursor-pointer ${
              !isSignUp ? "text-[#b87352]" : "text-[#695D50]"
            }`}
          >
            {!isSignUp && (
              <motion.div
                layoutId="active-tab-indicator"
                className="absolute inset-0 bg-white border border-[#e6dfd5]/30 rounded-xl shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">Masuk Akun</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl relative transition cursor-pointer ${
              isSignUp ? "text-[#b87352]" : "text-[#695D50]"
            }`}
          >
            {isSignUp && (
              <motion.div
                layoutId="active-tab-indicator"
                className="absolute inset-0 bg-white border border-[#e6dfd5]/30 rounded-xl shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">Daftar Baru</span>
          </button>
        </div>

        {/* Feedback Messages */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-[#FCFAF7] border border-[#cf8a68]/40 rounded-2xl flex items-start gap-2.5 mb-4 text-[#804A30] text-xs font-medium"
              id="auth-error-alert"
            >
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-[#cf8a68]" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-[#FCFAF7] border border-[#445D25]/30 rounded-2xl flex items-start gap-2.5 mb-4 text-[#445D25] text-xs font-medium"
              id="auth-success-alert"
            >
              <Sparkles size={15} className="mt-0.5 flex-shrink-0 text-[#445D25]" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4" id="auth-credentials-form">
          {/* Email input field */}
          <div className="space-y-1 relative" id="email-field-container">
            <label htmlFor="auth-email-input" className="text-[10px] font-bold text-[#804A30] uppercase tracking-wider block pl-1">
              Alamat Email
            </label>
            <div className="relative">
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-9 pr-3.5 py-3 bg-[#FAF6F0] border border-[#e6dfd5] hover:border-[#b87352]/30 focus:border-[#b87352] focus:bg-white text-xs font-semibold rounded-2xl text-[#2d1d14] outline-none transition-all"
              />
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#695D50]/60" />
            </div>
          </div>

          {/* Password input field */}
          <div className="space-y-1 relative" id="password-field-container">
            <label htmlFor="auth-password-input" className="text-[10px] font-bold text-[#804A30] uppercase tracking-wider block pl-1">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                id="auth-password-input"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full pl-9 pr-10 py-3 bg-[#FAF6F0] border border-[#e6dfd5] hover:border-[#b87352]/30 focus:border-[#b87352] focus:bg-white text-xs font-semibold rounded-2xl text-[#2d1d14] outline-none transition-all"
              />
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#695D50]/60" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#695D50]/60 hover:text-[#b87352] transition cursor-pointer"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            id="auth-submit-btn"
            className="w-full py-3 bg-[#b87352] hover:bg-[#cf8a68] disabled:bg-[#b87352]/50 text-white font-semibold text-xs tracking-tight rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#b87352]/10 transition-all active:scale-[0.98] mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isSignUp ? (
              <>
                <Sparkles size={14} />
                Daftar Akun Baru
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Masuk ke Aplikasi
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
