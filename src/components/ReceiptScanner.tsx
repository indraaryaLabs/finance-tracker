import React, { useState, useRef } from "react";
import { UploadCloud, FileText, QrCode, Scan, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { Transaction } from "../types";
import { scanReceipt } from "../services/gemini";

interface ReceiptScannerProps {
  onScanComplete: (scannedTx: Omit<Transaction, "id">) => void;
}

export default function ReceiptScanner({ onScanComplete }: ReceiptScannerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom visual scanning beam control
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setScanning(true);
    setScanResult(null);

    try {
      // Convert file to Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(",")[1];
        const mimeType = file.type;

        // Perform active fetch query to server via service
        const data = await scanReceipt(base64Data, mimeType);
        setScanResult(data);
        setScanning(false);
      };
    } catch (err) {
      console.error(err);
      setScanning(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleApprove = () => {
    if (!scanResult) return;
    onScanComplete({
      description: scanResult.merchant || "Scan Transaksi",
      amount: scanResult.amount || 0,
      type: "expense",
      category: scanResult.category || "Others",
      tag: scanResult.tag || "Lifestyle",
      date: scanResult.date || new Date().toISOString().split("T")[0],
      items: scanResult.items || []
    });
    setScanResult(null);
    setFileName("");
  };

  return (
    <div className="w-full flex flex-col space-y-4" id="receipt-scanner-root">
      <div className="space-y-0.5">
        <span className="text-[10px] font-bold text-[#804A30] uppercase tracking-widest block">
          OCR & Fin-Vision
        </span>
        <h3 className="font-display font-semibold text-lg text-[#2d1d14] flex items-center gap-1.5">
          <Scan className="text-[#b87352]" size={18} />
          Pindai Struk Belanja Real-Time
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5" id="scanner-layout">
        {/* Upload Container Area */}
        <div className={`md:col-span-6 relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
          dragActive ? "border-[#b87352] bg-[#b87352]/5" : "border-[#e6dfd5] bg-[#FCFAF7] hover:border-[#b87352]/50 coffee-card-shadow"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        id="upload-dropzone"
        >
          <input
            id="receipt-file-picker"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {scanning ? (
            <div className="space-y-4 py-4 flex flex-col items-center justify-center" id="scanning-loader">
              <div className="relative">
                <FileText className="text-[#e6dfd5]" size={44} />
                <div className="absolute top-0 left-0 w-full h-0.5 bg-[#b87352] animate-bounce" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-[#2d1d14] flex items-center justify-center gap-1.5 font-mono">
                  <Loader2 size={12} className="animate-spin text-[#b87352]" />
                  MEMINDAI STRUK...
                </div>
                <p className="text-[10px] text-[#695D50]/80 max-w-[200px]">
                  Kala AI sedang membaca baris harga dan kuantitas barang dagang.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2 flex flex-col items-center justify-center" id="upload-idle">
              <div className="p-3 bg-[#FAF6F0] rounded-xl border border-[#e6dfd5]">
                <UploadCloud className="text-[#b87352]" size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#2d1d14]">
                  {fileName ? fileName : "Drag & Drop atau Klik untuk Unggah"}
                </p>
                <p className="text-[10px] text-[#695D50]/80 max-w-[200px] mx-auto">
                  Mendukung foto struk kuliner, bensin, atau invoice digital Anda.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Scan Result Panel */}
        <div className="md:col-span-6 flex flex-col justify-between" id="scan-result-panel">
          {scanResult ? (
            <div className="bg-[#FCFAF7] rounded-xl border border-[#e6dfd5]/60 p-5 flex flex-col space-y-4 h-full coffee-card-shadow" id="result-detail-card">
              <div className="flex items-center justify-between border-b border-[#e6dfd5]/30 pb-3" id="result-header">
                <div>
                  <span className="text-[9px] font-mono font-bold text-[#b87352] uppercase tracking-widest block flex items-center gap-1">
                    <Sparkles size={10} />
                    HASIL DI-KATEGORISASI AI
                  </span>
                  <h4 className="font-display font-semibold text-sm text-[#2d1d14] mt-1">
                    {scanResult.merchant || "Merchant Tidak Dikenal"}
                  </h4>
                </div>
                <span className="text-[10px] font-medium text-[#695D50]/60 font-mono">
                  {scanResult.date}
                </span>
              </div>

              <div className="flex-1 space-y-3 text-xs" id="result-content">
                <div className="flex justify-between items-center" id="result-category">
                  <span className="text-[#695D50]">Kategori Anggaran</span>
                  <span className="px-2 py-0.5 rounded bg-[#F3E1D3] border border-[#E8C8B0]/50 text-[#804A30] font-medium">
                    {scanResult.category}
                  </span>
                </div>

                <div className="flex justify-between items-center" id="result-total">
                  <span className="text-[#695D50]">Total Nominal</span>
                  <span className="font-mono font-bold text-[#2d1d14]">
                    Rp {Number(scanResult.amount).toLocaleString("id-ID")}
                  </span>
                </div>

                {scanResult.items && scanResult.items.length > 0 && (
                  <div className="space-y-1 pt-1.5" id="result-items">
                    <span className="text-[10px] font-semibold text-[#804A30] uppercase tracking-wider block">
                      Rincian Struk
                    </span>
                    <div className="bg-[#FAF6F0] px-2.5 py-2 rounded-lg border border-[#e6dfd5]/40 space-y-1 max-h-[85px] overflow-y-auto" id="scanned-items-list">
                      {scanResult.items.map((item: string, i: number) => (
                        <div key={i} className="text-[10px] font-mono text-[#695D50] truncate flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#b87352] flex-shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {scanResult.warning && (
                  <div className="text-[9px] text-[#695D50]/60 leading-snug border-t border-[#e6dfd5]/30 pt-2" id="gemini-key-alert">
                    * {scanResult.warning}
                  </div>
                )}
              </div>

              <button
                type="button"
                id="apply-scan-btn"
                onClick={handleApprove}
                className="w-full py-2 rounded-lg bg-[#b87352] hover:bg-[#cf8a68] text-white font-medium text-xs tracking-tight flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-[#b87352]/10"
              >
                <CheckCircle2 size={13} />
                Setujui & Masukkan ke Buku Kas
              </button>
            </div>
          ) : (
            <div className="bg-[#FAF6F0]/55 border border-[#e6dfd5]/50 rounded-xl p-5 flex flex-col items-center justify-center text-center h-full space-y-2 py-10 coffee-card-shadow" id="result-placeholder">
              <QrCode className="text-[#804A30]/50" size={40} />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[#2d1d14] block">
                  Belum Ada Struk Terpilih
                </span>
                <p className="text-[10px] text-[#695D50]/80 max-w-[200px]">
                  Silakan unggah struk belanja Anda untuk menikmati parsing baris instan bertenaga AI.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
