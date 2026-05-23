# ANNEXE E — Exemples de code

Référence des extraits importants à citer dans la thèse.

1) Requête projet (hook) — `project/src/hooks/useProjects.ts`

    // Utiliser le query builder centralisé
    const data = await queryBuilders.projects.list(filters);

2) Server entry (API) — `project/server/index.ts`

    app.get('/api/users', async (_req, res) => { ... })

3) Exports (BI) — `bi/utils/exporters.py`

    # Exemple: CSVExporter.export_projects(df)

4) Audit (JS) — `project/src/lib/audit.ts`

    await createAuditLog({ userId, action, resourceType, newData });

Conseil: citer de courts extraits (10–20 lignes) et pointer vers les fichiers sources dans l'annexe.
