export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  tag: string;
  date: string;
  items?: string[];
}

export interface BudgetLimit {
  category: string;
  limit: number;
}

export interface AIInsight {
  title: string;
  desc: string;
  type: "critical" | "warning" | "info" | "achievement";
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export interface OnboardingState {
  completed: boolean;
  fullName: string;
  salary: number;
  savingsMindset: "aggressive" | "balanced" | "minimal";
  primaryGoal: "home" | "debt" | "emergency" | "lifestyle" | "investing";
}
