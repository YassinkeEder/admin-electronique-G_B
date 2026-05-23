# ANNEXE C — API : implémentée et planifiée

Endpoints implémentés (exemples)

- `GET /api/health`
  - Response: `{ status: 'ok', timestamp: '...' }`

- `GET /api/users`
  - Description: retourne la liste des profils (id, fullName, email, role, isActive)
  - Exemple:

      curl -s http://localhost:3001/api/users | jq

- `POST /api/users`
  - Crée un profil minimal. Corps: `{ "email": "x@x.x", "fullName": "Nom" }`

Endpoints planifiés (Roadmap)

- `GET /api/projects` (pagination, filtres)
- `POST /api/projects` (create)
- `GET /api/projects/:id` (detail)
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- Endpoints de prédiction:
  - `POST /api/predictions/delay`
  - `POST /api/predictions/budget`
- Endpoints d'export: `POST /api/exports/{csv,excel,pdf}`
- Endpoints audit: `GET /api/audit-logs`

Bonnes pratiques et sécurité

- Valider et sanitiser les entrées côté API (Zod / validators).
- Utiliser des secrets (DATABASE_URL) via CI / variables d'environnement.
- Appliquer RLS / règles côté Supabase si utilisé.

Exemple de requête POST (création de profil)

    curl -X POST http://localhost:3001/api/users \
      -H 'Content-Type: application/json' \
      -d '{"email":"alice@example.org","fullName":"Alice"}'

Référence code
- Server entry: `project/server/index.ts`
- Query builders (prévu): `project/src/lib/queries.ts`
