import React from "react";
import { FileSpreadsheet, Printer } from "lucide-react";

interface ExportButtonsProps { onExportExcel?: () => void; onPrint?: () => void; }

export default function ExportButtons({ onExportExcel, onPrint }: ExportButtonsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {onExportExcel && (
        <button type="button" onClick={onExportExcel} title="Export Excel"
          className="p-2 rounded-xl border border-[#e6dfd5] bg-white/60 text-[#8B7E74] hover:text-[#5B8C5A] hover:border-[#5B8C5A]/30 cursor-pointer transition">
          <FileSpreadsheet size={14} />
        </button>
      )}
      {onPrint && (
        <button type="button" onClick={onPrint} title="Print"
          className="p-2 rounded-xl border border-[#e6dfd5] bg-white/60 text-[#8B7E74] hover:text-[#b87352] hover:border-[#b87352]/30 cursor-pointer transition">
          <Printer size={14} />
        </button>
      )}
    </div>
  );
}
