# 🇬🇼 E-GovProjetGB — Plateforme de Gouvernance Électronique

Système intégré de gestion et de pilotage des **projets numériques publics de la République de Guinée-Bissau**, avec module BI avancé et reporting automatisé.

## 📋 Vue d'ensemble

**E-GovProjetGB** est une plateforme full-stack (React + Supabase + Python) conçue pour :

- ✅ **Pilotage centralisé** de tous les projets publics par secteur et région
- 📊 **Tableau de bord temps réel** avec KPI et alertes automatiques
- 📋 **Gestion des tâches et jalons** avec assignation et suivi de budget
- 📈 **Module BI avancé** : prédictions ML, analyse d'écarts, rapports exportables
- 🔐 **Gouvernance distribuée** avec rôles fine-grained (admin, chef_projet, decideur, public)
- 🌍 **Couverture nationale** : 9 régions + 9 secteurs (santé, éducation, infrastructure, etc.)

**Contexte métier** : Permettre aux décideurs guinéens de suivre l'exécution budgétaire, l'avancement et la qualité des programmes publics avec transparence et efficacité.

---

## 🚀 Démarrage rapide

### Prérequis

- **Node.js** 20+ (LTS recommandé)
- **Python** 3.10+ (pour le module BI)
- **Compte Supabase** gratuit (https://supabase.com)
- **Git** pour le versioning

### Installation locale (5 min)

#### 1. Cloner le repo et installer les dépendances

```bash
git clone <repo-url> && cd project-bolt/project
npm install
```

#### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Puis éditer `.env` avec vos credentials Supabase :

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Obtenir ces valeurs : Supabase Dashboard → Settings → API

#### 3. Appliquer les migrations de base de données

```bash
npx supabase db push
```

Ou, si vous déployez via Supabase Cloud, les migrations sont appliquées automatiquement.

#### 4. Démarrer l'application en développement

```bash
npm run dev
```

Accédez à **http://localhost:5173**

---

## 📦 Architecture du projet

### Frontend (React + TypeScript + Tailwind CSS)

```
src/
├── components/        # Composants réutilisables (UI, dashboard, projects)
├── contexts/          # Context API (Auth, Theme, I18n, Filters)
├── hooks/             # Hooks personnalisés (useProjects, useTasks, useMetrics, etc.)
├── lib/               # Utilitaires (Supabase, formatters, validators, exporters)
├── pages/             # Pages principales (Dashboard, ProjectDetail, etc.)
├── types/             # Types TypeScript centralisés
└── App.tsx            # Point d'entrée

Key: Vite for bundling, Recharts for charting, Lucide for icons
```

### Backend (Supabase)

- **PostgreSQL** : Modèle de données relationnelle (projects, tasks, metrics, users, audit)
- **Auth** : Authentification JWT intégrée
- **Realtime** : Souscription live aux changements (notifications, projets, tâches)
- **Storage** : Stockage de fichiers (documents, rapports)
- **Edge Functions** : Webhooks et logique côté serveur (optionnel)

### Module BI (Python)

```
bi/
├── app.py             # Interface Streamlit
├── ml_models/         # Pipelines ML (prédictions, clustering)
├── dashboards/        # Tableaux de bord analytiques
├── utils/             # Filtres, formatage, exportateurs
├── data/              # Connexion DB, requêtes SQL
└── requirements.txt   # Dépendances Python
```

---

## 🔐 Sécurité des Variables d'Environnement

### ⚠️ IMPORTANT

Le fichier `.env` **NE DOIT JAMAIS** être commité. Il contient :

- `VITE_SUPABASE_ANON_KEY` (clé publique du navigateur — acceptable d'exposer légèrement)
- `SUPABASE_SERVICE_ROLE_KEY` (secrets d'administration — **À PROTÉGER ABSOLUMENT**)
- Credentials de base de données

### Configuration correcte

```bash
# 1. .env.example : Template SANS secrets
git add .env.example

# 2. .env : Ignoré par Git (voir .gitignore)
git add .gitignore
# .gitignore doit contenir:
.env
.env.local
.env.*.local
```

### Déploiement en production

- **Vercel / Netlify** : Configurer les env vars dans le dashboard
- **Docker** : Passer les env vars au démarrage du container
- **Supabase Functions** : Utilisez les Secrets natifs de Supabase

---

## 📊 Structure de données

### Schéma principal

```sql
-- Utilisateurs (via Supabase Auth)
profiles(id, email, full_name, role, department, phone, avatar_url)
  role IN ('admin', 'chef_projet', 'decideur', 'public')

-- Projets
projects(id, name, description, budget_xof, spent_xof, status, region, sector, progress, beneficiaries, start_date, end_date)
  region IN ('Bissau', 'Gabu', 'Bafata', ...)
  sector IN ('Health', 'Education', 'ICT', ...)
  status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SUSPENDED', 'CANCELLED')

-- Tâches
tasks(id, project_id, title, description, status, priority, progress, assigned_to, due_date)
  status IN ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED')
  priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')

-- Métriques KPI
metrics(id, project_id, kpi_type, value, target_value, unit, period_label, recorded_at)
  kpi_type IN ('budget_variance', 'roi', 'delay_index', 'completion_rate', ...)

-- Notifications (Realtime)
notifications(id, user_id, type, title, message, related_id, is_read, created_at)

-- Audit Log (conformité)
audit_logs(id, user_id, action, table_name, record_id, old_data, new_data, created_at)
```

### Rôles et permissions

| Rôle | Voir | Créer | Modifier | Supprimer | Exporter |
|------|------|-------|----------|-----------|----------|
| **admin** | Tout | Oui | Oui | Oui | Oui |
| **chef_projet** | Projets assignés | Oui | Oui | Non | Oui |
| **decideur** | Tous (lecture) | Non | Non | Non | Oui |
| **public** | Dashboard public | Non | Non | Non | Non |

---

## 🛠️ Workflow de développement

### Branch strategy

```
main (production) ← develop (staging) ← feature/xxx (dev)
```

### Commits

```bash
git commit -m "feat: add export report button (CORRECTION 7)"
git commit -m "fix: enable Supabase Realtime for notifications"
git commit -m "docs: complete README and .env.example"
```

### Pull Request checklist

- ✅ Tests unitaires passent
- ✅ Pas de `console.log` en production
- ✅ Types TypeScript stricts
- ✅ Migrations Supabase appliquées
- ✅ `.env` n'a pas été modifié

---

## 📖 Utilisation principale

### Créer un projet

1. Dashboard → "Nouveau projet"
2. Remplir : nom, région, secteur, budget XOF, dates
3. Ajouter des bénéficiaires
4. Créer des tâches et KPI
5. Assigner des membres de l'équipe

### Suivre en temps réel

- **KPI Card** : affiche tendance + valeur
- **Notifications** : alertes projet en retard, budget dépassé (Supabase Realtime)
- **Export rapport** : télécharger HTML autonome pour archivage

### Analyser (Module BI)

```bash
cd bi
pip install -r requirements.txt
streamlit run app.py
```

Accédez à `http://localhost:8501`

---

## 🧪 Tests

### Frontend

```bash
npm run test          # Jest + React Testing Library
npm run test:watch    # Mode watch
npm run test:coverage # Couverture
```

### Backend (Python)

```bash
cd bi && pytest tests/
```

---

## 📦 Build & Déploiement

### Build production

```bash
npm run build         # dist/
npm run preview       # Prévisualiser localement
```

### Déployer sur Vercel

```bash
npm install -g vercel
vercel               # Connecter et déployer
vercel env pull      # Récupérer les .env du dashboard
```

### Déployer sur Docker

```bash
docker build -t egov-projetgb .
docker run -p 3000:3000 -e VITE_SUPABASE_URL=... egov-projetgb
```

---

## 📋 Roadmap futures corrections

- **CORRECTION 11** : Tests E2E (Cypress)
- **CORRECTION 12** : Performance optimizations (React Query caching)
- **CORRECTION 13** : i18n multi-langue complète
- **CORRECTION 14** : Mobile PWA
- **CORRECTION 15** : SSO OIDC avec Keycloak

---

## 🤝 Contribution

1. Fork le repo
2. Créer une branche `feature/votre-feature`
3. Commit et Push
4. Ouvrir une Pull Request

---

## 📞 Support & Contact

- **Documentation** : [Wiki interne](./docs)
- **Issues** : Signaler les bugs sur le tracker GitHub
- **Email** : contact@egov-projetgb.gw (exemple)

---

## 📜 Licence & Crédits

**Projet gouvernemental** — République de Guinée-Bissau  
Contexte : Gouvernance électronique, transparence budgétaire, pilotage public

Développé par l'équipe E-Gov — 2026

---

## 🎯 Checklist de sécurité avant production

- [ ] `.env` ajouté à `.gitignore`
- [ ] Supabase RLS (Row Level Security) activé
- [ ] Authentification 2FA configurée pour admin
- [ ] Audit logs activés
- [ ] HTTPS partout (Supabase + CDN)
- [ ] Backups quotidiens configurés
- [ ] Rate limiting sur les API
- [ ] CORS bien défini
- [ ] Service Role Key stockée **seulement** en serveur

---

**Dernière mise à jour** : 15 mai 2026  
**Version** : 2.0 (Corrections 7-10 intégrées)
