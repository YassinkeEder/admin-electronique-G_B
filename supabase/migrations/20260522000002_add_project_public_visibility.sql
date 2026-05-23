-- Migration: 2026-05-22 - Ajout de la visibilité publique aux projets

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_projects_is_public ON projects(is_public);
