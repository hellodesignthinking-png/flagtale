import { create } from "zustand";
import type { LayerId } from "./types";

interface MapState {
  layer: LayerId;
  periodIndex: number;
  periods: string[];
  playing: boolean;
  selected: string | null; // admCd2
  hovered: string | null;
  basemap: boolean;

  setLayer: (l: LayerId) => void;
  setPeriodIndex: (i: number) => void;
  setPeriods: (p: string[]) => void;
  togglePlay: () => void;
  setPlaying: (v: boolean) => void;
  select: (admCd2: string | null) => void;
  setHovered: (admCd2: string | null) => void;
  toggleBasemap: () => void;
  stepPeriod: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  layer: "klai",
  periodIndex: 0,
  periods: [],
  playing: false,
  selected: null,
  hovered: null,
  basemap: true,

  setLayer: (l) => set({ layer: l }),
  setPeriodIndex: (i) => set({ periodIndex: i }),
  setPeriods: (p) =>
    set((s) => ({
      periods: p,
      periodIndex: s.periodIndex === 0 ? p.length - 1 : s.periodIndex,
    })),
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  setPlaying: (v) => set({ playing: v }),
  select: (admCd2) => set({ selected: admCd2 }),
  setHovered: (admCd2) => set({ hovered: admCd2 }),
  toggleBasemap: () => set((s) => ({ basemap: !s.basemap })),
  stepPeriod: () => {
    const { periodIndex, periods } = get();
    set({ periodIndex: (periodIndex + 1) % periods.length });
  },
}));
