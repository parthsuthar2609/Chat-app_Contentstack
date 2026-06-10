import { NextResponse } from 'next/server';
import {
  buildBlogContextBlock,
  findRelevantBlogs,
} from '@/lib/ai/blog-rag';
import { callGemini } from '@/lib/ai/gemini';

type SearchRequestBody = {
  query?: string;
  blogTags?: string;
  stackName?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SearchRequestBody;
    const query = body.query?.trim();

    if (!query) {
      return NextResponse.json({ error: 'Search query is required.' }, { status: 400 });
    }

    const results = await findRelevantBlogs(query, body.blogTags, 6);

    if (!results.length) {
      return NextResponse.json({
        results: [],
        summary: 'No matching blog posts were found. Try different keywords.',
      });
    }

    const blogContext = buildBlogContextBlock(results);
    const stackName = body.stackName?.trim() || 'this site';

    const systemInstruction = `You are a research assistant for ${stackName}. 
Given blog excerpts from the site, write a concise answer (2-4 sentences) that directly addresses the user's search query.
Use markdown **bold** for key terms. If posts only partially match, say what was found.`;

    const result = await callGemini(
      systemInstruction,
      [{ role: 'user', parts: [{ text: `Search query: "${query}"\n\nBlog posts:\n${blogContext}` }] }],
      400,
    );

    const summary = result.ok
      ? result.reply
      : 'Here are the most relevant articles from the site.';

    return NextResponse.json({
      results: results.map(({ uid, title, url, excerpt }) => ({
        uid,
        title,
        url,
        excerpt,
      })),
      summary,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unexpected server error.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
