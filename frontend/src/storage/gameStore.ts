import { create } from 'zustand';

interface PZCoefficient {
    price: string;
    coefficientPZ: number;
}

interface Item {
    market_name: string;
    coefficientL: number;
    coefficientSR: number;
    coefficientSRN: number;
    coefficientV: number;
    coefficientP: number;
    coefficientPZ: PZCoefficient;
    top100PZCoefficients: PZCoefficient[];
}

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
    },
    data: [],
    loading: true,
    setData: (data) => set({ data }),
    setLoading: (loading) => set({ loading }),
}));
