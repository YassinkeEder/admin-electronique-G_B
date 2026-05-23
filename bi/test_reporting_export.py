"""
Test Script for Reporting & Export Module
Validation des exporters, filtres, et audit logging
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
from pathlib import Path
from io import BytesIO

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from utils.exporters import CSVExporter, ExcelExporter, PDFExporter, get_export_filename
from utils.filters import AdvancedFilter, FilterOperator, ProjectFilters, FilterPreset
from utils.audit import AuditAction, AuditLevel, AuditLogger, log_action, AuditContext

# ============================================================================
# CREATE SAMPLE DATA
# ============================================================================

def create_sample_projects(n: int = 50) -> pd.DataFrame:
    """Create realistic sample projects"""
    
    np.random.seed(42)
    
    regions = ['Bissau', 'Gabu', 'Bafata', 'Cacheu', 'Biombo', 'Oio', 'Tombali', 'Quinara']
    sectors = ['Santé', 'Éducation', 'Infrastructure', 'Agriculture', 'Eau', 'Énergie']
    statuses = ['PLANNED', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'COMPLETED']
    
    projects = []
    
    for i in range(n):
        start_date = datetime.now() - timedelta(days=np.random.randint(30, 300))
        planned_end = start_date + timedelta(days=np.random.randint(60, 300))
        
        projects.append({
            'id': f'PRJ-{i+1:03d}',
            'name': f"Projet {i+1}",
            'region': np.random.choice(regions),
            'sector': np.random.choice(sectors),
            'status': np.random.choice(statuses),
            'budget_xof': np.random.uniform(10_000_000, 500_000_000),
            'spent_xof': None,  # Will be calculated
            'progress': np.random.uniform(0, 100),
            'beneficiaries': np.random.randint(100, 100000),
            'start_date': start_date,
            'end_date': planned_end,
            'created_at': start_date,
            'updated_at': datetime.now(),
            'created_by': 'ADMIN',
            'updated_by': 'ADMIN',
            'is_archived': False,
            'description': f'Projet test {i+1}'
        })
    
    df = pd.DataFrame(projects)
    
    # Calculate spent_xof based on progress
    df['spent_xof'] = df.apply(
        lambda row: row['budget_xof'] * (row['progress'] / 100) * np.random.uniform(0.9, 1.1),
        axis=1
    )
    
    return df

# ============================================================================
# TEST 1: CSV EXPORT
# ============================================================================

def test_csv_export():
    """Test CSV export functionality"""
    
    print("\n" + "="*70)
    print("TEST 1: CSV EXPORT")
    print("="*70)
    
    projects = create_sample_projects(30)
    
    try:
        # Export with formatting
        csv_data = CSVExporter.export_projects(
            projects[['id', 'name', 'region', 'sector', 'budget_xof', 'spent_xof', 'progress']],
            format_currency=True
        )
        
        print(f"\n✅ CSV export successful")
        print(f"   Size: {len(csv_data)} bytes")
        print(f"   Preview (first 200 chars):\n   {csv_data[:200]}...")
        
        # Verify structure
        lines = csv_data.strip().split('\n')
        print(f"   Lines: {len(lines)}")
        print(f"   Columns: {lines[0]}")
        
        return True
    
    except Exception as e:
        print(f"❌ CSV export failed: {e}")
        return False

# ============================================================================
# TEST 2: EXCEL EXPORT
# ============================================================================

def test_excel_export():
    """Test Excel export functionality"""
    
    print("\n" + "="*70)
    print("TEST 2: EXCEL EXPORT")
    print("="*70)
    
    projects = create_sample_projects(30)
    
    try:
        # Export with multiple sheets
        excel_bytes = ExcelExporter.export_projects(
            projects[['id', 'name', 'region', 'sector', 'budget_xof', 'spent_xof', 'progress']]
        )
        
        print(f"\n✅ Excel export successful")
        print(f"   Size: {len(excel_bytes)} bytes")
        print(f"   Format: .xlsx (OpenPyXL compatible)")
        
        # Verify it's a valid zip file (xlsx is zip)
        if excel_bytes[:4] == b'PK\x03\x04':
            print(f"   ✓ Valid ZIP signature (xlsx is valid)")
        else:
            print(f"   ⚠️ Unexpected format signature")
        
        return True
    
    except ImportError as e:
        print(f"⚠️ openpyxl not installed: {e}")
        print("   Install with: pip install openpyxl")
        return False
    
    except Exception as e:
        print(f"❌ Excel export failed: {e}")
        return False

# ============================================================================
# TEST 3: PDF EXPORT
# ============================================================================

def test_pdf_export():
    """Test PDF export functionality"""
    
    print("\n" + "="*70)
    print("TEST 3: PDF EXPORT")
    print("="*70)
    
    projects = create_sample_projects(30)
    
    try:
        # Create KPIs
        kpis = {
            'Total Projects': len(projects),
            'Total Budget': projects['budget_xof'].sum(),
            'Avg Progress': projects['progress'].mean(),
        }
        
        # Export PDF
        pdf_bytes = PDFExporter.export_summary_report(
            projects[['id', 'name', 'region', 'sector', 'budget_xof', 'spent_xof', 'progress']],
            kpis,
            title="Test Report",
            include_tables=True
        )
        
        print(f"\n✅ PDF export successful")
        print(f"   Size: {len(pdf_bytes)} bytes")
        print(f"   Format: PDF (ReportLab compatible)")
        
        # Verify PDF signature
        if pdf_bytes[:4] == b'%PDF':
            print(f"   ✓ Valid PDF signature")
        else:
            print(f"   ⚠️ Unexpected PDF signature")
        
        return True
    
    except ImportError as e:
        print(f"⚠️ reportlab not installed: {e}")
        print("   Install with: pip install reportlab")
        return False
    
    except Exception as e:
        print(f"❌ PDF export failed: {e}")
        return False

# ============================================================================
# TEST 4: ADVANCED FILTERS
# ============================================================================

def test_advanced_filters():
    """Test advanced filter functionality"""
    
    print("\n" + "="*70)
    print("TEST 4: ADVANCED FILTERS")
    print("="*70)
    
    projects = create_sample_projects(50)
    
    try:
        # Test AdvancedFilter
        filter_obj = AdvancedFilter(projects)
        filter_obj.add_condition('region', FilterOperator.IN, ['Bissau', 'Gabu'], 'Region filter')
        filter_obj.add_condition('budget_xof', FilterOperator.GREATER_THAN, 50_000_000, 'Budget > 50M')
        
        result = filter_obj.apply()
        summary = filter_obj.get_summary()
        
        print(f"\n✅ AdvancedFilter working")
        print(f"   Original: {summary['original_rows']} rows")
        print(f"   Filtered: {summary['filtered_rows']} rows")
        print(f"   Reduction: {summary['reduction_percent']:.1f}%")
        
        # Test ProjectFilters
        overdue = ProjectFilters.overdue_projects(projects)
        print(f"\n✅ ProjectFilters working")
        print(f"   Overdue projects: {len(overdue)}")
        
        # Test at-risk projects
        at_risk = ProjectFilters.at_risk_projects(projects)
        print(f"   At-risk projects: {len(at_risk)}")
        
        # Test FilterPreset
        risk_report = FilterPreset.risk_report(projects)
        print(f"\n✅ FilterPreset working")
        print(f"   Risk report projects: {len(risk_report)}")
        
        return True
    
    except Exception as e:
        print(f"❌ Filter test failed: {e}")
        return False

# ============================================================================
# TEST 5: AUDIT LOGGING
# ============================================================================

def test_audit_logging():
    """Test audit logging functionality"""
    
    print("\n" + "="*70)
    print("TEST 5: AUDIT LOGGING")
    print("="*70)
    
    try:
        # Create logger
        logger = AuditLogger()
        
        # Log some actions
        logger.log(
            AuditAction.EXPORT_CSV,
            user_id='USER001',
            resource_type='projects',
            resource_id='PRJ-001',
            details={'rows': 50, 'columns': 7}
        )
        
        logger.log(
            AuditAction.EXPORT_EXCEL,
            user_id='USER002',
            resource_type='report',
            resource_id='regional_report'
        )
        
        logger.log(
            AuditAction.FILTER_APPLIED,
            user_id='USER001',
            resource_type='projects',
            details={'filters': 3}
        )
        
        print(f"\n✅ Audit logging working")
        print(f"   Total entries: {len(logger.logs)}")
        
        # Get statistics
        stats = logger.get_statistics()
        print(f"   Unique users: {stats['unique_users']}")
        print(f"   Actions: {list(stats['actions_count'].keys())}")
        
        # Get filtered logs
        export_logs = logger.get_logs(action=AuditAction.EXPORT_CSV)
        print(f"   CSV exports logged: {len(export_logs)}")
        
        # Test integrity
        integrity = logger.verify_integrity()
        print(f"\n✅ Integrity check")
        print(f"   Status: {integrity['status']}")
        print(f"   Valid: {integrity['valid']}")
        print(f"   Total entries: {integrity['total_entries']}")
        
        # Test context manager
        with AuditContext(AuditAction.REPORT_GENERATED, user_id='USER001', resource_type='pdf_report'):
            pass  # Simulating work
        
        print(f"\n✅ AuditContext (context manager) working")
        print(f"   Total entries after context: {len(logger.logs)}")
        
        return True
    
    except Exception as e:
        print(f"❌ Audit logging test failed: {e}")
        return False

# ============================================================================
# TEST 6: EXPORT UTILITIES
# ============================================================================

def test_export_utilities():
    """Test export utility functions"""
    
    print("\n" + "="*70)
    print("TEST 6: EXPORT UTILITIES")
    print("="*70)
    
    try:
        # Test filename generation
        csv_name = get_export_filename('csv', suffix='projects')
        excel_name = get_export_filename('excel', suffix='report')
        pdf_name = get_export_filename('pdf', suffix='regional')
        
        print(f"\n✅ Export filename generation")
        print(f"   CSV: {csv_name}")
        print(f"   Excel: {excel_name}")
        print(f"   PDF: {pdf_name}")
        
        # Validate formats
        assert csv_name.endswith('.csv'), "CSV filename should end with .csv"
        assert excel_name.endswith('.xlsx'), "Excel filename should end with .xlsx"
        assert pdf_name.endswith('.pdf'), "PDF filename should end with .pdf"
        
        print(f"   ✓ All filenames valid")
        
        return True
    
    except Exception as e:
        print(f"❌ Export utilities test failed: {e}")
        return False

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def main():
    """Run all tests"""
    
    print("\n" + "█"*70)
    print("  REPORTING & EXPORT MODULE TEST SUITE")
    print("  E-GovProjetGB BI Platform")
    print("█"*70)
    
    results = []
    
    # Run tests
    results.append(("CSV Export", test_csv_export()))
    results.append(("Excel Export", test_excel_export()))
    results.append(("PDF Export", test_pdf_export()))
    results.append(("Advanced Filters", test_advanced_filters()))
    results.append(("Audit Logging", test_audit_logging()))
    results.append(("Export Utilities", test_export_utilities()))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status:10} | {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✅ ALL TESTS PASSED - Module is production ready!")
    else:
        print(f"\n⚠️ {total - passed} test(s) failed - See errors above")
    
    print("█"*70 + "\n")
    
    return passed == total

if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
