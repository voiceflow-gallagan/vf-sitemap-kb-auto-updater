import { parseString } from "xml2js";
import { getExistingDocs } from "./kbManager";
import { addToQueue, processQueue, resetProcessedCount } from "./queue";

interface SitemapUrl {
  loc: string[];
  lastmod?: string[];
}

export async function processSitemaps(sitemapUrls: string[], apiKey: string) {
  console.log(`Starting new sitemap processing run for ${sitemapUrls.length} sitemaps.`);
  resetProcessedCount();
  const existingDocs = await getExistingDocs(apiKey);

  for (const sitemapUrl of sitemapUrls) {
    console.log(`Processing sitemap: ${sitemapUrl}`);
    const urls = await fetchSitemapUrls(sitemapUrl);
    for (const url of urls) {
      const existingDoc = existingDocs.find((doc: { data: { url: string } }) => doc && doc.data.url === url.loc[0]);
      if (!existingDoc) {
        // New document, add to queue
        addToQueue({ url: url.loc[0], overwrite: false, apiKey });
      } else if (!url.lastmod || (url.lastmod && new Date(url.lastmod[0]) > new Date(existingDoc.updatedAt))) {
        // Existing document with no lastmod or newer lastmod, add to queue for update
        addToQueue({ url: url.loc[0], overwrite: true, apiKey });
      }
      // If the document exists and is not newer, do nothing
    }
  }

  processQueue();
}

async function fetchSitemapUrls(sitemapUrl: string): Promise<SitemapUrl[]> {
  const response = await fetch(sitemapUrl);
  const xml = await response.text();
  return new Promise((resolve, reject) => {
    parseString(xml, (err, result) => {
      if (err) reject(err);
      else {
        const urls = result.urlset?.url || result.sitemapindex?.sitemap || [];
        resolve(urls.map((url: { loc: string | string[], lastmod?: string }) => ({
          loc: Array.isArray(url.loc) ? url.loc : [url.loc],
          lastmod: url.lastmod
        })));
      }
    });
  });
}
