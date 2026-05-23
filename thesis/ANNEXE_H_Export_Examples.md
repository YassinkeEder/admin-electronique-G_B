# ANNEXE H — Exemples d'exports (CSV / Excel / PDF)

Exemple d'en-tête CSV (projets)

    id,name,region,sector,budget_xof,spent_xof,progress
    PRJ-001,Projet A,Bissau,Health,5000000,2500000,50

Générer un export (exemple via script Python)

    # bi/test_sample_data.py
    python bi/test_sample_data.py

Excel / PDF

- Les exports Excel sont multi-feuilles (sheet par vue : projets, kpis).
- Les rapports PDF sont formatés A4 et incluent un résumé KPI.

Vérifier : `bi/dashboards/reporting_export.py` et `bi/utils/exporters.py`.
