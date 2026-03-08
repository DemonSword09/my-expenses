import { create } from 'zustand';

interface MLState {
    isReady: boolean;
    setReady: (ready: boolean) => void;
}

export const useMLStore = create<MLState>((set) => ({
    isReady: false,
    setReady: (ready) => set({ isReady: ready }),
}));
