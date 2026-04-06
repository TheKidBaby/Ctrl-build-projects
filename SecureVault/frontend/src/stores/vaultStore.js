import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { vault } from '../crypto/vault';
import { api } from '../services/api';

export const useVaultStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isUnlocked: false,
      user: null,
      
      passwords: [],
      categories: [],
      selectedCategory: null,
      
      searchQuery: '',
      sortBy: 'updated_at',
      sortOrder: 'desc',
      viewMode: 'grid',
      
      isLoading: false,
      error: null,
      
      theme: 'dark',

      setTheme: (theme) => {
        set({ theme });
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },

      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      register: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.register(email, password);
          await vault.unlock(password, response.user.salt);
          
          set({
            isAuthenticated: true,
            isUnlocked: true,
            user: response.user,
            isLoading: false
          });

          await get().fetchCategories();
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.login(email, password);
          await vault.unlock(password, response.user.salt);
          
          set({
            isAuthenticated: true,
            isUnlocked: true,
            user: response.user,
            isLoading: false
          });

          await get().fetchPasswords();
          await get().fetchCategories();
          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      logout: () => {
        vault.lock();
        api.logout();
        set({
          isAuthenticated: false,
          isUnlocked: false,
          user: null,
          passwords: [],
          categories: []
        });
      },

      fetchPasswords: async () => {
        set({ isLoading: true });
        try {
          const encryptedPasswords = await api.getPasswords();
          
          const passwords = await Promise.all(
            encryptedPasswords.map(async (ep) => {
              try {
                const decrypted = await vault.decryptEntry({
                  ciphertext: ep.encrypted_data,
                  iv: ep.iv
                });
                return {
                  id: ep.id,
                  ...decrypted,
                  categoryId: ep.category_id,
                  iconUrl: ep.icon_url,
                  createdAt: ep.created_at,
                  updatedAt: ep.updated_at,
                  lastUsedAt: ep.last_used_at,
                  useCount: ep.use_count,
                  favorite: ep.favorite === 1
                };
              } catch (error) {
                console.error('Failed to decrypt password:', error);
                return null;
              }
            })
          );

          set({ passwords: passwords.filter(p => p !== null), isLoading: false });
        } catch (error) {
          console.error('Failed to fetch passwords:', error);
          set({ isLoading: false, error: error.message });
        }
      },

      fetchCategories: async () => {
        try {
          const categories = await api.getCategories();
          set({ categories });
        } catch (error) {
          console.error('Failed to fetch categories:', error);
        }
      },

      addPassword: async (passwordData) => {
        set({ isLoading: true, error: null });
        try {
          const encrypted = await vault.encryptEntry(passwordData);
          
          const response = await api.createPassword({
            encrypted_data: encrypted.ciphertext,
            iv: encrypted.iv,
            tag: '',
            category_id: passwordData.categoryId,
            domain_hash: passwordData.website ? await (await import('../crypto/vault')).sha256(passwordData.website) : null
          });

          set(state => ({
            passwords: [{
              id: response.id,
              ...passwordData,
              categoryId: response.category_id,
              iconUrl: response.icon_url,
              createdAt: response.created_at,
              updatedAt: response.updated_at,
              favorite: false,
              useCount: 0
            }, ...state.passwords],
            isLoading: false
          }));

          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      updatePassword: async (id, passwordData) => {
        set({ isLoading: true, error: null });
        try {
          const encrypted = await vault.encryptEntry(passwordData);
          
          await api.updatePassword(id, {
            encrypted_data: encrypted.ciphertext,
            iv: encrypted.iv,
            tag: '',
            category_id: passwordData.categoryId
          });

          set(state => ({
            passwords: state.passwords.map(p => 
              p.id === id ? { ...p, ...passwordData, updatedAt: Date.now() } : p
            ),
            isLoading: false
          }));

          return { success: true };
        } catch (error) {
          set({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      },

      deletePassword: async (id) => {
        try {
          await api.deletePassword(id);
          set(state => ({
            passwords: state.passwords.filter(p => p.id !== id)
          }));
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      toggleFavorite: async (id) => {
        try {
          await api.toggleFavorite(id);
          set(state => ({
            passwords: state.passwords.map(p =>
              p.id === id ? { ...p, favorite: !p.favorite } : p
            )
          }));
        } catch (error) {
          console.error('Failed to toggle favorite:', error);
        }
      },

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
      setViewMode: (viewMode) => set({ viewMode }),

      getFilteredPasswords: () => {
        const { passwords, searchQuery, selectedCategory, sortBy, sortOrder } = get();
        
        let filtered = [...passwords];

        if (selectedCategory) {
          filtered = filtered.filter(p => p.categoryId === selectedCategory);
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(p => 
            p.website?.toLowerCase().includes(query) ||
            p.username?.toLowerCase().includes(query) ||
            p.notes?.toLowerCase().includes(query)
          );
        }

        filtered.sort((a, b) => {
          const aVal = a[sortBy];
          const bVal = b[sortBy];
          
          if (sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
          }
          return aVal < bVal ? 1 : -1;
        });

        return filtered;
      }
    }),
    {
      name: 'securevault-storage',
      partialize: (state) => ({
        theme: state.theme,
        viewMode: state.viewMode
      })
    }
  )
);
