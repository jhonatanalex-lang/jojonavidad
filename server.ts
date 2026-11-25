import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function isPrivateOrBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '0.0.0.0' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  ) {
    return true;
  }

  if (net.isIP(hostname)) {
    // IPv4 private / loopback / link-local checks
    const parts = hostname.split('.').map(Number);
    if (parts.length === 4) {
      if (
        parts[0] === 10 ||
        parts[0] === 127 ||
        parts[0] === 0 ||
        (parts[0] === 169 && parts[1] === 254) ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168)
      ) {
        return true;
      }
    }
    // IPv6 loopback / link-local / unique local
    if (
      lower === '::1' ||
      lower.startsWith('fe80:') ||
      lower.startsWith('fc') ||
      lower.startsWith('fd')
    ) {
      return true;
    }
  }

  return false;
}

function resolveAbsoluteUrl(candidate: string | undefined, baseUrl: string): string {
  if (!candidate) return '';
  const trimmed = candidate.trim();
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('javascript:')) {
    return '';
  }
  try {
    const resolved = new URL(trimmed, baseUrl);
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
      return '';
    }
    return resolved.href;
  } catch {
    return '';
  }
}

function cleanSnippet(text: string | undefined, maxLen = 220): string {
  if (!text) return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen - 1).trimEnd() + '…';
}

function isBlockedOrGenericTitle(title: string): boolean {
  const lower = title.toLowerCase().trim();
  if (!lower || lower.length < 3) return true;
  const exactBlocked = new Set([
    'mercado libre',
    'mercadolibre',
    'facebook',
    'facebook marketplace',
    'amazon',
    'amazon.com',
    'amazon.es',
    'amazon.com.mx',
    'ripley',
    'ripley.com.pe',
    'falabella',
    'falabella.com',
    'falabella.com.pe',
    'oechsle',
    'plazavea',
    'promart',
    'sodimac',
    'tottus',
    'coolbox',
    'hiraoka',
    'tiendamia',
    'aliexpress',
    'temu',
    'shein',
    'ebay',
    'instagram',
    'tiktok',
    'tiktok - make your day',
  ]);
  if (exactBlocked.has(lower)) return true;

  const blockedPatterns = [
    'log in',
    'login',
    'inicia sesión',
    'iniciar sesión',
    'entrar a facebook',
    'account verification',
    'verificación de cuenta',
    'security check',
    'just a moment',
    'attention required',
    'access denied',
    'robot or human',
    'are you a human',
    'verify you are human',
    'captcha',
    'pardon our interruption',
    'enable javascript',
    'service unavailable',
    'página no encontrada',
    'page not found',
    'not found',
    '403 forbidden',
    '404 not found',
    '503 -',
    'sorry, something went wrong',
  ];
  return blockedPatterns.some(
    (pat) => lower === pat || (lower.length < 60 && lower.includes(pat))
  );
}

function isGateRedirectUrl(urlStr: string): boolean {
  const lower = urlStr.toLowerCase();
  return (
    lower.includes('/account-verification') ||
    lower.includes('/login') ||
    lower.includes('/ap/signin') ||
    lower.includes('/checkpoint') ||
    lower.includes('/notfound') ||
    lower.includes('/not-found') ||
    lower.includes('/404') ||
    lower.includes('productlinknotfound') ||
    lower.includes('/errors/') ||
    lower.includes('challenge') ||
    lower.includes('captcha')
  );
}

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

function extractProductTitleFromUrl(parsedUrl: URL): string {
  const segments = parsedUrl.pathname.split('/').filter(Boolean);
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

    // Clean store-specific IDs & file extensions
    const cleaned = seg
      .replace(/\.(html?|php|aspx?)$/i, '')
      .replace(/^M[A-Z]{1,2}-\d+-/i, '')
      .replace(/-_JM$/i, '')
      .replace(/-\d{5,}p?$/i, '')
      .replace(/^[A-Z0-9]{8,14}$/, '');

    if (!cleaned || cleaned.length < 4) continue;
    if (/^M[A-Z]{1,2}\d+$/i.test(cleaned)) continue;
    if (/^\d+$/.test(cleaned)) continue;
    // Skip opaque base64/hash-like tokens with no hyphens/underscores/spaces
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

function buildSmartUrlFallback(parsedUrl: URL, hintTitle = '') {
  const host = parsedUrl.hostname.replace(/^www\./i, '').replace(/^m\./i, '');
  const siteName = detectStoreName(host, parsedUrl.pathname);
  const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
  const slugTitle = extractProductTitleFromUrl(parsedUrl);
  const cleanHint = hintTitle.trim();

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
    url: parsedUrl.href,
    title,
    description: defaultDesc,
    image: '',
    siteName,
    price: '',
    favicon,
    imageQuery,
  };
}

function extractJsonLdProduct($: cheerio.CheerioAPI): {
  name?: string;
  description?: string;
  image?: string;
  price?: string;
} {
  const result: { name?: string; description?: string; image?: string; price?: string } = {};
  const scripts = $('script[type="application/ld+json"]');

  const pickImageValue = (img: unknown): string => {
    if (typeof img === 'string') return img;
    if (Array.isArray(img)) {
      for (const item of img) {
        const found = pickImageValue(item);
        if (found) return found;
      }
    }
    if (img && typeof img === 'object') {
      const rec = img as Record<string, unknown>;
      if (typeof rec.url === 'string') return rec.url;
      if (typeof rec.contentUrl === 'string') return rec.contentUrl;
    }
    return '';
  };

  const inspectNode = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(inspectNode);
      return;
    }
    const obj = node as Record<string, unknown>;
    if (Array.isArray(obj['@graph'])) {
      inspectNode(obj['@graph']);
    }
    const typeVal = String(obj['@type'] || '').toLowerCase();
    if (typeVal.includes('product')) {
      if (!result.name && typeof obj.name === 'string') result.name = obj.name;
      if (!result.description && typeof obj.description === 'string') {
        result.description = obj.description;
      }
      if (!result.image && obj.image) {
        result.image = pickImageValue(obj.image);
      }
      if (!result.price && obj.offers && typeof obj.offers === 'object') {
        const offers = Array.isArray(obj.offers) ? obj.offers[0] : obj.offers;
        if (offers && typeof offers === 'object') {
          const o = offers as Record<string, unknown>;
          const amount = o.price ?? o.lowPrice;
          const currency = o.priceCurrency;
          if (amount !== undefined && amount !== null && String(amount).trim()) {
            result.price = `${currency ? `${String(currency)} ` : ''}${String(amount)}`.trim();
          }
        }
      }
    }
  };

  scripts.each((_i, el) => {
    const raw = $(el).html();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      inspectNode(parsed);
    } catch {
      // ignore malformed JSON-LD blocks
    }
  });

  return result;
}

async function resolveFallbackProductImage(
  query: string,
  siteName: string
): Promise<string> {
  const clean = query.trim();
  if (!clean || clean.length < 2) return '';
  if (isBlockedOrGenericTitle(clean)) return '';
  const lower = clean.toLowerCase();
  if (
    lower === siteName.toLowerCase() ||
    lower.startsWith('producto en ') ||
    lower.startsWith('artículo en ') ||
    lower.startsWith('publicación ') ||
    /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(clean)
  ) {
    return '';
  }

  const candidate = `https://tse1.mm.bing.net/th?q=${encodeURIComponent(
    clean
  )}&w=600&h=600&c=7&rs=1&p=0`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(candidate, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timer);
    const ctype = res.headers.get('content-type') || '';
    if (res.ok && ctype.startsWith('image/')) {
      return candidate;
    }
  } catch {
    // ignore timeout
  }
  return '';
}

async function fetchHtmlWithUa(targetUrl: string, userAgent: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-PE,es-419,es;q=0.9,en;q=0.8',
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Extract OpenGraph / meta preview for pasted product links
  app.post('/api/link-preview', async (req, res) => {
    const rawUrl = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
    const hintTitle =
      typeof req.body?.hintTitle === 'string' ? req.body.hintTitle.trim().slice(0, 120) : '';

    if (!rawUrl) {
      return res.status(400).json({ ok: false, error: 'Ingresa una URL válida.' });
    }

    let parsedUrl: URL;
    try {
      const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
      parsedUrl = new URL(normalized);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return res.status(400).json({ ok: false, error: 'Solo se permiten enlaces http o https.' });
      }
    } catch {
      return res.status(400).json({ ok: false, error: 'El formato del enlace no es válido.' });
    }

    if (isPrivateOrBlockedHost(parsedUrl.hostname)) {
      return res.status(400).json({ ok: false, error: 'Enlace no permitido por seguridad.' });
    }

    const smartFallback = buildSmartUrlFallback(parsedUrl, hintTitle);
    const { imageQuery: _q, ...publicFallback } = smartFallback;

    const sendFallback = async () => {
      const fallbackImg = await resolveFallbackProductImage(
        smartFallback.imageQuery,
        smartFallback.siteName
      );
      return res.json({
        ok: true,
        partial: !fallbackImg,
        preview: {
          ...publicFallback,
          image: fallbackImg,
        },
      });
    };

    try {
      const chromeUa =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
      const whatsappUa = 'WhatsApp/2.23.20.0 A';

      let response = await fetchHtmlWithUa(parsedUrl.href, chromeUa, 6000);
      let redirectedUrl = response.url || parsedUrl.href;
      let hitGate =
        isGateRedirectUrl(redirectedUrl) && !isGateRedirectUrl(parsedUrl.href);

      const isSocialWalled =
        smartFallback.siteName === 'Facebook Marketplace' ||
        smartFallback.siteName === 'Facebook' ||
        smartFallback.siteName === 'Instagram';

      if ((!response.ok || hitGate) && !isSocialWalled) {
        try {
          const retry = await fetchHtmlWithUa(parsedUrl.href, whatsappUa, 3500);
          const retryUrl = retry.url || parsedUrl.href;
          const retryGate =
            isGateRedirectUrl(retryUrl) && !isGateRedirectUrl(parsedUrl.href);
          if (retry.ok && !retryGate) {
            response = retry;
            redirectedUrl = retryUrl;
            hitGate = false;
          }
        } catch {
          // keep original response
        }
      }

      const finalUrl = hitGate ? parsedUrl.href : redirectedUrl;
      const finalParsed = new URL(finalUrl);
      const finalHost = finalParsed.hostname.replace(/^www\./i, '').replace(/^m\./i, '');
      const finalSmart = hitGate
        ? smartFallback
        : buildSmartUrlFallback(finalParsed, hintTitle);
      const { imageQuery: finalImageQuery, ...finalPublicSmart } = finalSmart;

      if (!response.ok || hitGate) {
        const fallbackImg = await resolveFallbackProductImage(
          finalImageQuery,
          finalSmart.siteName
        );
        return res.json({
          ok: true,
          partial: !fallbackImg,
          preview: {
            ...finalPublicSmart,
            image: fallbackImg,
          },
        });
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.startsWith('image/')) {
        return res.json({
          ok: true,
          partial: false,
          preview: {
            url: finalUrl,
            title: hintTitle || 'Imagen de referencia',
            description: finalHost,
            image: finalUrl,
            siteName: finalHost,
            price: '',
            favicon: finalSmart.favicon,
          },
        });
      }

      const rawHtml = await response.text();
      const htmlSlice = rawHtml.slice(0, 700_000);
      const $ = cheerio.load(htmlSlice);
      const jsonLd = extractJsonLdProduct($);

      const pickMeta = (selectors: string[]): string => {
        for (const sel of selectors) {
          const val = $(sel).attr('content');
          if (val && val.trim()) return val.trim();
        }
        return '';
      };

      const rawTitle = cleanSnippet(
        pickMeta([
          'meta[property="og:title"]',
          'meta[name="twitter:title"]',
          'meta[name="title"]',
        ]) ||
          jsonLd.name ||
          $('h1.ui-pdp-title').first().text() ||
          $('h1[itemprop="name"]').first().text() ||
          $('h1.product_title').first().text() ||
          $('h1').first().text() ||
          $('title').first().text(),
        140
      );

      const blockedPage = isBlockedOrGenericTitle(rawTitle);
      const title = blockedPage ? finalSmart.title : rawTitle;

      const rawDescription = cleanSnippet(
        pickMeta([
          'meta[property="og:description"]',
          'meta[name="twitter:description"]',
          'meta[name="description"]',
        ]) || jsonLd.description,
        220
      );

      const description = blockedPage
        ? finalSmart.description
        : rawDescription || finalSmart.description;

      const rawImage = blockedPage
        ? ''
        : pickMeta([
            'meta[property="og:image:secure_url"]',
            'meta[property="og:image"]',
            'meta[property="og:image:url"]',
            'meta[name="twitter:image"]',
            'meta[name="twitter:image:src"]',
            'link[rel="image_src"]',
          ]) ||
          jsonLd.image ||
          $('img.ui-pdp-image').first().attr('src') ||
          $('#landingImage').attr('data-old-hires') ||
          $('#landingImage').attr('src') ||
          $('img.wp-post-image').first().attr('src') ||
          $('img[itemprop="image"]').first().attr('src') ||
          $('link[rel="image_src"]').attr('href') ||
          '';

      const scrapedSiteName = cleanSnippet(
        pickMeta(['meta[property="og:site_name"]']),
        60
      );
      const siteName =
        finalSmart.siteName !== finalHost
          ? finalSmart.siteName
          : scrapedSiteName || finalHost;

      let image = resolveAbsoluteUrl(rawImage, finalUrl);
      if (!image) {
        const query = blockedPage
          ? finalImageQuery
          : !isBlockedOrGenericTitle(title)
          ? title
          : finalImageQuery;
        image = await resolveFallbackProductImage(query, siteName);
      }

      const priceAmount = pickMeta([
        'meta[property="product:price:amount"]',
        'meta[property="og:price:amount"]',
        'meta[itemprop="price"]',
      ]);
      const priceCurrency = pickMeta([
        'meta[property="product:price:currency"]',
        'meta[property="og:price:currency"]',
        'meta[itemprop="priceCurrency"]',
      ]);
      const mlPriceFraction = $('.andes-money-amount__fraction').first().text().trim();
      const mlPriceSymbol = $('.andes-money-amount__currency-symbol').first().text().trim();

      const price = blockedPage
        ? ''
        : priceAmount
        ? `${priceCurrency ? priceCurrency + ' ' : ''}${priceAmount}`.trim()
        : jsonLd.price ||
          (mlPriceFraction ? `${mlPriceSymbol ? mlPriceSymbol + ' ' : ''}${mlPriceFraction}`.trim() : '');

      const rawIcon =
        $('link[rel="apple-touch-icon"]').attr('href') ||
        $('link[rel="icon"]').attr('href') ||
        $('link[rel="shortcut icon"]').attr('href') ||
        '';
      const favicon =
        resolveAbsoluteUrl(rawIcon, finalUrl) || finalSmart.favicon;

      return res.json({
        ok: true,
        partial: !image,
        preview: {
          url: finalUrl,
          title,
          description,
          image,
          siteName,
          price,
          favicon,
        },
      });
    } catch {
      return sendFallback();
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
