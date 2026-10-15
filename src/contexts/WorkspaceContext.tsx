import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Workspace, WorkspaceMember, UserRole } from "../types";

interface WorkspaceContextValue {
  workspace: Workspace | null;
  member: WorkspaceMember | null;
  role: UserRole;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  allMembers: WorkspaceMember[];
  refreshWorkspace: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspace: null,
  member: null,
  role: "secretary",
  isAdmin: false,
  loading: true,
  error: null,
  allMembers: [],
  refreshWorkspace: async () => {},
});

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

interface WorkspaceProviderProps {
  userId: string;
  children: React.ReactNode;
}

export function WorkspaceProvider({ userId, children }: WorkspaceProviderProps) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [member, setMember] = useState<WorkspaceMember | null>(null);
  const [allMembers, setAllMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      setError(null);

      // Find the workspace membership for this user
      const { data: memberData, error: memberErr } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (memberErr) throw memberErr;

      if (!memberData) {
        // User has no workspace yet
        setWorkspace(null);
        setMember(null);
        setLoading(false);
        return;
      }

      setMember(memberData as WorkspaceMember);

      // Fetch the workspace
      const { data: wsData, error: wsErr } = await supabase
        .from("workspaces")
        .select("*")
        .eq("id", memberData.workspace_id)
        .single();

      if (wsErr) throw wsErr;
      setWorkspace(wsData as Workspace);

      // Fetch all members of this workspace
      const { data: membersData } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("workspace_id", memberData.workspace_id);

      setAllMembers((membersData || []) as WorkspaceMember[]);
    } catch (err: any) {
      console.error("WorkspaceContext error:", err);
      setError(err.message || "Gagal memuat data workspace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchWorkspace();
    }
  }, [userId]);

  const role: UserRole = member?.role === "admin" ? "admin" : "secretary";

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        member,
        role,
        isAdmin: role === "admin",
        loading,
        error,
        allMembers,
        refreshWorkspace: fetchWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
