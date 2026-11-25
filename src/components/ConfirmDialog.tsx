import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F1E1C]/60 dark:bg-black/70 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#223B37] border border-[#D8E2DE] dark:border-[#34534D] px-5 pt-2.5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-6 shadow-2xl">
        <div className="w-10 h-1 rounded-full bg-[#D4DFDB] dark:bg-[#3A5C55] mx-auto mb-3 sm:hidden" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                destructive
                  ? 'bg-[#D96857]/15 dark:bg-[#D96857]/25 text-[#C45544] dark:text-[#F29C8E]'
                  : 'bg-[#2F4E49]/12 dark:bg-[#355A53] text-[#2B4B46] dark:text-[#F2D5A0]'
              }`}
            >
              {destructive ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>
            <h3
              id="confirm-dialog-title"
              className="font-display text-lg font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] text-balance"
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#556D68] dark:text-[#BDD0CB] hover:bg-[#F3F6F4] dark:hover:bg-[#294742] transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-[#49635E] dark:text-[#D7E4E0]">
          {description}
        </p>

        <div className="mt-5 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-[46px] px-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-white dark:bg-[#284540] text-sm font-medium text-[#1A2E2B] dark:text-[#FBF3E4] hover:bg-[#F3F6F4] dark:hover:bg-[#2F524C] transition-colors whitespace-nowrap shrink-0"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`min-h-[46px] px-5 py-2 rounded-full text-sm font-semibold text-[#FFFBF5] transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 active:scale-[0.98] ${
              destructive
                ? 'bg-[#C44939] dark:bg-[#D15948] hover:bg-[#A63A2B] dark:hover:bg-[#E06857]'
                : 'bg-[#D96857] dark:bg-[#DE705E] hover:bg-[#C45544] dark:hover:bg-[#EA7E6C]'
            }`}
          >
            {busy ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
