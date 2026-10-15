// ============================================================
// Formatters — Utility functions for display formatting
// ============================================================

/**
 * Format a number as Indonesian Rupiah currency
 */
export function rupiah(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

/**
 * Format a number with Indonesian thousands separator (no currency symbol)
 */
export function formatAngka(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(val);
}

/**
 * Parse a formatted Indonesian number string back to number
 * e.g. "1.500.000" → 1500000
 */
export function parseAngka(str: string): number {
  const cleaned = str.replace(/\D/g, "");
  return cleaned === "" ? 0 : Number(cleaned);
}

const BULAN_INDONESIA = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const BULAN_PENDEK = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agt", "Sep", "Okt", "Nov", "Des",
];

const HARI_INDONESIA = [
  "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu",
];

/**
 * Format a date string (YYYY-MM-DD) to Indonesian format
 * @param dateStr - "2026-07-12"
 * @param format - "long" → "12 Juli 2026", "short" → "12 Jul 2026", "full" → "Sabtu, 12 Juli 2026"
 */
export function formatTanggal(
  dateStr: string,
  format: "long" | "short" | "full" = "long"
): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;

  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();

  if (format === "short") {
    return `${day} ${BULAN_PENDEK[month]} ${year}`;
  }
  if (format === "full") {
    return `${HARI_INDONESIA[d.getDay()]}, ${day} ${BULAN_INDONESIA[month]} ${year}`;
  }
  return `${day} ${BULAN_INDONESIA[month]} ${year}`;
}

/**
 * Format a month string ("2026-07") to Indonesian month/year
 */
export function formatBulanTahun(monthStr: string): string {
  if (!monthStr || monthStr.length < 7) return "";
  const [year, month] = monthStr.split("-").map(Number);
  return `${BULAN_INDONESIA[month - 1]} ${year}`;
}

/**
 * Format a period range for closing books
 * @returns "1 Januari 2026 — 30 Juni 2026"
 */
export function formatPeriode(startDate: string, endDate: string): string {
  return `${formatTanggal(startDate)} — ${formatTanggal(endDate)}`;
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/**
 * Get current month as YYYY-MM
 */
export function currentMonthISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * Translate income sub-type to Indonesian label
 */
export function labelSubTipePemasukan(subType: string): string {
  const map: Record<string, string> = {
    unit_order: "Pemesanan Unit",
    maintenance: "Perbaikan / Maintenance",
    service_other: "Jasa Lainnya",
  };
  return map[subType] || subType;
}

/**
 * Translate operational expense category to Indonesian
 */
export function labelKategoriOperasional(cat: string): string {
  const map: Record<string, string> = {
    listrik: "Listrik & Air",
    sewa: "Sewa Tempat",
    peralatan: "Peralatan",
    transportasi: "Transportasi",
    umum: "Umum",
  };
  return map[cat] || cat;
}

/**
 * Translate project status to Indonesian label with emoji
 */
export function labelStatusProyek(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    draft: { label: "Draft", color: "text-slate-500" },
    in_progress: { label: "Dikerjakan", color: "text-sky-600" },
    completed: { label: "Selesai", color: "text-emerald-600" },
    paid: { label: "Lunas", color: "text-green-700" },
  };
  return map[status] || { label: status, color: "text-slate-500" };
}

/**
 * Translate user role to Indonesian label
 */
export function labelRole(role: string): string {
  return role === "admin" ? "Admin / Pemilik" : "Sekretaris / Pencatat";
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number = 40): string {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "…" : text;
}
