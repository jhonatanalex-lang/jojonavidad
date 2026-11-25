import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ChevronRight,
  Home,
  KeyRound,
  Loader2,
  LogOut,
  Minus,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import { FamilyGroup, UserAccount } from '../types/wishlist';
import { ThemeMode } from '../lib/theme';
import {
  normalizeMemberName,
  normalizePhoneDigits,
  sanitizeGroupCodeInput,
} from '../lib/validation';
import { QrCodeBox } from './QrCodeBox';
import { ThemeToggle } from './ThemeToggle';
import {
  FestiveInputShell,
  HolidayMedallion,
  HolidayWorkspaceHero,
  NavidadSecretaLogo,
} from './FestiveDecor';

interface GroupOnboardingScreenProps {
  initialJoinCode: string;
  activeAccount: UserAccount | null;
  myCreatedGroups: FamilyGroup[];
  myJoinedGroups: FamilyGroup[];
  isBusy: boolean;
  errorMsg: string | null;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onJoinByCode: (code: string) => Promise<void>;
  onRecoverWithPhone: (name: string, phone: string) => Promise<void>;
  onLinkAccount: (name: string, phone: string) => Promise<void>;
  onSwitchAccount: () => void;
  onCreateGroup: (
    name: string,
    expectedMembers: number,
    creatorIdentity?: { name: string; phone: string }
  ) => Promise<FamilyGroup>;
  onContinueToGroup: (group: FamilyGroup) => void;
  onBackToWelcome: () => void;
}

export const GroupOnboardingScreen: React.FC<GroupOnboardingScreenProps> = ({
  initialJoinCode,
  activeAccount,
  myCreatedGroups,
  myJoinedGroups,
  isBusy,
  errorMsg,
  theme,
  onToggleTheme,
  onJoinByCode,
  onRecoverWithPhone,
  onLinkAccount,
  onSwitchAccount,
  onCreateGroup,
  onContinueToGroup,
  onBackToWelcome,
}) => {
  const [mode, setMode] = useState<'recover' | 'join' | 'create'>(() => {
    if (initialJoinCode) return 'join';
    return activeAccount ? 'join' : 'recover';
  });
  const [expandedSecondary, setExpandedSecondary] = useState<
    'none' | 'join' | 'create' | 'recover'
  >(initialJoinCode ? 'join' : 'none');

  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [groupName, setGroupName] = useState('');
  const [expectedMembers, setExpectedMembers] = useState(6);

  const [recoverName, setRecoverName] = useState('');
  const [recoverPhone, setRecoverPhone] = useState('');

  const [creatorName, setCreatorName] = useState('');
  const [creatorPhone, setCreatorPhone] = useState('');

  const [backupOpen, setBackupOpen] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [backupPhone, setBackupPhone] = useState('');

  const [createdGroup, setCreatedGroup] = useState<FamilyGroup | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (initialJoinCode) {
      setJoinCode(initialJoinCode);
      setMode('join');
      setExpandedSecondary('join');
    }
  }, [initialJoinCode]);

  useEffect(() => {
    if (activeAccount && mode === 'recover') {
      setMode('join');
    }
    if (activeAccount) {
      setBackupOpen(false);
    }
  }, [activeAccount, mode]);

  const validateNameAndPhone = (rawName: string, rawPhone: string): string | null => {
    const cleanName = normalizeMemberName(rawName);
    if (!cleanName || cleanName.length < 2) {
      return 'Ingresa tu nombre (mínimo 2 caracteres).';
    }
    const digits = normalizePhoneDigits(rawPhone);
    if (digits.length < 7 || digits.length > 15) {
      return 'Ingresa un número de celular válido (entre 7 y 15 dígitos).';
    }
    return null;
  };

  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateNameAndPhone(recoverName, recoverPhone);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError(null);
    try {
      await onRecoverWithPhone(recoverName, recoverPhone);
      setRecoverName('');
      setRecoverPhone('');
      setExpandedSecondary('none');
    } catch {
      // Handled by parent state
    }
  };

  const handleBackupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateNameAndPhone(backupName, backupPhone);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError(null);
    try {
      await onLinkAccount(backupName, backupPhone);
      setBackupName('');
      setBackupPhone('');
      setBackupOpen(false);
    } catch {
      // Handled by parent state
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeGroupCodeInput(joinCode);
    if (clean.length < 3) {
      setLocalError('Ingresa un código válido (mínimo 3 caracteres).');
      return;
    }
    setLocalError(null);
    await onJoinByCode(clean);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = groupName.trim();
    if (trimmed.length < 2) {
      setLocalError('Escribe un nombre para el grupo.');
      return;
    }
    if (expectedMembers < 2 || expectedMembers > 100) {
      setLocalError('Indica entre 2 y 100 participantes.');
      return;
    }
    if (!activeAccount) {
      const identityError = validateNameAndPhone(creatorName, creatorPhone);
      if (identityError) {
        setLocalError(identityError);
        return;
      }
    }
    setLocalError(null);
    try {
      const created = await onCreateGroup(
        trimmed,
        expectedMembers,
        activeAccount ? undefined : { name: creatorName, phone: creatorPhone }
      );
      setCreatedGroup(created);
      setExpandedSecondary('none');
    } catch {
      // Handled by parent state
    }
  };

  const savedGroupsMap = new Map<string, { group: FamilyGroup; isCreator: boolean }>();
  for (const g of myCreatedGroups) {
    savedGroupsMap.set(g.code, { group: g, isCreator: true });
  }
  for (const g of myJoinedGroups) {
    if (!savedGroupsMap.has(g.code)) {
      savedGroupsMap.set(g.code, { group: g, isCreator: false });
    }
  }
  const savedGroups = Array.from(savedGroupsMap.values());
  const hasSavedGroups = savedGroups.length > 0;
  const activeError = localError || errorMsg;

  return (
    <div className="min-h-[100dvh] bg-[#F3F6F4] dark:bg-[#192D2A] flex flex-col">
      <header className="sticky top-0 z-20 border-b border-[#D8E2DE] dark:border-[#2E4B46] bg-[#F3F6F4]/92 dark:bg-[#192D2A]/92 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToWelcome}
            className="text-[#2B4B46] dark:text-[#F2D5A0] whitespace-nowrap shrink-0 text-left rounded focus-visible:outline-2 focus-visible:outline-[#D96857] dark:focus-visible:outline-[#F2D5A0]"
          >
            <NavidadSecretaLogo variant="compact" />
          </button>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} compact />
            <button
              type="button"
              onClick={onBackToWelcome}
              className="min-h-[40px] px-3 py-1.5 rounded-full text-xs font-semibold text-[#556D68] dark:text-[#BDD0CB] hover:text-[#1A2E2B] dark:hover:text-[#FBF3E4] hover:bg-white dark:hover:bg-[#233D38] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Inicio</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-2xl w-full mx-auto space-y-5">
          {createdGroup ? (
            <div className="rounded-3xl bg-white dark:bg-[#223B37] border border-[#D8E2DE] dark:border-[#34534D] p-5 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center gap-4">
                <HolidayMedallion object="cottage" size="md" />
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-semibold text-[#D96857] dark:text-[#F2D5A0]">
                    Grupo creado
                  </p>
                  <h1 className="font-display text-2xl font-bold text-[#1A2E2B] dark:text-[#FBF3E4] text-balance truncate">
                    {createdGroup.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#556D68] dark:text-[#BDD0CB] tabular-nums">
                    {createdGroup.expectedMembers} participantes · Comparte el código o QR
                  </p>
                </div>
              </div>

              <QrCodeBox
                groupCode={createdGroup.code}
                groupName={createdGroup.name}
              />

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCreatedGroup(null);
                    setGroupName('');
                  }}
                  className="min-h-[46px] px-4 py-2.5 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-white dark:bg-[#284540] text-sm font-medium text-[#556D68] dark:text-[#BDD0CB] hover:text-[#1A2E2B] dark:hover:text-[#FBF3E4] whitespace-nowrap"
                >
                  Ver mis grupos
                </button>
                <button
                  type="button"
                  onClick={() => onContinueToGroup(createdGroup)}
                  className="min-h-[50px] px-6 py-3 rounded-full bg-[#D96857] hover:bg-[#C45544] dark:bg-[#DE705E] dark:hover:bg-[#EA7E6C] text-[#FFFBF5] text-sm sm:text-base font-bold shadow-md shadow-[#D96857]/25 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span>Entrar al grupo</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : hasSavedGroups ? (
            <>
              <HolidayWorkspaceHero
                title={savedGroups.length === 1 ? 'Tu grupo' : 'Tus grupos'}
                subtitle="Toca tu grupo para entrar a la lista de deseos."
                metaText={activeAccount ? activeAccount.displayName : undefined}
                object="cottage"
              />

              {activeError && expandedSecondary === 'none' && !backupOpen && (
                <div
                  role="alert"
                  className="rounded-2xl border border-[#D96857]/40 bg-white dark:bg-[#2F2120] px-4 py-3 text-sm text-[#C45544] dark:text-[#F29C8E]"
                >
                  {activeError}
                </div>
              )}

              {/* Legacy Backup Prompt when user has local groups but no linked phone yet */}
              {!activeAccount && (
                <div className="rounded-2xl bg-white dark:bg-[#223B37] border border-[#D8E2DE] dark:border-[#34534D] p-4 sm:p-5 space-y-3">
                  {!backupOpen ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-[#2F4E49]/10 dark:bg-[#355A53] text-[#2F4E49] dark:text-[#F2D5A0] flex items-center justify-center shrink-0 mt-0.5">
                          <Smartphone className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-sm font-bold text-[#1A2E2B] dark:text-[#FBF3E4]">
                            Respalda tus grupos para otros equipos
                          </p>
                          <p className="text-xs text-[#556D68] dark:text-[#BDD0CB] leading-relaxed">
                            Guarda tu nombre y celular una sola vez para abrirlos en cualquier navegador sin recordar códigos.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setLocalError(null);
                          setExpandedSecondary('none');
                          setBackupOpen(true);
                        }}
                        className="min-h-[44px] px-4 py-2 rounded-full bg-[#2F4E49] hover:bg-[#243E3A] dark:bg-[#355E56] dark:hover:bg-[#3F6F66] text-[#FFFBF4] text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
                      >
                        Guardar con mi celular
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleBackupSubmit} className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-[#1A2E2B] dark:text-[#FBF3E4]">
                          Vincular tus grupos actuales
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setBackupOpen(false);
                            setLocalError(null);
                          }}
                          className="min-h-[40px] min-w-[40px] -mr-2 flex items-center justify-center rounded-xl text-[#556D68] dark:text-[#BDD0CB] hover:text-[#1A2E2B] dark:hover:text-[#FBF3E4]"
                          aria-label="Cerrar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {activeError && (
                        <div
                          role="alert"
                          className="rounded-xl border border-[#D96857]/40 bg-[#D96857]/8 dark:bg-[#2F2120] px-3.5 py-2.5 text-xs sm:text-sm text-[#C45544] dark:text-[#F29C8E]"
                        >
                          {activeError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <FestiveInputShell ornament="bauble">
                          <input
                            type="text"
                            value={backupName}
                            onChange={(e) => {
                              setBackupName(e.target.value.toUpperCase());
                              setLocalError(null);
                            }}
                            placeholder="Tu nombre"
                            maxLength={60}
                            className="w-full min-h-[48px] pl-10 pr-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm font-semibold uppercase text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0]"
                            required
                          />
                        </FestiveInputShell>
                        <FestiveInputShell ornament="star">
                          <input
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            value={backupPhone}
                            onChange={(e) => {
                              setBackupPhone(e.target.value);
                              setLocalError(null);
                            }}
                            placeholder="Celular (ej. 987654321)"
                            maxLength={20}
                            className="w-full min-h-[48px] pl-10 pr-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm font-mono text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0]"
                            required
                          />
                        </FestiveInputShell>
                      </div>

                      <p className="flex items-start gap-1.5 text-xs text-[#556D68] dark:text-[#BDD0CB] leading-relaxed">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#2F4E49] dark:text-[#F2D5A0]" />
                        <span>
                          Tu número se cifra en tu dispositivo antes de guardarse y nadie del grupo podrá verlo.
                        </span>
                      </p>

                      <button
                        type="submit"
                        disabled={isBusy}
                        className="w-full min-h-[46px] px-5 py-2.5 rounded-full bg-[#D96857] hover:bg-[#C45544] dark:bg-[#DE705E] dark:hover:bg-[#EA7E6C] text-[#FFFBF5] text-sm font-semibold active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {isBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Smartphone className="h-4 w-4" />
                        )}
                        <span>{isBusy ? 'Guardando…' : 'Guardar respaldo'}</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {savedGroups.map(({ group, isCreator }) => (
                  <button
                    key={group.code}
                    type="button"
                    onClick={() => onContinueToGroup(group)}
                    className="w-full min-h-[84px] p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#223B37] border border-[#D8E2DE] dark:border-[#34534D] hover:border-[#D96857] dark:hover:border-[#F2D5A0] active:scale-[0.99] transition-all flex items-center justify-between gap-3.5 text-left"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <HolidayMedallion
                        object={isCreator ? 'tree' : 'gift'}
                        size="sm"
                      />
                      <div className="min-w-0 space-y-0.5">
                        <p className="font-display text-lg sm:text-xl font-bold text-[#1A2E2B] dark:text-[#FBF3E4] leading-snug truncate">
                          {group.name}
                        </p>
                        <p className="text-xs sm:text-sm text-[#556D68] dark:text-[#BDD0CB] tabular-nums truncate">
                          {isCreator ? 'Organizador' : 'Miembro'} · {group.expectedMembers} pers. ·{' '}
                          <span className="font-mono">{group.code}</span>
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-sm font-bold text-[#D96857] dark:text-[#F2D5A0] whitespace-nowrap shrink-0">
                      <span>Entrar</span>
                      <ChevronRight className="h-5 w-5" />
                    </span>
                  </button>
                ))}
              </div>

              {/* Compact Secondary Join / Create / Recover Section */}
              <div className="pt-2 border-t border-[#D8E2DE] dark:border-[#2E4B46]">
                {expandedSecondary === 'none' ? (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-medium text-[#556D68] dark:text-[#BDD0CB]">
                      ¿Buscas otro grupo?
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setLocalError(null);
                          setBackupOpen(false);
                          setExpandedSecondary('join');
                        }}
                        className="min-h-[44px] px-3 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-white dark:bg-[#223B37] hover:border-[#2F4E49] dark:hover:border-[#F2D5A0] active:scale-[0.98] transition-all text-xs font-semibold text-[#3C5651] dark:text-[#D7E4E0] hover:text-[#1A2E2B] dark:hover:text-[#FBF3E4] inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <KeyRound className="h-3.5 w-3.5 shrink-0" />
                        <span>Unirme con código</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLocalError(null);
                          setBackupOpen(false);
                          setExpandedSecondary('create');
                        }}
                        className="min-h-[44px] px-3 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-white dark:bg-[#223B37] hover:border-[#D96857] dark:hover:border-[#DE705E] active:scale-[0.98] transition-all text-xs font-semibold text-[#3C5651] dark:text-[#D7E4E0] hover:text-[#D96857] dark:hover:text-[#F2D5A0] inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <Plus className="h-3.5 w-3.5 shrink-0" />
                        <span>Crear grupo</span>
                      </button>
                    </div>

                    {activeAccount ? (
                      <div className="flex items-center justify-between gap-2 pt-1 text-xs text-[#556D68] dark:text-[#BDD0CB]">
                        <span className="truncate">
                          Acceso rápido: <strong className="text-[#1A2E2B] dark:text-[#FBF3E4]">{activeAccount.displayName}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={onSwitchAccount}
                          className="min-h-[40px] px-2.5 rounded-full text-xs font-semibold text-[#556D68] dark:text-[#BDD0CB] hover:text-[#D96857] dark:hover:text-[#F2D5A0] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Cambiar persona</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setLocalError(null);
                          setBackupOpen(false);
                          setExpandedSecondary('recover');
                        }}
                        className="w-full min-h-[44px] px-3 py-2 rounded-full border border-dashed border-[#C7D5D0] dark:border-[#3A5C55] text-xs font-semibold text-[#556D68] dark:text-[#BDD0CB] hover:text-[#1A2E2B] dark:hover:text-[#FBF3E4] hover:border-[#2F4E49] dark:hover:border-[#F2D5A0] inline-flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Smartphone className="h-3.5 w-3.5 shrink-0" />
                        <span>Recuperar grupos de otro equipo con mi celular</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 rounded-2xl bg-white dark:bg-[#223B37] border border-[#D8E2DE] dark:border-[#34534D] p-4 sm:p-5 space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-sm font-bold text-[#1A2E2B] dark:text-[#FBF3E4]">
                        {expandedSecondary === 'join'
                          ? 'Unirme con código'
                          : expandedSecondary === 'recover'
                          ? 'Recuperar mis grupos'
                          : 'Crear grupo nuevo'}
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedSecondary('none');
                          setLocalError(null);
                        }}
                        className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-[#556D68] dark:text-[#BDD0CB] hover:text-[#1A2E2B] dark:hover:text-[#FBF3E4] hover:bg-[#F3F6F4] dark:hover:bg-[#2A4742]"
                        aria-label="Cerrar"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {activeError && (
                      <div
                        role="alert"
                        className="rounded-xl border border-[#D96857]/40 bg-[#D96857]/8 dark:bg-[#2F2120] px-3.5 py-2.5 text-xs sm:text-sm text-[#C45544] dark:text-[#F29C8E]"
                      >
                        {activeError}
                      </div>
                    )}

                    {expandedSecondary === 'join' ? (
                      <form onSubmit={handleJoinSubmit} className="flex flex-col sm:flex-row gap-2.5">
                        <FestiveInputShell ornament="star" className="flex-1">
                          <input
                            id="join-group-code-input"
                            type="text"
                            value={joinCode}
                            onChange={(e) => {
                              setJoinCode(e.target.value.toUpperCase());
                              setLocalError(null);
                            }}
                            placeholder="Código (ej. FAMIL-7K4M)"
                            maxLength={40}
                            className="w-full min-h-[48px] pl-10 pr-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm font-mono font-bold uppercase tracking-wider text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0] transition-colors"
                            required
                          />
                        </FestiveInputShell>
                        <button
                          type="submit"
                          disabled={isBusy}
                          className="min-h-[48px] px-6 py-2 rounded-full bg-[#D96857] hover:bg-[#C45544] dark:bg-[#DE705E] dark:hover:bg-[#EA7E6C] text-[#FFFBF5] text-sm font-semibold active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-60"
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowRight className="h-4 w-4" />
                          )}
                          <span>Entrar</span>
                        </button>
                      </form>
                    ) : expandedSecondary === 'recover' ? (
                      <form onSubmit={handleRecoverSubmit} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <FestiveInputShell ornament="bauble">
                            <input
                              type="text"
                              value={recoverName}
                              onChange={(e) => {
                                setRecoverName(e.target.value.toUpperCase());
                                setLocalError(null);
                              }}
                              placeholder="Tu nombre"
                              maxLength={60}
                              className="w-full min-h-[48px] pl-10 pr-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm font-semibold uppercase text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0]"
                              required
                            />
                          </FestiveInputShell>
                          <FestiveInputShell ornament="star">
                            <input
                              type="tel"
                              inputMode="tel"
                              autoComplete="tel"
                              value={recoverPhone}
                              onChange={(e) => {
                                setRecoverPhone(e.target.value);
                                setLocalError(null);
                              }}
                              placeholder="Celular (ej. 987654321)"
                              maxLength={20}
                              className="w-full min-h-[48px] pl-10 pr-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm font-mono text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0]"
                              required
                            />
                          </FestiveInputShell>
                        </div>
                        <button
                          type="submit"
                          disabled={isBusy}
                          className="w-full min-h-[48px] px-5 py-2.5 rounded-full bg-[#D96857] hover:bg-[#C45544] dark:bg-[#DE705E] dark:hover:bg-[#EA7E6C] text-[#FFFBF5] text-sm font-semibold active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Smartphone className="h-4 w-4" />
                          )}
                          <span>{isBusy ? 'Buscando…' : 'Recuperar mis grupos'}</span>
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleCreateSubmit} className="space-y-3.5">
                        <FestiveInputShell ornament="tree">
                          <input
                            id="create-group-name-input"
                            type="text"
                            value={groupName}
                            onChange={(e) => {
                              setGroupName(e.target.value);
                              setLocalError(null);
                            }}
                            placeholder="Nombre del grupo (ej. Familia Pérez)"
                            maxLength={60}
                            className="w-full min-h-[48px] pl-10 pr-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0] transition-colors"
                            required
                          />
                        </FestiveInputShell>

                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs sm:text-sm font-semibold text-[#1A2E2B] dark:text-[#FBF3E4]">
                            Participantes
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setExpectedMembers((v) => Math.max(2, v - 1))
                              }
                              aria-label="Reducir participantes"
                              className="min-h-[44px] min-w-[44px] rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] hover:border-[#D96857] dark:hover:border-[#F2D5A0] flex items-center justify-center text-[#1A2E2B] dark:text-[#FBF3E4]"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <input
                              id="create-group-count-input"
                              type="number"
                              min={2}
                              max={100}
                              value={expectedMembers}
                              onChange={(e) =>
                                setExpectedMembers(
                                  Math.max(2, Math.min(100, Number(e.target.value) || 2))
                                )
                              }
                              className="w-16 min-h-[44px] px-2 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-white dark:bg-[#1C3330] text-center text-base font-mono font-bold tabular-nums text-[#1A2E2B] dark:text-[#FBF3E4] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0]"
                              required
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setExpectedMembers((v) => Math.min(100, v + 1))
                              }
                              aria-label="Aumentar participantes"
                              className="min-h-[44px] min-w-[44px] rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] hover:border-[#D96857] dark:hover:border-[#F2D5A0] flex items-center justify-center text-[#1A2E2B] dark:text-[#FBF3E4]"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {!activeAccount && (
                          <div className="pt-2 border-t border-[#D8E2DE] dark:border-[#34534D] space-y-2.5">
                            <p className="text-xs font-semibold text-[#556D68] dark:text-[#BDD0CB]">
                              Tu acceso rápido (para abrir este grupo desde otro equipo)
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <FestiveInputShell ornament="bauble">
                                <input
                                  type="text"
                                  value={creatorName}
                                  onChange={(e) => {
                                    setCreatorName(e.target.value.toUpperCase());
                                    setLocalError(null);
                                  }}
                                  placeholder="Tu nombre"
                                  maxLength={60}
                                  className="w-full min-h-[48px] pl-10 pr-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm font-semibold uppercase text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0]"
                                  required
                                />
                              </FestiveInputShell>
                              <FestiveInputShell ornament="star">
                                <input
                                  type="tel"
                                  inputMode="tel"
                                  autoComplete="tel"
                                  value={creatorPhone}
                                  onChange={(e) => {
                                    setCreatorPhone(e.target.value);
                                    setLocalError(null);
                                  }}
                                  placeholder="Tu celular (ej. 987654321)"
                                  maxLength={20}
                                  className="w-full min-h-[48px] pl-10 pr-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm font-mono text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0]"
                                  required
                                />
                              </FestiveInputShell>
                            </div>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isBusy}
                          className="w-full min-h-[48px] px-5 py-2.5 rounded-full bg-[#D96857] hover:bg-[#C45544] dark:bg-[#DE705E] dark:hover:bg-[#EA7E6C] text-[#FFFBF5] text-sm font-semibold active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          <span>Crear y obtener QR</span>
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <HolidayWorkspaceHero
                title="Elige tu grupo"
                subtitle={
                  activeAccount
                    ? 'Únete con un código o crea un nuevo grupo navideño.'
                    : 'Recupera tus grupos con tu celular, ingresa un código o crea un grupo nuevo.'
                }
                metaText={activeAccount ? activeAccount.displayName : undefined}
                object="cottage"
              />

              <div className="rounded-3xl bg-white dark:bg-[#223B37] border border-[#D8E2DE] dark:border-[#34534D] p-5 sm:p-7 space-y-5 shadow-sm">
                <div
                  className={`grid gap-1 p-1 rounded-full bg-[#EAF0ED] dark:bg-[#192D2A] border border-[#D8E2DE] dark:border-[#2E4B46] ${
                    activeAccount ? 'grid-cols-2' : 'grid-cols-3'
                  }`}
                >
                  {!activeAccount && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('recover');
                        setLocalError(null);
                      }}
                      className={`min-h-[44px] px-2.5 sm:px-3 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        mode === 'recover'
                          ? 'bg-[#2F4E49] dark:bg-[#3A635B] text-[#FFFBF4] shadow-xs'
                          : 'text-[#556D68] dark:text-[#BDD0CB] hover:text-[#1A2E2B] dark:hover:text-[#FBF3E4]'
                      }`}
                    >
                      <Smartphone className="h-4 w-4 shrink-0" />
                      <span>Mis grupos</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('join');
                      setLocalError(null);
                    }}
                    className={`min-h-[44px] px-2.5 sm:px-3 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      mode === 'join'
                        ? 'bg-[#2F4E49] dark:bg-[#3A635B] text-[#FFFBF4] shadow-xs'
                        : 'text-[#556D68] dark:text-[#BDD0CB] hover:text-[#1A2E2B] dark:hover:text-[#FBF3E4]'
                    }`}
                  >
                    <KeyRound className="h-4 w-4 shrink-0" />
                    <span>Código</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('create');
                      setLocalError(null);
                    }}
                    className={`min-h-[44px] px-2.5 sm:px-3 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      mode === 'create'
                        ? 'bg-[#2F4E49] dark:bg-[#3A635B] text-[#FFFBF4] shadow-xs'
                        : 'text-[#556D68] dark:text-[#BDD0CB] hover:text-[#1A2E2B] dark:hover:text-[#FBF3E4]'
                    }`}
                  >
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>Crear</span>
                  </button>
                </div>

                {activeError && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-[#D96857]/40 bg-[#D96857]/8 dark:bg-[#2F2120] px-4 py-3 text-sm text-[#C45544] dark:text-[#F29C8E]"
                  >
                    {activeError}
                  </div>
                )}

                {mode === 'recover' && !activeAccount ? (
                  <form onSubmit={handleRecoverSubmit} className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label
                          htmlFor="recover-name-input"
                          className="block text-xs font-semibold text-[#556D68] dark:text-[#BDD0CB] mb-1.5"
                        >
                          Tu nombre
                        </label>
                        <FestiveInputShell ornament="bauble">
                          <input
                            id="recover-name-input"
                            type="text"
                            value={recoverName}
                            onChange={(e) => {
                              setRecoverName(e.target.value.toUpperCase());
                              setLocalError(null);
                            }}
                            placeholder="Ej. MARÍA"
                            maxLength={60}
                            className="w-full min-h-[50px] pl-10 pr-4 py-2.5 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base font-semibold uppercase text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0] transition-colors"
                            required
                          />
                        </FestiveInputShell>
                      </div>

                      <div>
                        <label
                          htmlFor="recover-phone-input"
                          className="block text-xs font-semibold text-[#556D68] dark:text-[#BDD0CB] mb-1.5"
                        >
                          Tu número de celular
                        </label>
                        <FestiveInputShell ornament="star">
                          <input
                            id="recover-phone-input"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            value={recoverPhone}
                            onChange={(e) => {
                              setRecoverPhone(e.target.value);
                              setLocalError(null);
                            }}
                            placeholder="Ej. 987654321"
                            maxLength={20}
                            className="w-full min-h-[50px] pl-10 pr-4 py-2.5 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base font-mono text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0] transition-colors"
                            required
                          />
                        </FestiveInputShell>
                      </div>
                    </div>

                    <p className="flex items-start gap-2 text-xs text-[#556D68] dark:text-[#BDD0CB] leading-relaxed">
                      <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-[#2F4E49] dark:text-[#F2D5A0]" />
                      <span>
                        Si ya creaste o te uniste a un grupo antes, recuperaremos todos tus grupos automáticamente. Tu número se cifra y nadie del grupo podrá verlo.
                      </span>
                    </p>

                    <button
                      type="submit"
                      disabled={isBusy}
                      className="w-full min-h-[50px] px-5 py-3 rounded-full bg-[#D96857] hover:bg-[#C45544] dark:bg-[#DE705E] dark:hover:bg-[#EA7E6C] text-[#FFFBF5] text-sm font-bold shadow-md shadow-[#D96857]/25 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Smartphone className="h-4 w-4" />
                      )}
                      <span>{isBusy ? 'Buscando tus grupos…' : 'Recuperar mis grupos'}</span>
                    </button>
                  </form>
                ) : mode === 'join' ? (
                  <form onSubmit={handleJoinSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="join-group-code-input"
                        className="block text-xs font-semibold text-[#556D68] dark:text-[#BDD0CB] mb-2"
                      >
                        Código del grupo
                      </label>
                      <FestiveInputShell ornament="star">
                        <input
                          id="join-group-code-input"
                          type="text"
                          value={joinCode}
                          onChange={(e) => {
                            setJoinCode(e.target.value.toUpperCase());
                            setLocalError(null);
                          }}
                          placeholder="FAMIL-7K4M"
                          maxLength={40}
                          className="w-full min-h-[54px] pl-11 pr-11 py-3 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-center text-lg font-mono font-bold uppercase tracking-wider text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0] transition-colors"
                          required
                        />
                      </FestiveInputShell>
                    </div>

                    <button
                      type="submit"
                      disabled={isBusy}
                      className="w-full min-h-[50px] px-5 py-3 rounded-full bg-[#D96857] hover:bg-[#C45544] dark:bg-[#DE705E] dark:hover:bg-[#EA7E6C] text-[#FFFBF5] text-sm font-bold shadow-md shadow-[#D96857]/25 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      <span>{isBusy ? 'Verificando…' : 'Entrar al grupo'}</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="create-group-name-input"
                        className="block text-xs font-semibold text-[#556D68] dark:text-[#BDD0CB] mb-1.5"
                      >
                        Nombre del grupo
                      </label>
                      <FestiveInputShell ornament="tree">
                        <input
                          id="create-group-name-input"
                          type="text"
                          value={groupName}
                          onChange={(e) => {
                            setGroupName(e.target.value);
                            setLocalError(null);
                          }}
                          placeholder="Ej. Familia Pérez"
                          maxLength={60}
                          className="w-full min-h-[50px] pl-10 pr-4 py-2.5 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0] transition-colors"
                          required
                        />
                      </FestiveInputShell>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-1">
                      <label
                        htmlFor="create-group-count-input"
                        className="text-sm font-semibold text-[#1A2E2B] dark:text-[#FBF3E4]"
                      >
                        Participantes
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpectedMembers((v) => Math.max(2, v - 1))
                          }
                          aria-label="Reducir participantes"
                          className="min-h-[44px] min-w-[44px] rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] hover:border-[#D96857] dark:hover:border-[#F2D5A0] flex items-center justify-center text-[#1A2E2B] dark:text-[#FBF3E4]"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          id="create-group-count-input"
                          type="number"
                          min={2}
                          max={100}
                          value={expectedMembers}
                          onChange={(e) =>
                            setExpectedMembers(
                              Math.max(2, Math.min(100, Number(e.target.value) || 2))
                            )
                          }
                          className="w-16 min-h-[44px] px-2 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-white dark:bg-[#1C3330] text-center text-base font-mono font-bold tabular-nums text-[#1A2E2B] dark:text-[#FBF3E4] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setExpectedMembers((v) => Math.min(100, v + 1))
                          }
                          aria-label="Aumentar participantes"
                          className="min-h-[44px] min-w-[44px] rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] hover:border-[#D96857] dark:hover:border-[#F2D5A0] flex items-center justify-center text-[#1A2E2B] dark:text-[#FBF3E4]"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {!activeAccount && (
                      <div className="pt-3 border-t border-[#D8E2DE] dark:border-[#34534D] space-y-3">
                        <p className="text-xs font-semibold text-[#556D68] dark:text-[#BDD0CB]">
                          Tu acceso rápido (para abrir este grupo desde otro navegador)
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label htmlFor="creator-name-input" className="sr-only">
                              Tu nombre
                            </label>
                            <FestiveInputShell ornament="bauble">
                              <input
                                id="creator-name-input"
                                type="text"
                                value={creatorName}
                                onChange={(e) => {
                                  setCreatorName(e.target.value.toUpperCase());
                                  setLocalError(null);
                                }}
                                placeholder="Tu nombre"
                                maxLength={60}
                                className="w-full min-h-[48px] pl-10 pr-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm font-semibold uppercase text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0]"
                                required
                              />
                            </FestiveInputShell>
                          </div>
                          <div>
                            <label htmlFor="creator-phone-input" className="sr-only">
                              Tu celular
                            </label>
                            <FestiveInputShell ornament="star">
                              <input
                                id="creator-phone-input"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                value={creatorPhone}
                                onChange={(e) => {
                                  setCreatorPhone(e.target.value);
                                  setLocalError(null);
                                }}
                                placeholder="Tu celular (ej. 987654321)"
                                maxLength={20}
                                className="w-full min-h-[48px] pl-10 pr-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm font-mono text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0]"
                                required
                              />
                            </FestiveInputShell>
                          </div>
                        </div>
                        <p className="flex items-start gap-1.5 text-xs text-[#556D68] dark:text-[#BDD0CB] leading-relaxed">
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#2F4E49] dark:text-[#F2D5A0]" />
                          <span>
                            Tu número se cifra antes de guardarse y nadie del grupo podrá verlo.
                          </span>
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isBusy}
                      className="w-full min-h-[50px] px-5 py-3 rounded-full bg-[#D96857] hover:bg-[#C45544] dark:bg-[#DE705E] dark:hover:bg-[#EA7E6C] text-[#FFFBF5] text-sm font-bold shadow-md shadow-[#D96857]/25 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      <span>
                        {isBusy ? 'Creando grupo…' : 'Crear grupo y obtener QR'}
                      </span>
                    </button>
                  </form>
                )}

                {activeAccount && (
                  <div className="pt-3 border-t border-[#D8E2DE] dark:border-[#34534D] flex items-center justify-between gap-2 text-xs text-[#556D68] dark:text-[#BDD0CB]">
                    <span className="truncate">
                      Acceso rápido: <strong className="text-[#1A2E2B] dark:text-[#FBF3E4]">{activeAccount.displayName}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={onSwitchAccount}
                      className="min-h-[40px] px-2.5 rounded-full text-xs font-semibold text-[#556D68] dark:text-[#BDD0CB] hover:text-[#D96857] dark:hover:text-[#F2D5A0] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Cambiar persona</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
