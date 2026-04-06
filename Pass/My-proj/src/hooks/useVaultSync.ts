import { useEffect, useCallback, useRef } from 'react'
import { useVaultStore, VaultEntry } from '@stores/vaultStore'
import { useSyncStore } from '@stores/syncStore'
import { vaultApi } from '@services/vaultApi'
import { encryptPassword, decryptPassword, EncryptedData } from '@crypto/index'

export interface UseSyncOptions {
  autoSync?: boolean
  syncInterval?: number
  userId?: string
}

/**
 * Hook for managing vault synchronization with backend
 * Handles upload, download, and conflict resolution
 */
export function useVaultSync(options: UseSyncOptions = {}) {
  const {
    autoSync = true,
    syncInterval = 5 * 60 * 1000, // 5 minutes
    userId = 'default-user', // In production, get from auth
  } = options

  const vaultStore = useVaultStore()
  const syncStore = useSyncStore()
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isSyncingRef = useRef(false)

  // Set user ID for API client
  useEffect(() => {
    vaultApi.setUserId(userId)
  }, [userId])

  // Setup online/offline listeners
  useEffect(() => {
    const handleOnline = () => syncStore.setOnline(true)
    const handleOffline = () => syncStore.setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncStore])

  /**
   * Convert local VaultEntry to payload for backend
   */
  const entryToPayload = useCallback(
    async (entry: VaultEntry): Promise<any> => {
      // In production, encrypt sensitive data before sending
      return {
        id: entry.id,
        encryptedData: btoa(
          JSON.stringify({
            title: entry.title,
            username: entry.username,
            password: entry.password,
            url: entry.url,
            notes: entry.notes,
          }),
        ),
        iv: 'mock-iv', // In production, use real IV
        salt: 'mock-salt', // In production, use real salt
        category: entry.category,
        isFavorite: entry.isFavorite,
        passwordStrength: entry.passwordStrength,
        lastModifiedBy: entry.lastModifiedBy,
        createdAt: new Date(entry.createdAt).toISOString(),
        updatedAt: new Date(entry.updatedAt).toISOString(),
      }
    },
    [],
  )

  /**
   * Convert backend payload to local VaultEntry
   */
  const payloadToEntry = useCallback(async (payload: any): Promise<VaultEntry> => {
    let decrypted = { title: '', username: '', password: '', url: '', notes: '' }

    try {
      const decryptedStr = atob(payload.encryptedData)
      decrypted = JSON.parse(decryptedStr)
    } catch (error) {
      console.error('Failed to decrypt entry data:', error)
    }

    return {
      id: payload.id,
      title: decrypted.title || 'Imported Entry',
      username: decrypted.username || '',
      password: decrypted.password || '',
      url: decrypted.url || '',
      notes: decrypted.notes || '',
      category: payload.category || 'other',
      tags: [],
      isFavorite: payload.isFavorite || false,
      createdAt: new Date(payload.createdAt).getTime(),
      updatedAt: new Date(payload.updatedAt).getTime(),
      passwordStrength: payload.passwordStrength || 0,
      lastModifiedBy: payload.lastModifiedBy || 'sync',
    }
  }, [])

  /**
   * Upload local entries to backend
   */
  const uploadEntries = useCallback(async () => {
    try {
      const { entries } = vaultStore
      if (entries.length === 0) return

      const payloads = await Promise.all(entries.map((e) => entryToPayload(e)))
      await vaultApi.syncEntries(payloads, syncStore.lastSync || undefined)

      syncStore.setLastSync(new Date())
      syncStore.recordSyncStats(0, entries.length, 0)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      syncStore.setSyncError(`Upload failed: ${message}`)
      console.error('Upload error:', error)
    }
  }, [vaultStore, syncStore, entryToPayload])

  /**
   * Download entries from backend
   */
  const downloadEntries = useCallback(async () => {
    try {
      const remoteEntries = await vaultApi.getEntries()
      const convertedEntries = await Promise.all(
        remoteEntries.map((p) => payloadToEntry(p)),
      )

      // Merge with local entries, newer version wins
      const { entries: localEntries } = vaultStore
      const merged: { [key: string]: VaultEntry } = {}

      // Add all local entries
      localEntries.forEach((entry) => {
        merged[entry.id] = entry
      })

      // Merge remote entries
      let created = 0
      let updated = 0
      convertedEntries.forEach((remoteEntry) => {
        const localEntry = merged[remoteEntry.id]
        if (!localEntry) {
          merged[remoteEntry.id] = remoteEntry
          created++
        } else if (remoteEntry.updatedAt > localEntry.updatedAt) {
          merged[remoteEntry.id] = remoteEntry
          updated++
        }
      })

      // Update store with merged entries
      const mergedArray = Object.values(merged)
      vaultStore.entries = mergedArray

      syncStore.setLastSync(new Date())
      syncStore.recordSyncStats(created, updated, 0)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      syncStore.setSyncError(`Download failed: ${message}`)
      console.error('Download error:', error)
    }
  }, [vaultStore, syncStore, payloadToEntry])

  /**
   * Full sync: check backend health, then sync both ways
   */
  const sync = useCallback(async () => {
    if (isSyncingRef.current) {
      console.warn('Sync already in progress')
      return
    }

    isSyncingRef.current = true
    syncStore.setSyncing(true)

    try {
      // Check backend health
      const isHealthy = await syncStore.checkBackendHealth()
      if (!isHealthy) {
        throw new Error('Backend is not available')
      }

      // Download first to get latest remote data
      await downloadEntries()

      // Then upload any local changes
      await uploadEntries()

      syncStore.setSyncError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      syncStore.setSyncError(message)
      console.error('Sync error:', error)
    } finally {
      isSyncingRef.current = false
      syncStore.setSyncing(false)
    }
  }, [downloadEntries, uploadEntries, syncStore])

  /**
   * Setup auto-sync interval
   */
  useEffect(() => {
    if (!autoSync || !syncStore.isOnline) {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current)
        syncTimerRef.current = null
      }
      return
    }

    // Sync immediately on mount
    sync()

    // Setup periodic sync
    syncTimerRef.current = setInterval(() => {
      if (syncStore.isOnline && !isSyncingRef.current) {
        sync()
      }
    }, syncInterval)

    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current)
        syncTimerRef.current = null
      }
    }
  }, [autoSync, syncInterval, sync, syncStore.isOnline])

  /**
   * Manual sync trigger
   */
  const manualSync = useCallback(async () => {
    if (!syncStore.isOnline) {
      syncStore.setSyncError('You are offline. Cannot sync.')
      return
    }
    await sync()
  }, [sync, syncStore])

  /**
   * Export vault for backup
   */
  const exportForBackup = useCallback(async () => {
    try {
      const entries = await vaultApi.exportEntries()
      return JSON.stringify(entries, null, 2)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      syncStore.setSyncError(`Export failed: ${message}`)
      return null
    }
  }, [syncStore])

  /**
   * Import vault from backup
   */
  const importFromBackup = useCallback(
    async (backupData: string) => {
      try {
        const entries = JSON.parse(backupData)
        if (!Array.isArray(entries)) {
          throw new Error('Invalid backup format')
        }

        const count = await vaultApi.importEntries(entries)
        syncStore.setSyncError(null)

        // Sync after import
        await downloadEntries()

        return count
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        syncStore.setSyncError(`Import failed: ${message}`)
        return 0
      }
    },
    [syncStore, downloadEntries],
  )

  return {
    // State
    isSyncing: syncStore.isSyncing,
    isOnline: syncStore.isOnline,
    lastSync: syncStore.lastSync,
    syncError: syncStore.syncError,
    backendAvailable: syncStore.backendAvailable,

    // Actions
    sync: manualSync,
    uploadEntries,
    downloadEntries,
    exportForBackup,
    importFromBackup,

    // Settings
    setAutoSyncEnabled: syncStore.setAutoSyncEnabled,
    setAutoSyncInterval: syncStore.setAutoSyncInterval,
  }
}

export default useVaultSync
