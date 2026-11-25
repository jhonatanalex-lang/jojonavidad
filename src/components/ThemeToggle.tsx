import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { ThemeMode } from '../lib/theme';

interface ThemeToggleProps {
  theme: ThemeMode;
  onToggle: () => void;
  compact?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onToggle,
  compact = false,
  className = '',
}) => {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={isDark ? 'Tema claro' : 'Tema oscuro'}
      className={`min-h-[40px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-white/90 dark:bg-[#233D38] text-xs font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] hover:border-[#D96857] dark:hover:border-[#F2D5A0] hover:text-[#2B4B46] dark:hover:text-[#F2D5A0] active:scale-[0.97] transition-all whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1.5 ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-[#F2D5A0] shrink-0" />
      ) : (
        <Moon className="h-4 w-4 text-[#2F4E49] shrink-0" />
      )}
      {!compact && (
        <span className="hidden sm:inline">
          {isDark ? 'Claro' : 'Oscuro'}
        </span>
      )}
    </button>
  );
};
