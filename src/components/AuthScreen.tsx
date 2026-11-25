import React, { useState } from 'react';
import {
  ArrowRight,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';
import { ThemeMode } from '../lib/theme';
import { ThemeToggle } from './ThemeToggle';
import {
  HOLIDAY_ASSETS,
  HolidayMedallion,
  NavidadSecretaLogo,
  ScallopedSnowEdge,
} from './FestiveDecor';

interface AuthScreenProps {
  invitedCode: string | null;
  savedGroupsCount?: number;
  isConnecting: boolean;
  needsAnonymousEnablement: boolean;
  errorMsg: string | null;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onContinue: () => void;
  onRetrySession: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  invitedCode,
  savedGroupsCount = 0,
  isConnecting,
  needsAnonymousEnablement,
  errorMsg,
  theme,
  onToggleTheme,
  onContinue,
  onRetrySession,
}) => {
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const authProvidersUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`;

  const ctaLabel = invitedCode
    ? `Entrar a ${invitedCode}`
    : savedGroupsCount > 0
    ? 'Ingresar a mis grupos'
    : 'Comenzar';

  return (
    <div className="min-h-[100dvh] bg-[#2D4B46] dark:bg-[#192D2A] text-[#FBF3E4] flex flex-col">
      {/* Minimal top utility row with ThemeToggle */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-1 flex items-center justify-end">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </header>

      <main className="flex-1 flex flex-col justify-center px-4 sm:px-6 py-3 sm:py-6">
        <div className="max-w-4xl w-full mx-auto">
          {/* Presentable Branded Cover Card */}
          <div className="rounded-3xl overflow-hidden bg-[#355751] dark:bg-[#223B37] border border-[#527A72]/45 shadow-2xl shadow-[#10201D]/40">
            {/* Upper Matte Pine-Teal Showcase: Centered Crest Logo + 3D Village Diorama */}
            <div className="relative bg-gradient-to-b from-[#2F4E49] via-[#375A54] to-[#345650] pt-7 sm:pt-9">
              {/* Subtle ambient lantern glow behind logo */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 h-40 w-72 rounded-full bg-[#F2D5A0]/12 blur-3xl"
              />

              {/* Hero Brand Logo & Subtitle */}
              <div className="relative z-10 px-5 sm:px-8 flex flex-col items-center text-center">
                <NavidadSecretaLogo variant="hero" />
                <p className="mt-3 max-w-md text-sm sm:text-base text-[#E2ECE9] leading-relaxed text-balance">
                  {invitedCode
                    ? `Te invitaron al grupo ${invitedCode}. Organiza deseos y tallas sin revelar sorpresas.`
                    : 'Organiza tu amigo secreto en familia: listas de deseos, tallas exactas y reservas anónimas.'}
                </p>
              </div>

              {/* 3D Miniature Christmas Village Diorama */}
              <div className="relative mt-4 sm:mt-5">
                {!heroImgFailed ? (
                  <div className="relative w-full aspect-[16/8.2] sm:aspect-[16/7.2] max-h-[300px] overflow-hidden">
                    <img
                      src={HOLIDAY_ASSETS.villageHero}
                      alt="Aldea navideña 3D con casitas nevadas, pinos escarchados y esferas cobrizas"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFailed(true)}
                      className="w-full h-full object-cover object-bottom"
                    />
                    <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#355751] to-transparent" />
                  </div>
                ) : (
                  <div className="w-full h-36 bg-gradient-to-b from-[#375A54] to-[#26413C]" />
                )}

                {/* Signature scalloped snow shelf transitioning to the action area */}
                <div className="absolute bottom-0 inset-x-0 pointer-events-none">
                  <ScallopedSnowEdge className="text-[#F3F6F4] dark:text-[#1F3531]" />
                </div>
              </div>
            </div>

            {/* Lower Frosted Surface: 4 3D Holiday Medallions + Primary Action CTA */}
            <div className="bg-[#F3F6F4] dark:bg-[#1F3531] px-5 sm:px-8 py-6 sm:py-8 space-y-6">
              <div className="grid grid-cols-4 gap-2.5 sm:gap-5 max-w-2xl mx-auto">
                <div className="flex flex-col items-center text-center gap-1.5">
                  <HolidayMedallion object="cottage" size="sm" />
                  <span className="text-[11px] sm:text-xs font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] leading-tight">
                    Grupo con QR
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5">
                  <HolidayMedallion object="gift" size="sm" />
                  <span className="text-[11px] sm:text-xs font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] leading-tight">
                    Tus deseos
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5">
                  <HolidayMedallion object="tree" size="sm" />
                  <span className="text-[11px] sm:text-xs font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] leading-tight">
                    Tallas exactas
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5">
                  <HolidayMedallion object="sleigh" size="sm" />
                  <span className="text-[11px] sm:text-xs font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] leading-tight">
                    Reserva secreta
                  </span>
                </div>
              </div>

              <div className="max-w-sm mx-auto text-center space-y-3">
                {needsAnonymousEnablement ? (
                  <div className="rounded-2xl border border-[#D96857]/40 bg-white dark:bg-[#2B1F1E] p-4 space-y-3 text-left text-sm text-[#1A2E2B] dark:text-[#FBF3E4]">
                    <p className="font-semibold text-[#C45544] dark:text-[#F29C8E] text-xs">
                      Activa el acceso Anónimo en Firebase Console para entrar sin login
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={authProvidersUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] px-4 py-2 rounded-full bg-[#D96857] text-white text-xs font-semibold hover:bg-[#C45544] inline-flex items-center gap-1.5"
                      >
                        <span>Abrir Firebase</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={onRetrySession}
                        disabled={isConnecting}
                        className="min-h-[44px] px-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-white dark:bg-[#233D38] text-xs font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] inline-flex items-center gap-1.5"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${isConnecting ? 'animate-spin' : ''}`}
                        />
                        <span>Reintentar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {errorMsg && (
                      <div
                        role="alert"
                        className="rounded-2xl border border-[#D96857]/40 bg-white dark:bg-[#2F2120] px-4 py-3 text-sm text-[#C45544] dark:text-[#F29C8E]"
                      >
                        {errorMsg}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={onContinue}
                      disabled={isConnecting}
                      className="w-full min-h-[52px] px-7 py-3 rounded-full bg-[#D96857] hover:bg-[#C45544] dark:bg-[#DE705E] dark:hover:bg-[#EA7E6C] text-[#FFFBF5] text-sm sm:text-base font-bold shadow-lg shadow-[#D96857]/30 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Conectando…</span>
                        </>
                      ) : (
                        <>
                          <span>{ctaLabel}</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    <p className="text-xs text-[#556D68] dark:text-[#BDD0CB]">
                      Crea un grupo o únete con un código sin contraseñas.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
