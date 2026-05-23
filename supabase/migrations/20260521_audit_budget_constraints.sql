-- Migration: 2026-05-21 - Fix N°1 (audit_logs protection) & Fix N°2 (budget constraints)
-- Adds CHECK constraints on projects and prevents DELETE on audit_logs via trigger

-- =========================
-- FIX N°2 — Budget constraints (non-destructive)
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_budget_non_negative') THEN
    ALTER TABLE projects ADD CONSTRAINT chk_budget_non_negative CHECK (budget_xof >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_spent_non_negative') THEN
    ALTER TABLE projects ADD CONSTRAINT chk_spent_non_negative CHECK (spent_xof >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_spent_le_budget') THEN
    ALTER TABLE projects ADD CONSTRAINT chk_spent_le_budget CHECK (spent_xof <= budget_xof);
  END IF;
END$$;


-- =========================
-- FIX N°1 — Audit logs immutables (safe guard)
-- =========================
-- Create a trigger function that prevents DELETE on audit_logs to preserve audit trail.
-- Administrators can later DROP this trigger if an approved process to archive logs is added.

CREATE OR REPLACE FUNCTION prevent_audit_logs_delete()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Deletion of audit_logs is forbidden to preserve audit trail';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_prevent_audit_logs_delete'
  ) THEN
    CREATE TRIGGER tr_prevent_audit_logs_delete
      BEFORE DELETE ON audit_logs
      FOR EACH ROW
      EXECUTE FUNCTION prevent_audit_logs_delete();
  END IF;
END$$;

-- End migration
