const cheerio = require('cheerio');

async function scrapeUrl(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Error al obtener la página: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove non-content elements
  $('script, style, nav, footer, header, aside, iframe, noscript, svg, form').remove();
  $('[role="navigation"], [role="banner"], [role="contentinfo"]').remove();

  // Try to get main content area first
  let content = '';
  const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content', '.post-content', '.entry-content'];

  for (const selector of mainSelectors) {
    const el = $(selector);
    if (el.length && el.text().trim().length > 100) {
      content = el.text();
      break;
    }
  }

  // Fallback to body
  if (!content) {
    content = $('body').text();
  }

  // Clean up whitespace
  content = content
    .replace(/\t/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');

  const title = $('title').text().trim() || $('h1').first().text().trim() || '';

  return { title, content };
}

module.exports = { scrapeUrl };
