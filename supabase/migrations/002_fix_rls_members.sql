-- ============================================================
-- FIX: Perbaikan RLS untuk workspace members
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================================

-- Drop policy lama yang bermasalah
DROP POLICY IF EXISTS "members_insert" ON workspace_members;
DROP POLICY IF EXISTS "members_select" ON workspace_members;

-- Fix: Allow workspace OWNER to insert members (untuk first-time setup)
-- DAN allow existing admin to insert members (untuk undang anggota)
CREATE POLICY "members_insert" ON workspace_members FOR INSERT
  WITH CHECK (
    -- Pemilik workspace bisa menambahkan member (termasuk dirinya sendiri)
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = workspace_members.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
    OR
    -- Admin yang sudah terdaftar bisa menambahkan member baru
    is_workspace_admin(workspace_id)
  );

-- Fix: Allow user to see their own membership + co-members
CREATE POLICY "members_select" ON workspace_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_workspace_member(workspace_id)
  );
