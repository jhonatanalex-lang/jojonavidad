import { LinkPreview } from '../types/wishlist';
import { normalizeHttpUrl } from './validation';

const KNOWN_STORES: Array<{ match: (host: string, path: string) => boolean; name: string }> = [
  {
    match: (h) => h.includes('mercadolibre.') || h.includes('mercadolivre.') || h.includes('meli.'),
    name: 'Mercado Libre',
  },
  {
    match: (h, p) =>
      (h.includes('facebook.') || h.includes('fb.')) && p.toLowerCase().includes('marketplace'),
    name: 'Facebook Marketplace',
  },
  {
    match: (h) => h.includes('facebook.') || h.includes('fb.'),
    name: 'Facebook',
  },
  {
    match: (h) => h.includes('amazon.') || h === 'a.co' || h.includes('amzn.'),
    name: 'Amazon',
  },
  { match: (h) => h.includes('falabella.'), name: 'Falabella' },
  { match: (h) => h.includes('ripley.'), name: 'Ripley' },
  { match: (h) => h.includes('oechsle.'), name: 'Oechsle' },
  { match: (h) => h.includes('plazavea.'), name: 'PlazaVea' },
  { match: (h) => h.includes('promart.'), name: 'Promart' },
  { match: (h) => h.includes('sodimac.'), name: 'Sodimac' },
  { match: (h) => h.includes('tottus.'), name: 'Tottus' },
  { match: (h) => h.includes('coolbox.'), name: 'Coolbox' },
  { match: (h) => h.includes('hiraoka.'), name: 'Hiraoka' },
  { match: (h) => h.includes('wong.'), name: 'Wong' },
  { match: (h) => h.includes('metro.pe'), name: 'Metro' },
  { match: (h) => h.includes('tailoy.'), name: 'Tai Loy' },
  { match: (h) => h.includes('tiendamia.'), name: 'Tiendamia' },
  { match: (h) => h.includes('aliexpress.'), name: 'AliExpress' },
  { match: (h) => h.includes('temu.'), name: 'Temu' },
  { match: (h) => h.includes('shein.'), name: 'Shein' },
  { match: (h) => h.includes('ebay.'), name: 'eBay' },
  { match: (h) => h.includes('etsy.'), name: 'Etsy' },
  { match: (h) => h.includes('zara.'), name: 'Zara' },
  { match: (h) => h.includes('adidas.'), name: 'Adidas' },
  { match: (h) => h.includes('nike.'), name: 'Nike' },
  { match: (h) => h.includes('hm.com'), name: 'H&M' },
  { match: (h) => h.includes('linio.'), name: 'Linio' },
  { match: (h) => h.includes('instagram.'), name: 'Instagram' },
  { match: (h) => h.includes('tiktok.'), name: 'TikTok' },
];

const IGNORED_PATH_SEGMENTS = new Set([
  'p',
  'dp',
  'gp',
  'aw',
  'd',
  's',
  'b',
  'product',
  'products',
  'producto',
  'productos',
  'articulo',
  'articulos',
  'item',
  'items',
  'itm',
  'listing',
  'buy',
  'shop',
  'tienda',
  'store',
  'categoria',
  'category',
  'cat',
  'pe',
  'es',
  'en',
  'mx',
  'cl',
  'co',
  'ar',
  'br',
  'us',
  'falabella-pe',
  'falabella-cl',
  'falabella-co',
  'marketplace',
  'share',
  'v',
  'video',
  'reel',
  'reels',
  'sistema',
  '404',
  'notfound',
  'not-found',
  'ref',
  'collections',
  'collection',
]);

function detectStoreName(host: string, pathname: string): string {
  const lowerHost = host.toLowerCase();
  const found = KNOWN_STORES.find((s) => s.match(lowerHost, pathname));
  return found ? found.name : host;
}

export function extractProductTitleFromUrl(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  let best = '';

  for (const rawSeg of segments) {
    let seg = rawSeg;
    try {
      seg = decodeURIComponent(rawSeg);
    } catch {
      // keep raw
    }

    const lower = seg.toLowerCase();
    if (IGNORED_PATH_SEGMENTS.has(lower)) continue;
    if (lower.startsWith('@')) continue;

    const cleaned = seg
      .replace(/\.(html?|php|aspx?)$/i, '')
      .replace(/^M[A-Z]{1,2}-\d+-/i, '')
      .replace(/-_JM$/i, '')
      .replace(/-\d{5,}p?$/i, '')
      .replace(/^[A-Z0-9]{8,14}$/, '');

    if (!cleaned || cleaned.length < 4) continue;
    if (/^M[A-Z]{1,2}\d+$/i.test(cleaned)) continue;
    if (/^\d+$/.test(cleaned)) continue;
    if (!/[-_\s]/.test(cleaned) && /[0-9]/.test(cleaned) && cleaned.length >= 7) {
      continue;
    }

    const words = cleaned.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (words.length < 4 || !/[a-zA-ZáéíóúñÁÉÍÓÚÑ]{2,}/.test(words)) continue;
    if (!words.includes(' ') && words.length < 5) continue;

    if (words.length > best.length) {
      best = words;
    }
  }

  if (!best) return '';
  return best.charAt(0).toUpperCase() + best.slice(1);
}

export function isFallbackThumbnailUrl(imageUrl: string | undefined): boolean {
  return Boolean(imageUrl && imageUrl.startsWith('https://tse1.mm.bing.net/th?'));
}

export function buildThumbnailFallbackUrl(title: string): string {
  const clean = title.trim();
  if (!clean || clean.length < 2) return '';
  const lower = clean.toLowerCase();
  if (
    lower.startsWith('producto en ') ||
    lower.startsWith('artículo en ') ||
    lower.startsWith('publicación ') ||
    /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(clean)
  ) {
    return '';
  }
  return `https://tse1.mm.bing.net/th?q=${encodeURIComponent(
    clean
  )}&w=600&h=600&c=7&rs=1&p=0`;
}

export function buildFallbackLinkPreview(rawUrl: string, hintTitle = ''): LinkPreview {
  const valid = normalizeHttpUrl(rawUrl) || rawUrl;
  const cleanHint = hintTitle.trim();

  try {
    const parsed = new URL(valid);
    const host = parsed.hostname.replace(/^www\./i, '').replace(/^m\./i, '');
    const siteName = detectStoreName(host, parsed.pathname);
    const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
      host
    )}&sz=64`;
    const slugTitle = extractProductTitleFromUrl(parsed.pathname);

    let defaultTitle = `Producto en ${siteName}`;
    let defaultDesc = `Toca para ver en ${siteName}`;

    if (siteName === 'Facebook Marketplace') {
      defaultTitle = 'Artículo en Facebook Marketplace';
      defaultDesc = 'Toca para abrir el artículo en Marketplace';
    } else if (siteName === 'Facebook') {
      defaultTitle = 'Publicación de Facebook';
      defaultDesc = 'Toca para ver el enlace en Facebook';
    } else if (siteName === 'Instagram' || siteName === 'TikTok') {
      defaultTitle = `Publicación en ${siteName}`;
      defaultDesc = `Toca para ver en ${siteName}`;
    } else if (siteName === host) {
      defaultTitle = slugTitle || host;
      defaultDesc = 'Toca para abrir el enlace del producto';
    }

    const title = slugTitle || defaultTitle;
    const imageQuery = slugTitle || cleanHint;

    return {
      url: parsed.href,
      title,
      description: defaultDesc,
      image: imageQuery ? buildThumbnailFallbackUrl(imageQuery) : '',
      siteName,
      price: '',
      favicon,
    };
  } catch {
    return {
      url: rawUrl,
      title: rawUrl,
      description: 'Enlace del producto',
      image: cleanHint ? buildThumbnailFallbackUrl(cleanHint) : '',
      siteName: 'Enlace',
      price: '',
    };
  }
}

export async function fetchLinkPreview(
  url: string,
  hintTitle = ''
): Promise<{
  preview: LinkPreview;
  partial: boolean;
}> {
  const fallback = buildFallbackLinkPreview(url, hintTitle);

  try {
    const res = await fetch('/api/link-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, hintTitle: hintTitle.trim() }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok || !data.preview) {
      return { preview: fallback, partial: !fallback.image };
    }

    const p = data.preview as LinkPreview;
    const resolvedImage = p.image || fallback.image;
    return {
      preview: {
        url: p.url || fallback.url,
        title: p.title || fallback.title,
        description: p.description || fallback.description,
        image: resolvedImage,
        siteName: p.siteName || fallback.siteName,
        price: p.price || '',
        favicon: p.favicon || fallback.favicon,
      },
      partial: Boolean(data.partial) && !resolvedImage,
    };
  } catch {
    return { preview: fallback, partial: !fallback.image };
  }
}
