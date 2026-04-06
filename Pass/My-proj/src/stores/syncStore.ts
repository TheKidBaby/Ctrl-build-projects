import { create } from 'zustand'
import { vaultApi } from '@services/vaultApi'

export interface SyncState {
  // Sync status
  isSyncing: boolean
  isOnline: boolean
  lastSync: Date | null
  nextAutoSync: Date | null
  syncError: string | null

  // Sync settings
  autoSyncEnabled: boolean
  autoSyncInterval: number // in milliseconds

  // Sync statistics
  entriesSynced: number
  entriesCreated: number
  entriesUpdated: number
  entriesSkipped: number

  // Backend status
  backendAvailable: boolean
  backendUrl: string

  // Actions
  setSyncing: (syncing: boolean) => void
  setOnline: (online: boolean) => void
  setSyncError: (error: string | null) => void
  setAutoSyncEnabled: (enabled: boolean) => void
  setAutoSyncInterval: (interval: number) => void
  setLastSync: (date: Date) => void
  setNextAutoSync: (date: Date | null) => void
  checkBackendHealth: () => Promise<boolean>
  resetSyncStats: () => void
  recordSyncStats: (created: number, updated: number, skipped: number) => void
}

export const useSyncStore = create<SyncState>((set, get) => ({
  // Initial state
  isSyncing: false,
  isOnline: navigator.onLine,
  lastSync: null,
  nextAutoSync: null,
  syncError: null,
  autoSyncEnabled: true,
  autoSyncInterval: 5 * 60 * 1000, // 5 minutes default
  entriesSynced: 0,
  entriesCreated: 0,
  entriesUpdated: 0,
  entriesSkipped: 0,
  backendAvailable: false,
  backendUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/vault',

  // Actions
  setSyncing: (syncing: boolean) => {
    set({ isSyncing: syncing })
  },

  setOnline: (online: boolean) => {
    set({ isOnline: online })
  },

  setSyncError: (error: string | null) => {
    set({ syncError: error })
    if (error) {
      setTimeout(() => set({ syncError: null }), 5000)
    }
  },

  setAutoSyncEnabled: (enabled: boolean) => {
    set({ autoSyncEnabled: enabled })
  },

  setAutoSyncInterval: (interval: number) => {
    set({ autoSyncInterval: interval })
  },

  setLastSync: (date: Date) => {
    set({ lastSync: date })
  },

  setNextAutoSync: (date: Date | null) => {
    set({ nextAutoSync: date })
  },

  checkBackendHealth: async () => {
    try {
      const isHealthy = await vaultApi.checkHealth()
      set({ backendAvailable: isHealthy })
      return isHealthy
    } catch (error) {
      set({ backendAvailable: false })
      return false
    }
  },

  resetSyncStats: () => {
    set({
      entriesSynced: 0,
      entriesCreated: 0,
      entriesUpdated: 0,
      entriesSkipped: 0,
    })
  },

  recordSyncStats: (created: number, updated: number, skipped: number) => {
    set((state) => ({
      entriesSynced: state.entriesSynced + created + updated,
      entriesCreated: state.entriesCreated + created,
      entriesUpdated: state.entriesUpdated + updated,
      entriesSkipped: state.entriesSkipped + skipped,
    }))
  },
}))

export default useSyncStore
