# ANNEXE B — Architecture Système

Vue d'ensemble

L'architecture du projet est composée de trois volets principaux :

- Frontend : React + Vite (UI, Routes, composants)
- API : Node.js (Express) + Prisma (ORM) — endpoints REST
- Données : PostgreSQL (Supabase possible) + Prisma migrations
- BI / ML : Streamlit (Python), modèles scikit-learn pour prédictions
- CI/CD & Déploiement : GitHub Actions, Docker, Docker Compose

Flux de données (résumé)

1. L'utilisateur interagit via l'UI (React). Les opérations CRUD appellent l'API.
2. L'API utilise Prisma pour accéder à la base Postgres.
3. Les actions importantes (export, création, modification) sont journalisées dans `audit_logs`.
4. Le module BI lit les données (extraction SQL ou via export) pour calculs et exports.

Fichiers clés

- Frontend : `project/src/` (pages, hooks, components)
- API : `project/server/index.ts`
- ORM / schema : `project/prisma/schema.prisma`
- BI : `bi/` (dashboards, utils, tests)
- Migrations SQL : `supabase/migrations/` et `project/prisma/migrations`

Diagramme (textuel)

    [User Browser] <---> [Frontend (Vite)] <--REST--> [API (Express + Prisma)] <---> [Postgres]
                                                  \--> [Audit logs table]
                                                  \--> [Exports / Filesystem]
                                                  \--> [ML pipeline (offline/ETL)]

Recommandations pour la soutenance

- Préparer un schéma visuel (PNG/SVG) basé sur le diagramme textuel ci‑dessus.
- Mettre en avant la séparation des responsabilités et les garanties (migrations, audits, tests).
