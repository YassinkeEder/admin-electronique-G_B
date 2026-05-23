# ANNEXE G — Exemples de journaux d'audit

Structure JSON typique d'une entrée `audit_logs` :

    {
      "id": "uuid",
      "user_id": "user-uuid",
      "action": "CREATE",
      "resource_type": "projects",
      "record_id": "project-uuid",
      "old_data": null,
      "new_data": { "name": "Projet A", "budget_xof": 5000000 },
      "changes": { "name": { "old": null, "new": "Projet A" } },
      "created_at": "2026-05-20T12:34:56Z"
    }

Exporter les logs (exemple SQL)

    SELECT id, user_id, action, resource_type, record_id, created_at
    FROM audit_logs
    ORDER BY created_at DESC
    LIMIT 100;

Ou via Supabase / API : utiliser `supabase.from('audit_logs').select('*')`.

Conseil: anonymiser les identifiants lors de la publication d'annexes si nécessaire.
