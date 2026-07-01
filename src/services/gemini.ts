import { Transaction, BudgetLimit, ChatMessage } from "../types";

export async function categorizeTransaction(description: string, amount: number | "") {
  const response = await fetch("/api/gemini/categorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, amount })
  });
  if (!response.ok) throw new Error("Failed to categorize transaction");
  return response.json();
}

export async function analyzeSpending(transactions: Transaction[], budgetLimits: BudgetLimit[]) {
  const response = await fetch("/api/gemini/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactions, budgetLimits })
  });
  if (!response.ok) throw new Error("Failed to analyze spending pattern");
  return response.json();
}

export async function chatWithKala(message: string, transactions: Transaction[], history: ChatMessage[]) {
  const response = await fetch("/api/gemini/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, transactions, history })
  });
  if (!response.ok) throw new Error("Chat API failed");
  return response.json();
}

export async function scanReceipt(imageBase64: string, mimeType: string) {
  const response = await fetch("/api/gemini/scan-receipt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mimeType })
  });
  if (!response.ok) throw new Error("Failed to scan receipt via Gemini");
  return response.json();
}
