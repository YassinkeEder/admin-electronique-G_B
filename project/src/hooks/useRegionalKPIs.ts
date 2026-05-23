import { useMemo } from 'react';
import { Project, ProjectRegion } from '../types';
import { isOverdue } from '../lib/utils';

/**
 * Interface pour les KPI régionaux
 */
export interface RegionalKPI {
  region: ProjectRegion;
  totalBudget: number;
  totalSpent: number;
  projectCount: number;
  avgProgress: number;
  delayedCount: number;
  budgetUtilizationRate: number; // spent/budget * 100
}

/**
 * Hook pour calculer les KPI par région
 * Ne fait pas de fetch supplémentaire - utilise les projects fournis
 * Retourne un tableau trié par budget total décroissant
 * 
 * @param projects - Tableau des projects déjà chargés
 * @returns { regionalKPIs, top3Regions }
 */
export function useRegionalKPIs(projects: Project[]) {
  const data = useMemo(() => {
    // Grouper par région
    const regionMap = new Map<ProjectRegion, Project[]>();
    
    projects.forEach(project => {
      if (!regionMap.has(project.region)) {
        regionMap.set(project.region, []);
      }
      regionMap.get(project.region)!.push(project);
    });

    // Calculer les KPI pour chaque région
    const regionalKPIs: RegionalKPI[] = Array.from(regionMap.entries()).map(([region, regionProjects]) => {
      const totalBudget = regionProjects.reduce((s, p) => s + p.budget_xof, 0);
      const totalSpent = regionProjects.reduce((s, p) => s + p.spent_xof, 0);
      const avgProgress = regionProjects.length > 0
        ? Math.round(regionProjects.reduce((s, p) => s + p.progress, 0) / regionProjects.length)
        : 0;
      const delayedCount = regionProjects.filter(p => isOverdue(p.end_date, p.status)).length;
      const budgetUtilizationRate = totalBudget > 0
        ? Math.round((totalSpent / totalBudget) * 100)
        : 0;

      return {
        region,
        totalBudget,
        totalSpent,
        projectCount: regionProjects.length,
        avgProgress,
        delayedCount,
        budgetUtilizationRate,
      };
    });

    // Trier par budgetTotal décroissant
    regionalKPIs.sort((a, b) => b.totalBudget - a.totalBudget);

    // Extraire les 3 régions avec le plus de budget
    const top3Regions = regionalKPIs.slice(0, 3);

    return { regionalKPIs, top3Regions };
  }, [projects]);

  return data;
}
