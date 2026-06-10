import Stack from '@/contentstack-sdk';

export type BlogSource = {
  uid: string;
  title: string;
  url: string;
  excerpt: string;
  score: number;
};

type BlogEntry = {
  uid?: string;
  title?: string;
  url?: string;
  body?: string;
  tags?: string | string[];
};

function stripHtml(html?: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

function scoreBlog(entry: BlogEntry, queryTokens: string[], filterTags: string[]): number {
  const title = (entry.title || '').toLowerCase();
  const body = stripHtml(entry.body).toLowerCase();
  const tags = Array.isArray(entry.tags)
    ? entry.tags.join(' ').toLowerCase()
    : (entry.tags || '').toLowerCase();

  let score = 0;
  for (const token of queryTokens) {
    if (title.includes(token)) score += 4;
    if (tags.includes(token)) score += 3;
    if (body.includes(token)) score += 1;
  }

  for (const tag of filterTags) {
    const t = tag.toLowerCase();
    if (tags.includes(t) || title.includes(t) || body.includes(t)) {
      score += 2;
    }
  }

  return score;
}

async function fetchAllBlogs(): Promise<BlogEntry[]> {
  const response = await Stack.getEntry({
    contentTypeUid: 'blog_post',
    referenceFieldPath: undefined,
    jsonRtePath: ['body'],
  });
  return (response?.[0] as BlogEntry[]) || [];
}

export async function findRelevantBlogs(
  query: string,
  blogTags?: string,
  limit = 3,
): Promise<BlogSource[]> {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];

  const filterTags = blogTags
    ? blogTags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const blogs = await fetchAllBlogs();

  return blogs
    .map((entry) => {
      const score = scoreBlog(entry, queryTokens, filterTags);
      const excerpt = stripHtml(entry.body).slice(0, 280);
      return {
        uid: entry.uid || '',
        title: entry.title || 'Untitled',
        url: entry.url || '#',
        excerpt,
        score,
      };
    })
    .filter((b) => b.score > 0 && b.uid)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function buildBlogContextBlock(sources: BlogSource[]): string {
  if (!sources.length) return '';

  return sources
    .map(
      (s, i) =>
        `[${i + 1}] Title: ${s.title}\nURL: ${s.url}\nExcerpt: ${s.excerpt}`,
    )
    .join('\n\n');
}
