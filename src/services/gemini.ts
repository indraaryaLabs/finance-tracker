import type { ChatMessage } from "../types";

export async function categorizeTransaction(description: string, amount: number | "") {
  const response = await fetch("/api/gemini/categorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, amount })
  });
  if (!response.ok) throw new Error("Failed to categorize transaction");
  return response.json();
}

export async function analyzeSpending(data: { totalIncome: number; totalExpense: number; categories: Record<string, number> }) {
  const response = await fetch("/api/gemini/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("Failed to analyze spending pattern");
  return response.json();
}

export async function chatWithAssistant(message: string, context: string, history: ChatMessage[]) {
  const response = await fetch("/api/gemini/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, context, history })
  });
  if (!response.ok) throw new Error("Chat API failed");
  return response.json();
}
