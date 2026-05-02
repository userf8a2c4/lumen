const cheerio = require('cheerio');

// Intentamos cargar Readability/jsdom (instalados opcionalmente)
let Readability, JSDOM;
try {
  ({ Readability } = require('@mozilla/readability'));
  ({ JSDOM }       = require('jsdom'));
} catch { /* fallback to cheerio only */ }

/**
 * Extrae el dominio y favicon de una URL.
 */
function getOriginMeta(url) {
  try {
    const u = new URL(url);
    return {
      domain: u.hostname.replace(/^www\./, ''),
      origin: u.origin,
      favicon: `${u.origin}/favicon.ico`,
    };
  } catch {
    return { domain: url, origin: url, favicon: '' };
  }
}

/**
 * Limpieza agresiva con cheerio: elimina ruido visual.
 */
function cleanWithCheerio(html) {
  const $ = cheerio.load(html);

  // Eliminar elementos no-contenido
  $(
    'script, style, nav, footer, header, aside, iframe, noscript, svg, form,' +
    '[role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"],' +
    '.nav, .navbar, .header, .footer, .sidebar, .ad, .ads, .advertisement,' +
    '.cookie-banner, .popup, .modal, .overlay, .menu, .breadcrumb,' +
    '#nav, #header, #footer, #sidebar, #menu, #cookie'
  ).remove();

  // Intentar extraer área principal
  let content = '';
  const mainSelectors = [
    'article', 'main', '[role="main"]',
    '.content', '#content', '.post-content', '.entry-content',
    '.article-body', '.page-content', '.main-content',
    '.doc-content', '.documentation', '.markdown-body',
  ];

  for (const sel of mainSelectors) {
    const el = $(sel);
    if (el.length && el.text().trim().length > 200) {
      // Convertir headings a texto estructurado
      el.find('h1, h2, h3, h4').each((_, h) => {
        const tag = $(h).prop('tagName').toLowerCase();
        const prefix = tag === 'h1' ? '\n# ' : tag === 'h2' ? '\n## ' : tag === 'h3' ? '\n### ' : '\n#### ';
        $(h).before(prefix + $(h).text().trim() + '\n');
        $(h).remove();
      });
      // Convertir listas
      el.find('li').each((_, li) => {
        $(li).before('• ' + $(li).text().trim() + '\n');
        $(li).remove();
      });
      content = el.text();
      break;
    }
  }

  // Fallback: body completo con estructura
  if (!content) {
    $('h1, h2, h3').each((_, h) => {
      const tag = $(h).prop('tagName').toLowerCase();
      const prefix = tag === 'h1' ? '\n# ' : tag === 'h2' ? '\n## ' : '\n### ';
      $(h).before(prefix + $(h).text().trim() + '\n');
      $(h).remove();
    });
    $('li').each((_, li) => {
      $(li).before('• ' + $(li).text().trim() + '\n');
      $(li).remove();
    });
    content = $('body').text();
  }

  // Limpiar espacios
  content = content
    .replace(/\t/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{4,}/g, '\n\n\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join('\n');

  const title = $('h1').first().text().trim() || $('title').text().trim() || '';
  return { title, content };
}

/**
 * Extracción con @mozilla/readability (más precisa).
 */
function extractWithReadability(html, url) {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document, {
    charThreshold: 100,
    keepClasses: false,
  });
  const article = reader.parse();
  if (!article) return null;

  // Convertir HTML de readability a texto estructurado
  const $ = cheerio.load(article.content || '');

  // Preservar estructura de encabezados
  $('h1, h2, h3, h4').each((_, h) => {
    const tag = $(h).prop('tagName').toLowerCase();
    const prefix = tag === 'h1' ? '\n# ' : tag === 'h2' ? '\n## ' : tag === 'h3' ? '\n### ' : '\n#### ';
    $(h).replaceWith(prefix + $(h).text().trim() + '\n');
  });
  $('li').each((_, li) => { $(li).replaceWith('• ' + $(li).text().trim() + '\n'); });
  $('p').each((_, p) => { $(p).replaceWith($(p).text().trim() + '\n\n'); });
  $('br').replaceWith('\n');

  let content = $.text()
    .replace(/\t/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{4,}/g, '\n\n\n')
    .split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
    .join('\n');

  return {
    title: article.title || '',
    content,
    byline: article.byline || '',
    siteName: article.siteName || '',
  };
}

/**
 * Función principal de scraping.
 * Retorna: { title, content, domain, favicon, url, wordCount, method }
 */
async function scrapeUrl(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Error al obtener la página: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const origin = getOriginMeta(url);

  let result = null;
  let method = 'cheerio';

  // Intentar Readability primero (mejor calidad)
  if (Readability && JSDOM) {
    try {
      result = extractWithReadability(html, url);
      if (result && result.content.length > 150) {
        method = 'readability';
      } else {
        result = null;
      }
    } catch { result = null; }
  }

  // Fallback a cheerio
  if (!result) {
    result = cleanWithCheerio(html);
    method = 'cheerio';
  }

  const wordCount = result.content.split(/\s+/).filter(Boolean).length;

  return {
    title:     result.title || origin.domain,
    content:   result.content,
    domain:    origin.domain,
    favicon:   origin.favicon,
    url,
    wordCount,
    method,
    siteName:  result.siteName || origin.domain,
  };
}

module.exports = { scrapeUrl };
