import type { APIRoute } from 'astro';
import { locales, getLocalizedPath } from '../i18n/ui';

const SITE_ORIGIN = 'https://snapgif.github.io';

export const GET: APIRoute = () => {
  const lastMod = new Date().toISOString().split('T')[0];

  const urlEntries = locales
    .map((loc) => {
      const locUrl = `${SITE_ORIGIN}${getLocalizedPath(loc, '')}`;
      const xhtmlLinks = locales
        .map(
          (altLoc) =>
            `    <xhtml:link rel="alternate" hreflang="${altLoc}" href="${SITE_ORIGIN}${getLocalizedPath(altLoc, '')}" />`
        )
        .join('\n');
      const xDefaultLink = `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}/" />`;

      return `  <url>
    <loc>${locUrl}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
${xhtmlLinks}
${xDefaultLink}
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
};
