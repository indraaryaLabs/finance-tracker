import React from "react";
import { useWorkspace } from "../../contexts/WorkspaceContext";

interface PrintHeaderProps { title: string; subtitle?: string; }

export default function PrintHeader({ title, subtitle }: PrintHeaderProps) {
  const { workspace } = useWorkspace();
  return (
    <div className="hidden print:block mb-6 border-b-2 border-black pb-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">{workspace?.name || "Bengkel"}</h1>
          {workspace?.address && <p className="text-xs text-gray-600 mt-0.5">{workspace.address}</p>}
          {workspace?.phone && <p className="text-xs text-gray-600">{workspace.phone}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          <p className="text-xs text-gray-400 mt-1">Dicetak: {new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </div>
    </div>
  );
}

export function PrintFooter() {
  return (
    <div className="hidden print:block mt-12 pt-8 border-t border-gray-300">
      <div className="flex justify-between items-end">
        <div className="text-center w-48">
          <p className="text-xs text-gray-500 mb-12">Mengetahui,</p>
          <div className="border-b border-gray-400 mb-1" />
          <p className="text-xs font-semibold">Pemilik Bengkel</p>
        </div>
        <div className="text-center w-48">
          <p className="text-xs text-gray-500 mb-12">Dibuat oleh,</p>
          <div className="border-b border-gray-400 mb-1" />
          <p className="text-xs font-semibold">Pencatat</p>
        </div>
      </div>
    </div>
  );
}
