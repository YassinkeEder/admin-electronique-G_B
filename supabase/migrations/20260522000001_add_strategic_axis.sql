-- Migration: 2026-05-22 - Ajout de l'axe stratégique national pour les projets

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'strategic_axis') THEN
    CREATE TYPE strategic_axis AS ENUM (
      'e_gouvernement',
      'infrastructure_numerique',
      'inclusion_numerique',
      'cybersecurite',
      'data_et_ia',
      'economie_numerique'
    );
  END IF;
END$$;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS strategic_axis strategic_axis NULL;
