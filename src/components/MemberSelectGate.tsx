import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { isExampleMemberId } from '../lib/firestoreService';
import { ThemeMode } from '../lib/theme';
import { FamilyGroup, MemberProfile, UserAccount } from '../types/wishlist';
import { normalizeMemberName, normalizePhoneDigits } from '../lib/validation';
import { ThemeToggle } from './ThemeToggle';
import {
  FestiveInputShell,
  HolidayMedallion,
  ScallopedSnowEdge,
} from './FestiveDecor';

interface MemberSelectGateProps {
  group: FamilyGroup | null;
  familyCode: string;
  currentUid: string;
  activeAccount: UserAccount | null;
  isAdmin: boolean;
  members: MemberProfile[];
  isSubmitting: boolean;
  errorMsg: string | null;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onEnterWithName: (name: string, phone?: string) => void;
  onChangeGroup: () => void;
}

export const MemberSelectGate: React.FC<MemberSelectGateProps> = ({
  group,
  familyCode,
  currentUid,
  activeAccount,
  isAdmin,
  members,
  isSubmitting,
  errorMsg,
  theme,
  onToggleTheme,
  onEnterWithName,
  onChangeGroup,
}) => {
  const [typedName, setTypedName] = useState(activeAccount?.displayName || '');
  const [typedPhone, setTypedPhone] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeAccount?.displayName && !typedName) {
      setTypedName(activeAccount.displayName);
    }
  }, [activeAccount?.displayName, typedName]);

  const realMembers = members.filter((m) => !isExampleMemberId(m.id));
  const isOwnedByCurrentUser = (m: MemberProfile) =>
    m.ownerUid === currentUid ||
    Boolean(activeAccount && m.accountId === activeAccount.accountId);

  const myLinkedProfiles = realMembers.filter(isOwnedByCurrentUser);
  const selectableProfiles = realMembers.filter(
    (m) => isOwnedByCurrentUser(m) || m.ownerUid === 'UNCLAIMED' || isAdmin
  );

  const isCreator = Boolean(
    group &&
      (group.creatorUid === currentUid ||
        Boolean(activeAccount && group.creatorAccountId === activeAccount.accountId))
  );
  const capacityReached = Boolean(
    group && realMembers.length >= group.expectedMembers
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeMemberName(typedName);
    if (!clean || clean.length < 2) {
      setLocalError('Ingresa tu nombre (mínimo 2 caracteres).');
      return;
    }

    if (!activeAccount) {
      const digits = normalizePhoneDigits(typedPhone);
      if (digits.length < 7 || digits.length > 15) {
        setLocalError('Ingresa un número de celular válido (entre 7 y 15 dígitos).');
        phoneInputRef.current?.focus();
        return;
      }
    }

    const existsAlready = members.some((m) => m.member === clean);
    if (capacityReached && !existsAlready && !isAdmin && !isCreator) {
      setLocalError(
        `Cupo completo (${group?.expectedMembers} participantes). Pide al creador ampliarlo.`
      );
      return;
    }

    setLocalError(null);
    onEnterWithName(clean, activeAccount ? undefined : typedPhone);
  };

  const handleQuickProfileSelect = (memberName: string) => {
    if (activeAccount) {
      setLocalError(null);
      onEnterWithName(memberName);
      return;
    }

    const digits = normalizePhoneDigits(typedPhone);
    if (digits.length >= 7 && digits.length <= 15) {
      setLocalError(null);
      onEnterWithName(memberName, typedPhone);
      return;
    }

    setTypedName(memberName);
    setLocalError('Ahora ingresa tu celular para guardar tu acceso desde cualquier equipo.');
    phoneInputRef.current?.focus();
  };

  const activeError = localError || errorMsg;

  return (
    <div className="min-h-[100dvh] bg-[#F3F6F4] dark:bg-[#192D2A] flex flex-col justify-center px-4 py-8">
      <div className="max-w-md w-full mx-auto rounded-3xl bg-white dark:bg-[#223B37] border border-[#D8E2DE] dark:border-[#34534D] overflow-hidden shadow-lg shadow-[#1A2E2B]/8 dark:shadow-black/35">
        {/* Pine-teal festive cap with 3D medallion & scalloped snow trim */}
        <div className="relative bg-gradient-to-br from-[#2C4B46] via-[#355953] to-[#26423D] px-5 pt-4 pb-8 text-[#FBF3E4]">
          <div className="flex items-center justify-between gap-2 mb-4">
            <button
              type="button"
              onClick={onChangeGroup}
              className="min-h-[40px] -ml-2 px-2.5 rounded-full text-xs font-semibold text-[#F2D5A0] hover:bg-white/10 inline-flex items-center gap-1 whitespace-nowrap"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Cambiar grupo</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#D7E4E0] tabular-nums">
                {familyCode}
                {group ? ` · ${realMembers.length}/${group.expectedMembers}` : ''}
              </span>
              <ThemeToggle theme={theme} onToggle={onToggleTheme} compact />
            </div>
          </div>

          <div className="flex flex-col items-center text-center gap-2.5">
            <HolidayMedallion object="sleigh" size="md" />
            <div>
              <p className="text-xs font-semibold text-[#F2D5A0] truncate">
                {group?.name || familyCode}
              </p>
              <h1 className="font-display text-2xl font-bold text-[#FFFBF4] mt-0.5">
                {activeAccount ? '¿Cómo entras al grupo?' : '¿Cuál es tu nombre?'}
              </h1>
            </div>
          </div>

          <div className="absolute bottom-0 inset-x-0 pointer-events-none">
            <ScallopedSnowEdge className="text-white dark:text-[#223B37]" />
          </div>
        </div>

        <div className="p-6 sm:p-7 space-y-5">
          {activeError && (
            <div
              role="alert"
              className="rounded-2xl border border-[#D96857]/40 bg-[#D96857]/8 dark:bg-[#2F2120] px-4 py-3 text-sm text-[#C45544] dark:text-[#F29C8E]"
            >
              {activeError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="member-login-input" className="sr-only">
                Tu nombre
              </label>
              <FestiveInputShell ornament="bauble">
                <input
                  id="member-login-input"
                  type="text"
                  value={typedName}
                  onChange={(e) => {
                    setTypedName(e.target.value.toUpperCase());
                    setLocalError(null);
                  }}
                  placeholder="TU NOMBRE"
                  maxLength={60}
                  className="w-full min-h-[54px] pl-11 pr-11 py-3 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-center text-lg font-bold uppercase tracking-wider text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0] transition-colors"
                  required
                />
              </FestiveInputShell>
            </div>

            {!activeAccount ? (
              <div className="space-y-2">
                <label htmlFor="member-phone-input" className="sr-only">
                  Tu celular
                </label>
                <FestiveInputShell ornament="star">
                  <input
                    ref={phoneInputRef}
                    id="member-phone-input"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={typedPhone}
                    onChange={(e) => {
                      setTypedPhone(e.target.value);
                      setLocalError(null);
                    }}
                    placeholder="TU CELULAR (EJ. 987654321)"
                    maxLength={20}
                    className="w-full min-h-[52px] pl-11 pr-11 py-3 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-center text-base font-mono font-semibold tracking-wider text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0] transition-colors"
                    required
                  />
                </FestiveInputShell>
                <p className="flex items-start gap-1.5 px-1 text-xs text-[#556D68] dark:text-[#BDD0CB] leading-relaxed">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#2F4E49] dark:text-[#F2D5A0]" />
                  <span>
                    Con tu nombre y celular podrás abrir tus grupos desde otro celular o navegador. Tu número se cifra y nadie lo verá.
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-center text-xs text-[#556D68] dark:text-[#BDD0CB]">
                Acceso rápido activo · <strong className="text-[#1A2E2B] dark:text-[#FBF3E4]">{activeAccount.displayName}</strong>
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[52px] px-5 py-3 rounded-full bg-[#D96857] hover:bg-[#C45544] dark:bg-[#DE705E] dark:hover:bg-[#EA7E6C] text-[#FFFBF5] text-sm font-bold tracking-wide shadow-md shadow-[#D96857]/25 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserCheck className="h-4 w-4" />
              )}
              <span>{isSubmitting ? 'Entrando…' : 'Entrar'}</span>
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {selectableProfiles.length > 0 && (
            <div className="pt-4 border-t border-[#D8E2DE] dark:border-[#34534D] space-y-2.5">
              <p className="text-xs font-semibold text-[#556D68] dark:text-[#BDD0CB]">
                {myLinkedProfiles.length > 0
                  ? 'Entrar directo como'
                  : 'Nombres disponibles'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {selectableProfiles.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleQuickProfileSelect(m.member)}
                    className="min-h-[44px] px-3 py-2 rounded-full border border-[#D8E2DE] dark:border-[#34534D] bg-[#FAFBF9] dark:bg-[#1C3330] text-xs font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] hover:border-[#D96857] dark:hover:border-[#F2D5A0] hover:text-[#D96857] dark:hover:text-[#F2D5A0] transition-colors truncate disabled:opacity-60"
                  >
                    {m.member}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
