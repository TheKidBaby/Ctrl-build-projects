import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  hashPasswordArgon2id,
  verifyPasswordArgon2id,
  Argon2idHash,
} from "@crypto/argon2";
import {
  encryptVaultEntry,
  encryptVaultEntries,
  decryptVaultEntries,
} from "@crypto/entryEncryption";
import type { DecryptedEntry, VaultEntry } from "@/types/vault";

export interface VaultState {
  // Auth
  isAuthenticated: boolean;
  isInitialized: boolean;
  masterPasswordHash: Argon2idHash | null;

  // Data
  encryptedEntries: VaultEntry[];
  decryptedEntries: DecryptedEntry[];

  // UI
  selectedCategory: string;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  selectedEntryId: string | null;

  // Actions
  initializeVault: () => void;
  setMasterPassword: (password: string) => Promise<void>;
  authenticate: (password: string) => Promise<boolean>;
  logout: () => void;
  addEntry: (
    entry: Omit<
      DecryptedEntry,
      "id" | "createdAt" | "updatedAt" | "lastAccessedAt"
    >,
    password: string,
  ) => Promise<void>;
  updateEntry: (
    id: string,
    updates: Partial<DecryptedEntry>,
    password: string,
  ) => Promise<void>;
  deleteEntry: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedEntry: (id: string | null) => void;
  clearError: () => void;
  setError: (error: string) => void;
  getFilteredEntries: () => DecryptedEntry[];
  exportVault: () => Promise<string>;
  importVault: (data: string, password: string) => Promise<boolean>;
}

const STORAGE_KEY = "vaultmaster_vault_v2";
const HASH_KEY = "vaultmaster_hash";

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isInitialized: false,
      masterPasswordHash: null,
      encryptedEntries: [],
      decryptedEntries: [],
      selectedCategory: "All",
      searchQuery: "",
      isLoading: false,
      error: null,
      selectedEntryId: null,

      initializeVault: () => {
        set({ isInitialized: true });
        const storedHash = localStorage.getItem(HASH_KEY);
        if (storedHash) {
          try {
            const hash = JSON.parse(storedHash) as Argon2idHash;
            set({ masterPasswordHash: hash });
          } catch (error) {
            console.error("Failed to parse stored hash:", error);
          }
        }
      },

      setMasterPassword: async (password: string) => {
        try {
          const hash = await hashPasswordArgon2id(password);
          set({ masterPasswordHash: hash });
          localStorage.setItem(HASH_KEY, JSON.stringify(hash));
        } catch (error) {
          throw new Error(`Failed to set master password: ${error}`);
        }
      },

      authenticate: async (password: string) => {
        try {
          set({ isLoading: true });
          const { masterPasswordHash, encryptedEntries } = get();

          if (!masterPasswordHash) {
            await get().setMasterPassword(password);
            set({ isAuthenticated: true, isLoading: false });
            return true;
          }

          const isValid = await verifyPasswordArgon2id(
            password,
            masterPasswordHash,
          );

          if (!isValid) {
            set({
              error: "Invalid master password",
              isLoading: false,
            });
            return false;
          }

          let decrypted: DecryptedEntry[] = [];
          if (encryptedEntries.length > 0) {
            try {
              decrypted = await decryptVaultEntries(encryptedEntries, password);
            } catch (error) {
              console.error("Failed to decrypt entries:", error);
              set({
                error: "Failed to decrypt vault entries",
                isLoading: false,
              });
              return false;
            }
          }

          set({
            isAuthenticated: true,
            decryptedEntries: decrypted,
            isLoading: false,
          });
          return true;
        } catch (error) {
          set({
            error: `Authentication failed: ${error}`,
            isLoading: false,
          });
          return false;
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          decryptedEntries: [],
          selectedEntryId: null,
          searchQuery: "",
        });
      },

      addEntry: async (entry, password) => {
        try {
          set({ isLoading: true });
          const { decryptedEntries, encryptedEntries } = get();

          const newDecrypted: DecryptedEntry = {
            ...entry,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastAccessedAt: Date.now(),
          };

          const encrypted = await encryptVaultEntry(newDecrypted, password);

          set({
            decryptedEntries: [...decryptedEntries, newDecrypted],
            encryptedEntries: [...encryptedEntries, encrypted],
            isLoading: false,
          });
        } catch (error) {
          set({
            error: `Failed to add entry: ${error}`,
            isLoading: false,
          });
        }
      },

      updateEntry: async (id, updates, password) => {
        try {
          set({ isLoading: true });
          const { decryptedEntries, encryptedEntries } = get();

          const entryToUpdate = decryptedEntries.find((e) => e.id === id);
          if (!entryToUpdate) {
            throw new Error("Entry not found");
          }

          const updatedDecrypted: DecryptedEntry = {
            ...entryToUpdate,
            ...updates,
            updatedAt: Date.now(),
          };

          const encrypted = await encryptVaultEntry(updatedDecrypted, password);

          set({
            decryptedEntries: decryptedEntries.map((e) =>
              e.id === id ? updatedDecrypted : e,
            ),
            encryptedEntries: encryptedEntries.map((e) =>
              e.id === id ? encrypted : e,
            ),
            isLoading: false,
          });
        } catch (error) {
          set({
            error: `Failed to update entry: ${error}`,
            isLoading: false,
          });
        }
      },

      deleteEntry: (id) => {
        set((state) => ({
          decryptedEntries: state.decryptedEntries.filter((e) => e.id !== id),
          encryptedEntries: state.encryptedEntries.filter((e) => e.id !== id),
          selectedEntryId:
            state.selectedEntryId === id ? null : state.selectedEntryId,
        }));
      },

      toggleFavorite: (id) => {
        set((state) => ({
          decryptedEntries: state.decryptedEntries.map((e) =>
            e.id === id
              ? { ...e, isFavorite: !e.isFavorite, updatedAt: Date.now() }
              : e,
          ),
          encryptedEntries: state.encryptedEntries.map((e) =>
            e.id === id
              ? { ...e, isFavorite: !e.isFavorite, updatedAt: Date.now() }
              : e,
          ),
        }));
      },

      setSelectedCategory: (category) => {
        set({ selectedCategory: category, searchQuery: "" });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setSelectedEntry: (id) => {
        set({ selectedEntryId: id });
      },

      clearError: () => {
        set({ error: null });
      },

      setError: (error) => {
        set({ error });
        setTimeout(() => set({ error: null }), 5000);
      },

      getFilteredEntries: () => {
        const { decryptedEntries, selectedCategory, searchQuery } = get();
        let filtered = decryptedEntries;

        if (selectedCategory !== "All") {
          if (selectedCategory === "Favorites") {
            filtered = filtered.filter((e) => e.isFavorite);
          } else {
            filtered = filtered.filter((e) => e.category === selectedCategory);
          }
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (e) =>
              e.title.toLowerCase().includes(query) ||
              (e.username?.toLowerCase().includes(query) ?? false) ||
              (e.email?.toLowerCase().includes(query) ?? false) ||
              (e.url?.toLowerCase().includes(query) ?? false) ||
              e.tags.some((tag) => tag.toLowerCase().includes(query)),
          );
        }

        return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
      },

      exportVault: async () => {
        try {
          const { decryptedEntries } = get();
          const exportData = {
            version: 1,
            exportedAt: new Date().toISOString(),
            entriesCount: decryptedEntries.length,
            entries: decryptedEntries,
          };
          return JSON.stringify(exportData, null, 2);
        } catch (error) {
          throw new Error(`Failed to export vault: ${error}`);
        }
      },

      importVault: async (data, password) => {
        try {
          set({ isLoading: true });
          const { decryptedEntries, encryptedEntries } = get();

          const vaultData = JSON.parse(data);
          if (!vaultData.entries || !Array.isArray(vaultData.entries)) {
            throw new Error("Invalid vault format");
          }

          const encryptedImports = await encryptVaultEntries(
            vaultData.entries,
            password,
          );

          set({
            decryptedEntries: [...decryptedEntries, ...vaultData.entries],
            encryptedEntries: [...encryptedEntries, ...encryptedImports],
            isLoading: false,
          });

          get().setError(
            `Successfully imported ${vaultData.entries.length} entries`,
          );
          return true;
        } catch (error) {
          set({
            error: `Failed to import vault: ${error}`,
            isLoading: false,
          });
          return false;
        }
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        encryptedEntries: state.encryptedEntries,
        masterPasswordHash: state.masterPasswordHash,
      }),
    },
  ),
);
