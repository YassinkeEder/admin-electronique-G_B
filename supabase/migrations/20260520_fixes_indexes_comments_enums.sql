-- Migration: 2026-05-20 - Fixes: indexes, comments soft-delete, enums
-- NOTE: This migration contains non-destructive updates (indexes, ALTER TYPE)

-- =========================
-- FIX N°3 — Index manquants
-- =========================
-- Index manquant : recherche de tâches par assigné
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to
  ON tasks(assigned_to);

-- Index manquant : tri chronologique des logs d'audit
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs(created_at DESC);


-- =========================
-- FIX N°6 — Soft delete pour commentaires
-- =========================
-- 1) Ajouter la colonne deleted_at (si elle n'existe pas)
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- 2) Remplacer la policy DELETE (si existante) par une policy UPDATE (soft delete)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Users can delete own comments' AND polrelid = 'comments'::regclass
  ) THEN
    EXECUTE 'DROP POLICY "Users can delete own comments" ON comments';
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- ignore
END$$;

-- Create new policy for soft-delete by owner
CREATE POLICY IF NOT EXISTS "Users can soft delete own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = author_id);

-- 3) Index pour ignorer les commentaires supprimés
CREATE INDEX IF NOT EXISTS idx_comments_active
  ON comments(resource_type, resource_id)
  WHERE deleted_at IS NULL;


-- =========================
-- FIX N°7 — Enums manquants
-- =========================
-- Créer les types si manquants
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'comment_resource_type') THEN
    CREATE TYPE comment_resource_type AS ENUM ('projects', 'tasks', 'documents');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_member_role') THEN
    CREATE TYPE org_member_role AS ENUM ('member', 'manager', 'observer');
  END IF;
END$$;

-- Modifier les colonnes existantes pour utiliser les enums (si les colonnes existent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='resource_type') THEN
    -- Tentative de conversion en utilisant un cast (si les valeurs sont compatibles)
    BEGIN
      ALTER TABLE comments ALTER COLUMN resource_type TYPE comment_resource_type USING resource_type::comment_resource_type;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skipping resource_type -> comment_resource_type conversion: %', SQLERRM;
    END;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_organizations' AND column_name='role') THEN
    BEGIN
      ALTER TABLE user_organizations ALTER COLUMN role TYPE org_member_role USING role::org_member_role;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skipping role -> org_member_role conversion: %', SQLERRM;
    END;
  END IF;
END$$;

-- Fin migration
