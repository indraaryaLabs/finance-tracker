import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wrench, MapPin, Phone, User, ArrowRight, Sparkles } from "lucide-react";

interface WorkspaceSetupProps {
  userId: string;
  onComplete: (data: { workspaceName: string; address: string; phone: string; ownerName: string }) => void;
}

export default function WorkspaceSetup({ userId, onComplete }: WorkspaceSetupProps) {
  const [step, setStep] = useState(0);
  const [workspaceName, setWorkspaceName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { title: "Nama Bengkel Anda", subtitle: "Masukkan nama usaha bengkel atau workshop Anda", icon: Wrench },
    { title: "Informasi Kontak", subtitle: "Alamat dan nomor telepon bengkel", icon: MapPin },
    { title: "Nama Pemilik", subtitle: "Siapa yang menjalankan bisnis ini?", icon: User },
  ];

  const canProceed = () => {
    if (step === 0) return workspaceName.trim().length >= 2;
    if (step === 1) return true;
    if (step === 2) return ownerName.trim().length >= 2;
    return false;
  };

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else { setIsSubmitting(true); onComplete({ workspaceName: workspaceName.trim(), address: address.trim(), phone: phone.trim(), ownerName: ownerName.trim() }); }
  };

  const CurrentIcon = steps[step].icon;

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center p-4 font-sans">
      <div className="absolute top-[-20%] left-[-15%] w-[50%] h-[50%] bg-[#b87352]/6 rounded-full blur-[120px] pointer-events-none" />

      <motion.div className="relative w-full max-w-lg" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#b87352] to-[#a0613f] text-white shadow-lg shadow-[#b87352]/20">
              <Wrench size={20} />
            </div>
            <div className="text-left">
              <span className="block text-[9px] font-bold text-[#b87352] uppercase tracking-[0.2em] font-mono">Workshop Finance</span>
              <span className="block text-lg font-display font-bold text-[#2d1d14] tracking-tight">BengkelBooks</span>
            </div>
          </div>
          <p className="text-sm text-[#8B7E74] max-w-xs mx-auto">Siapkan pencatatan keuangan profesional untuk bengkel Anda dalam hitungan menit.</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? "bg-[#b87352] w-10" : "bg-[#e6dfd5] w-6"}`} />
          ))}
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-[#e6dfd5] rounded-3xl p-8 shadow-xl shadow-[#2d1d14]/5">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-[#b87352]/8 border border-[#b87352]/15 text-[#b87352]">
                  <CurrentIcon size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2d1d14] tracking-tight">{steps[step].title}</h2>
                  <p className="text-xs text-[#8B7E74]">{steps[step].subtitle}</p>
                </div>
              </div>

              {step === 0 && (
                <div>
                  <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-2">Nama Bengkel / Workshop</label>
                  <div className="relative">
                    <Wrench size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0a69c]" />
                    <input type="text" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder="Contoh: Bengkel Jaya Abadi"
                      className="w-full pl-10 pr-4 py-3 bg-[#FAF6F0] border border-[#e6dfd5] rounded-xl text-sm font-semibold text-[#2d1d14] placeholder:text-[#b0a69c] focus:border-[#b87352] focus:ring-2 focus:ring-[#b87352]/10 outline-none transition" autoFocus />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-2">Alamat (Opsional)</label>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3.5 top-3 text-[#b0a69c]" />
                      <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Jl. Industri No. 45, Kendari" rows={2}
                        className="w-full pl-10 pr-4 py-3 bg-[#FAF6F0] border border-[#e6dfd5] rounded-xl text-sm text-[#2d1d14] placeholder:text-[#b0a69c] focus:border-[#b87352] focus:ring-2 focus:ring-[#b87352]/10 outline-none resize-none transition" autoFocus />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-2">Telepon (Opsional)</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0a69c]" />
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0821-xxxx-xxxx"
                        className="w-full pl-10 pr-4 py-3 bg-[#FAF6F0] border border-[#e6dfd5] rounded-xl text-sm text-[#2d1d14] placeholder:text-[#b0a69c] focus:border-[#b87352] focus:ring-2 focus:ring-[#b87352]/10 outline-none transition" />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-2">Nama Lengkap Pemilik</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0a69c]" />
                      <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Nama Anda"
                        className="w-full pl-10 pr-4 py-3 bg-[#FAF6F0] border border-[#e6dfd5] rounded-xl text-sm text-[#2d1d14] placeholder:text-[#b0a69c] focus:border-[#b87352] focus:ring-2 focus:ring-[#b87352]/10 outline-none transition" autoFocus />
                    </div>
                  </div>
                  <div className="bg-[#FAF6F0] border border-[#e6dfd5]/60 rounded-xl p-4 space-y-2">
                    <span className="text-[10px] font-bold text-[#b87352] uppercase tracking-widest">Ringkasan Bengkel</span>
                    <div className="space-y-1 text-xs">
                      {[["Nama", workspaceName], ["Alamat", address], ["Pemilik", ownerName]].map(([k, v]) => (
                        <div key={k} className="flex justify-between"><span className="text-[#8B7E74]">{k}:</span><span className="text-[#2d1d14] font-semibold">{v || "—"}</span></div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <button type="button" disabled={!canProceed() || isSubmitting} onClick={handleNext}
                className={`w-full mt-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer
                  ${canProceed() && !isSubmitting ? "bg-gradient-to-r from-[#b87352] to-[#a0613f] text-white shadow-lg shadow-[#b87352]/20 hover:shadow-xl hover:-translate-y-0.5" : "bg-[#e6dfd5] text-[#b0a69c] cursor-not-allowed"}`}>
                {isSubmitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Menyiapkan Bengkel...</>
                  : step < steps.length - 1 ? <>Lanjutkan<ArrowRight size={15} /></> : <><Sparkles size={15} />Mulai Pencatatan</>}
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="text-center text-[10px] text-[#b0a69c] mt-4 font-mono">Langkah {step + 1} dari {steps.length}</p>
      </motion.div>
    </div>
  );
}
