import React, { useState } from 'react';
import { MemberProfile } from '../types/wishlist';
import {
  FestiveInputShell,
  HolidayMedallion,
  ScallopedSnowEdge,
} from './FestiveDecor';

interface SizesPromptModalProps {
  open: boolean;
  memberProfile: MemberProfile | null;
  onSave: (profile: MemberProfile) => void;
  onSkip: () => void;
}

export const SizesPromptModal: React.FC<SizesPromptModalProps> = ({
  open,
  memberProfile,
  onSave,
  onSkip,
}) => {
  const [casaca, setCasaca] = useState('');
  const [polo, setPolo] = useState('');
  const [chompa, setChompa] = useState('');
  const [pantalon, setPantalon] = useState('');
  const [zapatillas, setZapatillas] = useState('');

  if (!open || !memberProfile) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...memberProfile,
      casaca: casaca.trim(),
      polo: polo.trim(),
      chompa: chompa.trim(),
      pantalon: pantalon.trim(),
      zapatillas: zapatillas.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-[#0F1E1C]/60 dark:bg-black/70 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md max-h-[90dvh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#223B37] border border-[#D8E2DE] dark:border-[#34534D] shadow-2xl overflow-hidden">
        <div className="relative bg-gradient-to-br from-[#2C4B46] via-[#345852] to-[#26423D] pt-2.5 sm:pt-4 px-5 sm:px-6 pb-6 shrink-0 text-[#FBF3E4]">
          <div className="w-10 h-1 rounded-full bg-white/30 mx-auto mb-3 sm:hidden" />
          <div className="flex items-center gap-3">
            <HolidayMedallion object="tree" size="xs" />
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#FFFBF4]">
                ¡Hola, {memberProfile.member}!
              </h2>
              <p className="text-xs text-[#D7E4E0]">
                Deja tus tallas para tu Amigo Secreto.
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 inset-x-0 pointer-events-none">
            <ScallopedSnowEdge className="text-white dark:text-[#223B37]" />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-3"
        >
          <FestiveInputShell ornament="tree">
            <input
              type="text"
              maxLength={40}
              value={casaca}
              onChange={(e) => setCasaca(e.target.value)}
              placeholder="Casaca (ej. M)"
              className="w-full min-h-[46px] pl-10 pr-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm font-mono text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0]"
              required
            />
          </FestiveInputShell>

          <FestiveInputShell ornament="bauble">
            <input
              type="text"
              maxLength={40}
              value={polo}
              onChange={(e) => setPolo(e.target.value)}
              placeholder="Polo (ej. M)"
              className="w-full min-h-[46px] pl-10 pr-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm font-mono text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0]"
              required
            />
          </FestiveInputShell>

          <FestiveInputShell ornament="snowflake">
            <input
              type="text"
              maxLength={40}
              value={chompa}
              onChange={(e) => setChompa(e.target.value)}
              placeholder="Chompa (ej. L)"
              className="w-full min-h-[46px] pl-10 pr-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm font-mono text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0]"
              required
            />
          </FestiveInputShell>

          <FestiveInputShell ornament="bell">
            <input
              type="text"
              maxLength={40}
              value={pantalon}
              onChange={(e) => setPantalon(e.target.value)}
              placeholder="Pantalón (ej. 32)"
              className="w-full min-h-[46px] pl-10 pr-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm font-mono text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0]"
              required
            />
          </FestiveInputShell>

          <FestiveInputShell ornament="gift">
            <input
              type="text"
              maxLength={40}
              value={zapatillas}
              onChange={(e) => setZapatillas(e.target.value)}
              placeholder="Zapatillas (ej. 42)"
              className="w-full min-h-[46px] pl-10 pr-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm font-mono text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0]"
              required
            />
          </FestiveInputShell>

          <div className="pt-2 flex flex-col-reverse sm:flex-row gap-2">
            <button
              type="button"
              onClick={onSkip}
              className="min-h-[46px] px-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-white dark:bg-[#284540] text-sm font-medium text-[#556D68] dark:text-[#BDD0CB] hover:text-[#1A2E2B] dark:hover:text-[#FBF3E4]"
            >
              Luego
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[48px] px-5 py-2 rounded-full bg-[#D96857] hover:bg-[#C45544] dark:bg-[#DE705E] dark:hover:bg-[#EA7E6C] text-[#FFFBF5] text-sm font-semibold shadow-md shadow-[#D96857]/25 active:scale-[0.98] transition-all"
            >
              Guardar tallas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
