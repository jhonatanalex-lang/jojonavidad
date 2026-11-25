import React, { useEffect, useState } from 'react';
import { ExternalLink, Globe, Loader2, Sparkles } from 'lucide-react';
import { LinkPreview } from '../types/wishlist';

interface LinkPreviewCardProps {
  preview: LinkPreview;
  compact?: boolean;
  loading?: boolean;
  onUseTitle?: (title: string) => void;
}

export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({
  preview,
  compact = false,
  loading = false,
  onUseTitle,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [preview.image]);

  return (
    <div className="rounded-2xl border border-[#D8E2DE] dark:border-[#34534D] bg-[#FAFBF9] dark:bg-[#1C3330] overflow-hidden transition-colors hover:border-[#BFD0CA] dark:hover:border-[#496F67]">
      <a
        href={preview.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col sm:flex-row items-stretch group focus-visible:outline-2 focus-visible:outline-[#D96857] dark:focus-visible:outline-[#F2D5A0]"
      >
        {preview.image && !imgFailed ? (
          <div
            className={`relative shrink-0 bg-[#EAF0ED] dark:bg-[#27443F] overflow-hidden ${
              compact ? 'sm:w-24 h-28 sm:h-auto' : 'sm:w-36 h-40 sm:h-auto'
            }`}
          >
            <img
              src={preview.image}
              alt={preview.title || 'Vista previa del enlace'}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        ) : (
          <div
            className={`shrink-0 flex flex-col items-center justify-center gap-1.5 bg-[#EAF0ED] dark:bg-[#27443F] text-[#2B4B46] dark:text-[#F2D5A0] px-3 ${
              compact ? 'sm:w-24 h-20 sm:h-auto' : 'sm:w-28 h-24 sm:h-auto'
            }`}
          >
            {preview.favicon ? (
              <img
                src={preview.favicon}
                alt=""
                referrerPolicy="no-referrer"
                className="h-7 w-7 rounded-md bg-white p-1 border border-[#D4DFDB] dark:border-[#3A5C55]"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Globe className="h-6 w-6 opacity-70" />
            )}
            <span className="text-[11px] font-semibold text-[#49635E] dark:text-[#D7E4E0] truncate max-w-full">
              {preview.siteName || 'Enlace'}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0 p-3.5 flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between gap-2 text-xs text-[#556D68] dark:text-[#BDD0CB]">
            <div className="flex items-center gap-1.5 min-w-0">
              {preview.favicon && (
                <img
                  src={preview.favicon}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-3.5 w-3.5 rounded-xs shrink-0 bg-white/80"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <span className="truncate font-medium">{preview.siteName}</span>
              {preview.price && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums font-semibold text-[#D96857] dark:text-[#F2D5A0] shrink-0">
                    {preview.price}
                  </span>
                </>
              )}
            </div>
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#D96857] dark:text-[#F2D5A0]" />
            ) : (
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#6F8882] dark:text-[#9AB4AE] group-hover:text-[#D96857] dark:group-hover:text-[#F2D5A0] transition-colors" />
            )}
          </div>

          <h4 className="text-sm font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] line-clamp-2 leading-snug group-hover:text-[#D96857] dark:group-hover:text-[#F2D5A0] transition-colors">
            {preview.title}
          </h4>

          {preview.description && (
            <p className="text-xs text-[#556D68] dark:text-[#BDD0CB] line-clamp-2 leading-relaxed">
              {preview.description}
            </p>
          )}
        </div>
      </a>

      {onUseTitle && preview.title && (
        <div className="px-3.5 py-2 border-t border-[#D8E2DE] dark:border-[#34534D] bg-white dark:bg-[#223B37] flex items-center justify-between gap-2">
          <span className="text-xs text-[#556D68] dark:text-[#BDD0CB] truncate">
            ¿Usar como nombre del deseo?
          </span>
          <button
            type="button"
            onClick={() => onUseTitle(preview.title)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#D96857] dark:text-[#F2D5A0] hover:underline whitespace-nowrap shrink-0 min-h-[36px] px-2"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Usar título
          </button>
        </div>
      )}
    </div>
  );
};
