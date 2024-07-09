import { create } from 'zustand';
import { Item } from '../types/itemTypes';
import { useFiltersStore } from './filterStore';

interface GameState {
    gameCode: number;
    setGameCode: (code: number) => void;
    data: Item[];
    loading: boolean;
    setData: (data: Item[]) => void;
    setLoading: (loading: boolean) => void;
}

const storedGameCode = localStorage.getItem('gameCode');

export const useGameStore = create<GameState>((set) => ({
    gameCode: storedGameCode ? parseInt(storedGameCode) : 730,
    setGameCode: (code) => {
        set({ gameCode: code });
        localStorage.setItem('gameCode', code.toString());
        useFiltersStore.getState().clearFilters();
    },
    data: [],
    loading: true,
    setData: (data) => set({ data }),
    setLoading: (loading) => set({ loading }),
}));