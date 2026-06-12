import { getAllEntries, getBlogListRes } from '@/helper';
import { Pages, PostPage } from '@/typescript/pages';
import { MetadataRoute } from 'next';

function toSitemapEntry(url: string): MetadataRoute.Sitemap[number] {
  return {
    url,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 1,
  };
}

export default async function : Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_HOSTED_URL || 'http://localhost:3000';

  try {
    const pages: Pages = (await getAllEntries()) ?? [];
    const posts: PostPage = (await getBlogListRes()) ?? [];

    const urls = [
      ...pages.map((page) => `${baseUrl}${page.url}`),
      ...posts.map((post) => `${baseUrl}${post.url}`),
    ].sort();

    if (!urls.length) return [toSitemapEntry(baseUrl)];

    return urls.map(toSitemapEntry);
  } catch (error) {
    // CI / build without valid Contentstack keys — return homepage only
    console.warn('[sitemap] CMS fetch failed, using fallback:', error);
    return [toSitemapEntry(baseUrl)];
  }
}
