import { create } from 'zustand';

interface FiltersState {
    filters: { rarity: string[], quality: string[], itemgroup: string[] };
    setFilters: (filters: { rarity: string[], quality: string[], itemgroup: string[] }) => void;
}

export const useFiltersStore = create<FiltersState>((set) => ({
    filters: { rarity: [], quality: [], itemgroup: [] },
    setFilters: (filters) => set({ filters }),
}));
