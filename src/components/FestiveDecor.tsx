import React, { useState } from 'react';
import { Gift, Home, Sparkles, TreePine } from 'lucide-react';

import villageHeroImg from '../assets/images/christmas_village_hero_1795481151189.jpg';
import gift3dImg from '../assets/images/holiday_3d_gift_1795481161103.jpg';
import sleigh3dImg from '../assets/images/holiday_3d_sleigh_1795481150215.jpg';
import tree3dImg from '../assets/images/holiday_3d_tree_1795481148222.jpg';
import cottage3dImg from '../assets/images/holiday_3d_cottage_1795481151136.jpg';

export const HOLIDAY_ASSETS = {
  villageHero: villageHeroImg,
  gift3d: gift3dImg,
  sleigh3d: sleigh3dImg,
  tree3d: tree3dImg,
  cottage3d: cottage3dImg,
} as const;

export type HolidayObjectKey = 'gift' | 'sleigh' | 'tree' | 'cottage';
export type InputOrnamentKind =
  | 'bauble'
  | 'tree'
  | 'gift'
  | 'star'
  | 'snowflake'
  | 'holly'
  | 'bell';

const OBJECT_META: Record<
  HolidayObjectKey,
  { src: string; alt: string; Icon: React.FC<{ className?: string }> }
> = {
  gift: {
    src: HOLIDAY_ASSETS.gift3d,
    alt: 'Regalo navideño 3D con lazo crema y esfera cobriza',
    Icon: Gift,
  },
  sleigh: {
    src: HOLIDAY_ASSETS.sleigh3d,
    alt: 'Trineo navideño 3D con reno y luces cálidas',
    Icon: Sparkles,
  },
  tree: {
    src: HOLIDAY_ASSETS.tree3d,
    alt: 'Árbol de Navidad 3D nevado con esferas doradas y coral',
    Icon: TreePine,
  },
  cottage: {
    src: HOLIDAY_ASSETS.cottage3d,
    alt: 'Casita navideña 3D con techo nevado y ventanas iluminadas',
    Icon: Home,
  },
};

interface NavidadSecretaLogoProps {
  variant?: 'hero' | 'compact';
  className?: string;
}

/** Custom 3D-shaded Christmas crest emblem + Fraunces wordmark */
export const NavidadSecretaLogo: React.FC<NavidadSecretaLogoProps> = ({
  variant = 'compact',
  className = '',
}) => {
  if (variant === 'hero') {
    return (
      <div className={`inline-flex flex-col items-center text-center select-none ${className}`}>
        {/* 3D Holiday Crest Seal */}
        <div className="relative mb-3">
          <div
            aria-hidden="true"
            className="absolute -inset-2 rounded-full bg-[#F2D5A0]/20 blur-xl"
          />
          <svg
            viewBox="0 0 96 96"
            className="relative h-20 w-20 sm:h-24 sm:w-24 drop-shadow-[0_10px_22px_rgba(12,26,24,0.45)]"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="crestBg" cx="35%" cy="28%" r="72%">
                <stop offset="0%" stopColor="#48756C" />
                <stop offset="58%" stopColor="#2B4B46" />
                <stop offset="100%" stopColor="#1B322E" />
              </radialGradient>
              <linearGradient id="crestGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFF2CB" />
                <stop offset="50%" stopColor="#E9BA77" />
                <stop offset="100%" stopColor="#B87E35" />
              </linearGradient>
              <linearGradient id="crestCoral" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F08A76" />
                <stop offset="100%" stopColor="#C14B3A" />
              </linearGradient>
              <linearGradient id="crestTree" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#72A898" />
                <stop offset="100%" stopColor="#264740" />
              </linearGradient>
            </defs>

            {/* Outer metallic gold ring */}
            <circle cx="48" cy="48" r="45" fill="url(#crestBg)" stroke="url(#crestGold)" strokeWidth="2.4" />
            <circle cx="48" cy="48" r="39.5" fill="none" stroke="#F2D5A0" strokeWidth="0.9" strokeDasharray="2.5 3.5" opacity="0.65" />

            {/* Delicate snow stars */}
            <circle cx="24" cy="34" r="1.4" fill="#FFFDF8" opacity="0.85" />
            <circle cx="72" cy="32" r="1.6" fill="#FCE8B8" opacity="0.9" />
            <circle cx="29" cy="24" r="1" fill="#FFFDF8" opacity="0.7" />
            <circle cx="67" cy="44" r="1.1" fill="#FFFDF8" opacity="0.75" />

            {/* Stylized frosted pine tree silhouette behind gift */}
            <path d="M48 22 31 46h34L48 22Z" fill="url(#crestTree)" />
            <path d="M48 33 26 60h44L48 33Z" fill="url(#crestTree)" />
            {/* Snow crest on treetop */}
            <path d="M43 29.5c2 1.2 3.5 1.6 5 1.6s3-.4 5-1.6L48 22l-5 7.5Z" fill="#FFFDF8" opacity="0.92" />

            {/* Miniature coral-terracotta 3D gift box at center base */}
            <rect x="35" y="54" width="26" height="19" rx="3.5" fill="url(#crestCoral)" />
            <rect x="33.5" y="50.5" width="29" height="5.5" rx="2" fill="#E37360" />
            <rect x="45.6" y="50.5" width="4.8" height="22.5" fill="url(#crestGold)" />
            <path
              d="M48 50.8c-3.4 0-6.6-2.4-5.8-4.7.7-2 3.8-1 5.8 3 2-4 5.1-5 5.8-3 .8 2.3-2.4 4.7-5.8 4.7Z"
              fill="url(#crestGold)"
            />

            {/* Tiny copper baubles on tree */}
            <circle cx="40.5" cy="44" r="2.2" fill="#E37360" />
            <circle cx="55.5" cy="43" r="2.2" fill="#F2D5A0" />

            {/* Crown star on top */}
            <path
              d="M48 11.5 50.2 16.2 55.4 16.8 51.5 20.3 52.6 25.3 48 22.7 43.4 25.3 44.5 20.3 40.6 16.8 45.8 16.2Z"
              fill="url(#crestGold)"
            />
          </svg>
        </div>

        <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#F2D5A0]">
          Intercambio familiar
        </p>
        <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#FFFBF4] mt-1 leading-none">
          Navidad Secreta
        </h1>

        {/* Reference-inspired delicate horizontal divider */}
        <div
          aria-hidden="true"
          className="mt-3 flex items-center justify-center gap-2 w-44 text-[#F2D5A0]/80"
        >
          <span className="h-1.5 w-1.5 rounded-full border border-current" />
          <span className="h-px flex-1 bg-current opacity-70" />
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          <span className="h-px flex-1 bg-current opacity-70" />
          <span className="h-1.5 w-1.5 rounded-full border border-current" />
        </div>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap shrink-0 ${className}`}>
      <svg viewBox="0 0 36 36" className="h-7 w-7 shrink-0" aria-hidden="true">
        <defs>
          <radialGradient id="crestCompactBg" cx="35%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#48756C" />
            <stop offset="100%" stopColor="#1F3A35" />
          </radialGradient>
          <linearGradient id="crestCompactGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF2CB" />
            <stop offset="100%" stopColor="#C98F3E" />
          </linearGradient>
        </defs>
        <circle cx="18" cy="18" r="16.5" fill="url(#crestCompactBg)" stroke="url(#crestCompactGold)" strokeWidth="1.5" />
        <path d="M18 8.5 11.5 18.5h13L18 8.5Z" fill="#6AA191" />
        <rect x="13" y="19.5" width="10" height="7.5" rx="1.6" fill="#E06E5B" />
        <rect x="17" y="19.5" width="2" height="7.5" fill="url(#crestCompactGold)" />
        <path
          d="M18 4.8 18.9 6.8 21.1 7.1 19.5 8.5 19.9 10.6 18 9.5 16.1 10.6 16.5 8.5 14.9 7.1 17.1 6.8Z"
          fill="url(#crestCompactGold)"
        />
      </svg>
      <span className="font-display text-lg sm:text-xl font-bold tracking-tight">
        Navidad Secreta
      </span>
    </span>
  );
};

interface HolidayMedallionProps {
  object: HolidayObjectKey;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<HolidayMedallionProps['size']>, string> = {
  xs: 'h-9 w-9',
  sm: 'h-11 w-11',
  md: 'h-14 w-14 sm:h-16 sm:w-16',
  lg: 'h-20 w-20 sm:h-24 sm:w-24',
};

export const HolidayMedallion: React.FC<HolidayMedallionProps> = ({
  object,
  size = 'md',
  label,
  className = '',
}) => {
  const [failed, setFailed] = useState(false);
  const meta = OBJECT_META[object];
  const FallbackIcon = meta.Icon;

  return (
    <div className={`inline-flex flex-col items-center gap-1.5 shrink-0 ${className}`}>
      <div
        className={`${SIZE_CLASSES[size]} relative rounded-full overflow-hidden bg-[#2F4E49] ring-2 ring-[#F2D5A0]/50 dark:ring-[#F2D5A0]/40 shadow-md shadow-[#152825]/20 dark:shadow-black/40 flex items-center justify-center`}
      >
        {!failed ? (
          <img
            src={meta.src}
            alt={meta.alt}
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="w-full h-full object-cover scale-[1.06]"
          />
        ) : (
          <FallbackIcon className="h-1/2 w-1/2 text-[#F2D5A0]" />
        )}
      </div>
      {label && (
        <span className="text-[11px] font-semibold text-[#FBF3E4]/90 dark:text-[#FBF3E4]/90 text-center leading-tight">
          {label}
        </span>
      )}
    </div>
  );
};

interface Ornament3DIconProps {
  kind: InputOrnamentKind;
  className?: string;
}

/** Tactile 3D-shaded miniature Christmas ornament SVG for adorning inputs & labels */
export const Ornament3DIcon: React.FC<Ornament3DIconProps> = ({
  kind,
  className = 'h-5 w-5',
}) => {
  switch (kind) {
    case 'bauble':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <defs>
            <radialGradient id="bauble3d" cx="35%" cy="32%" r="68%">
              <stop offset="0%" stopColor="#FFD2B8" />
              <stop offset="42%" stopColor="#E0725F" />
              <stop offset="100%" stopColor="#9D392A" />
            </radialGradient>
            <linearGradient id="capGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF0C2" />
              <stop offset="100%" stopColor="#C48B3C" />
            </linearGradient>
          </defs>
          <path
            d="M12 4.5a2 2 0 0 1 4 0"
            fill="none"
            stroke="#E9BA77"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <rect x="11" y="5" width="6" height="3" rx="1" fill="url(#capGold)" />
          <circle cx="14" cy="16.5" r="8.8" fill="url(#bauble3d)" />
          <ellipse cx="11" cy="13.2" rx="2.4" ry="1.5" transform="rotate(-25 11 13.2)" fill="#FFF8EE" opacity="0.6" />
          <path
            d="M6.4 16.5c2.2 1.6 5.2 2.2 7.6 2.2s5.4-.6 7.6-2.2"
            fill="none"
            stroke="#FCE6C3"
            strokeWidth="1.15"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>
      );

    case 'tree':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="pine3d" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#639686" />
              <stop offset="55%" stopColor="#355F56" />
              <stop offset="100%" stopColor="#213E38" />
            </linearGradient>
          </defs>
          <rect x="12.2" y="21.5" width="3.6" height="3.8" rx="0.9" fill="#8C593B" />
          <path d="M14 5.5 6.8 14h14.4L14 5.5Z" fill="url(#pine3d)" />
          <path d="M14 10.2 5.4 22h17.2L14 10.2Z" fill="url(#pine3d)" />
          {/* Snow dusting */}
          <path
            d="M11.6 8.6c.8.6 1.7.8 2.4.8s1.6-.2 2.4-.8L14 5.5l-2.4 3.1Z"
            fill="#FFFDF8"
            opacity="0.9"
          />
          {/* Tiny coral & gold ornaments */}
          <circle cx="12" cy="15.5" r="1.45" fill="#E37360" />
          <circle cx="16.4" cy="18.2" r="1.45" fill="#F2C679" />
          <circle cx="10.8" cy="19.6" r="1.25" fill="#FFFDF8" />
          {/* Ceramic cream star */}
          <path
            d="M14 2.2 14.9 4.2 17 4.4 15.4 5.8 15.9 7.8 14 6.7 12.1 7.8 12.6 5.8 11 4.4 13.1 4.2Z"
            fill="#FCE8B8"
          />
        </svg>
      );

    case 'gift':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="box3d" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#EE8370" />
              <stop offset="100%" stopColor="#B84737" />
            </linearGradient>
            <linearGradient id="ribbon3d" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFF7E2" />
              <stop offset="100%" stopColor="#E7C280" />
            </linearGradient>
          </defs>
          <rect x="5" y="11" width="18" height="13" rx="2.5" fill="url(#box3d)" />
          <rect x="4" y="8.5" width="20" height="4.2" rx="1.6" fill="#E06D5B" />
          <rect x="12.2" y="8.5" width="3.6" height="15.5" fill="url(#ribbon3d)" />
          <path
            d="M14 8.6C11.5 8.6 9.2 6.8 9.8 5.1c.5-1.4 2.7-.8 4.2 2.2 1.5-3 3.7-3.6 4.2-2.2.6 1.7-1.7 3.5-4.2 3.5Z"
            fill="url(#ribbon3d)"
          />
        </svg>
      );

    case 'star':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <defs>
            <radialGradient id="star3d" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFF8DF" />
              <stop offset="50%" stopColor="#F2C472" />
              <stop offset="100%" stopColor="#C18238" />
            </radialGradient>
          </defs>
          <path
            d="M14 3.2 17.1 9.6 24.2 10.6 19 15.6 20.3 22.6 14 19.2 7.7 22.6 9 15.6 3.8 10.6 10.9 9.6Z"
            fill="url(#star3d)"
            stroke="#FFF4D1"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'holly':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="leaf3d" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5D9282" />
              <stop offset="100%" stopColor="#284B43" />
            </linearGradient>
            <radialGradient id="berry3d" cx="32%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFC8B6" />
              <stop offset="50%" stopColor="#DF6755" />
              <stop offset="100%" stopColor="#9B3224" />
            </radialGradient>
          </defs>
          <path
            d="M13.5 14C9.5 14 5.5 11.2 4.5 7.5c3.5.3 7.5 2 9 6.5Z"
            fill="url(#leaf3d)"
          />
          <path
            d="M14.5 14c4 0 8-2.8 9-6.5-3.5.3-7.5 2-9 6.5Z"
            fill="url(#leaf3d)"
          />
          <path
            d="M14 14.5c-2.8 3.2-6 5.2-9 5.5 1-3.5 4.2-6 9-5.5Z"
            fill="url(#leaf3d)"
          />
          <path
            d="M14 14.5c2.8 3.2 6 5.2 9 5.5-1-3.5-4.2-6-9-5.5Z"
            fill="url(#leaf3d)"
          />
          <circle cx="14" cy="14" r="2.7" fill="url(#berry3d)" />
          <circle cx="11.2" cy="16.6" r="2.2" fill="url(#berry3d)" />
          <circle cx="16.8" cy="16.6" r="2.2" fill="url(#berry3d)" />
        </svg>
      );

    case 'bell':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="bell3d" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF0C4" />
              <stop offset="55%" stopColor="#E5B05E" />
              <stop offset="100%" stopColor="#A96E28" />
            </linearGradient>
          </defs>
          <circle cx="14" cy="21.8" r="2.2" fill="#B5752A" />
          <path
            d="M14 5.5c-4.2 0-6.5 3.1-6.5 7.2 0 3.3-1.4 5.2-2.3 6.2-.4.5-.1 1.3.6 1.3h16.4c.7 0 1-.8.6-1.3-.9-1-2.3-2.9-2.3-6.2 0-4.1-2.3-7.2-6.5-7.2Z"
            fill="url(#bell3d)"
          />
          <path
            d="M11 6.6c1.1-1.3 2.3-1.9 3-1.9s1.9.6 3 1.9"
            fill="none"
            stroke="#DF6755"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'snowflake':
    default:
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <g
            stroke="#5D8C83"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            <line x1="14" y1="4" x2="14" y2="24" />
            <line x1="5.3" y1="9" x2="22.7" y2="19" />
            <line x1="22.7" y1="9" x2="5.3" y2="19" />
            <path d="M11.6 6.2 14 8.5l2.4-2.3" />
            <path d="M11.6 21.8 14 19.5l2.4 2.3" />
          </g>
          <circle cx="14" cy="14" r="2.3" fill="#E0725F" />
        </svg>
      );
  }
};

interface FestiveInputShellProps {
  ornament?: InputOrnamentKind;
  snowCap?: boolean;
  alignTop?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps any input / textarea / select with a subtle frosted snow cap along the top edge
 * and a tactile 3D miniature Christmas ornament nestled cleanly on the left side.
 */
export const FestiveInputShell: React.FC<FestiveInputShellProps> = ({
  ornament = 'bauble',
  snowCap = true,
  alignTop = false,
  children,
  className = '',
}) => {
  return (
    <div className={`relative group/input ${className}`}>
      {/* Delicate scalloped snow dusting perched on the top-right rim of the input */}
      {snowCap && (
        <svg
          viewBox="0 0 76 12"
          aria-hidden="true"
          className="pointer-events-none select-none absolute -top-[4px] right-4 z-10 h-[10px] w-[62px] drop-shadow-[0_1px_1px_rgba(24,45,42,0.16)]"
        >
          <path
            d="M3 5C8 0.5 17 0.5 22 4c5-3.2 14-3.5 20 .2 5-3 13-2.5 18 .6 4.2-2.2 10-1.4 13 1.2-3 2.2-6.5 2-9.5 1.2-3.4 2.6-8.4 2.5-12 .5-4 2.8-10 2.7-14.2.3-4 2.4-9.5 2.4-13.4.2-3.6 2-8.2 1.8-11.2-.2C9.5 8.8 5.2 8.2 3 5Z"
            className="fill-[#FFFDF9] dark:fill-[#F7EFE1]"
          />
        </svg>
      )}

      {/* 3D Miniature Christmas Ornament on the left edge */}
      <span
        aria-hidden="true"
        className={`pointer-events-none select-none absolute left-3 z-10 flex items-center justify-center transition-transform duration-200 group-focus-within/input:scale-110 ${
          alignTop ? 'top-3.5' : 'top-1/2 -translate-y-1/2'
        }`}
      >
        <Ornament3DIcon kind={ornament} className="h-5 w-5 drop-shadow-xs" />
      </span>

      {children}
    </div>
  );
};

interface ScallopedSnowEdgeProps {
  className?: string;
}

/** Signature scalloped snow-shelf trim inspired by the 3D Christmas village ledge */
export const ScallopedSnowEdge: React.FC<ScallopedSnowEdgeProps> = ({
  className = 'text-[#F3F6F4] dark:text-[#192D2A]',
}) => (
  <svg
    viewBox="0 0 1200 28"
    preserveAspectRatio="none"
    aria-hidden="true"
    className={`w-full h-3.5 sm:h-5 block ${className}`}
  >
    <path
      fill="currentColor"
      d="M0,28 L0,10 Q25,26 50,10 Q75,26 100,10 Q125,26 150,10 Q175,26 200,10 Q225,26 250,10 Q275,26 300,10 Q325,26 350,10 Q375,26 400,10 Q425,26 450,10 Q475,26 500,10 Q525,26 550,10 Q575,26 600,10 Q625,26 650,10 Q675,26 700,10 Q725,26 750,10 Q775,26 800,10 Q825,26 850,10 Q875,26 900,10 Q925,26 950,10 Q975,26 1000,10 Q1025,26 1050,10 Q1075,26 1100,10 Q1125,26 1150,10 Q1175,26 1200,10 L1200,28 Z"
    />
  </svg>
);

interface HolidayWorkspaceHeroProps {
  title: string;
  subtitle: string;
  metaText?: string;
  object: HolidayObjectKey;
}

/**
 * Compact 3D miniature Christmas header card with pine-teal diorama backdrop,
 * circular 3D holiday object medallion, and subtle scalloped snowy ledge.
 */
export const HolidayWorkspaceHero: React.FC<HolidayWorkspaceHeroProps> = ({
  title,
  subtitle,
  metaText,
  object,
}) => {
  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#2C4B46] via-[#345852] to-[#26423D] dark:from-[#213B37] dark:via-[#294742] dark:to-[#1E3531] text-[#FBF3E4] shadow-md shadow-[#1A2E2B]/12 dark:shadow-black/35 border border-[#426A63]/40">
      {/* Subtle snowy sparkles & warm lantern glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-[#E9BA77]/15 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 left-1/3 h-20 w-40 rounded-full bg-[#DF6E5C]/12 blur-2xl"
      />

      <div className="relative px-4 sm:px-6 pt-4 sm:pt-5 pb-6 sm:pb-7 flex items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5 min-w-0">
          <HolidayMedallion object={object} size="md" />
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#FBF3E4] text-balance leading-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-[#D7E4E0] mt-0.5 leading-snug">
              {subtitle}
            </p>
          </div>
        </div>

        {metaText && (
          <span className="hidden sm:inline-block text-xs font-medium text-[#F2D5A0] tabular-nums shrink-0 max-w-[180px] truncate">
            {metaText}
          </span>
        )}
      </div>

      {/* Scalloped snow shelf trim along the bottom */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <ScallopedSnowEdge className="text-[#F3F6F4] dark:text-[#192D2A]" />
      </div>
    </div>
  );
};
