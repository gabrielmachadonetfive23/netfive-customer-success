import Parser from "rss-parser";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ALL_NEWS_FEEDS } from "@/lib/integrations/news/feeds";
import { classifyArticle } from "@/lib/services/news-classification";

const parser = new Parser();
const FEED_USER_AGENT = "Mozilla/5.0 (compatible; NetfiveCS/1.0; +https://netfive.com.br)";
const FEED_TIMEOUT_MS = 15_000;

/**
 * Busca o XML do feed via fetch (que decodifica gzip automaticamente) em vez
 * de usar Parser.parseURL — o fetcher embutido do rss-parser usa http/https
 * puro e não decodifica `Content-Encoding: gzip`, o que quebra em feeds como
 * os do G1, que sempre respondem comprimidos.
 */
async function fetchFeedXml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers: { "User-Agent": FEED_USER_AGENT }, signal: controller.signal });
    if (!response.ok) throw new Error(`Status code ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

const MAX_SUMMARY_LENGTH = 500;
const RETENTION_DAYS = 120;

function truncate(text: string, maxLength: number): string {
  const trimmed = text.trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1).trimEnd()}…` : trimmed;
}

function sourceDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export interface NewsFetchSummary {
  feedsProcessed: number;
  itemsSeen: number;
  inserted: number;
  duplicates: number;
  irrelevant: number;
  pruned: number;
  feedErrors: { feed: string; message: string }[];
}

/**
 * Busca as fontes RSS configuradas, classifica cada item e grava as notícias
 * relevantes novas no banco. Chamada pelo cron diário (08h) — ver
 * /api/cron/news. Idempotente: notícias já gravadas (mesma URL) são puladas.
 */
export async function fetchAndStoreNews(): Promise<NewsFetchSummary> {
  const summary: NewsFetchSummary = {
    feedsProcessed: 0,
    itemsSeen: 0,
    inserted: 0,
    duplicates: 0,
    irrelevant: 0,
    pruned: 0,
    feedErrors: [],
  };

  for (const feed of ALL_NEWS_FEEDS) {
    let parsed: Parser.Output<Record<string, unknown>>;
    try {
      const xml = await fetchFeedXml(feed.url);
      parsed = await parser.parseString(xml);
    } catch (error) {
      summary.feedErrors.push({ feed: feed.name, message: error instanceof Error ? error.message : String(error) });
      continue;
    }

    summary.feedsProcessed++;

    for (const item of parsed.items) {
      if (!item.link || !item.title) continue;
      summary.itemsSeen++;

      const summaryText = item.contentSnippet ?? item.content ?? item.summary ?? "";
      const classification = classifyArticle(item.title, summaryText, feed.kind === "security");
      if (!classification) {
        summary.irrelevant++;
        continue;
      }

      const publishedAt = item.isoDate ? new Date(item.isoDate) : item.pubDate ? new Date(item.pubDate) : new Date();

      try {
        await prisma.newsArticle.create({
          data: {
            title: item.title.trim(),
            summary: summaryText ? truncate(summaryText, MAX_SUMMARY_LENGTH) : null,
            url: item.link,
            sourceName: feed.name,
            sourceDomain: sourceDomainFromUrl(item.link),
            publishedAt: Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
            category: classification.category,
            segments: classification.segments,
            tags: classification.tags,
          },
        });
        summary.inserted++;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          summary.duplicates++;
        } else {
          summary.feedErrors.push({ feed: feed.name, message: error instanceof Error ? error.message : String(error) });
        }
      }
    }
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const pruned = await prisma.newsArticle.deleteMany({ where: { publishedAt: { lt: cutoff } } });
  summary.pruned = pruned.count;

  return summary;
}
