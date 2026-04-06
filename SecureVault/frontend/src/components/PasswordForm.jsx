import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Globe, User, Lock, Eye, EyeOff, 
  Folder, FileText, Wand2, Save
} from 'lucide-react';
import { PasswordGenerator } from './PasswordGenerator';
import { calculateStrength } from '../crypto/vault';
import { useVaultStore } from '../stores/vaultStore';
import { cn } from '../lib/utils';
import { BreachChecker } from './BreachChecker';

export function PasswordForm({ isOpen, onClose, editingPassword = null }) {
  const { categories, addPassword, updatePassword } = useVaultStore();
  
  const [formData, setFormData] = useState({
    website: '',
    username: '',
    password: '',
    categoryId: '',
    notes: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const strength = calculateStrength(formData.password);

  useEffect(() => {
    if (editingPassword) {
      setFormData({
        website: editingPassword.website || '',
        username: editingPassword.username || '',
        password: editingPassword.password || '',
        categoryId: editingPassword.categoryId || '',
        notes: editingPassword.notes || ''
      });
    } else {
      setFormData({
        website: '',
        username: '',
        password: '',
        categoryId: '',
        notes: ''
      });
    }
    setShowGenerator(false);
    setError(null);
  }, [editingPassword, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let result;
      if (editingPassword) {
        result = await updatePassword(editingPassword.id, formData);
      } else {
        result = await addPassword(formData);
      }

      if (result.success) {
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSelect = (password) => {
    setFormData(f => ({ ...f, password }));
    setShowGenerator(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-dark-800 rounded-2xl shadow-2xl"
      >
        <div className="sticky top-0 flex items-center justify-between p-6 pb-4 border-b border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 z-10">
          <h2 className="text-xl font-semibold text-dark-900 dark:text-white">
            {editingPassword ? 'Edit Password' : 'Add New Password'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
          >
            <X className="w-5 h-5 text-dark-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              Website
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData(f => ({ ...f, website: e.target.value }))}
                placeholder="example.com"
                className="input-base pl-11"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              Username / Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(f => ({ ...f, username: e.target.value }))}
                placeholder="john@example.com"
                className="input-base pl-11"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-dark-700 dark:text-dark-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowGenerator(!showGenerator)}
                className="flex items-center gap-1 text-xs text-vault-500 hover:text-vault-600 font-medium"
              >
                <Wand2 className="w-3.5 h-3.5" />
                {showGenerator ? 'Hide Generator' : 'Generate'}
              </button>
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••••••"
                className="input-base pl-11 pr-11 font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-dark-100 dark:hover:bg-dark-700 rounded"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-dark-400" />
                ) : (
                  <Eye className="w-4 h-4 text-dark-400" />
                )}
              </button>
            </div>

            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-dark-400">Strength</span>
                  <span className="text-xs font-medium" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden bg-dark-200 dark:bg-dark-700">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${strength.percentage}%`,
                      backgroundColor: strength.color 
                    }}
                  />
                </div>
              </div>
            )}

            {formData.password && (
              <div className="mt-3">
                <BreachChecker 
                  password={formData.password}
                  onResult={(result) => {
                    if (result.breached && result.severity === 'critical') {
                      console.warn('Critical breach detected:', result);
                    }
                  }}
                />
              </div>
            )}
          </div>

          {showGenerator && (
            <div className="p-4 rounded-xl bg-dark-50 dark:bg-dark-900 border border-dark-200 dark:border-dark-700">
              <PasswordGenerator onSelect={handlePasswordSelect} />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              Category
            </label>
            <div className="relative">
              <Folder className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData(f => ({ ...f, categoryId: e.target.value }))}
                className="input-base pl-11 appearance-none cursor-pointer"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              Notes
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-dark-400" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                placeholder="Additional notes..."
                rows={3}
                className="input-base pl-11 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn btn-primary py-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {editingPassword ? 'Update' : 'Save'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
