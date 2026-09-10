import { create } from 'zustand'
import type { StrictModeConfig } from '../types'

interface StrictModeState {
  config: StrictModeConfig
  setConfig: (patch: Partial<StrictModeConfig>) => void
  reset: () => void
}

const defaultConfig: StrictModeConfig = {
  origin: true,
  ingredient: true,
  manufacturer: true,
  distributor: true,
  processing: true,
  company_address: true,
  gs1Warning: false,
}

export const useStrictModeStore = create<StrictModeState>((set) => ({
  config: defaultConfig,
  setConfig: (patch) => set((state) => ({ config: { ...state.config, ...patch } })),
  reset: () => set({ config: defaultConfig }),
}))
