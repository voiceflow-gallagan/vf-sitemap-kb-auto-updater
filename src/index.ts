import { serve } from "bun";
import { processSitemaps } from "./sitemapProcessor";
import { getQueueStatus } from './queue';
import cron from 'node-cron';
import fs from 'fs/promises';

async function readSitemapsFromFile(): Promise<string[]> {
  try {
    const content = await fs.readFile('sitemaps.txt', 'utf-8');
    return content.split('\n').filter(line => line.trim() !== '');
  } catch (error) {
    console.error('Error reading sitemaps.txt:', error);
    return [];
  }
}

// Check if cron should be used
const useCron = Bun.env.USE_CRON === 'true';

if (useCron) {
  // Schedule the weekly task
  cron.schedule('0 0 * * 0', async () => {
    console.log('Running weekly sitemap processing task');
    const sitemaps = await readSitemapsFromFile();
    if (sitemaps.length > 0) {
      processSitemaps(sitemaps);
    } else {
      console.log('No sitemaps found in sitemaps.txt');
    }
  });
  console.log('Cron job scheduled for weekly sitemap processing');
} else {
  console.log('Cron job not scheduled (USE_CRON is not set to true)');
}

const server = serve({
  port: Bun.env.PORT ?? 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "GET" && url.pathname === "/status") {
      return new Response(JSON.stringify(getQueueStatus()), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (req.method === "POST" && url.pathname === "/process-sitemaps") {
      const body = await req.json() as { sitemaps?: unknown; apiKey?: string };
      if (Array.isArray(body.sitemaps)) {
        const apiKey = body.apiKey || Bun.env.VOICEFLOW_API_KEY;
        processSitemaps(body.sitemaps, apiKey);
        return new Response("Processing sitemaps", { status: 202 });
      }
      return new Response("Invalid request body", { status: 400 });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Listening on http://localhost:${server.port}`);
