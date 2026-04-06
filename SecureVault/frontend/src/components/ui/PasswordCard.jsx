import { useState } from 'react';
import { Eye, EyeOff, Copy, Pencil, Trash2, Star, ExternalLink, MoreVertical } from 'lucide-react';
import { calculateStrength } from '../../crypto/vault';
import { cn, timeAgo, copyToClipboard } from '../../lib/utils';

export function PasswordCard({ password, onEdit, onDelete, onToggleFavorite, viewMode }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const strength = calculateStrength(password.password);

  const handleCopy = async () => {
    if (await copyToClipboard(password.password)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const openSite = () => {
    let url = password.website;
    if (!/^https?:\/\//.test(url)) url = 'https://' + url;
    window.open(url, '_blank');
  };

  const initial = (password.website || '?')[0].toUpperCase();

  if (viewMode === 'list') {
    return (
      <div className="group flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-border-hover bg-surface-0 transition-all animate-in">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0" style={{ background: strength.color + '18', color: strength.color }}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{password.website}</p>
          <p className="text-xs text-text-tertiary truncate">{password.username}</p>
        </div>
        <code className="hidden sm:block text-xs font-mono text-text-secondary bg-surface-2 px-2 py-1 rounded">
          {revealed ? password.password : '•'.repeat(12)}
        </code>
        <div className="flex items-center gap-0.5">
          <IconBtn icon={revealed ? EyeOff : Eye} onClick={() => setRevealed(!revealed)} />
          <IconBtn icon={Copy} onClick={handleCopy} active={copied} />
          <IconBtn icon={Pencil} onClick={() => onEdit(password)} />
          <IconBtn icon={ExternalLink} onClick={openSite} />
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col p-5 rounded-xl border border-border hover:border-border-hover bg-surface-0 transition-all animate-in">
      {/* Head */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold" style={{ background: strength.color + '15', color: strength.color }}>
            {initial}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{password.website}</p>
            <p className="text-xs text-text-tertiary">{password.username}</p>
          </div>
        </div>
        <button onClick={() => onToggleFavorite(password.id)} className="p-1">
          <Star className={cn("w-4 h-4", password.favorite ? "fill-amber-400 text-amber-400" : "text-text-tertiary hover:text-amber-400")} />
        </button>
      </div>

      {/* Password */}
      <div className="flex items-center gap-1.5 bg-surface-1 rounded-lg px-3 py-2 mb-3">
        <code className="flex-1 text-xs font-mono text-text-secondary truncate">
          {revealed ? password.password : '•'.repeat(16)}
        </code>
        <IconBtn size="sm" icon={revealed ? EyeOff : Eye} onClick={() => setRevealed(!revealed)} />
        <IconBtn size="sm" icon={Copy} onClick={handleCopy} active={copied} />
      </div>

      {/* Strength */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xxs text-text-tertiary">Strength</span>
          <span className="text-xxs font-medium" style={{ color: strength.color }}>{strength.label}</span>
        </div>
        <div className="h-1 rounded-full bg-surface-3 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${strength.percentage}%`, backgroundColor: strength.color }} />
        </div>
      </div>

      {/* Meta */}
      <p className="text-xxs text-text-tertiary mb-3">{timeAgo(password.updatedAt)}</p>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <button onClick={() => onEdit(password)} className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-text-secondary transition-colors">
          Edit
        </button>
        <button onClick={openSite} className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors">
          Open
        </button>
      </div>
    </div>
  );
}

function IconBtn({ icon: Icon, onClick, active, size = 'md' }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md transition-colors",
        size === 'sm' ? 'p-1' : 'p-1.5',
        active ? "text-brand-500" : "text-text-tertiary hover:text-text-primary hover:bg-surface-2"
      )}
    >
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
    </button>
  );
}
