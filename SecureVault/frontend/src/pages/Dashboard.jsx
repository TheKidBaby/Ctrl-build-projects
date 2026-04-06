import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Grid3X3, List, 
  Shield, Key, AlertTriangle, Loader2
} from 'lucide-react';
import { useVaultStore } from '../stores/vaultStore';
import { PasswordCard } from '../components/ui/PasswordCard';
import { PasswordForm } from '../components/PasswordForm';
import { Sidebar } from '../components/Sidebar';
import { VaultScanner } from '../components/VaultScanner';
import { calculateStrength } from '../crypto/vault';
import { cn } from '../lib/utils';

export function Dashboard() {
  const { 
    passwords,
    searchQuery, 
    setSearchQuery,
    viewMode,
    setViewMode,
    getFilteredPasswords,
    isLoading,
    deletePassword,
    toggleFavorite
  } = useVaultStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPassword, setEditingPassword] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const filteredPasswords = getFilteredPasswords();

  const stats = useMemo(() => {
    const total = passwords.length;
    const weak = passwords.filter(p => {
      return calculateStrength(p.password).score <= 4;
    }).length;
    
    return { total, weak };
  }, [passwords]);

  const handleEdit = (password) => {
    setEditingPassword(password);
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    await deletePassword(id);
    setShowDeleteConfirm(null);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingPassword(null);
  };

  return (
    <div className="flex h-screen bg-dark-50 dark:bg-dark-950">
      <Sidebar onAddPassword={() => setShowAddModal(true)} />

      <main className="flex-1 overflow-hidden flex flex-col">
        <header className="flex items-center justify-between p-6 bg-white dark:bg-dark-900 border-b border-dark-200 dark:border-dark-800">
          <div>
            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
              Password Vault
            </h1>
            <p className="text-dark-500 text-sm">
              {stats.total} passwords stored securely
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search passwords..."
                className="w-64 pl-10 pr-4 py-2 rounded-xl bg-dark-100 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 text-dark-900 dark:text-white placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-vault-500/50"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-dark-100 dark:bg-dark-800 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  viewMode === 'grid'
                    ? "bg-white dark:bg-dark-700 shadow text-dark-900 dark:text-white"
                    : "text-dark-500 hover:text-dark-900 dark:hover:text-white"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  viewMode === 'list'
                    ? "bg-white dark:bg-dark-700 shadow text-dark-900 dark:text-white"
                    : "text-dark-500 hover:text-dark-900 dark:hover:text-white"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-5 h-5" />
              Add Password
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-vault-500/10">
                <Key className="w-6 h-6 text-vault-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-dark-900 dark:text-white">{stats.total}</p>
                <p className="text-sm text-dark-500">Total Passwords</p>
              </div>
            </div>
            
            <div className="card p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <Shield className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-dark-900 dark:text-white">{stats.total - stats.weak}</p>
                <p className="text-sm text-dark-500">Strong Passwords</p>
              </div>
            </div>
            
            <div className="card p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-dark-900 dark:text-white">{stats.weak}</p>
                <p className="text-sm text-dark-500">Weak Passwords</p>
              </div>
            </div>
          </div>

          {/* Vault Scanner */}
          <VaultScanner />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-vault-500 animate-spin" />
            </div>
          ) : filteredPasswords.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-full bg-dark-100 dark:bg-dark-800 flex items-center justify-center mb-4">
                <Key className="w-8 h-8 text-dark-400" />
              </div>
              <h3 className="text-lg font-medium text-dark-900 dark:text-white mb-2">
                {searchQuery ? 'No results found' : 'No passwords yet'}
              </h3>
              <p className="text-dark-500 mb-4">
                {searchQuery 
                  ? 'Try a different search term' 
                  : 'Add your first password to get started'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-primary"
                >
                  <Plus className="w-5 h-5" />
                  Add Password
                </button>
              )}
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-3"
            )}>
              <AnimatePresence>
                {filteredPasswords.map((password) => (
                  <PasswordCard
                    key={password.id}
                    password={password}
                    viewMode={viewMode}
                    onEdit={handleEdit}
                    onDelete={() => setShowDeleteConfirm(password.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {showAddModal && (
          <PasswordForm
            isOpen={showAddModal}
            onClose={handleCloseModal}
            editingPassword={editingPassword}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">
                Delete Password?
              </h3>
              <p className="text-dark-500 mb-6">
                This action cannot be undone. The password will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 btn bg-red-500 text-white hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
