import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Gift,
  ImageOff,
  Loader2,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react';
import { fetchWishPhoto } from '../lib/firestoreService';
import { buildFallbackLinkPreview } from '../lib/linkService';
import { WishItem } from '../types/wishlist';
import { LinkPreviewCard } from './LinkPreviewCard';

interface WishCardProps {
  wish: WishItem;
  isOwn: boolean;
  canManage: boolean;
  defaultOpen?: boolean;
  variant?: 'card' | 'list-item';
  favoriteBusy?: boolean;
  onEdit?: (wish: WishItem) => void;
  onDelete?: (wish: WishItem) => void;
  onToggleReserve?: (wish: WishItem) => void;
  onToggleFavorite?: (wish: WishItem) => void;
}

export const WishCard: React.FC<WishCardProps> = ({
  wish,
  isOwn,
  canManage,
  defaultOpen = false,
  variant = 'card',
  favoriteBusy = false,
  onEdit,
  onDelete,
  onToggleReserve,
  onToggleFavorite,
}) => {
  const [expanded, setExpanded] = useState(defaultOpen);
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const hasPhoto = Boolean(wish.photoId);
  const hasLink = Boolean(wish.productUrl);
  const isFavorite = Boolean(wish.isFavorite);

  useEffect(() => {
    if (!expanded || !wish.photoId || photoDataUrl) return;
    let cancelled = false;
    setLoadingPhoto(true);
    setPhotoError(false);

    fetchWishPhoto(wish.photoId)
      .then((url) => {
        if (!cancelled) {
          if (url) setPhotoDataUrl(url);
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
  }, [expanded, wish.photoId, photoDataUrl]);

  useEffect(() => {
    setPhotoDataUrl('');
    setPhotoError(false);
  }, [wish.photoId]);

  const metaParts: string[] = isOwn && variant === 'list-item' ? [] : [wish.member];
  if (wish.createdAt) metaParts.push(wish.createdAt);
  if (hasLink) metaParts.push('Enlace');
  if (hasPhoto) metaParts.push('Foto');
  if (!isOwn && wish.reservedAnonymously) {
    metaParts.push('Reservado en secreto');
  }

  const fallbackLink = hasLink
    ? buildFallbackLinkPreview(wish.productUrl, wish.wish)
    : null;

  const wrapperClass =
    variant === 'list-item'
      ? `${
          isFavorite
            ? 'bg-[#FBF6EB]/70 dark:bg-[#27413B]'
            : 'bg-white dark:bg-[#223B37]'
        } overflow-hidden transition-colors`
      : `rounded-3xl ${
          isFavorite
            ? 'bg-[#FBF6EB]/70 dark:bg-[#27413B] border-[#C98B4B]/55 dark:border-[#F2D5A0]/45'
            : 'bg-white dark:bg-[#223B37] border-[#D8E2DE] dark:border-[#34534D]'
        } border overflow-hidden transition-colors hover:border-[#BFD0CA] dark:hover:border-[#496F67]`;

  return (
    <article className={wrapperClass}>
      <div className="flex items-start gap-1">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex-1 min-w-0 p-4 sm:p-5 pr-2 text-left hover:bg-[#F3F6F4]/60 dark:hover:bg-[#294742]/70 transition-colors focus-visible:outline-2 focus-visible:outline-[#D96857] dark:focus-visible:outline-[#F2D5A0]"
        >
          <div className="min-w-0 space-y-1">
            {(isFavorite || metaParts.length > 0) && (
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[#556D68] dark:text-[#BDD0CB] font-medium">
                {isFavorite && (
                  <>
                    <span className="inline-flex items-center gap-1 font-semibold text-[#B87735] dark:text-[#F2D5A0]">
                      <Star className="h-3.5 w-3.5 fill-current shrink-0" />
                      Regalo favorito
                    </span>
                    {metaParts.length > 0 && (
                      <span aria-hidden="true" className="text-[#B8C7C2] dark:text-[#4C7069]">
                        ·
                      </span>
                    )}
                  </>
                )}
                {metaParts.map((part, idx) => (
                  <React.Fragment key={`${part}-${idx}`}>
                    <span
                      className={
                        !isOwn && idx === 0
                          ? 'font-semibold text-[#2B4B46] dark:text-[#F2D5A0]'
                          : part === 'Reservado en secreto'
                          ? 'font-semibold text-[#D96857] dark:text-[#F29C8E]'
                          : 'tabular-nums'
                      }
                    >
                      {part}
                    </span>
                    {idx < metaParts.length - 1 && (
                      <span aria-hidden="true" className="text-[#B8C7C2] dark:text-[#4C7069]">
                        ·
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            <h3 className="text-base sm:text-lg font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] leading-snug break-words">
              {wish.wish}
            </h3>
          </div>
        </button>

        <div className="pr-2 sm:pr-3 pt-2.5 sm:pt-3.5 flex items-center gap-0.5 shrink-0">
          {canManage && onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(wish)}
              disabled={favoriteBusy}
              aria-label={
                isFavorite
                  ? `Quitar "${wish.wish}" como regalo favorito`
                  : `Marcar "${wish.wish}" como regalo favorito principal`
              }
              title={
                isFavorite
                  ? 'Tu regalo favorito principal (toca para quitar)'
                  : 'Marcar como tu regalo favorito principal'
              }
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors active:scale-[0.95] disabled:opacity-60 ${
                isFavorite
                  ? 'text-[#B87735] dark:text-[#F2D5A0] hover:bg-[#C98B4B]/12 dark:hover:bg-[#F2D5A0]/10'
                  : 'text-[#89A09A] dark:text-[#7E9E97] hover:text-[#B87735] dark:hover:text-[#F2D5A0] hover:bg-[#F3F6F4] dark:hover:bg-[#294742]'
              }`}
            >
              {favoriteBusy ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <Star className={`h-4.5 w-4.5 ${isFavorite ? 'fill-current' : ''}`} />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Contraer detalles' : 'Ver detalles'}
            aria-expanded={expanded}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#556D68] dark:text-[#BDD0CB] hover:bg-[#F3F6F4] dark:hover:bg-[#294742] transition-colors"
          >
            <ChevronDown
              className={`h-5 w-5 transition-transform duration-200 ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3.5 border-t border-[#D8E2DE] dark:border-[#34534D] bg-[#FAFBF9] dark:bg-[#1C3330] space-y-3.5">
          {wish.description && (
            <p className="text-sm text-[#1A2E2B] dark:text-[#FBF3E4] leading-relaxed whitespace-pre-line">
              {wish.description}
            </p>
          )}

          {hasLink && fallbackLink && (
            <LinkPreviewCard
              preview={{
                url: wish.productUrl,
                title: wish.linkTitle || fallbackLink.title,
                description: wish.linkDesc || fallbackLink.description,
                image: wish.linkImage || fallbackLink.image,
                price: wish.linkPrice || '',
                siteName: wish.linkSite || fallbackLink.siteName,
                favicon: fallbackLink.favicon,
              }}
            />
          )}

          {hasPhoto && (
            <div>
              {loadingPhoto ? (
                <div className="rounded-2xl border border-[#D8E2DE] dark:border-[#34534D] bg-white dark:bg-[#223B37] p-5 flex items-center justify-center gap-2 text-xs text-[#556D68] dark:text-[#BDD0CB]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#D96857] dark:text-[#F2D5A0]" />
                  <span>Cargando foto…</span>
                </div>
              ) : photoDataUrl && !photoError ? (
                <div className="rounded-2xl overflow-hidden border border-[#D8E2DE] dark:border-[#34534D] bg-white dark:bg-[#223B37]">
                  <img
                    src={photoDataUrl}
                    alt={`Foto de referencia para ${wish.wish}`}
                    referrerPolicy="no-referrer"
                    className="w-full max-h-72 object-contain bg-[#FAFBF9] dark:bg-[#1C3330]"
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-[#D8E2DE] dark:border-[#34534D] bg-white dark:bg-[#223B37] p-5 flex flex-col items-center justify-center gap-2 text-center text-[#556D68] dark:text-[#BDD0CB]">
                  <ImageOff className="h-6 w-6 opacity-60" />
                  <p className="text-xs">No se pudo cargar la foto.</p>
                </div>
              )}
            </div>
          )}

          <div className="pt-2.5 border-t border-[#D8E2DE] dark:border-[#34534D] flex flex-wrap items-center justify-between gap-2.5">
            {canManage ? (
              <>
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(wish)}
                    disabled={favoriteBusy}
                    className={`min-h-[44px] px-4 py-2 rounded-full border text-xs sm:text-sm font-semibold active:scale-[0.98] inline-flex items-center gap-1.5 whitespace-nowrap transition-all disabled:opacity-60 ${
                      isFavorite
                        ? 'border-[#C98B4B]/65 dark:border-[#F2D5A0]/55 bg-[#FBF6EB] dark:bg-[#2A443D] text-[#A26525] dark:text-[#F2D5A0]'
                        : 'border-[#D4DFDB] dark:border-[#3A5C55] bg-white dark:bg-[#223B37] text-[#1A2E2B] dark:text-[#FBF3E4] hover:border-[#C98B4B] dark:hover:border-[#F2D5A0]'
                    }`}
                  >
                    {favoriteBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Star
                        className={`h-3.5 w-3.5 ${
                          isFavorite
                            ? 'fill-current text-[#B87735] dark:text-[#F2D5A0]'
                            : ''
                        }`}
                      />
                    )}
                    <span>{isFavorite ? 'Regalo favorito' : 'Marcar favorito'}</span>
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(wish)}
                      className="min-h-[44px] px-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-white dark:bg-[#223B37] text-xs sm:text-sm font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] hover:border-[#2F4E49] dark:hover:border-[#F2D5A0] active:scale-[0.98] inline-flex items-center gap-1.5 whitespace-nowrap transition-all"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(wish)}
                      className="min-h-[44px] px-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-white dark:bg-[#223B37] text-xs sm:text-sm font-semibold text-[#C45544] dark:text-[#F29C8E] hover:border-[#D96857] dark:hover:border-[#F29C8E] active:scale-[0.98] inline-flex items-center gap-1.5 whitespace-nowrap transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  )}
                </div>
              </>
            ) : (
              onToggleReserve && (
                <div className="w-full flex flex-wrap items-center justify-between gap-2.5">
                  <span className="text-xs text-[#556D68] dark:text-[#BDD0CB]">
                    {wish.reservedAnonymously
                      ? `Reservado en secreto (${wish.member} no lo ve)`
                      : 'Disponible para reservar en secreto'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleReserve(wish)}
                    className={`min-h-[44px] px-4 py-2 rounded-full text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap active:scale-[0.98] transition-all ${
                      wish.reservedAnonymously
                        ? 'border border-[#D4DFDB] dark:border-[#3A5C55] bg-white dark:bg-[#223B37] text-[#556D68] dark:text-[#BDD0CB] hover:text-[#1A2E2B] dark:hover:text-[#FBF3E4]'
                        : 'bg-[#D96857] hover:bg-[#C45544] dark:bg-[#DE705E] dark:hover:bg-[#EA7E6C] text-[#FFFBF5]'
                    }`}
                  >
                    {wish.reservedAnonymously ? (
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
              )
            )}
          </div>
        </div>
      )}
    </article>
  );
};
