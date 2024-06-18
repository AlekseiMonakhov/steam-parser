import { create } from 'zustand';

interface GameState {
    gameCode: number;
    setGameCode: (code: number) => void;
}

const storedGameCode = localStorage.getItem('gameCode');

export const useGameStore = create<GameState>((set) => ({
    gameCode: storedGameCode ? parseInt(storedGameCode) : 730,
    setGameCode: (code) => {
        set({ gameCode: code });
        localStorage.setItem('gameCode', code.toString());
    },
}));
