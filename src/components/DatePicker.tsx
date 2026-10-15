import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

interface DatePickerProps { value: string; onChange: (d: string) => void; label?: string; placeholder?: string; disabled?: boolean; className?: string; }

export default function DatePicker({ value, onChange, label, placeholder = "Pilih tanggal", disabled = false, className = "" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => value ? new Date(value + "T00:00:00").getFullYear() : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? new Date(value + "T00:00:00").getMonth() : new Date().getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  const handleSelectDay = (day: number) => {
    onChange(`${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`);
    setIsOpen(false);
  };

  const displayValue = value ? (() => { const d = new Date(value + "T00:00:00"); return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`; })() : "";

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && <label className="block text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1.5">{label}</label>}
      <button type="button" disabled={disabled} onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left text-sm font-medium transition-all cursor-pointer
          ${isOpen ? "border-[#b87352]/50 bg-white ring-2 ring-[#b87352]/10 text-[#2d1d14]" : "border-[#e6dfd5] bg-[#FAF6F0] text-[#2d1d14] hover:border-[#b87352]/30"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
        <Calendar size={15} className="text-[#b0a69c] flex-shrink-0" />
        <span className={displayValue ? "text-[#2d1d14]" : "text-[#b0a69c]"}>{displayValue || placeholder}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-[300px] bg-white border border-[#e6dfd5] rounded-2xl shadow-xl shadow-[#2d1d14]/8 p-4">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => { if (viewMonth===0){setViewMonth(11);setViewYear(viewYear-1)}else setViewMonth(viewMonth-1) }}
              className="p-1.5 rounded-lg hover:bg-[#FAF6F0] text-[#8B7E74] hover:text-[#2d1d14] transition cursor-pointer"><ChevronLeft size={16} /></button>
            <div className="text-sm font-bold text-[#2d1d14] tracking-tight">{BULAN[viewMonth]} {viewYear}</div>
            <button type="button" onClick={() => { if (viewMonth===11){setViewMonth(0);setViewYear(viewYear+1)}else setViewMonth(viewMonth+1) }}
              className="p-1.5 rounded-lg hover:bg-[#FAF6F0] text-[#8B7E74] hover:text-[#2d1d14] transition cursor-pointer"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-[#b0a69c] uppercase tracking-wider py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDayOfWeek }).map((_,i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_,i) => {
              const day = i+1;
              const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const isSelected = dateStr === value;
              const isToday = dateStr === todayStr;
              return (
                <button key={day} type="button" onClick={() => handleSelectDay(day)}
                  className={`aspect-square flex items-center justify-center text-xs font-semibold rounded-lg cursor-pointer transition-all
                    ${isSelected ? "bg-[#b87352] text-white shadow-md shadow-[#b87352]/20 scale-110" : isToday ? "bg-[#b87352]/8 text-[#b87352] border border-[#b87352]/20" : "text-[#4a3f36] hover:bg-[#FAF6F0]"}`}>
                  {day}
                </button>
              );
            })}
          </div>
          <div className="mt-3 pt-2 border-t border-[#e6dfd5]/60 flex justify-center">
            <button type="button" onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); handleSelectDay(today.getDate()); }}
              className="text-[11px] font-bold text-[#b87352] hover:text-[#a0613f] cursor-pointer transition px-3 py-1 rounded-lg hover:bg-[#FAF6F0]">Hari Ini</button>
          </div>
        </div>
      )}
    </div>
  );
}
