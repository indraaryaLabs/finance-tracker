import React, { useState, useRef, useEffect } from "react";
import { Transaction } from "../types";
import { TrendingDown, TrendingUp, Calendar } from "lucide-react";

interface ExpenseChartProps {
  transactions: Transaction[];
}

export default function ExpenseChart({ transactions }: ExpenseChartProps) {
  const [viewMode, setViewMode] = useState<"weekly" | "monthly" | "last_months" | "custom_months" | "yearly">("monthly");
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; val: number; date: string; rawData: any } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(500);
  const height = 180;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setWidth(entry.contentRect.width || 500);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Helper: Indonesian Month names
  const getMonthNameIndonesian = (monthIdx: number, short = false) => {
    const monthsFull = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const monthsShort = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agt", "Sep", "Okt", "Nov", "Des"
    ];
    return short ? monthsShort[monthIdx] : monthsFull[monthIdx];
  };

  // Helper: Get reference date from latest transaction (or fallback to 2026-06-18)
  const getReferenceDate = () => {
    if (transactions.length === 0) return new Date("2026-06-18");
    const dates = transactions.map((t) => new Date(t.date).getTime());
    const maxTime = Math.max(...dates);
    return new Date(maxTime);
  };

  const getAvailableMonths = () => {
    const monthsSet = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        monthsSet.add(tx.date.substring(0, 7)); // e.g. "2026-06"
      }
    });
    if (monthsSet.size === 0) {
      const d = new Date();
      for (let i = 0; i < 6; i++) {
        const past = new Date(d.getFullYear(), d.getMonth() - i, 1);
        const y = past.getFullYear();
        const m = String(past.getMonth() + 1).padStart(2, "0");
        monthsSet.add(`${y}-${m}`);
      }
    }
    return Array.from(monthsSet).sort();
  };

  const availableMonths = getAvailableMonths();

  // Populate selected months if empty
  useEffect(() => {
    if (selectedMonths.length === 0 && availableMonths.length > 0) {
      setSelectedMonths(availableMonths.slice(-3));
    }
  }, [transactions]);

  // Aggregate monthly data for last numMonths
  const getLastMonthsData = (refDate: Date, numMonths = 6) => {
    const data = [];
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthStr = String(month + 1).padStart(2, "0");
      const prefix = `${year}-${monthStr}`;

      const expenses = transactions
        .filter((tx) => tx.date.startsWith(prefix) && tx.type === "expense")
        .reduce((sum, tx) => sum + tx.amount, 0);

      data.push({
        date: `${year}-${monthStr}-01`,
        label: getMonthNameIndonesian(month, true),
        tooltipLabel: `${getMonthNameIndonesian(month)} ${year}`,
        amount: expenses
      });
    }
    return data;
  };

  // Aggregate yearly data for refDate's year
  const getYearlyData = (refDate: Date) => {
    const year = refDate.getFullYear();
    const data = [];
    for (let month = 0; month < 12; month++) {
      const monthStr = String(month + 1).padStart(2, "0");
      const prefix = `${year}-${monthStr}`;

      const expenses = transactions
        .filter((tx) => tx.date.startsWith(prefix) && tx.type === "expense")
        .reduce((sum, tx) => sum + tx.amount, 0);

      data.push({
        date: `${year}-${monthStr}-01`,
        label: getMonthNameIndonesian(month, true),
        tooltipLabel: `${getMonthNameIndonesian(month)} ${year}`,
        amount: expenses
      });
    }
    return data;
  };

  // Aggregate custom selected months
  const getCustomMonthsData = () => {
    const sortedMonths = [...selectedMonths].sort();
    return sortedMonths.map((mStr) => {
      const [yearStr, monthStr] = mStr.split("-");
      const monthIdx = parseInt(monthStr, 10) - 1;
      const expenses = transactions
        .filter((tx) => tx.date.startsWith(mStr) && tx.type === "expense")
        .reduce((sum, tx) => sum + tx.amount, 0);

      return {
        date: `${mStr}-01`,
        label: `${getMonthNameIndonesian(monthIdx, true)} ${yearStr.substring(2, 4)}`,
        tooltipLabel: `${getMonthNameIndonesian(monthIdx)} ${yearStr}`,
        amount: expenses
      };
    });
  };

  // Get aggregated data points depending on active viewMode
  const getChartData = () => {
    const refDate = getReferenceDate();
    if (viewMode === "weekly") {
      // Last 7 days day-by-day
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(refDate);
        d.setDate(refDate.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });
      const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      return days.map((day) => {
        const expenses = transactions
          .filter((tx) => tx.date === day && tx.type === "expense")
          .reduce((sum, tx) => sum + tx.amount, 0);
        const dObj = new Date(day);
        const dayLabel = dayNames[dObj.getDay()];
        return {
          date: day,
          label: dayLabel,
          tooltipLabel: `${dayLabel} (${dObj.getDate()} ${getMonthNameIndonesian(dObj.getMonth())})`,
          amount: expenses
        };
      });
    } else if (viewMode === "monthly") {
      // Last 28 days grouped into 4 weeks (7 days each)
      const weeks = Array.from({ length: 4 }, (_, i) => {
        const startDayOffset = 27 - i * 7;
        const endDayOffset = 21 - i * 7;

        const startDate = new Date(refDate);
        startDate.setDate(refDate.getDate() - startDayOffset);
        
        const endDate = new Date(refDate);
        endDate.setDate(refDate.getDate() - endDayOffset);

        const startStr = startDate.toISOString().split("T")[0];
        const endStr = endDate.toISOString().split("T")[0];

        return {
          weekNum: i + 1,
          startDate,
          endDate,
          startStr,
          endStr
        };
      });

      return weeks.map((w) => {
        const expenses = transactions
          .filter((tx) => tx.type === "expense" && tx.date >= w.startStr && tx.date <= w.endStr)
          .reduce((sum, tx) => sum + tx.amount, 0);

        const formatDateShort = (d: Date) => {
          return `${d.getDate()} ${getMonthNameIndonesian(d.getMonth(), true)}`;
        };

        return {
          date: w.endStr,
          label: `Minggu ${w.weekNum}`,
          tooltipLabel: `Minggu ${w.weekNum} (${formatDateShort(w.startDate)} - ${formatDateShort(w.endDate)} ${w.endDate.getFullYear()})`,
          amount: expenses
        };
      });
    } else if (viewMode === "last_months") {
      return getLastMonthsData(refDate, 6);
    } else if (viewMode === "yearly") {
      return getYearlyData(refDate);
    } else {
      return getCustomMonthsData();
    }
  };

  const chartData = getChartData();
  const maxAmount = Math.max(...chartData.map((d) => d.amount), 500000); // Guard minimum 500k to maintain viewport scale

  // Helper coordinate mappers
  const paddingX = 40;
  const paddingY = 25;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const points = chartData.map((d, index) => {
    const denominator = chartData.length > 1 ? chartData.length - 1 : 1;
    const x = paddingX + (index / denominator) * graphWidth;
    // Invert Y coordinate so 0 is at bottom
    const y = paddingY + graphHeight - (d.amount / maxAmount) * graphHeight;
    return { x, y, val: d.amount, date: d.date, rawData: d };
  });

  // Create Bezier Curve for smooth line
  const bezierString = () => {
    if (points.length === 0) return "";
    let str = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const cpX1 = points[i].x + (points[i + 1].x - points[i].x) / 2;
      const cpY1 = points[i].y;
      const cpX2 = points[i].x + (points[i + 1].x - points[i].x) / 2;
      const cpY2 = points[i + 1].y;
      str += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i + 1].x} ${points[i + 1].y}`;
    }
    return str;
  };

  const areaString = () => {
    const pStr = bezierString();
    if (!pStr) return "";
    return `${pStr} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
  };

  const formatIDRCurrency = (val: number) => {
    if (val >= 1000000) {
      return `Rp ${(val / 1000000).toFixed(1)}jt`;
    }
    return `Rp ${(val / 1000).toFixed(0)}rb`;
  };

  // Dynamic Metadata Calculations
  const getSmallHeaderTitle = () => {
    switch (viewMode) {
      case "weekly": return "Analisis Siklus Mingguan";
      case "monthly": return "Analisis Siklus Bulanan";
      case "last_months": return "Analisis Beberapa Bulan Terakhir";
      case "custom_months": return "Analisis Pilihan Kustom";
      case "yearly": return "Analisis Siklus Tahunan";
      default: return "";
    }
  };

  const getBigHeaderTitle = () => {
    switch (viewMode) {
      case "weekly": return "Tren Pengeluaran 7 Hari";
      case "monthly": return "Tren Pengeluaran 4 Minggu";
      case "last_months": return "Tren Pengeluaran 6 Bulan";
      case "custom_months": return "Tren Pengeluaran Pilihan";
      case "yearly": return `Tren Pengeluaran Tahun ${getReferenceDate().getFullYear()}`;
      default: return "";
    }
  };

  const getDateRangeText = () => {
    if (chartData.length === 0) return "Tidak ada data";
    const refDate = getReferenceDate();

    const formatDateIndo = (d: Date) => {
      return `${d.getDate()} ${getMonthNameIndonesian(d.getMonth(), true)} ${d.getFullYear()}`;
    };

    const formatMonthYearIndo = (dateStr: string) => {
      const d = new Date(dateStr);
      return `${getMonthNameIndonesian(d.getMonth(), true)} ${d.getFullYear()}`;
    };

    if (viewMode === "weekly") {
      const startDate = new Date(refDate);
      startDate.setDate(refDate.getDate() - 6);
      return `${formatDateIndo(startDate)} - ${formatDateIndo(refDate)}`;
    } else if (viewMode === "monthly") {
      const startDate = new Date(refDate);
      startDate.setDate(refDate.getDate() - 27);
      return `${formatDateIndo(startDate)} - ${formatDateIndo(refDate)}`;
    } else {
      const firstPoint = chartData[0];
      const lastPoint = chartData[chartData.length - 1];
      return `${formatMonthYearIndo(firstPoint.date)} - ${formatMonthYearIndo(lastPoint.date)}`;
    }
  };

  const getPercentageChange = () => {
    const refDate = getReferenceDate();
    let currentSum = 0;
    let prevSum = 0;

    if (viewMode === "weekly") {
      const t1 = refDate.getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      const currentExpenses = transactions.filter(
        (t) => t.type === "expense" && new Date(t.date).getTime() > t1 - 7 * dayMs && new Date(t.date).getTime() <= t1
      );
      const prevExpenses = transactions.filter(
        (t) => t.type === "expense" && new Date(t.date).getTime() > t1 - 14 * dayMs && new Date(t.date).getTime() <= t1 - 7 * dayMs
      );
      currentSum = currentExpenses.reduce((s, t) => s + t.amount, 0);
      prevSum = prevExpenses.reduce((s, t) => s + t.amount, 0);
    } else if (viewMode === "monthly") {
      const t1 = refDate.getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      const currentExpenses = transactions.filter(
        (t) => t.type === "expense" && new Date(t.date).getTime() > t1 - 30 * dayMs && new Date(t.date).getTime() <= t1
      );
      const prevExpenses = transactions.filter(
        (t) => t.type === "expense" && new Date(t.date).getTime() > t1 - 60 * dayMs && new Date(t.date).getTime() <= t1 - 30 * dayMs
      );
      currentSum = currentExpenses.reduce((s, t) => s + t.amount, 0);
      prevSum = prevExpenses.reduce((s, t) => s + t.amount, 0);
    } else if (viewMode === "last_months") {
      const m1Prefix = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, "0")}`;
      const prevD = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
      const m2Prefix = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, "0")}`;

      currentSum = transactions.filter((t) => t.type === "expense" && t.date.startsWith(m1Prefix)).reduce((s, t) => s + t.amount, 0);
      prevSum = transactions.filter((t) => t.type === "expense" && t.date.startsWith(m2Prefix)).reduce((s, t) => s + t.amount, 0);
    } else if (viewMode === "yearly") {
      const year = refDate.getFullYear();
      currentSum = transactions.filter((t) => t.type === "expense" && t.date.startsWith(String(year))).reduce((s, t) => s + t.amount, 0);
      prevSum = transactions.filter((t) => t.type === "expense" && t.date.startsWith(String(year - 1))).reduce((s, t) => s + t.amount, 0);
    } else {
      if (selectedMonths.length >= 2) {
        const sorted = [...selectedMonths].sort();
        const latest = sorted[sorted.length - 1];
        const prev = sorted[sorted.length - 2];
        currentSum = transactions.filter((t) => t.type === "expense" && t.date.startsWith(latest)).reduce((s, t) => s + t.amount, 0);
        prevSum = transactions.filter((t) => t.type === "expense" && t.date.startsWith(prev)).reduce((s, t) => s + t.amount, 0);
      }
    }

    if (prevSum === 0) return { percent: 0, isDown: true };
    const pct = ((currentSum - prevSum) / prevSum) * 100;
    return {
      percent: Math.abs(parseFloat(pct.toFixed(1))),
      isDown: pct <= 0
    };
  };

  const trend = getPercentageChange();

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    let closestPoint = points[0];
    let minDistance = Math.abs(mouseX - points[0].x);

    for (let i = 1; i < points.length; i++) {
      const distance = Math.abs(mouseX - points[i].x);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = points[i];
      }
    }

    if (mouseX >= paddingX - 10 && mouseX <= width - paddingX + 10) {
      setHoveredPoint(closestPoint);
    } else {
      setHoveredPoint(null);
    }
  };

  const shouldRenderLabel = (idx: number, totalPoints: number) => {
    return true;
  };

  const getDisplayLabel = (p: typeof points[0]) => {
    if (viewMode === "weekly") {
      return p.rawData.label.substring(0, 3);
    }
    return p.rawData.label;
  };

  return (
    <div className="w-full flex flex-col space-y-4" id="expense-chart-root">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans" id="chart-header">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-[#804A30] uppercase tracking-widest block">
            {getSmallHeaderTitle()}
          </span>
          <div className="flex items-center gap-1.5" id="weekly-overview-insights">
            <h3 className="font-display font-semibold text-lg text-[#2d1d14]">
              {getBigHeaderTitle()}
            </h3>
            {trend.percent > 0 && (
              <span className={`inline-flex items-center gap-0.5 py-0.5 px-1.5 rounded text-[10px] font-medium font-mono border ${
                trend.isDown 
                  ? "bg-[#E2EAD3] text-[#445D25] border-[#CBD8B5]/50" 
                  : "bg-[#F3E1D3] text-[#804A30] border-[#E8C8B0]/50"
              }`}>
                {trend.isDown ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                {trend.isDown ? "-" : "+"}{trend.percent}%
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-[#695D50] bg-[#e6dfd5]/40 px-2.5 py-1 rounded-md border border-[#e6dfd5]/60 self-start sm:self-center">
          <Calendar size={12} />
          <span className="font-mono text-[11px]">{getDateRangeText()}</span>
        </div>
      </div>

      {/* Selector Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 bg-[#FAF6F0] p-1 rounded-lg border border-[#e6dfd5] text-xs font-sans">
        {[
          { mode: "weekly", label: "Mingguan" },
          { mode: "monthly", label: "Bulanan" },
          { mode: "last_months", label: "6 Bulan Terakhir" },
          { mode: "custom_months", label: "Pilihan Kustom" },
          { mode: "yearly", label: "Tahunan" }
        ].map((btn) => (
          <button
            key={btn.mode}
            type="button"
            onClick={() => setViewMode(btn.mode as any)}
            className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              viewMode === btn.mode
                ? "bg-[#b87352] text-white font-semibold shadow-sm"
                : "text-[#695D50] hover:bg-[#e6dfd5]/40"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Custom Selected Months Checkbox Bar */}
      {viewMode === "custom_months" && (
        <div className="bg-[#FCFAF7] p-2.5 rounded-lg border border-[#e6dfd5]/60 flex flex-wrap items-center gap-2 font-sans text-xs shadow-inner">
          <span className="text-[10px] font-bold text-[#804A30] uppercase tracking-wider mr-1">
            Pilih Bulan:
          </span>
          {availableMonths.map((mStr) => {
            const [yearStr, monthStr] = mStr.split("-");
            const displayLabel = `${getMonthNameIndonesian(parseInt(monthStr, 10) - 1, true)} ${yearStr}`;
            const isChecked = selectedMonths.includes(mStr);
            return (
              <label
                key={mStr}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded border cursor-pointer select-none transition-all ${
                  isChecked
                    ? "bg-[#F3E1D3] border-[#E8C8B0]/60 text-[#804A30] font-semibold"
                    : "bg-[#FCFAF7] border-[#e6dfd5] text-[#695D50] hover:bg-[#FAF6F0]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMonths([...selectedMonths, mStr]);
                    } else {
                      setSelectedMonths(selectedMonths.filter((m) => m !== mStr));
                    }
                  }}
                  className="accent-[#b87352]"
                />
                <span className="text-[11px]">{displayLabel}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* SVG Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full h-[190px] bg-[#FCFAF7] rounded-xl border border-[#e6dfd5]/60 p-1 flex items-center justify-center overflow-hidden coffee-card-shadow"
        id="chart-canvas-container"
      >
        {chartData.length > 0 ? (
          <svg
            width={width}
            height={height}
            className="overflow-visible animate-fade-in"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredPoint(null)}
            id="expense-chart-svg"
          >
            <defs>
              <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b87352" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#b87352" stopOpacity="0.00" />
              </linearGradient>
              <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#b87352" />
                <stop offset="100%" stopColor="#cf8a68" />
              </linearGradient>
            </defs>

            {/* Grid lines (horizontal) */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = paddingY + graphHeight * ratio;
              return (
                <g key={index}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#e6dfd5"
                    strokeWidth="0.8"
                    strokeDasharray="4 4"
                    opacity="0.5"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="#804A30"
                    opacity="0.8"
                    className="font-mono text-[9px] select-none"
                  >
                    {formatIDRCurrency(maxAmount * (1 - ratio))}
                  </text>
                </g>
              );
            })}

            {/* Vertical Guide Line */}
            {hoveredPoint && (
              <line
                x1={hoveredPoint.x}
                y1={paddingY}
                x2={hoveredPoint.x}
                y2={height - paddingY}
                stroke="#b87352"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.6"
                className="transition-all duration-150"
              />
            )}

            {/* Connected Curved Area Shadow */}
            {points.length > 0 && (
              <path d={areaString()} fill="url(#chartGlow)" className="transition-all duration-300" />
            )}

            {/* Grid lines (vertical and labels) */}
            {points.map((p, idx) => (
              <g key={idx}>
                {shouldRenderLabel(idx, points.length) && (
                  <>
                    <line
                      x1={p.x}
                      y1={paddingY}
                      x2={p.x}
                      y2={height - paddingY}
                      stroke="#e6dfd5"
                      strokeWidth="0.5"
                      opacity="0.3"
                    />
                    <text
                      x={p.x}
                      y={height - paddingY + 16}
                      textAnchor="middle"
                      fill="#695D50"
                      className="text-[10px] font-sans font-medium transition-colors select-none"
                    >
                      {getDisplayLabel(p)}
                    </text>
                  </>
                )}
              </g>
            ))}

            {/* Smooth Bezier Line Path */}
            {points.length > 0 && (
              <path
                d={bezierString()}
                fill="none"
                stroke="url(#lineGlow)"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            )}

            {/* Interactive Circle Interaction Points */}
            {points.map((p, idx) => (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="16"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(p)}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoveredPoint?.date === p.date ? "5" : "3.5"}
                  fill={hoveredPoint?.date === p.date ? "#b87352" : "#ffffff"}
                  stroke={hoveredPoint?.date === p.date ? "#ffffff" : "#b87352"}
                  strokeWidth={hoveredPoint?.date === p.date ? "2" : "1.8"}
                  className="transition-all duration-200 pointer-events-none"
                />
              </g>
            ))}
          </svg>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <span className="text-xs text-[#695D50]">Tidak ada data pengeluaran untuk filter terpilih</span>
          </div>
        )}

        {/* Hover Tooltip Overlay card */}
        {hoveredPoint && (
          <div
            className="absolute z-10 glass-panel px-3 py-2 rounded-lg shadow-md border border-[#e6dfd5] flex flex-col space-y-0.5 opacity-95 transition-all text-left"
            style={{
              left: `${Math.min(
                Math.max(hoveredPoint.x - 60, 10),
                width - 130
              )}px`,
              top: `${Math.min(hoveredPoint.y - 50, height - 60)}px`,
            }}
            id="chart-tooltip"
          >
            <span className="text-[9px] font-semibold text-[#804A30] capitalize">
              {hoveredPoint.rawData.tooltipLabel}
            </span>
            <span className="text-[12px] font-mono font-bold text-[#2d1d14] leading-none">
              Rp {hoveredPoint.val.toLocaleString("id-ID")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
