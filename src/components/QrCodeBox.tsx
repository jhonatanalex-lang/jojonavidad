import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download } from 'lucide-react';

interface QrCodeBoxProps {
  groupCode: string;
  groupName: string;
}

export function buildGroupInviteUrl(groupCode: string): string {
  return `${window.location.origin}${window.location.pathname}?grupo=${encodeURIComponent(
    groupCode
  )}`;
}

export const QrCodeBox: React.FC<QrCodeBoxProps> = ({ groupCode, groupName }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const inviteUrl = buildGroupInviteUrl(groupCode);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(inviteUrl, {
      width: 240,
      margin: 2,
      color: {
        dark: '#2B4B46',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [inviteUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(groupCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2400);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `navidad-secreta-${groupCode.toLowerCase()}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-2xl border border-[#D8E2DE] dark:border-[#34534D] bg-[#FAFBF9] dark:bg-[#1C3330] p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
        {/* Keep QR backing crisp white in both themes so smartphone cameras reliably decode it */}
        <div className="shrink-0 rounded-2xl bg-white border border-[#D8E2DE] dark:border-[#3A5C55] p-2.5 shadow-xs">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`Código QR para unirse al grupo ${groupName}`}
              className="w-36 h-36 sm:w-40 sm:h-40 block"
            />
          ) : (
            <div className="w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center text-xs text-[#556D68]">
              Generando QR…
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 w-full space-y-3 text-center sm:text-left">
          <div>
            <p className="text-xs font-semibold text-[#556D68] dark:text-[#BDD0CB]">Código</p>
            <div className="mt-1 flex items-center justify-center sm:justify-start gap-2">
              <span className="font-mono text-2xl font-bold tracking-wider text-[#2B4B46] dark:text-[#F2D5A0] tabular-nums">
                {groupCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="min-h-[44px] px-3.5 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-white dark:bg-[#223B37] text-xs font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] hover:border-[#D96857] dark:hover:border-[#F2D5A0] active:scale-[0.98] transition-all inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                {copiedCode ? (
                  <Check className="h-3.5 w-3.5 text-[#D96857] dark:text-[#F2D5A0]" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#556D68] dark:text-[#BDD0CB] mb-1">Enlace</p>
            <div className="text-xs font-mono break-all bg-white dark:bg-[#223B37] px-3.5 py-2.5 rounded-2xl border border-[#D8E2DE] dark:border-[#34534D] text-[#49635E] dark:text-[#D7E4E0]">
              {inviteUrl}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleCopyLink}
              className="min-h-[44px] px-4 py-2 rounded-full bg-[#D96857] hover:bg-[#C45544] dark:bg-[#DE705E] dark:hover:bg-[#EA7E6C] text-[#FFFBF5] text-xs sm:text-sm font-semibold active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedLink ? 'Copiado' : 'Copiar enlace'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={!qrDataUrl}
              className="min-h-[44px] px-4 py-2 rounded-full border border-[#D4DFDB] dark:border-[#3A5C55] bg-white dark:bg-[#223B37] text-xs sm:text-sm font-semibold text-[#1A2E2B] dark:text-[#FBF3E4] hover:border-[#D96857] dark:hover:border-[#F2D5A0] active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>Guardar QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
