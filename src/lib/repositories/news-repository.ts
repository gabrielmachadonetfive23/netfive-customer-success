import type { NewsArticle, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { NewsArticleDTO, PaginatedResult } from "@/lib/types";
import type { NewsListQuery } from "@/lib/validations/news";

function mapNewsToDTO(article: NewsArticle): NewsArticleDTO {
  return {
    id: article.id,
    title: article.title,
    summary: article.summary,
    url: article.url,
    sourceName: article.sourceName,
    sourceDomain: article.sourceDomain,
    publishedAt: article.publishedAt.toISOString(),
    category: article.category as NewsArticleDTO["category"],
    segments: article.segments,
    tags: article.tags,
    createdAt: article.createdAt.toISOString(),
  };
}

export async function findNewsPaginated(query: NewsListQuery): Promise<PaginatedResult<NewsArticleDTO>> {
  const where: Prisma.NewsArticleWhereInput = {};

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { summary: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.category) where.category = query.category;
  if (query.segments && query.segments.length > 0) where.segments = { hasSome: query.segments };

  const [total, articles] = await Promise.all([
    prisma.newsArticle.count({ where }),
    prisma.newsArticle.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return {
    items: articles.map(mapNewsToDTO),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

/** Lista de segmentos distintos entre as notícias já coletadas, para popular o filtro do lado do cliente. */
export async function findDistinctNewsSegments(): Promise<string[]> {
  const articles = await prisma.newsArticle.findMany({ select: { segments: true } });
  const set = new Set<string>();
  for (const article of articles) {
    for (const segment of article.segments) set.add(segment);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
