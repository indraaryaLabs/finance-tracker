import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { OnboardingState } from "../types";
import { Wallet, Sparkles, Compass, Shield, ArrowRight, TrendingUp, CheckCircle2 } from "lucide-react";

interface OnboardingProps {
  onComplete: (data: OnboardingState) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [income, setIncome] = useState<number | "">("");
  const [mindset, setMindset] = useState<"aggressive" | "balanced" | "minimal">("balanced");
  const [goal, setGoal] = useState<"home" | "debt" | "emergency" | "lifestyle" | "investing">("investing");
  const [loadingState, setLoadingState] = useState("");

  const handleNext = () => {
    if (step === 1 && !name.trim()) return;
    if (step === 2 && (!income || Number(income) <= 0)) return;
    
    if (step < 3) {
      setStep(step + 1);
    } else {
      triggerAISimulation();
    }
  };

  const triggerAISimulation = () => {
    setStep(4);
    const stages = [
      "Mengkalibrasi algoritma personalisasi...",
      "Menganalisis profil risiko finasial...",
      "Mengkonfigurasi batas anggaran kategori...",
      "Menghubungkan model kecerdasan Kala AI...",
      "Selesai! Membuka gerbang finansial Anda..."
    ];
    
    let currentIdx = 0;
    setLoadingState(stages[0]);
    
    const interval = setInterval(() => {
      currentIdx++;
      if (currentIdx < stages.length) {
        setLoadingState(stages[currentIdx]);
      } else {
        clearInterval(interval);
        onComplete({
          completed: true,
          fullName: name,
          salary: Number(income),
          savingsMindset: mindset,
          primaryGoal: goal
        });
      }
    }, 1000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF6F0] px-4 py-8 select-none relative overflow-hidden" id="onboarding-root">
      {/* Background radial gradients for luxury soft touch */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#b87352]/5 blur-3xl" />
      <div className="absolute bottom-[-25%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#cf8a68]/5 blur-3xl" />

      <AnimatePresence mode="wait">
        {step < 4 ? (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg glass-panel p-10 rounded-2xl coffee-card-shadow relative z-10 border border-[#e6dfd5]"
            id="onboarding-card"
          >
            {/* Branding Indicator */}
            <div className="flex items-center gap-2 mb-8" id="onboarding-brand">
              <div className="p-2 rounded-xl bg-[#b87352] text-white shadow-md shadow-[#b87352]/10">
                <Sparkles size={16} />
              </div>
              <span className="font-sans font-semibold text-xs uppercase tracking-wider text-[#804A30]">
                AI Finance Tracker
              </span>
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center gap-1.5 mb-8" id="onboarding-stepper">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s === step ? "w-8 bg-[#b87352]" : "w-1.5 bg-[#e6dfd5]"
                  }`}
                />
              ))}
            </div>

            {/* Step content */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
                id="onboarding-step-1"
              >
                <div className="space-y-2">
                  <h1 className="font-display text-3xl font-normal tracking-tight text-[#2d1d14] leading-tight">
                    Selamat datang di gerbang finansial masa depan.
                  </h1>
                  <p className="text-[#695D50] text-sm leading-relaxed font-sans">
                    Kami memadukan kekuatan kecerdasan buatan dengan pengelolaan anggaran yang presisi. Bagaimana kami sebaiknya memanggil Anda?
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="user-fullname" className="text-xs font-semibold text-[#804A30] uppercase tracking-wider block">
                    Nama Lengkap Anda
                  </label>
                  <input
                    id="user-fullname"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Indra Arya"
                    className="w-full px-4 py-3 rounded-lg border border-[#e6dfd5] focus:border-[#b87352] focus:ring-1 focus:ring-[#b87352] outline-none text-[#2d1d14] bg-white/50 text-sm transition-all shadow-sm"
                    autoFocus
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
                id="onboarding-step-2"
              >
                <div className="space-y-2">
                  <h1 className="font-display text-3xl font-normal tracking-tight text-[#2d1d14] leading-tight">
                    Berapa estimasi pemasukan bulanan Anda?
                  </h1>
                  <p className="text-[#695D50] text-sm leading-relaxed font-sans">
                    Masukkan perkiraan rata-rata pendapatan Anda. Jika pendapatan Anda tidak tetap (freelancer/pengusaha), Anda tetap bisa mencatat transaksi pemasukan riil di Buku Kas nanti untuk penyesuaian dinamis.
                  </p>
                </div>

                <div className="space-y-3">
                  <label htmlFor="user-salary" className="text-xs font-semibold text-[#804A30] uppercase tracking-wider block">
                    Estimasi Rata-Rata Pemasukan Bulanan (Rupiah)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#804A30] text-sm font-semibold">
                      Rp
                    </span>
                    <input
                      id="user-salary"
                      type="number"
                      value={income}
                      onChange={(e) => setIncome(e.target.value ? Number(e.target.value) : "")}
                      placeholder="Contoh: 15000000"
                      className="w-full pl-12 pr-4 py-3 rounded-lg border border-[#e6dfd5] focus:border-[#b87352] focus:ring-1 focus:ring-[#b87352] outline-none text-[#2d1d14] bg-white/50 text-sm transition-all shadow-sm font-mono placeholder:font-sans"
                      autoFocus
                    />
                  </div>
                  {income !== "" && Number(income) > 0 && (
                    <p className="text-[11px] text-[#4a5d4e] font-medium font-mono">
                      = {formatCurrency(Number(income))} / bulan
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
                id="onboarding-step-3"
              >
                <div className="space-y-2">
                  <h1 className="font-display text-3xl font-normal tracking-tight text-[#2d1d14] leading-tight">
                    Tentukan strategi finansial personal Anda.
                  </h1>
                  <p className="text-[#695D50] text-sm leading-relaxed font-sans">
                    Bagaimana kecerdasan buatan menyarankan Anda dalam menabung dan apa prioritas terbesar Anda saat ini?
                  </p>
                </div>

                <div className="space-y-4 font-sans">
                  {/* Saving mindset choice */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-[#804A30] uppercase tracking-wider block">
                      Mindset Tabungan
                    </span>
                    <div className="grid grid-cols-3 gap-2" id="mindset-choices">
                      {[
                        { key: "minimal", label: "Santai", desc: "10% tabungan" },
                        { key: "balanced", label: "Ideal", desc: "30% tabungan" },
                        { key: "aggressive", label: "Maksimal", desc: "50%+ tabungan" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          id={`mindset-${item.key}`}
                          onClick={() => setMindset(item.key as any)}
                          className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                            mindset === item.key
                              ? "border-[#b87352] bg-[#b87352]/5 shadow-sm"
                              : "border-[#e6dfd5] bg-white/40 hover:border-[#b87352]/40"
                          }`}
                        >
                          <div className={`text-xs font-semibold ${mindset === item.key ? "text-[#b87352]" : "text-[#2d1d14]"}`}>
                            {item.label}
                          </div>
                          <div className="text-[10px] text-[#695D50]/70 mt-0.5">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Primary Goal Choice */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-[#804A30] uppercase tracking-wider block">
                      Fokus Finansial Utama
                    </span>
                    <div className="grid grid-cols-2 gap-2" id="goal-choices">
                      {[
                        { key: "investing", label: "Investasi & Reksa Dana", icon: TrendingUp },
                        { key: "emergency", label: "Dana Darurat", icon: Shield },
                        { key: "debt", label: "Pelunasan Utang", icon: Wallet },
                        { key: "home", label: "Tabungan Properti", icon: Compass },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            id={`goal-${item.key}`}
                            onClick={() => setGoal(item.key as any)}
                            className={`p-3.5 rounded-lg border flex items-center gap-2.5 text-left cursor-pointer transition-all ${
                              goal === item.key
                                ? "border-[#b87352] bg-[#b87352]/5 shadow-sm"
                                : "border-[#e6dfd5] bg-white/40 hover:border-[#b87352]/40"
                            }`}
                          >
                            <div className={`p-1.5 rounded-md ${goal === item.key ? "bg-[#b87352] text-white" : "bg-[#FAF6F0] text-[#804A30]"}`}>
                              <Icon size={14} />
                            </div>
                            <span className={`text-[12px] font-medium leading-tight ${goal === item.key ? "text-[#b87352]" : "text-[#2d1d14]"}`}>
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Bottom Actions */}
            <div className="mt-10 pt-6 border-t border-[#e6dfd5]/40 flex items-center justify-between font-sans" id="onboarding-actions">
              <button
                type="button"
                id="onboarding-back-btn"
                onClick={() => step > 1 && setStep(step - 1)}
                disabled={step === 1}
                className={`text-xs font-semibold tracking-tight text-[#695D50]/60 cursor-pointer hover:text-[#2d1d14] transition-colors ${
                  step === 1 ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
              >
                Kembali
              </button>

              <button
                type="button"
                id="onboarding-next-btn"
                onClick={handleNext}
                disabled={
                  (step === 1 && !name.trim()) ||
                  (step === 2 && (!income || Number(income) <= 0))
                }
                className="px-5 py-2.5 rounded-lg bg-[#b87352] hover:bg-[#cf8a68] disabled:opacity-50 text-white font-medium text-xs tracking-tight flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#b87352]/10 transition-all"
              >
                {step === 3 ? "Mulai Analisis AI" : "Lanjutkan"}
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="spinner"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm text-center py-12 flex flex-col items-center justify-center space-y-6"
            id="onboarding-simulation"
          >
            <div className="relative flex items-center justify-center w-20 h-20" id="loader-circles">
              <div className="absolute inset-0 rounded-full border-4 border-[#e6dfd5]" />
              <div className="absolute inset-0 rounded-full border-4 border-[#b87352] border-t-transparent animate-spin" />
              <Sparkles className="text-[#b87352] animate-pulse" size={24} />
            </div>

            <div className="space-y-2">
              <h2 className="font-display font-semibold text-xl text-[#2d1d14]">
                Penyusunan Profil Finansial
              </h2>
              <p className="text-xs text-[#804A30] font-mono tracking-normal leading-relaxed h-8 max-w-[260px] mx-auto">
                {loadingState}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
