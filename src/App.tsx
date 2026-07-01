import React, { useState, useEffect } from "react";
import Onboarding from "./components/Onboarding";
import Dashboard from "./pages/Dashboard";
import Auth from "./components/Auth";
import { supabase } from "./lib/supabaseClient";
import { OnboardingState } from "./types";
import { Session } from "@supabase/supabase-js";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        setLoading(false);
      }
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setOnboarding(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch onboarding state when session changes
  useEffect(() => {
    if (!session) return;

    const fetchOnboarding = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("onboarding")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setOnboarding({
            completed: !!data.completed,
            fullName: data.full_name,
            salary: Number(data.salary),
            savingsMindset: data.savings_mindset || "balanced",
            primaryGoal: data.primary_goal || "investing"
          });
        } else {
          // No onboarding row exists yet for this user
          setOnboarding({
            completed: false,
            fullName: "",
            salary: 0,
            savingsMindset: "balanced",
            primaryGoal: "investing"
          });
        }
      } catch (err) {
        console.error("Error fetching onboarding data from Supabase:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOnboarding();
  }, [session]);

  const handleCompleteOnboarding = async (data: OnboardingState) => {
    if (!session) return;
    setOnboarding(data);

    try {
      const { error } = await supabase.from("onboarding").upsert({
        user_id: session.user.id,
        completed: data.completed,
        full_name: data.fullName,
        salary: data.salary,
        savings_mindset: data.savingsMindset,
        primary_goal: data.primaryGoal
      });
      if (error) throw error;
    } catch (err) {
      console.error("Failed to save onboarding to Supabase:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex items-center justify-center font-sans">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-[#b87352] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-[#804A30] uppercase tracking-wider animate-pulse">Menghubungkan ke Server...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render the login/signup screen
  if (!session) {
    return <Auth />;
  }

  // If onboarding is not completed, run onboarding flow
  if (!onboarding || !onboarding.completed) {
    return <Onboarding onComplete={handleCompleteOnboarding} />;
  }

  return <Dashboard onboarding={onboarding} setOnboarding={handleCompleteOnboarding} />;
}
