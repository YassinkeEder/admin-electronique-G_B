import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProjectStatus, ProjectRegion, ProjectSector, StrategicAxis } from '../types';

export interface ProjectFiltersState {
  status?: ProjectStatus | '';
  region?: ProjectRegion | '';
  sector?: ProjectSector | '';
  strategic_axis?: StrategicAxis | '';
  is_public?: boolean | undefined;
  search?: string;
}

export interface FilterContextValue {
  filters: ProjectFiltersState;
  setFilters: (partial: Partial<ProjectFiltersState>) => void;
  resetFilters: () => void;
  setStatus: (s: ProjectStatus | '') => void;
  setRegion: (r: ProjectRegion | '') => void;
  setSector: (s: ProjectSector | '') => void;
  setStrategicAxis: (a: StrategicAxis | '') => void;
  setSearch: (q: string) => void;
  setIsPublic: (isPublic?: boolean) => void;
}

const defaultFilters: ProjectFiltersState = {
  status: '',
  region: '',
  sector: '',
  strategic_axis: '',
  search: '',
  is_public: undefined,
};

const FilterContext = createContext<FilterContextValue | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<ProjectFiltersState>(defaultFilters);

  const setFilters = (partial: Partial<ProjectFiltersState>) => {
    setFiltersState(prev => ({ ...prev, ...partial }));
  };

  const resetFilters = () => setFiltersState(defaultFilters);

  const setStatus = (s: ProjectStatus | '') => setFilters({ status: s });
  const setRegion = (r: ProjectRegion | '') => setFilters({ region: r });
  const setSector = (s: ProjectSector | '') => setFilters({ sector: s });
  const setStrategicAxis = (a: StrategicAxis | '') => setFilters({ strategic_axis: a });
  const setSearch = (q: string) => setFilters({ search: q });
  const setIsPublic = (isPublic?: boolean) => setFilters({ is_public: isPublic });

  return (
    <FilterContext.Provider value={{
      filters,
      setFilters,
      resetFilters,
      setStatus,
      setRegion,
      setSector,
      setStrategicAxis,
      setSearch,
      setIsPublic,
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilterContext(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilterContext must be used within FilterProvider');
  return ctx;
}

export function useProjectFilters() {
  const {
    filters,
    setFilters,
    resetFilters,
    setStatus,
    setRegion,
    setSector,
    setStrategicAxis,
    setSearch,
    setIsPublic,
  } = useFilterContext();

  return {
    filters,
    setFilters,
    resetFilters,
    setStatus,
    setRegion,
    setSector,
    setStrategicAxis,
    setSearch,
    setIsPublic,
  };
}
