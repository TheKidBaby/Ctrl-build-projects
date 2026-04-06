import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, EyeOff, Copy, Pencil, Trash2, Star, 
  ExternalLink, MoreVertical, Clock, Shield
} from 'lucide-react';
import { calculateStrength } from '../../crypto/vault';
import { cn, formatRelativeTime, copyToClipboard } from '../../lib/utils';

export function PasswordCard({ password, onEdit, onDelete, onToggleFavorite, viewMode = 'grid' }) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  
  const strength = calculateStrength(password.password);

  const handleCopy = async (text, type) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const openWebsite = () => {
    let url = password.website;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    window.open(url, '_blank');
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "group flex items-center gap-4 p-4 rounded-xl",
          "bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700",
          "hover:border-vault-500/30 hover:shadow-lg transition-all duration-200"
        )}
      >
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-dark-100 dark:bg-dark-700 flex-shrink-0 flex items-center justify-center">
          <div 
            className="w-full h-full flex items-center justify-center text-white font-semibold text-lg"
            style={{ backgroundColor: strength.color }}
          >
            {password.website?.charAt(0).toUpperCase() || '?'}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-dark-900 dark:text-white truncate">
              {password.website || 'Untitled'}
            </h3>
            {password.favorite && (
              <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-dark-500 dark:text-dark-400 truncate">
            {password.username || 'No username'}
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <code className="font-mono text-sm bg-dark-100 dark:bg-dark-700 px-3 py-1.5 rounded-lg text-dark-700 dark:text-dark-300">
            {showPassword ? password.password : '••••••••••••'}
          </code>
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-dark-400" />
            ) : (
              <Eye className="w-4 h-4 text-dark-400" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleCopy(password.password, 'password')}
            className={cn(
              "p-2 rounded-lg transition-colors",
              copied === 'password' 
                ? "bg-vault-500 text-white"
                : "hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-400"
            )}
            title="Copy password"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={() => onEdit(password)}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-400 transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>

          <button
            onClick={openWebsite}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-400 transition-colors"
            title="Open website"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-400 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[160px] bg-white dark:bg-dark-800 rounded-xl border border-dark-200 dark:border-dark-700 shadow-xl py-1">
                  <button
                    onClick={() => {
                      handleCopy(password.username, 'username');
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300"
                  >
                    <Copy className="w-4 h-4" />
                    Copy username
                  </button>
                  <button
                    onClick={() => {
                      onToggleFavorite(password.id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300"
                  >
                    <Star className={cn("w-4 h-4", password.favorite && "fill-amber-500 text-amber-500")} />
                    {password.favorite ? 'Unfavorite' : 'Favorite'}
                  </button>
                  <hr className="my-1 border-dark-200 dark:border-dark-700" />
                  <button
                    onClick={() => {
                      onDelete(password.id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group relative p-6 rounded-2xl",
        "bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700",
        "hover:border-vault-500/30 hover:shadow-xl hover:-translate-y-1",
        "transition-all duration-300"
      )}
    >
      <button
        onClick={() => onToggleFavorite(password.id)}
        className="absolute top-4 right-4 p-1"
      >
        <Star className={cn(
          "w-5 h-5 transition-colors",
          password.favorite 
            ? "text-amber-500 fill-amber-500" 
            : "text-dark-300 dark:text-dark-600 hover:text-amber-500"
        )} />
      </button>

      <div className="flex items-start gap-4 mb-6">
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
          style={{ backgroundColor: strength.color }}
        >
          {password.website?.charAt(0).toUpperCase() || '?'}
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <h3 className="font-semibold text-lg text-dark-900 dark:text-white truncate">
            {password.website || 'Untitled'}
          </h3>
          <p className="text-sm text-dark-500 dark:text-dark-400 truncate">
            {password.username || 'No username'}
          </p>
        </div>
      </div>

      <div className="relative mb-4">
        <div className="flex items-center gap-2 p-3 bg-dark-50 dark:bg-dark-900/50 rounded-xl border border-dark-200 dark:border-dark-700">
          <code className="flex-1 font-mono text-sm text-dark-700 dark:text-dark-300 truncate">
            {showPassword ? password.password : '••••••••••••••••'}
          </code>
          
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-dark-700 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-dark-400" />
            ) : (
              <Eye className="w-4 h-4 text-dark-400" />
            )}
          </button>
          
          <button
            onClick={() => handleCopy(password.password, 'password')}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              copied === 'password'
                ? "bg-vault-500 text-white"
                : "hover:bg-white dark:hover:bg-dark-700 text-dark-400"
            )}
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        
        {copied && (
          <span className="absolute -top-2 right-2 text-xs bg-vault-500 text-white px-2 py-0.5 rounded-full">
            Copied!
          </span>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-dark-500 dark:text-dark-400">
            Strength
          </span>
          <span 
            className="text-xs font-semibold"
            style={{ color: strength.color }}
          >
            {strength.label}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-dark-200 dark:bg-dark-700">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${strength.percentage}%` }}
            style={{ backgroundColor: strength.color }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-dark-400 mb-4">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatRelativeTime(password.updatedAt)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5" />
          <span>{password.useCount || 0} uses</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-dark-200 dark:border-dark-700">
        <button
          onClick={() => onEdit(password)}
          className="flex-1 btn btn-secondary text-sm py-2"
        >
          <Pencil className="w-4 h-4" />
          Edit
        </button>
        
        <button
          onClick={openWebsite}
          className="flex-1 btn btn-primary text-sm py-2"
        >
          <ExternalLink className="w-4 h-4" />
          Open
        </button>
      </div>
    </motion.div>
  );
}
