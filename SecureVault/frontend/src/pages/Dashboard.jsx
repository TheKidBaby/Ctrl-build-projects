import { useState, useMemo } from 'react';
import { Plus, Search, Grid3X3, List, Shield, Key, AlertTriangle, Loader2 } from 'lucide-react';
import { useVaultStore } from '../stores/vaultStore';
import { PasswordCard } from '../components/ui/PasswordCard';
import { PasswordForm } from '../components/PasswordForm';
import { Sidebar } from '../components/Sidebar';
import { VaultScanner } from '../components/VaultScanner';
import { calculateStrength } from '../crypto/vault';
import { cn } from '../lib/utils';
import { SecurityInfo } from '../components/SecurityInfo';
export function Dashboard() {
  const { passwords, searchQuery, setSearchQuery, viewMode, setViewMode, getFilteredPasswords, isLoading, deletePassword, toggleFavorite } = useVaultStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const filtered = getFilteredPasswords();

  const stats = useMemo(() => {
    const weak = passwords.filter(p => calculateStrength(p.password).score <= 4).length;
    return { total: passwords.length, weak, strong: passwords.length - weak };
  }, [passwords]);

  return (
    <div className="flex h-screen bg-surface-0">
      <Sidebar onAddPassword={() => setShowAdd(true)} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-0">
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Vault</h1>
            <p className="text-xs text-text-tertiary">{stats.total} passwords</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..."
                className="w-56 pl-9 pr-3 py-1.5 text-sm rounded-lg border border-border bg-surface-1 focus:outline-none focus:border-brand-500 transition-colors" />
            </div>
            <div className="flex items-center gap-0.5 bg-surface-1 p-0.5 rounded-lg border border-border">
              {[['grid', Grid3X3], ['list', List]].map(([v, Icon]) => (
                <button key={v} onClick={() => setViewMode(v)} className={cn("p-1.5 rounded-md transition-colors",
                  viewMode === v ? "bg-surface-0 shadow-sm text-text-primary" : "text-text-tertiary hover:text-text-secondary"
                )}><Icon className="w-4 h-4" /></button>
              ))}
            </div>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors">
              <Plus className="w-4 h-4" />Add
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Key} label="Total" value={stats.total} color="text-brand-500" />
            <StatCard icon={Shield} label="Strong" value={stats.strong} color="text-green-500" />
            <StatCard icon={AlertTriangle} label="Weak" value={stats.weak} color="text-amber-500" />
          </div>

          <VaultScanner />
<SecurityInfo />
          {/* List */}
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-text-tertiary animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Key className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm font-medium text-text-primary">{searchQuery ? 'No results' : 'No passwords yet'}</p>
              <p className="text-xs text-text-tertiary mt-1">{searchQuery ? 'Try another search' : 'Add your first password'}</p>
              {!searchQuery && (
                <button onClick={() => setShowAdd(true)} className="mt-3 px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-lg transition-colors">
                  <Plus className="w-4 h-4 inline mr-1" />Add password
                </button>
              )}
            </div>
          ) : (
            <div className={cn(viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3" : "space-y-2")}>
              {filtered.map(pw => (
                <PasswordCard key={pw.id} password={pw} viewMode={viewMode}
                  onEdit={p => { setEditing(p); setShowAdd(true); }}
                  onDelete={() => setDeleting(pw.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {showAdd && <PasswordForm isOpen={showAdd} onClose={() => { setShowAdd(false); setEditing(null); }} editingPassword={editing} />}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setDeleting(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-xs bg-surface-0 rounded-xl p-5 shadow-2xl border border-border">
            <h3 className="text-sm font-semibold mb-1">Delete password?</h3>
            <p className="text-xs text-text-secondary mb-4">This can't be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleting(null)} className="flex-1 py-1.5 text-sm rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors">Cancel</button>
              <button onClick={() => { deletePassword(deleting); setDeleting(null); }} className="flex-1 py-1.5 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-surface-0">
      <div className={cn("p-2 rounded-lg bg-surface-1", color)}><Icon className="w-5 h-5" /></div>
      <div>
        <p className="text-xl font-bold tabular-nums text-text-primary">{value}</p>
        <p className="text-xxs text-text-tertiary">{label}</p>
      </div>
    </div>
  );
}
