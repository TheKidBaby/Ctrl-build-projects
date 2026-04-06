import { 
  Shield, Key, Star, Clock, Settings, LogOut, Plus,
  Users, CreditCard, ShoppingCart, Briefcase,
  Mail, PlayCircle, Globe
} from 'lucide-react';
import { useVaultStore } from '../stores/vaultStore';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '../lib/utils';

const ICONS = {
  'users': Users, 'credit-card': CreditCard, 'shopping-cart': ShoppingCart,
  'briefcase': Briefcase, 'mail': Mail, 'play-circle': PlayCircle, 'globe': Globe
};

export function Sidebar({ onAddPassword }) {
  const { categories, passwords, selectedCategory, setSelectedCategory, logout } = useVaultStore();

  const counts = {
    total: passwords.length,
    favorites: passwords.filter(p => p.favorite).length,
  };

  return (
    <aside className="w-60 h-screen flex flex-col bg-surface-1 border-r border-border">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <span className="font-serif font-bold text-lg tracking-tight text-text-primary">SecureVault</span>
      </div>

      {/* Add */}
      <div className="px-3 mb-5">
        <button onClick={onAddPassword} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          New password
        </button>
      </div>

      {/* Nav */}
      <nav className="px-3 space-y-0.5 mb-6">
        <SidebarItem icon={Key} label="All" count={counts.total} active={!selectedCategory} onClick={() => setSelectedCategory(null)} />
        <SidebarItem icon={Star} label="Favorites" count={counts.favorites} onClick={() => {}} />
        <SidebarItem icon={Clock} label="Recent" onClick={() => {}} />
      </nav>

      {/* Categories */}
      <div className="px-3 flex-1 overflow-y-auto">
        <p className="px-2 mb-2 text-xxs font-medium uppercase tracking-widest text-text-tertiary">Categories</p>
        <div className="space-y-0.5">
          {categories.map(cat => {
            const Icon = ICONS[cat.icon] || Globe;
            const count = passwords.filter(p => p.categoryId === cat.id).length;
            return (
              <SidebarItem
                key={cat.id}
                icon={Icon}
                iconColor={cat.color}
                label={cat.name}
                count={count}
                active={selectedCategory === cat.id}
                onClick={() => setSelectedCategory(cat.id)}
              />
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border flex items-center justify-between">
        <ThemeToggle />
        <button onClick={logout} className="p-2 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-surface-2 transition-colors" title="Logout">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ icon: Icon, iconColor, label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm transition-colors",
        active
          ? "bg-surface-2 text-text-primary font-medium"
          : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
      )}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4" style={iconColor ? { color: iconColor } : undefined} />
        <span>{label}</span>
      </div>
      {count !== undefined && (
        <span className="text-xxs text-text-tertiary tabular-nums">{count}</span>
      )}
    </button>
  );
}
