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
END $$;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS strategic_axis strategic_axis NOT NULL DEFAULT 'e_gouvernement';

CREATE INDEX IF NOT EXISTS projects_strategic_axis_idx ON projects(strategic_axis);
