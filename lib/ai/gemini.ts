export type GeminiContent = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

export type GeminiResult =
  | { ok: true; reply: string; model: string }
  | { ok: false; status: number; error: string; quota: boolean };

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
const FALLBACK_MODELS = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-3-flash-preview'];

export function getModelCandidates(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const envFallbacks =
    process.env.GEMINI_FALLBACK_MODELS?.split(',').map((m) => m.trim()).filter(Boolean) ?? [];
  return [...new Set([primary, ...envFallbacks, ...FALLBACK_MODELS])];
}

export function isQuotaError(status: number, message: string): boolean {
  return status === 429 || /quota|rate.?limit|resource.?exhausted/i.test(message);
}

export function formatGeminiError(raw: string, status: number): string {
  if (isQuotaError(status, raw)) {
    const retryMatch = raw.match(/retry in ([\d.]+)s/i);
    const retrySec = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : null;
    if (retrySec) {
      return `AI quota reached. Please wait about ${retrySec} seconds and try again.`;
    }
    return 'AI quota reached. Please try again shortly.';
  }
  if (raw.length > 1500) {
    return 'The AI service returned an error. Please try again.';
  }
  return raw;
}

export async function callGemini(
  systemInstruction: string,
  contents: GeminiContent[],
  maxTokens = 768,
): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 500, error: 'Gemini API key is not configured.', quota: false };
  }

  const models = getModelCandidates();
  let lastError = 'Gemini API request failed.';
  let lastStatus = 500;

  for (const model of models) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens },
      }),
    });

    const geminiData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      const apiError =
        geminiData?.error?.message || geminiData?.message || 'Gemini API request failed.';
      lastError = apiError;
      lastStatus = geminiResponse.status;
      if (!isQuotaError(geminiResponse.status, apiError)) break;
      continue;
    }

    const reply =
      geminiData?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text)
        .filter(Boolean)
        .join('\n')
        .trim() || '';

    if (reply) {
      return { ok: true, reply, model };
    }

    lastError = 'No response was generated. Please try again.';
    lastStatus = 502;
  }

  return {
    ok: false,
    status: lastStatus,
    error: formatGeminiError(lastError, lastStatus),
    quota: isQuotaError(lastStatus, lastError),
  };
}

export function buildChatSystemInstruction(
  systemPrompt: string | undefined,
  stackName: string | undefined,
  blogContext: string,
): string {
  const name = stackName?.trim() || 'this platform';
  const prompt = systemPrompt?.trim();
  const base = prompt
    ? `You are an expert AI assistant for ${name}. ${prompt}`
    : `You are a helpful AI assistant for ${name}. Answer clearly, accurately, and concisely.`;

  const rules = `
Rules:
- Use markdown: **bold** for emphasis, bullet lists when helpful, short paragraphs.
- If blog context is provided below, prefer it for factual answers and mention when you used site content.
- If the answer is not in the context, use your general knowledge but say so briefly.
- Stay focused on ${name} and composable / headless CMS topics when relevant.`;

  if (!blogContext) {
    return `${base}\n${rules}`;
  }

  return `${base}\n${rules}

--- Site blog context (use when relevant) ---
${blogContext}
--- End context ---`;
}
