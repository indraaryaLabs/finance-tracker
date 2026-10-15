import React from "react";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

interface StatCardProps { title: string; value: string; subtitle?: string; icon: LucideIcon; trend?: "up" | "down" | "neutral"; trendLabel?: string; accentColor?: string; }

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendLabel, accentColor = "text-[#b87352]" }: StatCardProps) {
  return (
    <div className="bg-white/80 border border-[#e6dfd5] rounded-2xl p-5 hover:shadow-lg hover:shadow-[#2d1d14]/3 transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl bg-[#FAF6F0] border border-[#e6dfd5]/60 ${accentColor}`}><Icon size={16} /></div>
        {trend && trend !== "neutral" && (
          <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
            trend === "up" ? "text-[#5B8C5A] bg-[#5B8C5A]/8 border-[#5B8C5A]/20" : "text-[#C75B3F] bg-[#C75B3F]/8 border-[#C75B3F]/20"
          }`}>
            {trend === "up" ? <TrendingUp size={10} /> : <TrendingDown size={10} />}{trendLabel}
          </div>
        )}
        {trend === "neutral" && trendLabel && (
          <span className="text-[10px] font-semibold text-[#b0a69c] px-2 py-0.5 rounded-lg bg-[#FAF6F0] border border-[#e6dfd5]/50">{trendLabel}</span>
        )}
      </div>
      <p className="text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mb-1">{title}</p>
      <p className="text-xl font-mono font-bold text-[#2d1d14] tracking-tight">{value}</p>
      {subtitle && <p className="text-[10px] text-[#b0a69c] mt-1">{subtitle}</p>}
    </div>
  );
}
