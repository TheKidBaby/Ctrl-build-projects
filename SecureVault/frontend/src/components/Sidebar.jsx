import { 
  Shield, Key, Star, Clock, 
  Settings, LogOut, Plus,
  Users, CreditCard, ShoppingCart, Briefcase,
  Mail, PlayCircle, Globe
} from 'lucide-react';
import { useVaultStore } from '../stores/vaultStore';
import { cn } from '../lib/utils';

const CATEGORY_ICONS = {
  'users': Users,
  'credit-card': CreditCard,
  'shopping-cart': ShoppingCart,
  'briefcase': Briefcase,
  'mail': Mail,
  'play-circle': PlayCircle,
  'globe': Globe
};

export function Sidebar({ onAddPassword }) {
  const { 
    categories, 
    passwords,
    selectedCategory, 
    setSelectedCategory,
    logout 
  } = useVaultStore();

  const stats = {
    total: passwords.length,
    favorites: passwords.filter(p => p.favorite).length,
    recent: passwords.filter(p => {
      const week = 7 * 24 * 60 * 60 * 1000;
      return Date.now() - p.updatedAt < week;
    }).length
  };

  const getCategoryIcon = (iconName) => {
    const Icon = CATEGORY_ICONS[iconName] || Globe;
    return Icon;
  };

  return (
    <aside className="w-64 h-screen flex flex-col bg-white dark:bg-dark-900 border-r border-dark-200 dark:border-dark-800">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-vault-400 to-emerald-500 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-xl text-dark-900 dark:text-white">
              SecureVault
            </h1>
            <p className="text-xs text-dark-500">Password Manager</p>
          </div>
        </div>
      </div>

      <div className="px-4 mb-4">
        <button
          onClick={onAddPassword}
          className="w-full btn btn-primary py-2.5"
        >
          <Plus className="w-5 h-5" />
          Add Password
        </button>
      </div>

      <div className="px-4 mb-6">
        <p className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-2 px-2">
          Quick Access
        </p>
        <nav className="space-y-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
              !selectedCategory
                ? "bg-vault-500/10 text-vault-600 dark:text-vault-400"
                : "text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800"
            )}
          >
            <div className="flex items-center gap-3">
              <Key className="w-4 h-4" />
              <span className="text-sm font-medium">All Passwords</span>
            </div>
            <span className="text-xs bg-dark-200 dark:bg-dark-700 px-2 py-0.5 rounded-full">
              {stats.total}
            </span>
          </button>

          <button
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium">Favorites</span>
            </div>
            <span className="text-xs bg-dark-200 dark:bg-dark-700 px-2 py-0.5 rounded-full">
              {stats.favorites}
            </span>
          </button>

          <button
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Recently Used</span>
            </div>
            <span className="text-xs bg-dark-200 dark:bg-dark-700 px-2 py-0.5 rounded-full">
              {stats.recent}
            </span>
          </button>
        </nav>
      </div>

      <div className="flex-1 px-4 overflow-y-auto">
        <p className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-2 px-2">
          Categories
        </p>
        <nav className="space-y-1">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.icon);
            const count = passwords.filter(p => p.categoryId === category.id).length;
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
                  selectedCategory === category.id
                    ? "bg-vault-500/10 text-vault-600 dark:text-vault-400"
                    : "text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" style={{ color: category.color }} />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                <span className="text-xs bg-dark-200 dark:bg-dark-700 px-2 py-0.5 rounded-full">
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-dark-200 dark:border-dark-800">
        <div className="flex items-center gap-2">
          <button
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center justify-center p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
