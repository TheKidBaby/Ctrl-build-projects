/**
 * Vault API Client
 * Handles all communication with the backend NeDB server
 * All sensitive data is encrypted client-side before transmission
 */

import { encryptPassword, decryptPassword, EncryptedData } from '@crypto/index'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/vault'

export interface VaultEntryPayload {
  id?: string
  encryptedData: string
  iv: string
  salt: string
  category: string
  isFavorite: boolean
  passwordStrength: number
  lastModifiedBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface VaultApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  count?: number
  syncResults?: any[]
}

class VaultApiClient {
  private userId: string | null = null
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Set user ID for all requests
   */
  setUserId(userId: string) {
    this.userId = userId
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.userId
  }

  /**
   * Make authenticated API request
   */
  private async request<T = any>(
    method: string,
    endpoint: string,
    body?: any,
  ): Promise<VaultApiResponse<T>> {
    if (!this.userId) {
      throw new Error('User ID not set. Call setUserId() first.')
    }

    const url = `${this.baseUrl}${endpoint}`
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': this.userId,
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${method} ${endpoint}`, error)
      throw error
    }
  }

  /**
   * Check if backend is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Get all vault entries
   */
  async getEntries(): Promise<VaultEntryPayload[]> {
    const response = await this.request<VaultEntryPayload[]>('GET', '/entries')
    return response.data || []
  }

  /**
   * Get a specific entry
   */
  async getEntry(id: string): Promise<VaultEntryPayload | null> {
    const response = await this.request<VaultEntryPayload>('GET', `/entries/${id}`)
    return response.data || null
  }

  /**
   * Create a new vault entry with encrypted data
   */
  async createEntry(entry: VaultEntryPayload): Promise<VaultEntryPayload> {
    const response = await this.request<VaultEntryPayload>('POST', '/entries', entry)
    if (!response.success) {
      throw new Error(response.error || 'Failed to create entry')
    }
    return response.data!
  }

  /**
   * Update a vault entry
   */
  async updateEntry(id: string, updates: Partial<VaultEntryPayload>): Promise<VaultEntryPayload> {
    const response = await this.request<VaultEntryPayload>('PUT', `/entries/${id}`, updates)
    if (!response.success) {
      throw new Error(response.error || 'Failed to update entry')
    }
    return response.data!
  }

  /**
   * Delete a vault entry
   */
  async deleteEntry(id: string): Promise<void> {
    const response = await this.request('DELETE', `/entries/${id}`)
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete entry')
    }
  }

  /**
   * Sync multiple entries at once
   */
  async syncEntries(entries: VaultEntryPayload[], lastSync?: Date): Promise<VaultEntryPayload[]> {
    const response = await this.request<VaultEntryPayload[]>('POST', '/sync', {
      entries,
      lastSync: lastSync?.toISOString(),
    })
    if (!response.success) {
      throw new Error(response.error || 'Failed to sync entries')
    }
    return response.data || []
  }

  /**
   * Bulk import entries
   */
  async importEntries(entries: VaultEntryPayload[]): Promise<number> {
    const response = await this.request('POST', '/import', { entries })
    if (!response.success) {
      throw new Error(response.error || 'Failed to import entries')
    }
    return response.count || 0
  }

  /**
   * Export all entries for backup
   */
  async exportEntries(): Promise<VaultEntryPayload[]> {
    const response = await this.request<VaultEntryPayload[]>('GET', '/export')
    if (!response.success) {
      throw new Error(response.error || 'Failed to export entries')
    }
    return response.data || []
  }

  /**
   * Get vault statistics
   */
  async getStats(): Promise<any> {
    const response = await this.request('GET', '/stats')
    if (!response.success) {
      throw new Error(response.error || 'Failed to get stats')
    }
    return response.data
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    const response = await this.request<string[]>('GET', '/categories')
    return response.data || []
  }

  /**
   * Get favorite entries
   */
  async getFavorites(): Promise<VaultEntryPayload[]> {
    const response = await this.request<VaultEntryPayload[]>('GET', '/favorites')
    return response.data || []
  }

  /**
   * Clear all vault entries (requires confirmation)
   */
  async clearVault(): Promise<void> {
    const response = await this.request(
      'DELETE',
      '/clear',
      {},
    )
    if (!response.success) {
      throw new Error(response.error || 'Failed to clear vault')
    }
  }

  /**
   * Clear all vault entries with confirmation header
   */
  async clearVaultConfirmed(): Promise<void> {
    if (!this.userId) {
      throw new Error('User ID not set')
    }

    const url = `${this.baseUrl}/clear`
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'x-user-id': this.userId,
        'x-confirm-delete': 'true',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }
  }
}

// Export singleton instance
export const vaultApi = new VaultApiClient()

export default VaultApiClient
