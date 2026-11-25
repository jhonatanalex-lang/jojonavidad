import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import {
  buildFallbackLinkPreview,
  fetchLinkPreview,
  isFallbackThumbnailUrl,
} from '../lib/linkService';
import { fetchWishPhoto } from '../lib/firestoreService';
import {
  compressImageFile,
  formatBytes,
  normalizeHttpUrl,
} from '../lib/validation';
import { CompressedPhoto, LinkPreview, WishItem } from '../types/wishlist';
import { LinkPreviewCard } from './LinkPreviewCard';
import {
  FestiveInputShell,
  HolidayMedallion,
  ScallopedSnowEdge,
} from './FestiveDecor';

interface WishComposerProps {
  open: boolean;
  editingWish: WishItem | null;
  currentFavoriteWish?: WishItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmitWish: (payload: {
    wish: string;
    description: string;
    productUrl: string;
    linkTitle: string;
    linkImage: string;
    linkSite: string;
    linkDesc: string;
    linkPrice: string;
    keepExistingPhoto: boolean;
    photo: CompressedPhoto | null;
    isFavorite: boolean;
  }) => Promise<void>;
}

export const WishComposer: React.FC<WishComposerProps> = ({
  open,
  editingWish,
  currentFavoriteWish = null,
  isSubmitting,
  onClose,
  onSubmitWish,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [photo, setPhoto] = useState<CompressedPhoto | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState('');
  const [keepExistingPhoto, setKeepExistingPhoto] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const lastFetchedInputRef = useRef<string>('');

  function resetForm() {
    setTitle('');
    setDescription('');
    setUrlInput('');
    setLinkPreview(null);
    setLoadingPreview(false);
    setPhoto(null);
    setExistingPhotoUrl('');
    setKeepExistingPhoto(false);
    setIsFavorite(false);
    setPhotoError(null);
    setFormError(null);
    lastFetchedInputRef.current = '';
  }

  useEffect(() => {
    if (!open) return;

    if (editingWish) {
      setTitle(editingWish.wish);
      setDescription(editingWish.description);
      setUrlInput(editingWish.productUrl || '');
      setPhoto(null);
      setKeepExistingPhoto(Boolean(editingWish.photoId));
      setIsFavorite(Boolean(editingWish.isFavorite));
      setExistingPhotoUrl('');
      setPhotoError(null);
      setFormError(null);

      if (editingWish.photoId) {
        fetchWishPhoto(editingWish.photoId)
          .then((dataUrl) => setExistingPhotoUrl(dataUrl))
          .catch(() => setExistingPhotoUrl(''));
      }

      if (editingWish.productUrl) {
        const fb = buildFallbackLinkPreview(editingWish.productUrl, editingWish.wish);
        setLinkPreview({
          url: editingWish.productUrl,
          title: editingWish.linkTitle || fb.title,
          description: editingWish.linkDesc || fb.description,
          image: editingWish.linkImage || fb.image,
          siteName: editingWish.linkSite || fb.siteName,
          price: editingWish.linkPrice || '',
          favicon: fb.favicon,
        });
        lastFetchedInputRef.current = editingWish.productUrl;
      } else {
        setLinkPreview(null);
        lastFetchedInputRef.current = '';
      }
    } else {
      resetForm();
    }
  }, [open, editingWish]);

  const normalizedUrl = normalizeHttpUrl(urlInput);

  useEffect(() => {
    if (!open) return;
    if (!normalizedUrl) {
      setLinkPreview(null);
      setLoadingPreview(false);
      lastFetchedInputRef.current = '';
      return;
    }

    if (normalizedUrl === lastFetchedInputRef.current && linkPreview) {
      return;
    }

    const hint = title.trim();
    setLinkPreview(buildFallbackLinkPreview(normalizedUrl, hint));
    setLoadingPreview(true);

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { preview } = await fetchLinkPreview(normalizedUrl, hint);
        if (!cancelled) {
          lastFetchedInputRef.current = normalizedUrl;
          setLinkPreview(preview);
        }
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, normalizedUrl]);

  useEffect(() => {
    if (!open || !normalizedUrl || loadingPreview || !linkPreview) return;
    const hasScrapedDirectImage =
      Boolean(linkPreview.image) && !isFallbackThumbnailUrl(linkPreview.image);
    if (hasScrapedDirectImage) return;

    const timer = setTimeout(() => {
      const updated = buildFallbackLinkPreview(normalizedUrl, title.trim());
      if (updated.image !== linkPreview.image) {
        setLinkPreview((prev) =>
          prev
            ? {
                ...prev,
                image: updated.image,
              }
            : updated
        );
      }
    }, 260);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, title, normalizedUrl, loadingPreview]);

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setPhotoError(null);
    try {
      const compressed = await compressImageFile(file);
      setPhoto(compressed);
      setExistingPhotoUrl('');
      setKeepExistingPhoto(false);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Error al procesar imagen.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanTitle = title.trim();
    const cleanDesc = description.trim();
    if (!cleanTitle) {
      setFormError('Escribe qué regalo deseas recibir.');
      return;
    }
    if (!cleanDesc) {
      setFormError('Agrega detalles útiles (talla, color o modelo).');
      return;
    }

    let finalUrl = '';
    let resolvedPreview: LinkPreview | null = linkPreview;
    if (urlInput.trim()) {
      finalUrl = normalizeHttpUrl(urlInput);
      if (!finalUrl) {
        setFormError('El enlace no es válido. Verifica la dirección.');
        return;
      }
      if (lastFetchedInputRef.current !== finalUrl) {
        const { preview } = await fetchLinkPreview(finalUrl, cleanTitle);
        resolvedPreview = preview;
        lastFetchedInputRef.current = finalUrl;
        setLinkPreview(preview);
      } else if (!resolvedPreview) {
        resolvedPreview = buildFallbackLinkPreview(finalUrl, cleanTitle);
      } else if (!resolvedPreview.image) {
        resolvedPreview = {
          ...resolvedPreview,
          image: buildFallbackLinkPreview(finalUrl, cleanTitle).image,
        };
      }
    }

    try {
      await onSubmitWish({
        wish: cleanTitle,
        description: cleanDesc,
        productUrl: finalUrl,
        linkTitle: resolvedPreview?.title || '',
        linkImage: resolvedPreview?.image || '',
        linkSite: resolvedPreview?.siteName || '',
        linkDesc: resolvedPreview?.description || '',
        linkPrice: resolvedPreview?.price || '',
        keepExistingPhoto,
        photo,
        isFavorite,
      });

      if (!editingWish) {
        resetForm();
      }
    } catch {
      // Error feedback is displayed by parent notification; keep form inputs intact
    }
  };

  if (!open) return null;

  const activePhotoPreview = photo?.dataUrl || existingPhotoUrl;
  const displayedPreview =
    normalizedUrl
      ? linkPreview || buildFallbackLinkPreview(normalizedUrl, title.trim())
      : null;
  const hasInvalidUrlText = Boolean(urlInput.trim()) && !normalizedUrl;
  const otherFavoriteWish =
    currentFavoriteWish && currentFavoriteWish.id !== editingWish?.id
      ? currentFavoriteWish
      : null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-[#0F1E1C]/60 dark:bg-black/70 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wish-composer-title"
    >
      <div className="w-full max-w-lg max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#223B37] border border-[#D8E2DE] dark:border-[#34534D] shadow-2xl overflow-hidden">
        {/* Pine-teal festive header with 3D gift medallion & scalloped snow shelf */}
        <div className="relative bg-gradient-to-br from-[#2C4B46] via-[#345852] to-[#26423D] pt-2.5 sm:pt-4 px-5 sm:px-6 pb-6 shrink-0 text-[#FBF3E4]">
          <div className="w-10 h-1 rounded-full bg-white/30 mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <HolidayMedallion object="gift" size="xs" />
              <h2
                id="wish-composer-title"
                className="font-display text-lg sm:text-xl font-bold text-[#FFFBF4] truncate"
              >
                {editingWish ? 'Editar deseo' : 'Nuevo deseo'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Cerrar"
              className="min-h-[44px] min-w-[44px] -mr-1.5 flex items-center justify-center rounded-full text-[#D7E4E0] hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="absolute bottom-0 inset-x-0 pointer-events-none">
            <ScallopedSnowEdge className="text-white dark:text-[#223B37]" />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-4"
        >
          {formError && (
            <div
              role="alert"
              className="rounded-2xl border border-[#D96857]/40 bg-[#D96857]/8 dark:bg-[#2F2120] px-4 py-3 text-sm text-[#C45544] dark:text-[#F29C8E]"
            >
              {formError}
            </div>
          )}

          <div>
            <label
              htmlFor="wish-title-input"
              className="block text-sm font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] mb-1.5"
            >
              ¿Qué quieres recibir?
            </label>
            <FestiveInputShell ornament="gift">
              <input
                id="wish-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Zapatillas negras"
                maxLength={140}
                className="w-full min-h-[48px] pl-10 pr-4 py-2.5 rounded-2xl border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0] transition-colors"
                required
              />
            </FestiveInputShell>
          </div>

          <div>
            <label
              htmlFor="wish-desc-input"
              className="block text-sm font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] mb-1.5"
            >
              Detalles
            </label>
            <FestiveInputShell ornament="holly" alignTop>
              <textarea
                id="wish-desc-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Talla, color o preferencia..."
                rows={3}
                maxLength={600}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0] transition-colors resize-y"
                required
              />
            </FestiveInputShell>
          </div>

          <div className="space-y-2.5">
            <span className="block text-sm font-semibold text-[#1A2E2B] dark:text-[#FBF3E4]">
              Enlace e imagen{' '}
              <span className="font-normal text-[#556D68] dark:text-[#BDD0CB]">(opcional)</span>
            </span>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFilePicked}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFilePicked}
            />

            {/* Link input with festive star ornament right alongside Add Image buttons */}
            <div className="flex items-stretch gap-2">
              <FestiveInputShell ornament="star" className="flex-1 min-w-0">
                <input
                  id="wish-link-input"
                  type="text"
                  inputMode="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Pegar enlace (Marketplace, tienda…)"
                  aria-label="Enlace del producto"
                  className="w-full min-h-[48px] pl-10 pr-9 py-2 rounded-2xl border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] focus:bg-white dark:focus:bg-[#25403B] text-base sm:text-sm text-[#1A2E2B] dark:text-[#FBF3E4] dark:placeholder:text-[#8CA8A1] outline-none focus:border-[#D96857] dark:focus:border-[#F2D5A0] transition-colors"
                />
                {urlInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setUrlInput('');
                      setLinkPreview(null);
                      lastFetchedInputRef.current = '';
                    }}
                    aria-label="Limpiar enlace"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-lg text-[#556D68] dark:text-[#BDD0CB] hover:text-[#1A2E2B] dark:hover:text-[#FBF3E4]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </FestiveInputShell>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                aria-label="Tomar foto"
                title="Tomar foto"
                className="min-h-[48px] min-w-[48px] px-2.5 rounded-2xl border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] hover:border-[#D96857] dark:hover:border-[#F2D5A0] active:scale-[0.97] text-[#2B4B46] dark:text-[#F2D5A0] transition-all inline-flex items-center justify-center shrink-0"
              >
                <Camera className="h-4.5 w-4.5" />
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                aria-label="Agregar imagen"
                className="min-h-[48px] px-3.5 rounded-2xl border border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] hover:border-[#D96857] dark:hover:border-[#F2D5A0] active:scale-[0.97] text-xs font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] transition-all inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <ImagePlus className="h-4 w-4 text-[#D96857] dark:text-[#F2D5A0] shrink-0" />
                <span>Imagen</span>
              </button>
            </div>

            {hasInvalidUrlText && (
              <p className="text-xs text-[#C45544] dark:text-[#F29C8E]">
                Pega un enlace completo (ej. mercadolibre.com/… o https://…)
              </p>
            )}

            {displayedPreview && (
              <div className="space-y-1.5">
                <LinkPreviewCard
                  preview={displayedPreview}
                  compact
                  loading={loadingPreview}
                  onUseTitle={
                    !title.trim() ? (t) => setTitle(t.slice(0, 120)) : undefined
                  }
                />
                {!loadingPreview && !displayedPreview.image && !activePhotoPreview && (
                  <p className="text-xs text-[#556D68] dark:text-[#BDD0CB]">
                    Este sitio protege su foto automática. Escribe el nombre arriba o adjunta una captura.
                  </p>
                )}
              </div>
            )}

            {activePhotoPreview && (
              <div className="rounded-2xl border border-[#D8E2DE] dark:border-[#34534D] bg-[#FAFBF9] dark:bg-[#1C3330] p-3 flex items-center gap-3.5">
                <img
                  src={activePhotoPreview}
                  alt="Vista previa de foto seleccionada"
                  referrerPolicy="no-referrer"
                  className="h-14 w-14 rounded-xl object-cover border border-[#D8E2DE] dark:border-[#34534D] shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-sm font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] truncate">
                    {photo ? photo.fileName : 'Foto guardada'}
                  </p>
                  <p className="text-xs text-[#556D68] dark:text-[#BDD0CB] font-mono tabular-nums">
                    {photo
                      ? `Optimizada · ${formatBytes(photo.sizeBytes)}`
                      : 'Lista'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    setExistingPhotoUrl('');
                    setKeepExistingPhoto(false);
                  }}
                  aria-label="Quitar foto"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#D96857] dark:text-[#F29C8E] hover:bg-[#D96857]/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}

            {photoError && <p className="text-xs text-[#C45544] dark:text-[#F29C8E]">{photoError}</p>}
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isFavorite}
            onClick={() => setIsFavorite((prev) => !prev)}
            className={`w-full min-h-[56px] px-4 py-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-colors ${
              isFavorite
                ? 'border-[#C98B4B]/65 dark:border-[#F2D5A0]/60 bg-[#FBF6EB] dark:bg-[#2A443D]'
                : 'border-[#D4DFDB] dark:border-[#3A5C55] bg-[#FAFBF9] dark:bg-[#1C3330] hover:border-[#C98B4B]/50 dark:hover:border-[#F2D5A0]/45'
            }`}
          >
            <div className="flex items-start gap-3 min-w-0">
              <Star
                className={`h-5 w-5 mt-0.5 shrink-0 transition-colors ${
                  isFavorite
                    ? 'text-[#B87735] dark:text-[#F2D5A0] fill-current'
                    : 'text-[#7E9690] dark:text-[#8CA8A1]'
                }`}
              />
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] leading-snug">
                  Destacar como mi regalo favorito principal
                </p>
                <p className="text-xs text-[#556D68] dark:text-[#BDD0CB] leading-relaxed">
                  {isFavorite && otherFavoriteWish
                    ? `Reemplazará a «${otherFavoriteWish.wish}» como tu único favorito.`
                    : isFavorite
                    ? 'Aparecerá primero en tu lista con estrella dorada para tu Amigo Secreto.'
                    : otherFavoriteWish
                    ? `Solo 1 favorito por persona (actual: «${otherFavoriteWish.wish}»).`
                    : 'Señala el regalo que más ilusión te hace (solo 1 por persona).'}
                </p>
              </div>
            </div>
            <span
              aria-hidden="true"
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                isFavorite
                  ? 'bg-[#C98B4B] dark:bg-[#E0B973]'
                  : 'bg-[#CBD6D2] dark:bg-[#3A5C55]'
              }`}
            >
              <span
                className={`inline-block h-4.5 w-4.5 rounded-full bg-white shadow-xs transition-transform ${
                  isFavorite ? 'translate-x-5.5' : 'translate-x-1'
                }`}
              />
            </span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[50px] px-6 py-3 rounded-full bg-[#D96857] hover:bg-[#C45544] dark:bg-[#DE705E] dark:hover:bg-[#EA7E6C] text-[#FFFBF5] text-base font-semibold shadow-md shadow-[#D96857]/25 active:scale-[0.98] transition-all disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando…</span>
              </>
            ) : editingWish ? (
              'Guardar cambios'
            ) : (
              'Guardar deseo'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
