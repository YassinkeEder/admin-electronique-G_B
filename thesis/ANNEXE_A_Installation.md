# ANNEXE A — Guide d'installation

Objectif : reproduire l'environnement de développement et préparer le déploiement.

Prérequis
- Node.js 18+ et npm
- Python 3.10+ (Streamlit)
- PostgreSQL (ou Supabase)
- Docker & Docker Compose
- Supabase CLI (optionnel)

Variables d'environnement essentielles
- `DATABASE_URL` (Postgres)
- `VITE_API_URL` (frontend → API)
- `ALLOWED_ORIGIN`
- `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` (optionnel)

Installation locale (frontend + API)

    cd project
    npm install
    npx prisma generate
    npm run server   # lance l'API
    npm run dev      # lance Vite (frontend)

Installation BI (Streamlit)

    cd bi
    pip install -r requirements.txt
    # ou (minimum)
    pip install openpyxl reportlab pandas streamlit

Build production et conteneurs

1. Créer `.env` (ne pas committer) avec `DATABASE_URL`, `VITE_API_URL`, `ALLOWED_ORIGIN`.
2. Construire et démarrer :

    docker compose -f docker-compose.prod.yml up -d --build

Migrations Prisma (CI / production)

    cd project
    npx prisma migrate deploy --schema=prisma/schema.prisma

Supabase (optionnel)

    supabase db push --project-ref $SUPABASE_PROJECT_REF

Notes
- Vérifier `prisma generate` dans l'image Docker si vous utilisez le client Prisma.
- Pour la partie BI, exécuter `streamlit run app.py` depuis le dossier `bi`.
