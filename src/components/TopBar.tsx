import React from 'react';
import {
  ListChecks,
  LogOut,
  Plus,
  Ruler,
  Users,
} from 'lucide-react';
import { ThemeMode } from '../lib/theme';
import { ThemeToggle } from './ThemeToggle';
import { NavidadSecretaLogo } from './FestiveDecor';

export type AppTab = 'upload' | 'list' | 'profile';

interface TopBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  currentMember: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenGroup: () => void;
  onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  currentMember,
  theme,
  onToggleTheme,
  onOpenGroup,
  onLogout,
}) => {
  return (
    <>
      <header className="sticky top-0 z-30 bg-[#F3F6F4]/92 dark:bg-[#192D2A]/92 backdrop-blur-md border-b border-[#D8E2DE] dark:border-[#2E4B46]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-13 sm:h-15 flex items-center justify-between gap-3 lg:gap-8">
          <button
            type="button"
            onClick={() => onSelectTab('list')}
            className="text-[#2B4B46] dark:text-[#F2D5A0] whitespace-nowrap shrink-0 text-left focus-visible:outline-2 focus-visible:outline-[#D96857] dark:focus-visible:outline-[#F2D5A0] rounded"
          >
            <NavidadSecretaLogo variant="compact" />
          </button>

          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-[#556D68] dark:text-[#BDD0CB]"
          >
            <button
              type="button"
              onClick={() => onSelectTab('upload')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-[#D96857] dark:border-[#F2D5A0] text-[#2B4B46] dark:text-[#F2D5A0] font-semibold'
                  : 'border-transparent hover:text-[#1A2E2B] dark:hover:text-[#FBF3E4]'
              }`}
            >
              Mis Deseos
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('list')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                activeTab === 'list'
                  ? 'border-[#D96857] dark:border-[#F2D5A0] text-[#2B4B46] dark:text-[#F2D5A0] font-semibold'
                  : 'border-transparent hover:text-[#1A2E2B] dark:hover:text-[#FBF3E4]'
              }`}
            >
              Lista Familiar
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('profile')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-[#D96857] dark:border-[#F2D5A0] text-[#2B4B46] dark:text-[#F2D5A0] font-semibold'
                  : 'border-transparent hover:text-[#1A2E2B] dark:hover:text-[#FBF3E4]'
              }`}
            >
              Tallas
            </button>
            <button
              type="button"
              onClick={onOpenGroup}
              className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:text-[#1A2E2B] dark:hover:text-[#FBF3E4] transition-colors"
            >
              Grupo
            </button>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="hidden lg:inline text-xs font-medium text-[#556D68] dark:text-[#BDD0CB] truncate max-w-[140px]">
              {currentMember}
            </span>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} compact />
            <button
              type="button"
              onClick={onOpenGroup}
              className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-[#2B4B46] dark:text-[#F2D5A0] hover:bg-[#E4ECE9] dark:hover:bg-[#233D38] transition-colors"
              aria-label="Grupo y QR"
            >
              <Users className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[40px] px-3 sm:px-3.5 py-1.5 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-white/90 dark:bg-[#233D38] text-xs font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] hover:border-[#D96857] dark:hover:border-[#DE705E] hover:text-[#D96857] dark:hover:text-[#F29C8E] transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      <nav
        aria-label="Navegación móvil"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#213834]/95 backdrop-blur-md border-t border-[#D8E2DE] dark:border-[#34534D] h-14 px-2 grid grid-cols-3 items-center pb-[env(safe-area-inset-bottom)]"
      >
        <button
          type="button"
          onClick={() => onSelectTab('upload')}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${
            activeTab === 'upload'
              ? 'text-[#D96857] dark:text-[#F2D5A0] font-semibold'
              : 'text-[#556D68] dark:text-[#BDD0CB]'
          }`}
        >
          <Plus className="h-5 w-5" />
          <span className="text-[10px] tracking-tight whitespace-nowrap">Mis Deseos</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('list')}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${
            activeTab === 'list'
              ? 'text-[#D96857] dark:text-[#F2D5A0] font-semibold'
              : 'text-[#556D68] dark:text-[#BDD0CB]'
          }`}
        >
          <ListChecks className="h-5 w-5" />
          <span className="text-[10px] tracking-tight whitespace-nowrap">Lista</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('profile')}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${
            activeTab === 'profile'
              ? 'text-[#D96857] dark:text-[#F2D5A0] font-semibold'
              : 'text-[#556D68] dark:text-[#BDD0CB]'
          }`}
        >
          <Ruler className="h-5 w-5" />
          <span className="text-[10px] tracking-tight whitespace-nowrap">Tallas</span>
        </button>
      </nav>
    </>
  );
};
