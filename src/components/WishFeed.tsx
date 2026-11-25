import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Gift,
  ImageOff,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
  Star,
  User,
  X,
} from 'lucide-react';
import { fetchWishPhoto } from '../lib/firestoreService';
import { buildFallbackLinkPreview } from '../lib/linkService';
import { MemberProfile, WishItem } from '../types/wishlist';
import { LinkPreviewCard } from './LinkPreviewCard';
import {
  FestiveInputShell,
  HOLIDAY_ASSETS,
  HolidayMedallion,
  HolidayWorkspaceHero,
  ScallopedSnowEdge,
} from './FestiveDecor';

interface WishFeedProps {
  wishes: WishItem[];
  members: MemberProfile[];
  currentMemberId: string;
  currentUid: string;
  isAdmin: boolean;
  hideFloatingControls?: boolean;
  onToggleReserve: (wish: WishItem) => void;
  onGoToUpload: () => void;
}

interface MemberGroup {
  memberId: string;
  memberName: string;
  isOwn: boolean;
  wishes: WishItem[];
  availableCount: number;
}

export const WishFeed: React.FC<WishFeedProps> = ({
  wishes,
  members,
  currentMemberId,
  hideFloatingControls = false,
  onToggleReserve,
  onGoToUpload,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('ALL');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [activeWishId, setActiveWishId] = useState<string | null>(null);

  const [detailPhotoUrl, setDetailPhotoUrl] = useState('');
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const activeWish = useMemo(
    () => wishes.find((w) => w.id === activeWishId) || null,
    [wishes, activeWishId]
  );

  useEffect(() => {
    setDetailPhotoUrl('');
    setPhotoError(false);
    if (!activeWish?.photoId) {
      setLoadingPhoto(false);
      return;
    }

    let cancelled = false;
    setLoadingPhoto(true);
    fetchWishPhoto(activeWish.photoId)
      .then((url) => {
        if (!cancelled) {
          if (url) setDetailPhotoUrl(url);
          else setPhotoError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setPhotoError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingPhoto(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeWish?.id, activeWish?.photoId]);

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const aOwn = a.id === currentMemberId;
      const bOwn = b.id === currentMemberId;
      if (aOwn !== bOwn) return aOwn ? -1 : 1;
      return a.member.localeCompare(b.member, 'es');
    });
  }, [members, currentMemberId]);

  const filtered = useMemo(() => {
    return wishes.filter((w) => {
      if (selectedMemberId !== 'ALL' && w.memberId !== selectedMemberId) return false;
      if (onlyAvailable && w.reservedAnonymously) return false;
      return true;
    });
  }, [wishes, selectedMemberId, onlyAvailable]);

  const groupedByMember = useMemo<MemberGroup[]>(() => {
    const map = new Map<string, MemberGroup>();
    for (const w of filtered) {
      const existing = map.get(w.memberId);
      if (existing) {
        existing.wishes.push(w);
        if (!w.reservedAnonymously) existing.availableCount += 1;
      } else {
        map.set(w.memberId, {
          memberId: w.memberId,
          memberName: w.member,
          isOwn: w.memberId === currentMemberId,
          wishes: [w],
          availableCount: w.reservedAnonymously ? 0 : 1,
        });
      }
    }

    for (const group of map.values()) {
      group.wishes.sort((a, b) => Number(Boolean(b.isFavorite)) - Number(Boolean(a.isFavorite)));
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.isOwn !== b.isOwn) return a.isOwn ? -1 : 1;
      return a.memberName.localeCompare(b.memberName, 'es');
    });
  }, [filtered, currentMemberId]);

  const activeFilterCount =
    (selectedMemberId !== 'ALL' ? 1 : 0) + (onlyAvailable ? 1 : 0);

  const hasNarrowingFilters = selectedMemberId !== 'ALL' || onlyAvailable;

  const clearAllFilters = () => {
    setSelectedMemberId('ALL');
    setOnlyAvailable(false);
  };

  const activeWishFallback = activeWish?.productUrl
    ? buildFallbackLinkPreview(activeWish.productUrl, activeWish.wish)
    : null;
  const isActiveWishOwn = activeWish ? activeWish.memberId === currentMemberId : false;

  return (
    <section className="space-y-4">
      <HolidayWorkspaceHero
        title="Lista Familiar"
        subtitle="Elige un participante y toca un deseo para ver detalles."
        metaText={`${filtered.length} ${filtered.length === 1 ? 'deseo' : 'deseos'}`}
        object="sleigh"
      />

      {/* Compact inline summary ONLY when the user narrowed results via Filter */}
      {hasNarrowingFilters && (
        <div className="flex items-center justify-between gap-3 px-1 text-xs text-[#556D68] dark:text-[#BDD0CB]">
          <span className="truncate">
            Filtro activo
            {selectedMemberId !== 'ALL'
              ? ` · ${members.find((m) => m.id === selectedMemberId)?.member || ''}`
              : ''}
            {onlyAvailable ? ' · Solo disponibles' : ''}
          </span>
          <button
            type="button"
            onClick={clearAllFilters}
            className="font-semibold text-[#D96857] dark:text-[#F2D5A0] hover:underline whitespace-nowrap shrink-0 min-h-[36px] px-1"
          >
            Limpiar
          </button>
        </div>
      )}

      {groupedByMember.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-[#223B37] border border-[#D8E2DE] dark:border-[#34534D] p-5 sm:p-8 flex flex-col sm:flex-row items-center gap-5">
          <img
            src={HOLIDAY_ASSETS.sleigh3d}
            alt="Trineo navideño 3D con reno y regalos"
            referrerPolicy="no-referrer"
            className="w-36 h-36 sm:w-40 sm:h-40 object-cover rounded-2xl border border-[#D8E2DE] dark:border-[#34534D] shrink-0"
          />
          <div className="space-y-2.5 text-center sm:text-left">
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#1A2E2B] dark:text-[#FBF3E4]">
              {wishes.length === 0
                ? 'Aún no hay deseos en el grupo'
                : 'Sin deseos con este filtro'}
            </h2>
            <p className="text-xs sm:text-sm text-[#556D68] dark:text-[#BDD0CB] leading-relaxed">
              {wishes.length === 0
                ? 'Cuando tú o tus familiares suban deseos, aparecerán organizados por persona.'
                : 'Este participante aún no tiene deseos con el filtro actual.'}
            </p>
            <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              {hasNarrowingFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="min-h-[44px] px-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-white dark:bg-[#284540] text-sm font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] hover:border-[#D96857] dark:hover:border-[#F2D5A0] transition-colors inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Limpiar filtros</span>
                </button>
              )}
              <button
                type="button"
                onClick={onGoToUpload}
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#D96857] hover:bg-[#C45544] dark:bg-[#DE705E] dark:hover:bg-[#EA7E6C] text-[#FFFBF5] text-sm font-semibold active:scale-[0.98] transition-all"
              >
                Subir un deseo
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {groupedByMember.map((group) => (
              <article
                key={group.memberId}
                className="rounded-3xl bg-white dark:bg-[#223B37] border border-[#D8E2DE] dark:border-[#34534D] overflow-hidden"
              >
                {/* Person Header */}
                <div className="px-4 sm:px-5 py-3.5 bg-[#EAF0ED]/75 dark:bg-[#294742]/90 border-b border-[#D8E2DE] dark:border-[#34534D] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-[#2F4E49]/12 dark:bg-[#355A53] text-[#2F4E49] dark:text-[#F2D5A0] flex items-center justify-center shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-bold text-[#1A2E2B] dark:text-[#FBF3E4] truncate leading-tight">
                        {group.memberName}
                        {group.isOwn ? ' (Tú)' : ''}
                      </h2>
                      <p className="text-xs text-[#556D68] dark:text-[#BDD0CB] tabular-nums mt-0.5">
                        {group.wishes.length}{' '}
                        {group.wishes.length === 1 ? 'deseo' : 'deseos'}
                        {!group.isOwn && group.availableCount < group.wishes.length
                          ? ` · ${group.availableCount} disponible${
                              group.availableCount === 1 ? '' : 's'
                            }`
                          : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Clean Wish List Rows */}
                <ul className="divide-y divide-[#D8E2DE] dark:divide-[#34534D]">
                  {group.wishes.map((wish) => {
                    const metaParts: string[] = [];
                    if (wish.productUrl) metaParts.push(wish.linkSite || 'Enlace');
                    if (wish.photoId) metaParts.push('Foto');
                    const isFavorite = Boolean(wish.isFavorite);

                    return (
                      <li key={wish.id}>
                        <button
                          type="button"
                          onClick={() => setActiveWishId(wish.id)}
                          className={`w-full min-h-[56px] px-4 sm:px-5 py-3 flex items-center justify-between gap-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[#D96857] dark:focus-visible:outline-[#F2D5A0] ${
                            isFavorite
                              ? 'bg-[#FBF6EB]/70 dark:bg-[#27413B] hover:bg-[#F7EFE0] dark:hover:bg-[#2D4B44]'
                              : 'hover:bg-[#F3F6F4] dark:hover:bg-[#294742] active:bg-[#EAF0ED] dark:active:bg-[#2F524C]'
                          }`}
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="text-sm sm:text-base font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] leading-snug line-clamp-2">
                              {wish.wish}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[#556D68] dark:text-[#BDD0CB]">
                              {isFavorite && (
                                <>
                                  <span className="inline-flex items-center gap-1 font-semibold text-[#B87735] dark:text-[#F2D5A0]">
                                    <Star className="h-3.5 w-3.5 fill-current shrink-0" />
                                    Regalo favorito
                                  </span>
                                  <span aria-hidden="true" className="text-[#B8C7C2] dark:text-[#4C7069]">
                                    ·
                                  </span>
                                </>
                              )}
                              {!group.isOwn && wish.reservedAnonymously ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-[#D96857] dark:text-[#F29C8E]">
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                  Reservado en secreto
                                </span>
                              ) : (
                                <span>{group.isOwn ? 'Tu deseo' : 'Disponible'}</span>
                              )}
                              {metaParts.map((part) => (
                                <React.Fragment key={part}>
                                  <span aria-hidden="true" className="text-[#B8C7C2] dark:text-[#4C7069]">
                                    ·
                                  </span>
                                  <span className="truncate">{part}</span>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>

                          <ChevronRight className="h-4.5 w-4.5 text-[#7E9690] dark:text-[#9AB4AE] shrink-0" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Floating Bottom-Right Filter Globe */}
      {!hideFloatingControls && !filterOpen && !activeWish && (
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label="Filtrar por participante"
          title="Filtrar"
          className={`fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 md:bottom-8 md:right-8 z-30 h-14 w-14 sm:w-auto sm:px-5 rounded-full text-[#FFFBF5] shadow-lg active:scale-[0.96] transition-all flex items-center justify-center gap-2 border ${
            hasNarrowingFilters
              ? 'bg-[#D96857] dark:bg-[#DE705E] border-transparent dark:border-[#F29C8E]/40 shadow-[#D96857]/35 dark:shadow-black/50 hover:bg-[#C45544] dark:hover:bg-[#EA7E6C]'
              : 'bg-[#2F4E49] dark:bg-[#325952] border-transparent dark:border-[#4C7A71] shadow-[#1A2E2B]/25 dark:shadow-black/50 hover:bg-[#243E3A] dark:hover:bg-[#3B6860]'
          }`}
        >
          <SlidersHorizontal className="h-5 w-5 shrink-0" />
          <span className="hidden sm:inline text-sm font-semibold whitespace-nowrap">
            {activeFilterCount > 0 ? `Filtrar (${activeFilterCount})` : 'Filtrar'}
          </span>
        </button>
      )}

      {/* Filter Bottom Sheet Modal */}
      {filterOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-[#0F1E1C]/60 dark:bg-black/70 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="filter-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFilterOpen(false);
          }}
        >
          <div className="w-full max-w-md max-h-[88dvh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#223B37] border border-[#D8E2DE] dark:border-[#34534D] shadow-2xl overflow-hidden">
            <div className="relative bg-gradient-to-br from-[#2C4B46] via-[#345852] to-[#26423D] pt-2.5 sm:pt-4 px-5 sm:px-6 pb-6 shrink-0 text-[#FBF3E4]">
              <div className="w-10 h-1 rounded-full bg-white/30 mx-auto mb-3 sm:hidden" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <HolidayMedallion object="sleigh" size="xs" />
                  <h2
                    id="filter-modal-title"
                    className="font-display text-lg font-bold text-[#FFFBF4]"
                  >
                    Filtrar lista
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  aria-label="Cerrar filtros"
                  className="min-h-[44px] min-w-[44px] -mr-1.5 flex items-center justify-center rounded-full text-[#D7E4E0] hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="absolute bottom-0 inset-x-0 pointer-events-none">
                <ScallopedSnowEdge className="text-white dark:text-[#223B37]" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-4">
              <div>
                <label
                  htmlFor="list-member-filter"
                  className="block text-xs font-semibold text-[#556D68] dark:text-[#BDD0CB] mb-1.5"
                >
                  Participante
                </label>
                <FestiveInputShell ornament="tree">
                  <select
                    id="list-member-filter"
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full min-h-[48px] pl-10 pr-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm font-medium text-[#1A2E2B] dark:text-[#FBF3E4] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0]"
                  >
                    <option value="ALL">Todos los participantes</option>
                    {sortedMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id === currentMemberId ? `${m.member} (Tú)` : m.member}
                      </option>
                    ))}
                  </select>
                </FestiveInputShell>
              </div>

              <button
                type="button"
                onClick={() => setOnlyAvailable((v) => !v)}
                className={`w-full min-h-[46px] px-4 py-2 rounded-full border text-sm font-semibold transition-colors whitespace-nowrap ${
                  onlyAvailable
                    ? 'border-[#2F4E49] dark:border-[#F2D5A0] bg-[#2F4E49] dark:bg-[#325952] text-[#FFFBF4]'
                    : 'border-[#D4DFDB] dark:border-[#3A5C55] bg-white dark:bg-[#1C3330] text-[#1A2E2B] dark:text-[#FBF3E4] hover:border-[#D96857] dark:hover:border-[#F2D5A0]'
                }`}
              >
                {onlyAvailable ? 'Mostrando solo disponibles' : 'Mostrar solo disponibles'}
              </button>

              <div className="pt-2 flex items-center gap-2.5">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="min-h-[48px] px-4 py-2.5 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-white dark:bg-[#284540] text-sm font-semibold text-[#556D68] dark:text-[#BDD0CB] hover:text-[#1A2E2B] dark:hover:text-[#FBF3E4] whitespace-nowrap"
                  >
                    Limpiar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="flex-1 min-h-[48px] px-5 py-2.5 rounded-full bg-[#D96857] hover:bg-[#C45544] dark:bg-[#DE705E] dark:hover:bg-[#EA7E6C] text-[#FFFBF5] text-sm sm:text-base font-semibold active:scale-[0.98] transition-all"
                >
                  Ver {filtered.length} {filtered.length === 1 ? 'deseo' : 'deseos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wish Detail Modal / Bottom Sheet */}
      {activeWish && (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-[#0F1E1C]/60 dark:bg-black/70 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wish-detail-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveWishId(null);
          }}
        >
          <div className="w-full max-w-lg max-h-[90dvh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#223B37] border border-[#D8E2DE] dark:border-[#34534D] shadow-2xl overflow-hidden">
            <div className="relative bg-gradient-to-br from-[#2C4B46] via-[#345852] to-[#26423D] pt-2.5 sm:pt-4 px-5 sm:px-6 pb-6 shrink-0 text-[#FBF3E4]">
              <div className="w-10 h-1 rounded-full bg-white/30 mx-auto mb-3 sm:hidden" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-[#D7E4E0] font-medium">
                    <span className="font-semibold text-[#F2D5A0]">
                      {activeWish.member}
                      {isActiveWishOwn ? ' (Tú)' : ''}
                    </span>
                    {activeWish.createdAt && (
                      <>
                        <span aria-hidden="true" className="text-[#8CA8A1]">
                          ·
                        </span>
                        <span className="tabular-nums">{activeWish.createdAt}</span>
                      </>
                    )}
                    {activeWish.isFavorite && (
                      <>
                        <span aria-hidden="true" className="text-[#8CA8A1]">
                          ·
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-[#F2D5A0]">
                          <Star className="h-3.5 w-3.5 fill-current shrink-0" />
                          Regalo favorito
                        </span>
                      </>
                    )}
                    {!isActiveWishOwn && activeWish.reservedAnonymously && (
                      <>
                        <span aria-hidden="true" className="text-[#8CA8A1]">
                          ·
                        </span>
                        <span className="font-semibold text-[#FFB5A7]">
                          Reservado en secreto
                        </span>
                      </>
                    )}
                  </div>
                  <h2
                    id="wish-detail-title"
                    className="font-display text-lg sm:text-xl font-bold text-[#FFFBF4] leading-snug break-words"
                  >
                    {activeWish.wish}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveWishId(null)}
                  aria-label="Cerrar detalle"
                  className="min-h-[44px] min-w-[44px] -mr-1.5 -mt-1 flex items-center justify-center rounded-full text-[#D7E4E0] hover:bg-white/10 shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="absolute bottom-0 inset-x-0 pointer-events-none">
                <ScallopedSnowEdge className="text-white dark:text-[#223B37]" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-4">
              {activeWish.description && (
                <p className="text-sm sm:text-base text-[#1A2E2B] dark:text-[#FBF3E4] leading-relaxed whitespace-pre-line">
                  {activeWish.description}
                </p>
              )}

              {activeWish.productUrl && activeWishFallback && (
                <LinkPreviewCard
                  preview={{
                    url: activeWish.productUrl,
                    title: activeWish.linkTitle || activeWishFallback.title,
                    description: activeWish.linkDesc || activeWishFallback.description,
                    image: activeWish.linkImage || activeWishFallback.image,
                    price: activeWish.linkPrice || '',
                    siteName: activeWish.linkSite || activeWishFallback.siteName,
                    favicon: activeWishFallback.favicon,
                  }}
                />
              )}

              {activeWish.photoId && (
                <div>
                  {loadingPhoto ? (
                    <div className="rounded-2xl border border-[#D8E2DE] dark:border-[#34534D] bg-[#FAFBF9] dark:bg-[#1C3330] p-6 flex items-center justify-center gap-2 text-xs text-[#556D68] dark:text-[#BDD0CB]">
                      <Loader2 className="h-4 w-4 animate-spin text-[#D96857] dark:text-[#F2D5A0]" />
                      <span>Cargando foto…</span>
                    </div>
                  ) : detailPhotoUrl && !photoError ? (
                    <div className="rounded-2xl overflow-hidden border border-[#D8E2DE] dark:border-[#34534D] bg-[#FAFBF9] dark:bg-[#1C3330]">
                      <img
                        src={detailPhotoUrl}
                        alt={`Foto de referencia para ${activeWish.wish}`}
                        referrerPolicy="no-referrer"
                        className="w-full max-h-80 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-[#D8E2DE] dark:border-[#34534D] bg-[#FAFBF9] dark:bg-[#1C3330] p-5 flex flex-col items-center justify-center gap-2 text-center text-[#556D68] dark:text-[#BDD0CB]">
                      <ImageOff className="h-6 w-6 opacity-60" />
                      <p className="text-xs">No se pudo cargar la foto.</p>
                    </div>
                  )}
                </div>
              )}

              {!isActiveWishOwn ? (
                <div className="pt-3.5 border-t border-[#D8E2DE] dark:border-[#34534D] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-[#1A2E2B] dark:text-[#FBF3E4]">
                        {activeWish.reservedAnonymously
                          ? 'Reservado en secreto'
                          : 'Disponible para regalar'}
                      </p>
                      <p className="text-xs text-[#556D68] dark:text-[#BDD0CB] leading-relaxed">
                        {activeWish.reservedAnonymously
                          ? `Alguien del grupo ya marcó este regalo para evitar duplicados. ${activeWish.member} no puede ver esta marca.`
                          : `Reserva anónima: márcalo si vas a comprarlo para evitar regalos repetidos. ${activeWish.member} no lo verá ni sabrá quién fue.`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleReserve(activeWish)}
                      className={`min-h-[46px] px-5 py-2.5 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 active:scale-[0.98] transition-all ${
                        activeWish.reservedAnonymously
                          ? 'border border-[#D4DFDB] dark:border-[#3A5C55] bg-white dark:bg-[#284540] text-[#556D68] dark:text-[#BDD0CB] hover:text-[#1A2E2B] dark:hover:text-[#FBF3E4]'
                          : 'bg-[#D96857] hover:bg-[#C45544] dark:bg-[#DE705E] dark:hover:bg-[#EA7E6C] text-[#FFFBF5] shadow-sm shadow-[#D96857]/25'
                      }`}
                    >
                      {activeWish.reservedAnonymously ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-[#D96857] dark:text-[#F29C8E]" />
                          <span>Liberar reserva</span>
                        </>
                      ) : (
                        <>
                          <Gift className="h-4 w-4" />
                          <span>Lo regalaré</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-3.5 border-t border-[#D8E2DE] dark:border-[#34534D] text-xs text-[#556D68] dark:text-[#BDD0CB] leading-relaxed">
                  Este es uno de tus deseos. Si alguien lo reserva en secreto, permanecerá oculto para ti para mantener la sorpresa. Puedes editarlo o elegir tu favorito en «Mis Deseos».
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
