# ANNEXE F — Résultats des tests

Résumé des commandes pour exécuter les tests et récupérer les rapports.

Tests JavaScript/TypeScript

    cd project
    npm ci
    npm test
    npm run test:coverage

Le rapport de couverture (Jest) est généré dans `project/coverage/`.

Tests BI (Streamlit / Python)

    cd bi
    python -m pytest test_reporting_export.py -q

Notes
- Les tests d'export (CSV/Excel/PDF) sont fournis dans `bi/test_reporting_export.py`.
- Inclure les logs et captures d'écran des sorties de tests dans `docs/test-outputs/` pour la soutenance.
