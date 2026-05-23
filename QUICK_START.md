# 🎯 QUICK START GUIDE

**Module**: E-GovProjetGB Reporting & Export  
**Status**: ✅ Production Ready  
**Time to Deploy**: < 10 minutes

---

## ⚡ 5-Minute Setup

### Step 1: Install (2 min)
```powershell
# Windows PowerShell
cd project-bolt\bi
pip install openpyxl reportlab
```

### Step 2: Verify (1 min)
```powershell
python test_reporting_export.py
```

**Expected output:**
```
✅ CSV Export PASS
✅ Excel Export PASS
✅ PDF Export PASS
✅ Advanced Filters PASS
✅ Audit Logging PASS
✅ Export Utilities PASS

Total: 6/6 tests passed ✅
```

### Step 3: Launch (2 min)
```powershell
streamlit run app.py
```

### Step 4: Navigate
1. Open browser to `http://localhost:8501`
2. Look for "📥 Reporting & Export" in sidebar
3. Click it!

---

## 🎮 USING THE DASHBOARD

### Tab 1: Exports 📥

**Export CSV**
1. Select "CSV" from dropdown
2. Choose columns you want
3. Check "Include Formatting" for currency/dates
4. Click preview to see data
5. Click "Download CSV" button

**Export Excel**
1. Select "Excel" from dropdown
2. Check "Include KPIs" for KPI sheet
3. Check "Include Summary" for regional summary
4. Click "Generate & Download"

**Export PDF**
1. Select "PDF Rapport" from dropdown
2. Enter report title
3. Check "Include Tables"
4. Click "Generate & Download"

### Tab 2: Filtres Avancés 🔍

**Quick Filters**
1. Select regions (multiselect)
2. Select sectors (multiselect)
3. Select statuses (multiselect)
4. Set date range (date picker)
5. Set budget range (slider)
6. Set progress range (slider)
7. Click "Appliquer Filtres"

**View Results**
- See filtered count
- See metrics (total budget, avg progress)
- Download filtered results as CSV

### Tab 3: Audit Logs 📋

**View Logs**
- Summary cards show totals
- Logs table shows all actions
- Filter by action, user, or level

**Verify Integrity**
- Click "Vérifier Intégrité"
- Green = No tampering
- Red = Tampering detected

**Export Logs**
- Export to CSV (download)
- Export to JSON (download)

### Tab 4: Presets 🎯

**Choose Report Type**
- Rapport Risques (overdue + budget overrun)
- Rapport Performance (completed projects)
- Analyse Régionale (by region)
- Analyse Sectorielle (by sector)

**View Results**
- Table shows filtered projects
- Metrics displayed
- Export ready

---

## 💻 PROGRAMMATIC USAGE

### Export Data
```python
from utils.exporters import CSVExporter, ExcelExporter, PDFExporter
import pandas as pd

# Your data
projects_df = pd.DataFrame(...)

# CSV
csv = CSVExporter.export_projects(projects_df, format_currency=True)

# Excel
excel = ExcelExporter.export_projects(projects_df)

# PDF
pdf = PDFExporter.export_summary_report(
    projects_df,
    kpis={'Total': len(projects_df)},
    title="Report"
)
```

### Filter Data
```python
from utils.filters import AdvancedFilter, FilterOperator, ProjectFilters

# Advanced filter
filt = AdvancedFilter(projects_df)
filt.add_condition('region', FilterOperator.IN, ['Bissau'])
filt.add_condition('budget_xof', FilterOperator.GREATER_THAN, 50_000_000)
result = filt.apply()

# Pre-built filters
overdue = ProjectFilters.overdue_projects(projects_df)
at_risk = ProjectFilters.at_risk_projects(projects_df)
```

### Log Actions
```python
from utils.audit import log_action, AuditAction, AuditContext

# Log action
log_action(AuditAction.EXPORT_CSV, user_id="user123")

# With context manager
with AuditContext(AuditAction.EXPORT_PDF, user_id="user123"):
    # Your export code here
    pass
```

---

## 📊 COMMON TASKS

### Export All Projects as CSV
1. Go to "📥 Exports" tab
2. Select "CSV"
3. Select all columns
4. Click "Download CSV"

### Find Overdue Projects
1. Go to "🔍 Filtres" tab
2. Filter by status ≠ "COMPLETED", "CANCELLED"
3. Filter by end_date < today
4. OR use "Rapport Risques" preset

### Generate Regional Report
1. Go to "🎯 Presets" tab
2. Select "Analyse Régionale"
3. Results show automatically
4. Can export to CSV/Excel/PDF

### Verify Audit Trail
1. Go to "📋 Audit Logs" tab
2. See all actions logged
3. Click "Vérifier Intégrité"
4. Verify no tampering

### Check Top 10 Budget Projects
1. Export as PDF
2. PDF includes Top 10 by budget
3. Download and review

---

## 🐛 TROUBLESHOOTING

### Error: "openpyxl not installed"
```powershell
pip install openpyxl
```

### Error: "reportlab not installed"
```powershell
pip install reportlab
```

### CSV doesn't have formatting
- Check "Include Formatting" checkbox
- This adds currency symbols, dates, etc.

### Excel columns too narrow
- Open file in Excel
- Columns auto-resize on opening
- Or double-click column headers to auto-fit

### PDF export fails
- Make sure reportlab is installed
- Restart Streamlit: Ctrl+C then `streamlit run app.py`

### Filters not working
- Make sure data is loaded
- Check Streamlit logs for errors
- Try refreshing page (F5)

---

## 📈 KEYBOARD SHORTCUTS

### Streamlit
- `R` - Refresh/rerun
- `C` - Clear cache
- `↓` - Scroll down
- `↑` - Scroll up

### Dashboard
- Tab navigation: Click tabs
- Filter: Click "Appliquer Filtres"
- Download: Click download button
- Verify: Click "Vérifier Intégrité"

---

## 💡 TIPS & TRICKS

1. **Combo Filters**: Apply multiple filters together
   - Region + Sector + Budget Range
   - All are applied together

2. **Presets**: Use presets for common reports
   - Don't have to re-create filters each time
   - Risk, Performance, Regional, Sectoral

3. **Audit Trail**: Always check audit logs
   - See who did what, when
   - Verify integrity weekly

4. **Export Options**: Choose format based on need
   - CSV: For data analysis (Excel, Python)
   - Excel: For business presentations
   - PDF: For official reports

5. **Batch Filters**: Combine conditions
   - Get exact data you need
   - Then export in any format

---

## 🎯 COMMON WORKFLOWS

### Workflow 1: Weekly Risk Report
1. Go to "🎯 Presets" tab
2. Select "Rapport Risques"
3. Click "Export as PDF"
4. Download and share

### Workflow 2: Regional Analysis
1. Go to "🔍 Filtres" tab
2. Select region (e.g., "Bissau")
3. Click "Appliquer Filtres"
4. Export as Excel
5. Open in Excel for analysis

### Workflow 3: Performance Review
1. Go to "🎯 Presets" tab
2. Select "Rapport Performance"
3. Review completed projects
4. Export for management review

### Workflow 4: Audit & Compliance
1. Go to "📋 Audit Logs" tab
2. Check last week's activities
3. Verify integrity
4. Export logs to CSV for archiving

---

## 📞 NEED HELP?

### Documentation
- **User Guide**: `bi/REPORTING_EXPORT_GUIDE.md`
- **Technical**: `REPORTING_EXPORT_COMPLETION.md`
- **Deployment**: `DEPLOYMENT_CHECKLIST.md`
- **Roadmap**: `ROADMAP.md`

### Common Issues
- See "TROUBLESHOOTING" section above
- Check Streamlit logs for errors
- Run `test_reporting_export.py` to verify

### Still Stuck?
1. Check documentation (links above)
2. Review test suite for examples
3. Check source code docstrings
4. Review function signatures

---

## ✨ FEATURES AT A GLANCE

| Feature | Where | How |
|---------|-------|-----|
| CSV Export | Tab 1 | Select columns, download |
| Excel Export | Tab 1 | Include KPIs, generate |
| PDF Export | Tab 1 | Add title, generate |
| Advanced Filters | Tab 2 | Select criteria, apply |
| Audit Logs | Tab 3 | View, filter, export |
| Risk Report | Tab 4 | Select preset, view |
| Performance Report | Tab 4 | Select preset, view |
| Regional Analysis | Tab 4 | Select preset, view |
| Sector Analysis | Tab 4 | Select preset, view |

---

## ✅ VERIFY INSTALLATION

Run this to verify everything works:

```powershell
# Test 1: Imports
python -c "from bi.utils.exporters import CSVExporter; print('✅ Exports OK')"
python -c "from bi.utils.audit import AuditLogger; print('✅ Audit OK')"
python -c "from bi.utils.filters import AdvancedFilter; print('✅ Filters OK')"

# Test 2: Dependencies
pip list | findstr /I "openpyxl|reportlab"

# Test 3: Run full test
python bi/test_reporting_export.py
```

All should show ✅ if working correctly.

---

## 🚀 YOU'RE READY!

Installation complete. Dashboard deployed. Features ready to use.

**Next Action**: Open browser to `http://localhost:8501` and explore! 🎉

---

**Quick Links**:
- [Installation Guide](./DEPLOYMENT_CHECKLIST.md)
- [User Manual](./bi/REPORTING_EXPORT_GUIDE.md)
- [Technical Docs](./REPORTING_EXPORT_COMPLETION.md)
- [Roadmap](./ROADMAP.md)

**Questions?** Check the documentation files above.

---

*Happy reporting!* 📊✨
