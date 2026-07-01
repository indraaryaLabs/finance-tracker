import { Transaction, BudgetLimit } from "../types";

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    description: "Gaji Bulanan - Tech Startup Office",
    amount: 18500000,
    type: "income",
    category: "Income",
    tag: "Earning",
    date: "2026-06-15"
  },
  {
    id: "tx-2",
    description: "Starbucks Coffee - Wisma Atria Cafe",
    amount: 85000,
    type: "expense",
    category: "Food & Beverages",
    tag: "Lifestyle",
    date: "2026-06-17"
  },
  {
    id: "tx-3",
    description: "Tagihan Listrik & WiFi PLN",
    amount: 750000,
    type: "expense",
    category: "Bills & Utilities",
    tag: "Necessity",
    date: "2026-06-16"
  },
  {
    id: "tx-4",
    description: "Gojek Ride - Palmerah to SCBD",
    amount: 45000,
    type: "expense",
    category: "Transportation",
    tag: "Transit",
    date: "2026-06-16"
  },
  {
    id: "tx-5",
    description: "Hoka Hoka Bento - Lunch",
    amount: 68000,
    type: "expense",
    category: "Food & Beverages",
    tag: "Lifestyle",
    date: "2026-06-15"
  },
  {
    id: "tx-6",
    description: "Keanggotaan Netflix Premium UHD",
    amount: 186000,
    type: "expense",
    category: "Entertainment",
    tag: "Leisure",
    date: "2026-06-14"
  },
  {
    id: "tx-7",
    description: "Gym Membership - FitHub One Month",
    amount: 350000,
    type: "expense",
    category: "Healthcare",
    tag: "Wellness",
    date: "2026-06-12"
  },
  {
    id: "tx-8",
    description: "Investasi Reksa Dana Saham Bibit",
    amount: 1500000,
    type: "expense",
    category: "Investments",
    tag: "Growth",
    date: "2026-06-10"
  },
  {
    id: "tx-9",
    description: "Buku Filosofi Teras - Gramedia",
    amount: 98000,
    type: "expense",
    category: "Shopping",
    tag: "Lifestyle",
    date: "2026-06-08"
  },
  {
    id: "tx-10",
    description: "Dividen Saham BBRI",
    amount: 450000,
    type: "income",
    category: "Income",
    tag: "Growth",
    date: "2026-06-05"
  }
];

export const DEFAULT_BUDGETS: BudgetLimit[] = [
  { category: "Food & Beverages", limit: 3000000 },
  { category: "Transportation", limit: 1200000 },
  { category: "Shopping", limit: 2500000 },
  { category: "Bills & Utilities", limit: 1500000 },
  { category: "Entertainment", limit: 1000000 },
  { category: "Healthcare", limit: 800000 },
  { category: "Investments", limit: 5000000 },
  { category: "Others", limit: 1000000 }
];

export const CATEGORY_COLORS: Record<string, string> = {
  "Food & Beverages": "bg-[#F3E1D3] text-[#ab5a37] border-[#E8C8B0]/60 hover:bg-[#ebd1be]",
  "Transportation": "bg-[#EAE1D9] text-[#827266] border-[#DDD0C4]/60 hover:bg-[#e0d3c6]",
  "Shopping": "bg-[#F5EAD4] text-[#cf8a68] border-[#E8DAB8]/60 hover:bg-[#f0e1c0]",
  "Bills & Utilities": "bg-[#EDD2C4] text-[#b55e36] border-[#DFBCA8]/60 hover:bg-[#e6c4b2]",
  "Entertainment": "bg-[#EAE1D9] text-[#8d5246] border-[#DDD0C4]/60 hover:bg-[#e0d3c6]",
  "Healthcare": "bg-[#EFEBE4] text-[#a88567] border-[#DFD9CE]/60 hover:bg-[#e6e0d6]",
  "Investments": "bg-[#EAE1D9] text-[#5c4033] border-[#DDD0C4]/60 hover:bg-[#e0d3c6]",
  "Income": "bg-[#F5EAD4] text-[#ca8141] border-[#E8DAB8]/60 hover:bg-[#f0e1c0]",
  "Others": "bg-[#EFEBE4] text-[#918376] border-[#DFD9CE]/60 hover:bg-[#e6e0d6]"
};

export const CATEGORY_TEXT_COLORS: Record<string, string> = {
  "Food & Beverages": "text-[#ab5a37]",
  "Transportation": "text-[#827266]",
  "Shopping": "text-[#cf8a68]",
  "Bills & Utilities": "text-[#b55e36]",
  "Entertainment": "text-[#8d5246]",
  "Healthcare": "text-[#a88567]",
  "Investments": "text-[#5c4033]",
  "Income": "text-[#ca8141]",
  "Others": "text-[#918376]"
};

export const CATEGORY_ACCENT_COLORS: Record<string, string> = {
  "Food & Beverages": "#ab5a37",
  "Transportation": "#827266",
  "Shopping": "#cf8a68",
  "Bills & Utilities": "#b55e36",
  "Entertainment": "#8d5246",
  "Healthcare": "#a88567",
  "Investments": "#5c4033",
  "Income": "#ca8141",
  "Others": "#918376"
};
