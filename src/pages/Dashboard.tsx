import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wallet,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Trash2,
  Filter,
  CheckCircle,
  TrendingUp,
  Activity,
  LogOut,
  Calendar,
  Tag,
  Scan,
  Inbox,
  AlertCircle,
  Loader2,
  Bot,
  PieChart,
  Sliders,
  Download,
  Printer,
  Edit2,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  RotateCcw
} from "lucide-react";
import { Transaction, BudgetLimit, AIInsight, OnboardingState } from "../types";
import {
  INITIAL_TRANSACTIONS,
  DEFAULT_BUDGETS
} from "../lib/data";
import { categorizeTransaction, analyzeSpending } from "../services/gemini";
import { supabase } from "../lib/supabaseClient";

// Extracted Sub-Components
import ExpenseChart from "../components/ExpenseChart";
import ReceiptScanner from "../components/ReceiptScanner";
import AIChatPanel from "../components/AIChatPanel";

interface DynamicCategory {
  name: string;
  label: string;
  color: string;
  textColor: string;
  accentColor: string;
}

const PRESET_COLORS = [
  { name: "Latte", color: "bg-[#F3E1D3] text-[#ab5a37] border-[#E8C8B0]/60 hover:bg-[#ebd1be]", textColor: "text-[#ab5a37]", accentColor: "#ab5a37" },
  { name: "Taupe", color: "bg-[#EAE1D9] text-[#827266] border-[#DDD0C4]/60 hover:bg-[#e0d3c6]", textColor: "text-[#827266]", accentColor: "#827266" },
  { name: "Sage", color: "bg-[#E2EAD3] text-[#445D25] border-[#CBD8B5]/50 hover:bg-[#d5e0c5]", textColor: "text-[#445D25]", accentColor: "#445D25" },
  { name: "Ochre", color: "bg-[#F5EAD4] text-[#cf8a68] border-[#E8DAB8]/60 hover:bg-[#ebdcb9]", textColor: "text-[#cf8a68]", accentColor: "#cf8a68" },
  { name: "Rose", color: "bg-[#EDD2C4] text-[#b55e36] border-[#DFBCA8]/60 hover:bg-[#e4c0b0]", textColor: "text-[#b55e36]", accentColor: "#b55e36" },
  { name: "Slate", color: "bg-[#EFEBE4] text-[#918376] border-[#DFD9CE]/60 hover:bg-[#e3dcd1]", textColor: "text-[#918376]", accentColor: "#918376" },
  { name: "Clay", color: "bg-[#EAE1D9] text-[#8d5246] border-[#DDD0C4]/60 hover:bg-[#e0d3c6]", textColor: "text-[#8d5246]", accentColor: "#8d5246" },
  { name: "Olive", color: "bg-[#F5EAD4] text-[#ca8141] border-[#E8DAB8]/60 hover:bg-[#ebdcb9]", textColor: "text-[#ca8141]", accentColor: "#ca8141" }
];

interface DashboardProps {
  onboarding: OnboardingState;
  setOnboarding: (val: OnboardingState | ((prev: OnboardingState) => OnboardingState)) => void;
}

export default function Dashboard({ onboarding, setOnboarding }: DashboardProps) {
  // -------------------------------------------------------------
  // STATE DEFINITIONS & LOCAL STORAGE HYDRATION
  // -------------------------------------------------------------
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetLimit[]>([]);
  const [categories, setCategories] = useState<DynamicCategory[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedLedgerMonth, setSelectedLedgerMonth] = useState<string>("2026-06");

  // Month Picker popup states
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(2026);

  useEffect(() => {
    const loadBackendData = async () => {
      try {
        let txData: Transaction[] = [];
        let bData: BudgetLimit[] = [];
        let cData: DynamicCategory[] = [];

        // 1. Fetch Categories
        const { data: catData, error: catError } = await supabase
          .from("categories")
          .select("*");
        if (catError) throw catError;

        if (!catData || catData.length === 0) {
          const defaultCats = [
            { name: "Food & Beverages", label: "Makanan & Minuman", color: "bg-[#F3E1D3] text-[#ab5a37] border-[#E8C8B0]/60 hover:bg-[#ebd1be]", text_color: "text-[#ab5a37]", accent_color: "#ab5a37" },
            { name: "Transportation", label: "Transportasi", color: "bg-[#EAE1D9] text-[#827266] border-[#DDD0C4]/60 hover:bg-[#e0d3c6]", text_color: "text-[#827266]", accent_color: "#827266" },
            { name: "Shopping", label: "Belanja & Ritel", color: "bg-[#F5EAD4] text-[#cf8a68] border-[#E8DAB8]/60 hover:bg-[#f0e1c0]", text_color: "text-[#cf8a68]", accent_color: "#cf8a68" },
            { name: "Bills & Utilities", label: "Tagihan & Utilitas", color: "bg-[#EDD2C4] text-[#b55e36] border-[#DFBCA8]/60 hover:bg-[#e6c4b2]", text_color: "text-[#b55e36]", accent_color: "#b55e36" },
            { name: "Entertainment", label: "Hiburan & Rekreasi", color: "bg-[#EAE1D9] text-[#8d5246] border-[#DDD0C4]/60 hover:bg-[#e0d3c6]", text_color: "text-[#8d5246]", accent_color: "#8d5246" },
            { name: "Healthcare", label: "Kesehatan & Medis", color: "bg-[#EFEBE4] text-[#a88567] border-[#DFD9CE]/60 hover:bg-[#e6e0d6]", text_color: "text-[#a88567]", accent_color: "#a88567" },
            { name: "Investments", label: "Investasi & Tabungan", color: "bg-[#EAE1D9] text-[#5c4033] border-[#DDD0C4]/60 hover:bg-[#e0d3c6]", text_color: "text-[#5c4033]", accent_color: "#5c4033" },
            { name: "Income", label: "Pemasukan", color: "bg-[#F5EAD4] text-[#ca8141] border-[#E8DAB8]/60 hover:bg-[#f0e1c0]", text_color: "text-[#ca8141]", accent_color: "#ca8141" },
            { name: "Others", label: "Lain-lain", color: "bg-[#EFEBE4] text-[#918376] border-[#DFD9CE]/60 hover:bg-[#e6e0d6]", text_color: "text-[#918376]", accent_color: "#918376" }
          ];

          const user = (await supabase.auth.getUser()).data.user;
          if (user) {
            const seedPayload = defaultCats.map((c) => ({
              user_id: user.id,
              name: c.name,
              label: c.label,
              color: c.color,
              text_color: c.text_color,
              accent_color: c.accent_color
            }));
            const { error: seedError } = await supabase.from("categories").insert(seedPayload);
            if (seedError) throw seedError;
            
            cData = defaultCats.map((c) => ({
              name: c.name,
              label: c.label,
              color: c.color,
              textColor: c.text_color,
              accentColor: c.accent_color
            }));
          }
        } else {
          cData = catData.map((c: any) => ({
            name: c.name,
            label: c.label,
            color: c.color,
            textColor: c.text_color,
            accentColor: c.accent_color
          }));
        }

        // 2. Fetch Budgets
        const { data: bgData, error: bgError } = await supabase
          .from("budgets")
          .select("*");
        if (bgError) throw bgError;

        if (!bgData || bgData.length === 0) {
          const defaultBudgets = [
            { category: "Food & Beverages", limit: 3000000 },
            { category: "Transportation", limit: 1200000 },
            { category: "Shopping", limit: 2500000 },
            { category: "Bills & Utilities", limit: 1500000 },
            { category: "Entertainment", limit: 1000000 },
            { category: "Healthcare", limit: 800000 },
            { category: "Investments", limit: 5000000 },
            { category: "Others", limit: 1000000 }
          ];
          const user = (await supabase.auth.getUser()).data.user;
          if (user) {
            const seedPayload = defaultBudgets.map((b) => ({
              user_id: user.id,
              category: b.category,
              limit_amount: b.limit
            }));
            const { error: seedError } = await supabase.from("budgets").insert(seedPayload);
            if (seedError) throw seedError;
            bData = defaultBudgets;
          }
        } else {
          bData = bgData.map((b: any) => ({
            category: b.category,
            limit: Number(b.limit_amount)
          }));
        }

        // 3. Fetch Transactions
        const { data: trData, error: trError } = await supabase
          .from("transactions")
          .select("*")
          .order("date", { ascending: false })
          .order("id", { ascending: false });
        if (trError) throw trError;

        if (!trData || trData.length === 0) {
          const defaultTxs: Transaction[] = [
            { id: "tx-1", description: "Gaji Bulanan - Tech Startup Office", amount: 18500000, type: "income", category: "Income", tag: "Earning", date: "2026-06-15" },
            { id: "tx-2", description: "Starbucks Coffee - Wisma Atria Cafe", amount: 85000, type: "expense", category: "Food & Beverages", tag: "Lifestyle", date: "2026-06-17" },
            { id: "tx-3", description: "Tagihan Listrik & WiFi PLN", amount: 750000, type: "expense", category: "Bills & Utilities", tag: "Necessity", date: "2026-06-16" },
            { id: "tx-4", description: "Gojek Ride - Palmerah to SCBD", amount: 45000, type: "expense", category: "Transportation", tag: "Transit", date: "2026-06-16" },
            { id: "tx-5", description: "Hoka Hoka Bento - Lunch", amount: 68000, type: "expense", category: "Food & Beverages", tag: "Lifestyle", date: "2026-06-15" },
            { id: "tx-6", description: "Keanggotaan Netflix Premium UHD", amount: 186000, type: "expense", category: "Entertainment", tag: "Leisure", date: "2026-06-14" },
            { id: "tx-7", description: "Gym Membership - FitHub One Month", amount: 350000, type: "expense", category: "Healthcare", tag: "Wellness", date: "2026-06-12" },
            { id: "tx-8", description: "Investasi Reksa Dana Saham Bibit", amount: 1500000, type: "expense", category: "Investments", tag: "Growth", date: "2026-06-10" },
            { id: "tx-9", description: "Buku Filosofi Teras - Gramedia", amount: 98000, type: "expense", category: "Shopping", tag: "Lifestyle", date: "2026-06-08" },
            { id: "tx-10", description: "Dividen Saham BBRI", amount: 450000, type: "income", category: "Income", tag: "Growth", date: "2026-06-05" }
          ];
          const user = (await supabase.auth.getUser()).data.user;
          if (user) {
            const seedPayload = defaultTxs.map((t) => ({
              id: t.id,
              user_id: user.id,
              description: t.description,
              amount: t.amount,
              type: t.type,
              category: t.category,
              tag: t.tag,
              date: t.date
            }));
            const { error: seedError } = await supabase.from("transactions").insert(seedPayload);
            if (seedError) throw seedError;
            txData = defaultTxs;
          }
        } else {
          txData = trData.map((t: any) => ({
            id: t.id,
            description: t.description,
            amount: Number(t.amount),
            type: t.type as any,
            category: t.category,
            tag: t.tag,
            date: t.date
          }));
        }

        setTransactions(txData);
        setBudgets(bData);
        setCategories(cData);

        if (txData.length > 0) {
          const dates = txData.map((t) => new Date(t.date).getTime());
          const maxTime = Math.max(...dates);
          const maxDateObj = new Date(maxTime);
          const y = maxDateObj.getFullYear();
          const m = String(maxDateObj.getMonth() + 1).padStart(2, '0');
          setSelectedLedgerMonth(`${y}-${m}`);
          setPickerYear(y);
        }
      } catch (error) {
        console.error("Failed to load backend data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    loadBackendData();
  }, []);

  const getInitialLedgerMonth = (): string => {
    if (transactions.length === 0) return "2026-06";
    const dates = transactions.map((t) => new Date(t.date).getTime());
    const maxTime = Math.max(...dates);
    const maxDateObj = new Date(maxTime);
    const y = maxDateObj.getFullYear();
    const m = String(maxDateObj.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  // Categories modal and form states
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [catFormName, setCatFormName] = useState("");
  const [catFormColorIdx, setCatFormColorIdx] = useState(0);
  const [editingCatName, setEditingCatName] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"overview" | "ledger" | "scanner" | "chat">("overview");

  // Transaction form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [txDescription, setTxDescription] = useState("");
  const [txAmount, setTxAmount] = useState<number | "">("");
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [txCategory, setTxCategory] = useState("Shopping");
  const [txTag, setTxTag] = useState("Lifestyle");
  const [categorizing, setCategorizing] = useState(false);

  // AI advisory report state
  const [aiAnalysis, setAiAnalysis] = useState<{
    summary: string;
    categoryTrends: string;
    insights: AIInsight[];
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Filter & sorting states
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");

  // Trigger Spending Analysis
  const performSpendingAnalysis = async (currentTxList = transactions) => {
    setAnalyzing(true);
    try {
      const data = await analyzeSpending(currentTxList, budgets);
      setAiAnalysis(data);
    } catch (err) {
      console.error("AI Analysis error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Run initial report analyze once dashboard is loaded
  useEffect(() => {
    performSpendingAnalysis();
  }, []);

  // -------------------------------------------------------------
  // AI DEBOUNCED AUTOMATIC CATEGORIZATION FORM SUGGESTION
  // -------------------------------------------------------------
  useEffect(() => {
    if (!txDescription || txDescription.length < 5) return;
    
    const handler = setTimeout(async () => {
      setCategorizing(true);
      try {
        const result = await categorizeTransaction(txDescription, txAmount);
        if (result.category) setTxCategory(result.category);
        if (result.tag) setTxTag(result.tag);
      } catch (err) {
        console.error("Categorizing error:", err);
      } finally {
        setCategorizing(false);
      }
    }, 1200);

    return () => clearTimeout(handler);
  }, [txDescription]);

  // -------------------------------------------------------------
  // UTILITY MATHS & STATS CALCULATORS
  // -------------------------------------------------------------
  const balanceStats = () => {
    const monthlyTxs = transactions.filter((t) => t.date.startsWith(selectedLedgerMonth));

    const income = monthlyTxs
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = monthlyTxs
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Add default salary from onboarding state to simulated income if they have no income transactions this month
    const totalSimulatedIncome = income === 0 && onboarding.salary > 0 
      ? onboarding.salary 
      : income;

    const netBalance = totalSimulatedIncome - expense;
    const savingsRatio = totalSimulatedIncome > 0 
      ? Math.max(0, Math.min(100, Math.round((netBalance / totalSimulatedIncome) * 100)))
      : 0;

    return {
      income: totalSimulatedIncome,
      expense,
      netBalance,
      savingsRatio,
      hasRealIncome: income > 0
    };
  };

  const stats = balanceStats();

  const getBudgetCargo = (category: string) => {
    const limitObj = budgets.find((b) => b.category === category);
    const limit = limitObj ? limitObj.limit : 1000000;
    const spent = transactions
      .filter((t) => t.category === category && t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const percent = Math.min(100, Math.round((spent / limit) * 100));
    return { limit, spent, percent };
  };

  const translateCategory = (cat: string): string => {
    const found = categories.find((c) => c.name.toLowerCase() === cat.toLowerCase());
    return found ? found.label : cat;
  };

  const getCategoryColorClass = (cat: string): string => {
    const found = categories.find((c) => c.name.toLowerCase() === cat.toLowerCase());
    return found ? found.color : "bg-[#EFEBE4] text-[#918376] border-[#DFD9CE]/60 hover:bg-[#e3dcd1]";
  };

  const getCategoryAccentColor = (cat: string): string => {
    const found = categories.find((c) => c.name.toLowerCase() === cat.toLowerCase());
    return found ? found.accentColor : "#918376";
  };

  const formatMonthYearIndonesian = (monthStr: string): string => {
    if (!monthStr || monthStr.length < 7) return "";
    const [year, month] = monthStr.split("-").map(Number);
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${months[month - 1]} ${year}`;
  };

  const handlePrevMonth = () => {
    const [year, month] = selectedLedgerMonth.split("-").map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
    setSelectedLedgerMonth(`${prevYear}-${prevMonth}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedLedgerMonth.split("-").map(Number);
    const nextDate = new Date(year, month, 1);
    const nextYear = nextDate.getFullYear();
    const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
    setSelectedLedgerMonth(`${nextYear}-${nextMonth}`);
  };

  const handleJumpToCurrentMonth = () => {
    setSelectedLedgerMonth(getInitialLedgerMonth());
  };

  const handleSaveCategory = async () => {
    if (!catFormName.trim()) return;

    const preset = PRESET_COLORS[catFormColorIdx];
    let updated: DynamicCategory[];

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    if (editingCatName) {
      updated = categories.map((c) => {
        if (c.name === editingCatName) {
          return {
            ...c,
            label: catFormName.trim(),
            color: preset.color,
            textColor: preset.textColor,
            accentColor: preset.accentColor
          };
        }
        return c;
      });
      setEditingCatName(null);

      await supabase.from("categories").upsert({
        user_id: user.id,
        name: editingCatName,
        label: catFormName.trim(),
        color: preset.color,
        text_color: preset.textColor,
        accent_color: preset.accentColor
      });
    } else {
      const nameKey = catFormName.trim();
      const exists = categories.some((c) => c.name.toLowerCase() === nameKey.toLowerCase());
      if (exists) {
        alert("Kategori dengan nama tersebut sudah ada!");
        return;
      }
      const newCat = {
        name: nameKey,
        label: catFormName.trim(),
        color: preset.color,
        textColor: preset.textColor,
        accentColor: preset.accentColor
      };
      updated = [...categories, newCat];

      await supabase.from("categories").insert({
        user_id: user.id,
        name: nameKey,
        label: catFormName.trim(),
        color: preset.color,
        text_color: preset.textColor,
        accent_color: preset.accentColor
      });
    }

    setCategories(updated);
    setCatFormName("");
    setCatFormColorIdx(0);
  };

  const handleDeleteCategory = async (catName: string) => {
    if (categories.length <= 1) {
      alert("Minimal harus ada 1 kategori tersisa!");
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus kategori "${translateCategory(catName)}"? Transaksi dengan kategori ini akan dialihkan ke kategori lain.`)) {
      const fallbackCat = categories.find((c) => c.name !== catName);
      const fallbackName = fallbackCat ? fallbackCat.name : "Others";

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const updatedTx = transactions.map((t) =>
        t.category === catName ? { ...t, category: fallbackName } : t
      );
      setTransactions(updatedTx);

      const updatedCats = categories.filter((cat) => cat.name !== catName);
      setCategories(updatedCats);

      await supabase.from("transactions")
        .update({ category: fallbackName })
        .eq("category", catName)
        .eq("user_id", user.id);

      await supabase.from("categories")
        .delete()
        .eq("name", catName)
        .eq("user_id", user.id);

      performSpendingAnalysis(updatedTx);
    }
  };

  // -------------------------------------------------------------
  // CONCRETE PORTFOLIO ACTIONS
  // -------------------------------------------------------------
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDescription || !txAmount || Number(txAmount) <= 0) return;

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    let updated: Transaction[];
    if (editingTransaction) {
      const updatedTx = {
        ...editingTransaction,
        description: txDescription,
        amount: Number(txAmount),
        type: txType,
        category: txCategory,
        tag: txTag
      };
      updated = transactions.map((t) =>
        t.id === editingTransaction.id ? updatedTx : t
      );
      setEditingTransaction(null);

      await supabase.from("transactions").update({
        description: txDescription,
        amount: Number(txAmount),
        type: txType,
        category: txCategory,
        tag: txTag
      }).eq("id", updatedTx.id).eq("user_id", user.id);

    } else {
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        description: txDescription,
        amount: Number(txAmount),
        type: txType,
        category: txCategory,
        tag: txTag,
        date: new Date().toISOString().split("T")[0]
      };
      updated = [newTx, ...transactions];

      await supabase.from("transactions").insert({
        id: newTx.id,
        user_id: user.id,
        description: newTx.description,
        amount: newTx.amount,
        type: newTx.type,
        category: newTx.category,
        tag: newTx.tag,
        date: newTx.date
      });
    }

    setTransactions(updated);
    setIsAddOpen(false);

    // Reset Form
    setTxDescription("");
    setTxAmount("");
    setTxType("expense");
    setTxCategory("Shopping");
    setTxTag("Lifestyle");

    // Re-trigger analysis
    performSpendingAnalysis(updated);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTxDescription(tx.description);
    setTxAmount(tx.amount);
    setTxType(tx.type);
    setTxCategory(tx.category);
    setTxTag(tx.tag || "");
    setIsAddOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);

    await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id);

    performSpendingAnalysis(updated);
  };

  const handleScanApply = async (scannedTx: Omit<Transaction, "id">) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const newTx: Transaction = {
      ...scannedTx,
      id: `tx-${Date.now()}`
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);

    await supabase.from("transactions").insert({
      id: newTx.id,
      user_id: user.id,
      description: newTx.description,
      amount: newTx.amount,
      type: newTx.type,
      category: newTx.category,
      tag: newTx.tag,
      date: newTx.date
    });

    performSpendingAnalysis(updated);
    setActiveTab("overview"); // Back to overview with nice highlight
  };

  const handleResetProfile = async () => {
    if (confirm("Reset seluruh data personalisasi AI Anda?")) {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return;

        await Promise.all([
          supabase.from("transactions").delete().eq("user_id", user.id),
          supabase.from("budgets").delete().eq("user_id", user.id),
          supabase.from("categories").delete().eq("user_id", user.id),
          supabase.from("onboarding").delete().eq("user_id", user.id)
        ]);

        window.location.reload();
      } catch (error) {
        console.error("Failed to reset profile in DB:", error);
      }
    }
  };

  // Sorting & Filtering of Transaction rows
  const getProcessedTransactions = () => {
    let list = [...transactions];
    
    // Filter by Month
    list = list.filter((t) => t.date.startsWith(selectedLedgerMonth));

    if (filterCategory !== "All") {
      list = list.filter((t) => t.category === filterCategory);
    }

    if (sortBy === "highest") {
      list.sort((a, b) => b.amount - a.amount);
    } else if (sortBy === "lowest") {
      list.sort((a, b) => a.amount - b.amount);
    } else if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return list;
  };

  const processedList = getProcessedTransactions();

  // Compute running balance chronologically
  const computeRunningBalances = () => {
    const sortedChronological = [...transactions].sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return transactions.indexOf(b) - transactions.indexOf(a);
    });

    const balances: Record<string, number> = {};
    let currentBalance = 0;
    sortedChronological.forEach((tx) => {
      if (tx.type === "income") {
        currentBalance += tx.amount;
      } else {
        currentBalance -= tx.amount;
      }
      balances[tx.id] = currentBalance;
    });
    return balances;
  };

  const runningBalances = computeRunningBalances();

  const handleExportCSV = () => {
    const headers = ["Tanggal", "Keterangan", "Kategori", "Nominal (IDR)"];
    const rows = processedList.map((tx) => [
      tx.date,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.category,
      tx.type === "income" ? tx.amount : -tx.amount
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map((row) => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Buku_Kas_${filterCategory}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper IDR representation
  const rupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val);
  };
  // Calculations for donut chart and budget progress bars
  const totalExpenseAmount = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const categoryData = budgets.map((b) => {
    const spent = transactions
      .filter((t) => t.category === b.category && t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      category: b.category,
      limit: b.limit,
      spent,
      percent: b.limit > 0 ? Math.min(100, Math.round((spent / b.limit) * 100)) : 0
    };
  });

  const nonZeroCategories = categoryData
    .filter((c) => c.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  const radius = 38;
  const strokeWidth = 10;
  const center = 50;
  const circumference = 2 * Math.PI * radius; // ~238.76

  let currentOffset = 0;
  const slices = nonZeroCategories.map((c) => {
    const percentage = totalExpenseAmount > 0 ? (c.spent / totalExpenseAmount) * 100 : 0;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += (percentage / 100) * circumference;
    return {
      ...c,
      percentage,
      strokeDasharray,
      strokeDashoffset
    };
  });

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex items-center justify-center font-sans">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-[#b87352] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-[#804A30] uppercase tracking-wider animate-pulse">Menghubungkan ke Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col antialiased text-[#2d1d14]" id="application-container">
      
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#FAF6F0]/85 backdrop-blur-md border-b border-[#e6dfd5] px-6 py-3.5 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#b87352] text-white shadow-md shadow-[#b87352]/10">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-[#804A30] tracking-wider block">
              Automated Ledger
            </span>
            <h1 className="font-display font-semibold text-sm text-[#2d1d14] flex items-center gap-1">
              AI Finance Tracker
              <span className="text-[10px] bg-[#F3E1D3] border border-[#E8C8B0]/50 text-[#804A30] py-0.5 px-1.5 rounded font-mono font-medium">v1.2</span>
            </h1>
          </div>
        </div>

        {/* Navigation Tabs (Latte layout style) */}
        <nav className="hidden md:flex items-center bg-[#e6dfd5]/45 p-1.5 rounded-xl border border-[#e6dfd5]/30 text-xs font-medium space-x-1 font-sans" id="desktop-navbar">
          {[
            { id: "overview", label: "Dashboard", icon: Layers },
            { id: "ledger", label: "Buku Kas", icon: Activity },
            { id: "scanner", label: "Pindai Vision", icon: Scan },
            { id: "chat", label: "Kala AI Chat", icon: Bot }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                id={`tab-desktop-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg cursor-pointer transition-all ${
                  activeTab === tab.id
                    ? "bg-[#FCFAF7] text-[#b87352] border border-[#e6dfd5]/60 shadow-sm"
                    : "text-[#695D50] hover:text-[#2d1d14]"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* User Badge Profile Controls */}
        <div className="flex items-center gap-3 font-sans">
          <div className="text-right">
            <span className="text-[10px] text-[#804A30] font-medium block capitalize">
              {onboarding.savingsMindset} Mindset
            </span>
            <span className="text-xs font-semibold text-[#2d1d14] block">
              {onboarding.fullName}
            </span>
          </div>
          <button
            type="button"
            id="reset-profile-btn"
            onClick={handleResetProfile}
            title="Reset Data Akun"
            className="p-2.5 rounded-lg border border-[#e6dfd5] bg-[#FCFAF7] hover:border-[#d96a50] hover:text-[#d96a50] cursor-pointer transition-all text-[#695D50]"
          >
            <Trash2 size={14} />
          </button>
          <button
            type="button"
            id="logout-btn"
            onClick={async () => {
              if (window.confirm("Apakah Anda yakin ingin keluar?")) {
                await supabase.auth.signOut();
              }
            }}
            title="Keluar Akun"
            className="p-2.5 rounded-lg border border-[#e6dfd5] bg-[#FCFAF7] hover:border-[#cf8a68] hover:text-[#cf8a68] cursor-pointer transition-all text-[#695D50]"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Main Workspace Frame container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6 pb-24" id="main-frame">
        
        {/* TAB WORKSPACE 1: OVERVIEW DASHBOARD */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
            id="overview-tab-content"
          >
            {/* Visual Stats Block (expensive look) */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans" id="overview-metrics-grid">
              
              {/* Card 1: Balance */}
              <div className="bg-[#FCFAF7] rounded-xl border border-[#e6dfd5]/60 p-5 flex flex-col justify-between hover:border-[#b87352]/40 transition-all coffee-card-shadow" id="metric-balance">
                <div className="flex items-center justify-between text-[#804A30]">
                  <span className="text-xs font-bold tracking-wider uppercase">Kas Bersih Anda</span>
                  <div className="p-1.5 bg-[#FAF6F0] rounded-lg border border-[#e6dfd5]/30">
                    <Wallet size={12} className="text-[#b87352]" />
                  </div>
                </div>
                <div className="mt-3.5 space-y-1">
                  <h3 className="text-xl font-mono font-bold text-[#2d1d14] tracking-tight">
                    {rupiah(stats.netBalance)}
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] font-medium text-[#445D25] font-mono">
                    <TrendingUp size={11} />
                    Ready to distribute safely
                  </div>
                </div>
              </div>

              {/* Card 2: Income */}
              <div className="bg-[#FCFAF7] rounded-xl border border-[#e6dfd5]/60 p-5 flex flex-col justify-between hover:border-[#b87352]/40 transition-all coffee-card-shadow" id="metric-income">
                <div className="flex items-center justify-between text-[#804A30]">
                  <span className="text-xs font-bold tracking-wider uppercase">Pemasukan</span>
                  <div className="p-1.5 bg-[#E2EAD3] rounded-lg border border-[#CBD8B5]/50">
                    <ArrowUpRight size={12} className="text-[#445D25]" />
                  </div>
                </div>
                <div className="mt-3.5 space-y-1">
                  <h3 className="text-xl font-mono font-bold text-[#2d1d14] tracking-tight">
                    {rupiah(stats.income)}
                  </h3>
                  <p className="text-[10px] text-[#695D50]/80">
                    {stats.hasRealIncome ? "Pemasukan riil tercatat bulan ini" : "Menggunakan estimasi rata-rata"}
                  </p>
                </div>
              </div>

              {/* Card 3: Expenses */}
              <div className="bg-[#FCFAF7] rounded-xl border border-[#e6dfd5]/60 p-5 flex flex-col justify-between hover:border-[#b87352]/40 transition-all coffee-card-shadow" id="metric-expense">
                <div className="flex items-center justify-between text-[#804A30]">
                  <span className="text-xs font-bold tracking-wider uppercase">Pengeluaran</span>
                  <div className="p-1.5 bg-[#F3E1D3] rounded-lg border border-[#E8C8B0]/50">
                    <ArrowDownRight size={12} className="text-[#804A30]" />
                  </div>
                </div>
                <div className="mt-3.5 space-y-1">
                  <h3 className="text-xl font-mono font-bold text-[#2d1d14] tracking-tight">
                    {rupiah(stats.expense)}
                  </h3>
                  <p className="text-[10px] text-[#695D50]/80 font-mono">
                    {transactions.filter(t => t.type === 'expense' && t.date.startsWith(selectedLedgerMonth)).length} transaksi bulan ini
                  </p>
                </div>
              </div>

              {/* Card 4: Savings Ratio */}
              <div className="bg-[#FCFAF7] rounded-xl border border-[#e6dfd5]/60 p-5 flex flex-col justify-between hover:border-[#b87352]/40 transition-all coffee-card-shadow" id="metric-savings-ratio">
                <div className="flex items-center justify-between text-[#804A30]">
                  <span className="text-xs font-bold tracking-wider uppercase">Laju Simpanan</span>
                  <div className="p-1.5 bg-[#E6DBDC] rounded-lg border border-[#D6C5C7]/50">
                    <Activity size={12} className="text-[#70484A]" />
                  </div>
                </div>
                <div className="mt-3.5 space-y-1">
                  <div className="flex items-end justify-between mb-1">
                    <h3 className="text-xl font-mono font-bold text-[#2d1d14] tracking-tight">
                      {stats.savingsRatio}%
                    </h3>
                    <span className="text-[10px] text-[#804A30] font-bold font-mono">Target: {onboarding.savingsMindset === 'aggressive' ? '50%' : '30%'}</span>
                  </div>
                  {/* Small progress meter track */}
                  <div className="w-full h-1.5 bg-[#FAF6F0] rounded-full overflow-hidden border border-[#e6dfd5]/30">
                    <div
                      className="bg-gradient-to-r from-[#b87352] to-[#cf8a68] h-full rounded-full transition-all duration-500"
                      style={{ width: `${stats.savingsRatio}%` }}
                    />
                  </div>
                </div>
              </div>

            </section>

            {/* Central Area: Chart on Left, AI Advisory on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="central-overview-panels">
              
              {/* Graphic Chart Left panel */}
              <div className="lg:col-span-7 bg-[#FCFAF7] rounded-2xl border border-[#e6dfd5]/60 p-6 flex flex-col space-y-4 coffee-card-shadow" id="dashboard-trend-graph">
                <ExpenseChart transactions={transactions} />
              </div>

              {/* AI Real-time Spending Advisor Right panel */}
              <div className="lg:col-span-5 flex flex-col" id="dashboard-ai-advisor-panel">
                <div className="bg-[#FCFAF7] rounded-2xl border border-[#e6dfd5]/60 p-6 flex flex-col space-y-4 h-full relative coffee-card-shadow" id="advisor-card">
                  
                  {/* Floating badge glow */}
                  <div className="absolute top-4 right-4 text-[9px] font-bold font-mono text-[#804A30] tracking-widest bg-[#F3E1D3] px-2.5 py-1 rounded-full border border-[#E8C8B0]/60 flex items-center gap-1">
                    <Sparkles size={10} className="animate-pulse" />
                    KALA ADVISORY
                  </div>

                  <div className="space-y-0.5 font-sans">
                    <span className="text-xs font-bold text-[#804A30] uppercase tracking-widest block">
                      Analisis Kecerdasan
                    </span>
                    <h3 className="font-display font-semibold text-lg text-[#2d1d14]">
                      Rangkuman Spending AI
                    </h3>
                  </div>

                  {analyzing ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-12" id="advisor-analyzing-skeleton">
                      <Loader2 className="animate-spin text-[#b87352]" size={24} />
                      <div className="space-y-1 text-center font-sans">
                        <p className="text-xs font-semibold text-[#2d1d14] font-mono">MENGANALISIS DATA KEUANGAN ANDA...</p>
                        <p className="text-[10px] text-[#695D50]/80 max-w-[240px]">Gemini sedang mengalkulasi struktur penghematan terbaik sesuai target kustom Anda.</p>
                      </div>
                    </div>
                  ) : aiAnalysis ? (
                    <div className="flex-1 flex flex-col justify-between space-y-4 font-sans" id="advisor-report-body">
                      {/* Interactive summary report text block */}
                      <div className="text-xs text-[#2d1d14] leading-relaxed space-y-3" id="advisor-summary-p">
                        <p className="bg-[#FAF6F0] p-4 rounded-xl border border-[#e6dfd5] font-sans leading-relaxed">
                          {aiAnalysis.summary}
                        </p>
                        
                        <div className="space-y-2 mt-4" id="reports-insight-rows">
                          <span className="text-[9px] font-mono font-bold text-[#804A30] uppercase tracking-widest block">
                            Rekomendasi Utama:
                          </span>
                          <div className="space-y-2" id="insight-cards-stack">
                            {aiAnalysis.insights.slice(0, 2).map((insight, idx) => {
                              const isCrit = insight.type === "critical";
                              const isWarn = insight.type === "warning";
                              return (
                                <div
                                  key={idx}
                                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                                    isCrit
                                      ? "bg-[#EDD2C4]/50 border-[#DFBCA8] text-[#7A4022]"
                                      : isWarn
                                      ? "bg-[#F5EAD4]/50 border-[#E8DAB8] text-[#835C2B]"
                                      : "bg-[#E2EAD3]/50 border-[#CBD8B5] text-[#445D25]"
                                  }`}
                                >
                                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                  <div className="space-y-0.5">
                                    <div className="font-semibold">{insight.title}</div>
                                    <div className="text-[10px] text-[#2d1d14]/75 leading-normal">{insight.desc}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        id="refresh-advice-btn"
                        onClick={() => performSpendingAnalysis()}
                        className="w-full py-2 border border-[#e6dfd5] hover:border-[#b87352]/30 rounded-lg text-[11px] font-semibold text-[#804A30] bg-[#FCFAF7] cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        <Bot size={13} />
                        Segarkan Insights models
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-10 space-y-2 font-sans" id="advisor-empty-state">
                      <Inbox className="text-[#804A30]/50" size={32} />
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-[#2d1d14]">Analisis Kas Belum Dimulai</p>
                        <p className="text-[10px] text-[#695D50]/80 max-w-[200px]">Silakan muat ulang analisis model AI untuk membaca transaksi terbaru.</p>
                      </div>
                      <button
                        type="button"
                        id="initiate-analysis-btn"
                        onClick={() => performSpendingAnalysis()}
                        className="mt-3 px-3.5 py-1.5 bg-[#b87352] hover:bg-[#cf8a68] text-white font-medium text-xs rounded-lg cursor-pointer"
                      >
                        Mulai Analisis Sekarang
                      </button>
                    </div>
                  )}

                </div>
              </div>

            </div>

            {/* Bottom Row: Budgets Donut & Progress trackers */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-budgets">
              
              {/* Left Card: Alokasi Biaya Bulanan */}
              <div className="lg:col-span-5 bg-[#FCFAF7] rounded-2xl border border-[#e6dfd5]/60 p-6 flex flex-col space-y-5 coffee-card-shadow" id="monthly-expense-allocation">
                <div className="flex items-center gap-2 font-sans">
                  <div className="p-1.5 bg-[#F3E1D3] rounded-lg border border-[#E8C8B0]/50 text-[#804A30]">
                    <PieChart size={15} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-[#804A30] uppercase tracking-widest block">
                      Proporsi Pengeluaran
                    </span>
                    <h3 className="font-display font-semibold text-base text-[#2d1d14]">
                      Alokasi Biaya Bulanan
                    </h3>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
                  {/* Donut graphic */}
                  <div className="flex-shrink-0 relative w-36 h-36 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {slices.length === 0 ? (
                        <circle
                          cx={center}
                          cy={center}
                          r={radius}
                          fill="transparent"
                          stroke="#e6dfd5"
                          strokeWidth={strokeWidth}
                        />
                      ) : (
                        slices.map((slice) => (
                          <circle
                            key={slice.category}
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="transparent"
                            stroke={getCategoryAccentColor(slice.category)}
                            strokeWidth={strokeWidth}
                            strokeDasharray={slice.strokeDasharray}
                            strokeDashoffset={slice.strokeDashoffset}
                            className="transition-all duration-500 ease-out"
                          />
                        ))
                      )}
                    </svg>
                    <div className="absolute flex flex-col items-center text-center font-sans">
                      <span className="text-[8px] font-bold text-[#695D50]/60 uppercase tracking-wider">TOTAL</span>
                      <span className="text-xs font-mono font-bold text-[#2d1d14] max-w-[90px] truncate">
                        {rupiah(totalExpenseAmount)}
                      </span>
                      <span className="text-[9px] text-[#804A30] font-medium font-mono">100%</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex-1 w-full space-y-3 font-sans">
                    {slices.length === 0 ? (
                      <p className="text-xs text-[#695D50]/70 italic text-center py-8">Belum ada pengeluaran</p>
                    ) : (
                      slices.map((slice) => (
                        <div key={slice.category} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getCategoryAccentColor(slice.category) }}
                            />
                            <div className="flex flex-col">
                              <span className="font-bold text-[#2d1d14] text-[11px] leading-tight">
                                {translateCategory(slice.category)}
                              </span>
                              <span className="text-[9px] text-[#695D50]/80 font-mono leading-none">
                                {rupiah(slice.spent)}
                              </span>
                            </div>
                          </div>
                          <span className="font-semibold font-mono text-[#2d1d14] text-[11px]">
                            {Math.round(slice.percentage)}%
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Card: Penggunaan Anggaran Kategori */}
              <div className="lg:col-span-7 bg-[#FCFAF7] rounded-2xl border border-[#e6dfd5]/60 p-6 flex flex-col space-y-5 coffee-card-shadow" id="category-budget-usage">
                <div className="flex items-center gap-2 font-sans">
                  <div className="p-1.5 bg-[#EAE1D9] rounded-lg border border-[#DDD0C4]/50 text-[#5C4D43]">
                    <Sliders size={15} />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-[#804A30] uppercase tracking-widest block">
                      Monitor Alokasi
                    </span>
                    <h3 className="font-display font-semibold text-base text-[#2d1d14]">
                      Penggunaan Anggaran Kategori
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-2 font-sans">
                  {categoryData.map((c) => {
                    return (
                      <div key={c.category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs leading-none">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getCategoryAccentColor(c.category) }}
                            />
                            <span className="font-bold text-[#2d1d14] text-[11px] truncate max-w-[120px]">
                              {translateCategory(c.category)}
                            </span>
                          </div>
                          <div className="text-[9px] text-[#695D50] font-mono whitespace-nowrap">
                            <span className="font-bold text-[#2d1d14]">{rupiah(c.spent)}</span>
                            <span> / {rupiah(c.limit)}</span>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full h-2.5 bg-[#e6dfd5]/35 rounded-full overflow-hidden border border-[#e6dfd5]/15">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${c.percent}%`,
                              backgroundColor: getCategoryAccentColor(c.category)
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </motion.div>
        )}

        {/* TAB WORKSPACE 2: TRANSACTIONS LEDGER MANAGE LIST */}
        {activeTab === "ledger" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
            id="ledger-tab-content"
          >
            {/* Header with trigger button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6dfd5]/60 pb-4" id="ledger-header-panel">
              <div className="space-y-0.5 font-sans">
                <span className="text-xs font-bold text-[#804A30] uppercase tracking-widest block">
                  Riwayat Manual & Transaksi
                </span>
                <h2 className="font-display font-semibold text-xl text-[#2d1d14]">
                  Buku Kas Ledger Utama
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2" id="ledger-actions-panel">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 border border-[#e6dfd5] bg-[#FCFAF7] hover:border-[#b87352]/30 rounded-lg text-xs font-semibold text-[#804A30] cursor-pointer transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
                >
                  <Download size={13} />
                  Ekspor CSV
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-2 border border-[#e6dfd5] bg-[#FCFAF7] hover:border-[#b87352]/30 rounded-lg text-xs font-semibold text-[#804A30] cursor-pointer transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
                >
                  <Printer size={13} />
                  Cetak Pembukuan
                </button>
                <button
                  type="button"
                  id="open-manage-categories-btn"
                  onClick={() => setIsManageCategoriesOpen(true)}
                  className="px-3.5 py-2 border border-[#e6dfd5] bg-[#FCFAF7] hover:border-[#b87352]/30 rounded-lg text-xs font-semibold text-[#804A30] cursor-pointer transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
                >
                  <Sliders size={13} />
                  Kelola Kategori
                </button>
                <button
                  type="button"
                  id="open-add-transaction-btn"
                  onClick={() => {
                    setEditingTransaction(null);
                    setTxDescription("");
                    setTxAmount("");
                    setTxType("expense");
                    setTxCategory("Shopping");
                    setTxTag("Lifestyle");
                    setIsAddOpen(true);
                  }}
                  className="px-4 py-2 bg-[#b87352] hover:bg-[#cf8a68] text-white font-medium text-xs tracking-tight rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#b87352]/10 justify-center transition-all font-sans"
                >
                  <Plus size={14} />
                  Tambah Transaksi Baru
                </button>
              </div>
            </div>

            {/* Navigasi Bulan Pembukuan */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FCFAF7]/90 backdrop-blur-md p-4 rounded-2xl border border-[#e6dfd5]/60 coffee-card-shadow font-sans" id="ledger-month-nav">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[10px] font-bold text-[#804A30] uppercase tracking-widest opacity-80">
                  Periode Aktif
                </span>
                
                {/* Wrapped in a relative container for exact alignment */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setPickerYear(Number(selectedLedgerMonth.split("-")[0]));
                      setIsMonthPickerOpen(!isMonthPickerOpen);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#FAF6F0] hover:bg-[#FAF6F0]/80 text-[#2d1d14] font-semibold text-xs transition border border-[#e6dfd5]/40 hover:border-[#b87352]/30 active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Calendar size={13} className="text-[#b87352]" />
                    <span className="font-mono text-[#2d1d14]">{formatMonthYearIndonesian(selectedLedgerMonth)}</span>
                    <ChevronDown size={13} className={`text-[#804A30] transition-transform duration-250 ${isMonthPickerOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* FLOATING MINI CALENDAR PICKER */}
                  {isMonthPickerOpen && (
                    <>
                      {/* Backdrop Click-away Mask */}
                      <div className="fixed inset-0 z-20" onClick={() => setIsMonthPickerOpen(false)} />
                      
                      {/* Floating Picker Card */}
                      <div className="absolute top-full left-0 mt-2 z-30 bg-[#FCFAF7]/95 backdrop-blur-md border border-[#e6dfd5] rounded-2xl p-4 w-[280px] shadow-2xl font-sans animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Year Selector */}
                        <div className="flex items-center justify-between border-b border-[#e6dfd5]/40 pb-2 mb-3">
                          <button
                            type="button"
                            onClick={() => setPickerYear(pickerYear - 1)}
                            className="p-1 rounded-lg hover:bg-[#FAF6F0] text-[#804A30] text-[10px] transition cursor-pointer font-bold"
                          >
                            ◀
                          </button>
                          <span className="font-mono text-xs font-bold text-[#2d1d14]">
                            Tahun {pickerYear}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPickerYear(pickerYear + 1)}
                            className="p-1 rounded-lg hover:bg-[#FAF6F0] text-[#804A30] text-[10px] transition cursor-pointer font-bold"
                          >
                            ▶
                          </button>
                        </div>

                        {/* Months Grid */}
                        <div className="grid grid-cols-3 gap-2">
                          {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"].map((mName, idx) => {
                            const mStr = String(idx + 1).padStart(2, '0');
                            const checkMonthStr = `${pickerYear}-${mStr}`;
                            const isSelected = selectedLedgerMonth === checkMonthStr;

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setSelectedLedgerMonth(checkMonthStr);
                                  setIsMonthPickerOpen(false);
                                }}
                                className={`py-2 text-[11px] font-bold rounded-xl cursor-pointer transition-all ${
                                  isSelected
                                    ? "bg-[#b87352] text-white shadow-md shadow-[#b87352]/20 scale-105"
                                    : "text-[#695D50] hover:bg-[#FAF6F0] border border-transparent hover:border-[#e6dfd5]/40"
                                }`}
                              >
                                {mName}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleJumpToCurrentMonth}
                  className="p-2 border border-[#e6dfd5] bg-[#FAF6F0] hover:bg-[#b87352] hover:text-white rounded-2xl text-[#804A30] cursor-pointer transition-all shadow-sm hover:shadow active:scale-95 flex items-center justify-center"
                  title="Kembali ke Periode Terbaru"
                >
                  <RotateCcw size={13} />
                </button>
              </div>

              <div className="text-[10px] font-mono text-[#695D50]/80 bg-[#FAF6F0] px-3 py-1.5 rounded-xl border border-[#e6dfd5]/25 self-end sm:self-auto">
                <span className="font-bold text-[#b87352]">{processedList.length}</span> Transaksi Terfilter
              </div>
            </div>

            {/* Controls Filter bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FCFAF7] p-3.5 rounded-xl border border-[#e6dfd5]/60 coffee-card-shadow font-sans" id="ledger-control-bar">
              <div className="flex flex-wrap items-center gap-2" id="filter-block">
                <span className="text-[11px] font-bold text-[#804A30] uppercase tracking-wider flex items-center gap-1 mr-1">
                  <Filter size={11} />
                  Saring:
                </span>
                {["All", ...categories.map((c) => c.name)].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    id={`filter-${cat}`}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 py-1 text-[10px] font-medium rounded-md cursor-pointer transition-all ${
                      filterCategory === cat
                        ? "bg-[#F3E1D3] text-[#804A30] font-bold border border-[#E8C8B0]/60 shadow-sm"
                        : "text-[#695D50] hover:bg-[#FAF6F0] border border-transparent"
                    }`}
                  >
                    {cat === "All" ? "Semua" : translateCategory(cat)}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto font-sans" id="sort-block">
                <label htmlFor="ledger-sorting" className="text-[10px] font-bold text-[#804A30] uppercase tracking-widest">
                  Urutkan:
                </label>
                <select
                  id="ledger-sorting"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#FAF6F0] border border-[#e6dfd5] text-xs font-semibold rounded-lg px-2.5 py-1 text-[#2d1d14] focus:outline-none focus:border-[#b87352] cursor-pointer"
                >
                  <option value="newest">Terbaru</option>
                  <option value="highest">Nominal Terbesar</option>
                  <option value="lowest">Nominal Terkecil</option>
                </select>
              </div>
            </div>

            {/* Ledger Rows List Container */}
            <div className="bg-[#FCFAF7] rounded-xl border border-[#e6dfd5]/60 overflow-hidden coffee-card-shadow font-sans" id="ledger-list-container">
              {processedList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-[#e6dfd5] font-sans">
                    <thead>
                      <tr className="bg-[#FAF6F0] border-b border-[#e6dfd5] text-[10px] font-bold text-[#804A30] uppercase tracking-wider font-mono">
                        <th className="px-4 py-3 border-r border-[#e6dfd5] whitespace-nowrap">Tanggal</th>
                        <th className="px-4 py-3 border-r border-[#e6dfd5]">Keterangan</th>
                        <th className="px-4 py-3 border-r border-[#e6dfd5]">Kategori</th>
                        <th className="px-4 py-3 border-r border-[#e6dfd5] text-right">Nominal</th>
                        <th className="px-4 py-3 text-center action-col">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e6dfd5] text-xs">
                      {processedList.map((tx) => {
                        const isIncome = tx.type === "income";
                        return (
                          <tr
                            key={tx.id}
                            className="hover:bg-[#FAF6F0]/40 transition-colors odd:bg-[#FCFAF7] even:bg-[#FAF6F0]/25"
                            id={`row-tx-${tx.id}`}
                          >
                            <td className="px-4 py-3.5 border-r border-[#e6dfd5] font-mono text-[11px] whitespace-nowrap text-[#695D50]">
                              {tx.date}
                            </td>
                            <td className="px-4 py-3.5 border-r border-[#e6dfd5] font-semibold text-[#2d1d14]">
                              {tx.description}
                            </td>
                            <td className="px-4 py-3.5 border-r border-[#e6dfd5] whitespace-nowrap">
                              <span className={`inline-block text-[9px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                                getCategoryColorClass(tx.category)
                              }`}>
                                {translateCategory(tx.category)}
                              </span>
                            </td>
                            <td className={`px-4 py-3.5 border-r border-[#e6dfd5] text-right font-mono font-bold ${
                              isIncome ? "text-[#445D25]" : "text-[#70484A]"
                            }`}>
                              {isIncome ? "+" : "-"} {rupiah(tx.amount)}
                            </td>
                            <td className="px-4 py-3.5 text-center action-col">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  id={`edit-tx-${tx.id}`}
                                  onClick={() => handleOpenEdit(tx)}
                                  className="p-1 px-1.5 text-[#804A30] hover:text-[#b87352] hover:bg-[#FAF6F0] rounded transition-all cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  type="button"
                                  id={`delete-tx-${tx.id}`}
                                  onClick={() => handleDeleteTransaction(tx.id)}
                                  className="p-1 px-1.5 text-[#cf8a68] hover:text-[#d96a50] hover:bg-[#FAF6F0] rounded transition-all cursor-pointer"
                                  title="Hapus"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-20 flex flex-col items-center justify-center text-center space-y-2" id="ledger-empty-view">
                  <Inbox className="text-[#804A30]/50" size={36} />
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-[#2d1d14]">Tidak Ada Transaksi Ditemukan</p>
                    <p className="text-[10px] text-[#695D50]/80">Silakan tambahkan transaksi baru atau ganti konfigurasi saringan kategori.</p>
                  </div>
                </div>
              )}
            </div>

          </motion.div>
        )}

        {/* TAB WORKSPACE 3: REAL-TIME SCANNER VISION */}
        {activeTab === "scanner" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#FCFAF7] rounded-2xl border border-[#e6dfd5]/60 p-6 coffee-card-shadow"
            id="scanner-tab-content"
          >
            <ReceiptScanner onScanComplete={handleScanApply} />
          </motion.div>
        )}

        {/* TAB WORKSPACE 4: CHAT ADVISOR DIALOG */}
        {activeTab === "chat" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
            id="chat-tab-content"
          >
            <AIChatPanel transactions={transactions} />
          </motion.div>
        )}

      </main>

      {/* 2. Responsive Bottom Navigation Bar for fingertips on mobile */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FCFAF7]/90 backdrop-blur-md border-t border-[#e6dfd5] p-2.5 flex items-center justify-around select-none">
        {[
          { id: "overview", label: "Dashboard", icon: Layers },
          { id: "ledger", label: "Ledger", icon: Activity },
          { id: "scanner", label: "Scanner", icon: Scan },
          { id: "chat", label: "Kala AI", icon: Bot }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              id={`tab-mobile-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                activeTab === tab.id ? "text-[#b87352]" : "text-[#695D50]/60"
              }`}
            >
              <Icon size={16} />
              <span className="text-[9px] font-sans font-semibold tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </footer>

      {/* 3. ADD TRANSACTION POPUP DIALOG (OVERLAY MASK SCREEN) */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2d1d14]/40 backdrop-blur-sm" id="overlay-transaction-add">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FCFAF7] rounded-2xl border border-[#e6dfd5] max-w-md w-full p-6 shadow-2xl relative"
              id="add-transaction-modal"
            >
              <div className="flex items-center justify-between border-b border-[#e6dfd5]/30 pb-3 mb-5 font-sans" id="modal-header">
                <div className="flex items-center gap-1.5 text-[#b87352]">
                  <Sparkles size={16} />
                  <h3 className="font-display font-semibold text-sm text-[#2d1d14]">
                    {editingTransaction ? "Edit Transaksi" : "Buku Transaksi AI"}
                  </h3>
                </div>
                <button
                  type="button"
                  id="close-add-modal-btn"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingTransaction(null);
                    setTxDescription("");
                    setTxAmount("");
                    setTxType("expense");
                    setTxCategory("Shopping");
                    setTxTag("Lifestyle");
                  }}
                  className="p-1 px-1.5 rounded text-[#695D50] hover:bg-[#FAF6F0] hover:text-[#2d1d14] transition"
                >
                  ✕
                </button>
              </div>

              {/* Form Input fields */}
              <form onSubmit={handleAddTransaction} className="space-y-4 font-sans" id="modal-form">
                
                {/* Description and real-time categorization flag */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="tx-desc" className="text-[10px] font-bold text-[#804A30] uppercase tracking-widest block">
                      Deskripsi Belanja / Gaji
                    </label>
                    {categorizing && (
                      <span className="text-[9px] text-[#b87352] font-mono font-medium animate-pulse flex items-center gap-1">
                        <Loader2 size={8} className="animate-spin" />
                        AI Membaca Kategori...
                      </span>
                    )}
                  </div>
                  <input
                    id="tx-desc"
                    type="text"
                    required
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    placeholder="Contoh: Belanja Bulanan Superindo"
                    className="w-full px-3 py-2 border border-[#e6dfd5] rounded-lg text-xs font-medium focus:border-[#b87352] focus:ring-1 focus:ring-[#b87352] outline-none bg-white text-[#2d1d14]"
                    autoFocus
                  />
                </div>

                {/* Amount input */}
                <div className="space-y-1">
                  <label htmlFor="tx-amount" className="text-[10px] font-bold text-[#804A30] uppercase tracking-widest block">
                    Jumlah Nominal (Rupiah)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#804A30]">Rp</span>
                    <input
                      id="tx-amount"
                      type="number"
                      required
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value ? Number(e.target.value) : "")}
                      placeholder="Contoh: 450000"
                      className="w-full pl-9 pr-3 py-2 border border-[#e6dfd5] rounded-lg text-xs font-mono focus:border-[#b87352] focus:ring-1 focus:ring-[#b87352] outline-none bg-white text-[#2d1d14] placeholder:font-sans"
                    />
                  </div>
                </div>

                {/* Selection block: Type */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#804A30] uppercase tracking-widest block">
                    Jenis Kas
                  </span>
                  <div className="grid grid-cols-2 gap-2" id="tx-type-choices">
                    <button
                      type="button"
                      id="tx-type-expense-btn"
                      onClick={() => setTxType("expense")}
                      className={`py-2 text-xs font-semibold rounded-lg cursor-pointer border transition-colors ${
                        txType === "expense"
                          ? "bg-[#2d1d14] border-[#2d1d14] text-white"
                          : "border-[#e6dfd5] bg-[#FAF6F0] text-[#695D50] hover:bg-[#FAF6F0]/80"
                      }`}
                    >
                      Pengeluaran (-)
                    </button>
                    <button
                      type="button"
                      id="tx-type-income-btn"
                      onClick={() => setTxType("income")}
                      className={`py-2 text-xs font-semibold rounded-lg cursor-pointer border transition-colors ${
                        txType === "income"
                          ? "bg-[#b87352] border-[#b87352] text-white"
                          : "border-[#e6dfd5] bg-[#FAF6F0] text-[#695D50] hover:bg-[#FAF6F0]/80"
                      }`}
                    >
                      Pemasukan (+)
                    </button>
                  </div>
                </div>

                {/* Suggested / Manual selected Category block */}
                <div className="space-y-1" id="tx-category-input-container">
                  <label htmlFor="tx-category" className="text-[10px] font-bold text-[#804A30] uppercase tracking-widest block">
                    Kategori Anggaran
                  </label>
                  <select
                    id="tx-category"
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full px-2.5 py-2 bg-[#FAF6F0] border border-[#e6dfd5] text-xs rounded-lg text-[#2d1d14] font-semibold focus:outline-none cursor-pointer focus:border-[#b87352]"
                  >
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  id="submit-transaction-btn"
                  className="w-full py-2.5 bg-[#b87352] hover:bg-[#cf8a68] text-white font-medium text-xs tracking-tight rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all shadow-md shadow-[#b87352]/10 text-center mt-5"
                >
                  <CheckCircle size={13} />
                  {editingTransaction ? "Simpan Perubahan" : "Rekam Aliran Kas"}
                </button>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CATEGORY MANAGEMENT MODAL */}
      <AnimatePresence>
        {isManageCategoriesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2d1d14]/40 backdrop-blur-sm" id="overlay-categories-manage">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FCFAF7] rounded-2xl border border-[#e6dfd5] max-w-md w-full p-6 shadow-2xl relative"
              id="manage-categories-modal"
            >
              <div className="flex items-center justify-between border-b border-[#e6dfd5]/30 pb-3 mb-4 font-sans" id="cat-modal-header">
                <div className="flex items-center gap-1.5 text-[#b87352]">
                  <Sliders size={16} />
                  <h3 className="font-display font-semibold text-sm text-[#2d1d14]">
                    Kelola Kategori Kas
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsManageCategoriesOpen(false);
                    setCatFormName("");
                    setCatFormColorIdx(0);
                    setEditingCatName(null);
                  }}
                  className="p-1 px-1.5 rounded text-[#695D50] hover:bg-[#FAF6F0] hover:text-[#2d1d14] transition"
                >
                  ✕
                </button>
              </div>

              {/* List of existing categories */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto mb-4 p-1 border-b border-[#e6dfd5]/30 font-sans" id="cat-list-box">
                <span className="text-[10px] font-bold text-[#804A30] uppercase tracking-widest block">
                  Daftar Kategori Aktif
                </span>
                {categories.map((c) => {
                  return (
                    <div key={c.name} className="flex items-center justify-between p-2 rounded-lg bg-[#FAF6F0]/40 border border-[#e6dfd5]/30 text-xs">
                      <span className={`inline-block text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${c.color}`}>
                        {c.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCatName(c.name);
                            setCatFormName(c.label);
                            const matchedIdx = PRESET_COLORS.findIndex((p) => p.accentColor === c.accentColor);
                            setCatFormColorIdx(matchedIdx !== -1 ? matchedIdx : 0);
                          }}
                          className="px-2 py-1 text-[10px] font-semibold text-[#804A30] hover:bg-[#FAF6F0] rounded border border-transparent hover:border-[#e6dfd5] cursor-pointer"
                        >
                          Ubah
                        </button>
                        {categories.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(c.name)}
                            className="px-2 py-1 text-[10px] font-semibold text-[#cf8a68] hover:bg-[#FAF6F0] rounded hover:text-[#d96a50] cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Form to add/edit category */}
              <div className="space-y-3 p-3 bg-[#FAF6F0]/40 rounded-xl border border-[#e6dfd5]/50 font-sans" id="cat-form-box">
                <span className="text-[10px] font-bold text-[#804A30] uppercase tracking-widest block">
                  {editingCatName ? "Ubah Kategori" : "Tambah Kategori Baru"}
                </span>

                <div className="space-y-1">
                  <label htmlFor="cat-name-input" className="text-[9px] font-bold text-[#804A30] uppercase tracking-wider block">
                    Nama Kategori (Indonesian)
                  </label>
                  <input
                    id="cat-name-input"
                    type="text"
                    required
                    value={catFormName}
                    onChange={(e) => setCatFormName(e.target.value)}
                    placeholder="Contoh: Pendidikan, Listrik"
                    className="w-full px-3 py-1.5 border border-[#e6dfd5] rounded-lg text-xs font-medium focus:border-[#b87352] outline-none bg-white text-[#2d1d14]"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[#804A30] uppercase tracking-wider block">
                    Pilihan Warna Preset
                  </span>
                  <div className="grid grid-cols-4 gap-1.5" id="cat-colors-presets">
                    {PRESET_COLORS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCatFormColorIdx(idx)}
                        className={`p-1.5 text-[9px] font-bold font-mono uppercase tracking-wider rounded border text-center transition-all ${p.color} ${
                          catFormColorIdx === idx ? "ring-2 ring-[#b87352] border-[#b87352]" : "border-transparent cursor-pointer"
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveCategory}
                    className="flex-1 py-1.5 bg-[#b87352] hover:bg-[#cf8a68] text-white font-semibold text-xs rounded-lg text-center transition cursor-pointer"
                  >
                    {editingCatName ? "Simpan Perubahan" : "Simpan Kategori"}
                  </button>
                  {editingCatName && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCatName(null);
                        setCatFormName("");
                        setCatFormColorIdx(0);
                      }}
                      className="px-3 py-1.5 bg-[#FAF6F0] hover:bg-[#FAF6F0]/80 text-[#695D50] border border-[#e6dfd5] font-semibold text-xs rounded-lg text-center transition cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
