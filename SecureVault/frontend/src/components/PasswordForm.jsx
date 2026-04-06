import { useState, useEffect } from 'react';
import { X, Globe, User, Lock, Eye, EyeOff, Folder, FileText, Wand2, Save } from 'lucide-react';
import { PasswordGenerator } from './PasswordGenerator';
import { BreachChecker } from './BreachChecker';
import { calculateStrength } from '../crypto/vault';
import { useVaultStore } from '../stores/vaultStore';

export function PasswordForm({ isOpen, onClose, editingPassword = null }) {
  const { categories, addPassword, updatePassword } = useVaultStore();
  const [form, setForm] = useState({ website: '', username: '', password: '', categoryId: '', notes: '' });
  const [showPw, setShowPw] = useState(false);
  const [showGen, setShowGen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const strength = calculateStrength(form.password);

  useEffect(() => {
    if (editingPassword) {
      setForm({ website: editingPassword.website || '', username: editingPassword.username || '', password: editingPassword.password || '', categoryId: editingPassword.categoryId || '', notes: editingPassword.notes || '' });
    } else {
      setForm({ website: '', username: '', password: '', categoryId: '', notes: '' });
    }
    setShowGen(false);
    setError(null);
  }, [editingPassword, isOpen]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = editingPassword ? await updatePassword(editingPassword.id, form) : await addPassword(form);
      result.success ? onClose() : setError(result.error);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in" />
      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-surface-0 rounded-xl shadow-2xl border border-border animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-border bg-surface-0">
          <h2 className="text-base font-semibold">{editingPassword ? 'Edit' : 'New'} password</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-surface-2 text-text-tertiary"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

          <Field icon={Globe} label="Website" value={form.website} onChange={v => setForm(f => ({ ...f, website: v }))} placeholder="example.com" required />
          <Field icon={User} label="Username / Email" value={form.username} onChange={v => setForm(f => ({ ...f, username: v }))} placeholder="john@example.com" />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-text-secondary">Password</label>
              <button type="button" onClick={() => setShowGen(!showGen)} className="text-xxs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
                <Wand2 className="w-3 h-3" />{showGen ? 'Hide' : 'Generate'}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••" className="w-full pl-9 pr-9 py-2 text-sm font-mono rounded-lg border border-border bg-surface-0 focus:outline-none focus:border-brand-500 transition-colors" required />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.password && (
              <div className="mt-1.5">
                <div className="flex justify-between mb-0.5">
                  <span className="text-xxs text-text-tertiary">Strength</span>
                  <span className="text-xxs font-medium" style={{ color: strength.color }}>{strength.label}</span>
                </div>
                <div className="h-1 rounded-full bg-surface-3 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${strength.percentage}%`, backgroundColor: strength.color }} />
                </div>
              </div>
            )}
          </div>

          {form.password && <BreachChecker password={form.password} />}

          {showGen && (
            <div className="p-3 rounded-lg bg-surface-1 border border-border">
              <PasswordGenerator onSelect={pw => { setForm(f => ({ ...f, password: pw })); setShowGen(false); }} />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Category</label>
            <div className="relative">
              <Folder className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-surface-0 focus:outline-none focus:border-brand-500 appearance-none cursor-pointer transition-colors">
                <option value="">None</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Notes</label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-4 h-4 text-text-tertiary" />
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes..." rows={2} className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-surface-0 focus:outline-none focus:border-brand-500 resize-none transition-colors" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-sm font-medium rounded-lg bg-surface-2 hover:bg-surface-3 text-text-secondary transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2 text-sm font-medium rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-50">
              {submitting ? '...' : <><Save className="w-4 h-4 inline mr-1" />{editingPassword ? 'Update' : 'Save'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="text-xs font-medium text-text-secondary mb-1.5 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-surface-0 focus:outline-none focus:border-brand-500 transition-colors" />
      </div>
    </div>
  );
}
