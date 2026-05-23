# Guide d'Installation - Module BI Streamlit

## 📋 Prérequis

- **Python 3.9+** (recommandé 3.10 ou 3.11)
- **PostgreSQL/Supabase** accessible en lecture
- **pip** ou **conda**
- Environ 500 MB disque libre

## 🚀 Installation Étapes

### 1️⃣ Créer l'environnement virtuel

```bash
cd project/bi
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2️⃣ Installer les dépendances

```bash
pip install -r requirements.txt
```

**Durée estimée**: 2-5 minutes selon connexion

### 3️⃣ Configurer les secrets

```bash
# Copier template
cp .streamlit/secrets.example.toml .streamlit/secrets.toml

# Éditer avec vos credentials
nano .streamlit/secrets.toml
# OU code .streamlit/secrets.toml
```

**Configuration requise**:
```toml
[database]
url = "postgresql://username:password@host:5432/egov_db"
```

### 4️⃣ Lancer l'application

```bash
streamlit run app.py
```

L'app s'ouvre automatiquement sur `http://localhost:8501`

---

## 🔑 Configuration Secrets

### Option 1: PostgreSQL Direct

```toml
[database]
url = "postgresql://egov_user:password123@localhost:5432/egov_projets"
```

### Option 2: Supabase

```toml
[database]
supabase_url = "https://yourproject.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ..."
```

### Option 3: Variables d'Environnement

```bash
# .env
DATABASE_URL=postgresql://user:pass@host/db
SUPABASE_URL=https://project.supabase.co
SUPABASE_KEY=your-key
```

Puis relancer: `streamlit run app.py`

---

## 🧪 Vérifier l'Installation

```bash
# Test 1: Vérifier Python
python --version  # Doit être 3.9+

# Test 2: Vérifier packages
pip show streamlit pandas plotly

# Test 3: Test import
python -c "import streamlit; import pandas; import plotly; print('✅ All imports OK')"

# Test 4: Lancer app
streamlit run app.py
```

---

## ⚠️ Troubleshooting Courant

### Erreur: "ModuleNotFoundError: No module named 'streamlit'"

**Solution**:
```bash
# Vérifier que venv est activé
which python  # macOS/Linux - doit montrer .../venv/bin/python
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### Erreur: "psycopg2: Error connecting to database"

**Causes possibles**:
1. DATABASE_URL incorrect dans secrets.toml
2. BD non accessible depuis votre IP
3. Credentials invalides

**Solution**:
```bash
# Tester connexion
psql "postgresql://user:pass@host/db" -c "SELECT 1;"
```

### Erreur: "No such file: .streamlit/secrets.toml"

**Solution**:
```bash
mkdir -p .streamlit
cp .streamlit/secrets.example.toml .streamlit/secrets.toml
# Éditer le fichier avec vos secrets
```

### Streamlit très lent

**Causes**: Cache expiré, requêtes lourdes

**Solutions**:
```bash
# Nettoyer cache
rm -rf ~/.streamlit/cache/

# Relancer
streamlit run app.py --logger.level=debug
```

---

## 📦 Structure Dossiers

```
bi/
├── app.py                 ← Point d'entrée (streamlit run app.py)
├── config.py              ← Config centralisée
├── requirements.txt       ← Dépendances
├── data/
│   ├── connection.py      ← Requêtes BD
│   └── __init__.py
├── kpis/
│   ├── core.py           ← Calculs KPI
│   └── __init__.py
├── dashboards/
│   ├── overview.py       ← Dashboard principal
│   └── __init__.py
├── utils/
│   ├── formatting.py     ← Helpers
│   └── __init__.py
├── .streamlit/
│   ├── config.toml       ← Config Streamlit
│   ├── secrets.toml      ← Secrets (git-ignored)
│   └── secrets.example.toml
├── README.md
├── .gitignore
└── INSTALLATION_GUIDE.md
```

---

## 🏃 Lancement Rapide

Pour les fois suivantes:

```bash
# Terminal 1: Activer venv
cd project/bi
source venv/bin/activate  # ou venv\Scripts\activate (Windows)

# Terminal 2: Lancer app
streamlit run app.py
```

---

## 📊 Premiers Pas

1. **Accéder** → http://localhost:8501
2. **Filtrer** → Utiliser sidebar gauche (région, secteur, statut)
3. **Explorer** → Cliquer pages dans menu navigation
4. **Exporter** → Page "Données Brutes" pour CSV

---

## 🔄 Déploiement en Production

### Sur Streamlit Cloud

```bash
# 1. Pusher sur GitHub
git add .
git commit -m "Add BI Streamlit module"
git push origin main

# 2. Aller sur https://share.streamlit.io/
# 3. Connecter repo GitHub
# 4. Ajouter secrets dans "Advanced settings"
```

### Sur Serveur Propre

```bash
# 1. Installer Nginx/Apache reverse proxy
# 2. Configurer SSL
# 3. Lancer Streamlit en background
nohup streamlit run app.py --server.port 8501 &

# 4. Configurer systemd service (optionnel)
# Voir: deployment/streamlit.service
```

---

## 📚 Ressources

- **Streamlit Docs**: https://docs.streamlit.io/
- **Plotly**: https://plotly.com/python/
- **Pandas**: https://pandas.pydata.org/docs/
- **PostgreSQL**: https://www.postgresql.org/docs/

---

## 🤝 Support

Erreurs non listées?
1. Vérifier logs: `streamlit run app.py --logger.level=debug`
2. Consulter README.md
3. Vérifier fichiers `data/connection.py` et `config.py`

---

**Dernière mise à jour**: April 2026  
**Version**: 1.0
