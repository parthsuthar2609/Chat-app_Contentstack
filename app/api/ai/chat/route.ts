import { NextResponse } from 'next/server';
import {
  buildBlogContextBlock,
  findRelevantBlogs,
} from '@/lib/ai/blog-rag';
import {
  buildChatSystemInstruction,
  callGemini,
  type GeminiContent,
} from '@/lib/ai/gemini';

type ChatHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatRequestBody = {
  message?: string;
  history?: ChatHistoryItem[];
  systemPrompt?: string;
  stackName?: string;
  stackId?: string;
  blogTags?: string;
};

const MAX_HISTORY = 10;

function toGeminiRole(role: ChatHistoryItem['role']): 'user' | 'model' {
  return role === 'assistant' ? 'model' : 'user';
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const history = Array.isArray(body.history) ? body.history : [];
    const sources = await findRelevantBlogs(message, body.blogTags, 3);
    const blogContext = buildBlogContextBlock(sources);

    const systemInstruction = buildChatSystemInstruction(
      body.systemPrompt,
      body.stackName,
      blogContext,
    );

    const contents: GeminiContent[] = history
      .slice(-MAX_HISTORY)
      .filter((item) => item?.content?.trim() && (item.role === 'user' || item.role === 'assistant'))
      .map((item) => ({
        role: toGeminiRole(item.role),
        parts: [{ text: item.content.trim() }],
      }));

    contents.push({ role: 'user', parts: [{ text: message }] });

    const result = await callGemini(systemInstruction, contents);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      reply: result.reply,
      model: result.model,
      sources: sources.map(({ uid, title, url }) => ({ uid, title, url })),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unexpected server error.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
