import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const isDark = document.documentElement.classList.contains('dark');

  const toggle = () => {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('securevault-theme', next);
    // Force re-render by dispatching event
    window.dispatchEvent(new Event('theme-change'));
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
