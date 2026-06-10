# Build an AI Chatbot in 1 Hour with Contentstack + Google Gemini

**Time:** ~60 minutes  
**Stack:** Contentstack (headless CMS) · Next.js · Google Gemini API  
**Result:** A CMS-driven AI Assistant page with live chat, editable content, and multi-platform tabs.

---

## What you'll build

A `/ai-assistant` page where marketers control labels, prompts, and button text in Contentstack — and developers wire a Gemini-powered chatbot on the frontend.

```
Contentstack Page Entry
└── page_components[]
    └── ai_assistant (modular block)
        └── tech_stack (group)
            ├── stack_name, stack_slug
            ├── llm_prompt          ← AI personality
            ├── chat_enabled
            ├── system_prompt       ← chat tab label
            ├── google_site         ← input placeholder
            ├── send_button_text
            └── search_button_text
```

**Architecture:**

```
Browser  →  Next.js API Route  →  Google Gemini
   ↑              ↑
Contentstack   llm_prompt from CMS
(Delivery API)
```

---

## Hour breakdown

| Step | Time | Task |
|------|------|------|
| 1 | 10 min | CMS content model + entry |
| 2 | 10 min | Fetch data from Contentstack |
| 3 | 20 min | React chat UI component |
| 4 | 15 min | Gemini API route |
| 5 | 5 min | Env vars + test |

---

## Step 1 — Contentstack setup (10 min)

### Create the `ai_assistant` modular block

Add a block to your **Page** content type with a `tech_stack` group (Multiple: ON or OFF).

**Minimum fields:**

| Field UID | Type | Example |
|-----------|------|---------|
| `stack_name` | Text | Content Stack |
| `stack_slug` | Text | Sitecore AI |
| `llm_prompt` | Long text | You are a Contentstack expert… |
| `chat_enabled` | Boolean | true |
| `system_prompt` | Text | Ask About Content Stack |
| `google_site` | Text | Type your question… |
| `send_button_text` | Text | Send |
| `search_enabled` | Boolean | true |
| `so_tagged` | Text | Find Related Blog |
| `blog_filter_tags` | Text | Search blogs… |
| `search_button_text` | Text | Search |

### Create & publish the page

1. Create a Page entry with URL `/ai-assistant`
2. Add the `ai_assistant` block
3. Fill in `tech_stack` row(s)
4. **Publish** (draft entries won't appear on the delivery API)

> **Tip:** Keep UI labels (`system_prompt`, `google_site`) separate from the AI brain (`llm_prompt`). Marketers edit labels; `llm_prompt` controls how Gemini responds.

---

## Step 2 — Fetch CMS data (10 min)

Create a helper that pulls the `ai_assistant` block from a Page entry.

```javascript
// helper/index.js
import Stack from "../contentstack-sdk";
import { addEditableTags } from "@contentstack/utils";

const liveEdit = process.env.CONTENTSTACK_LIVE_EDIT_TAGS === "true";

export const extractAiAssistantData = (entry) => {
  if (!entry) return undefined;

  const components = entry.page_components ?? [];
  const blocks = components.map((c) => c.ai_assistant).filter(Boolean);
  if (!blocks.length) return undefined;

  const techStacks = blocks.flatMap((block) => {
    const raw = block?.tech_stack;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  });

  const first = blocks[0];

  return {
    uid: entry.uid,
    locale: entry.locale,
    title: entry.title,
    hero_title: first.hero_title || entry.title,
    hero_description: first.hero_description,
    tech_stack: techStacks,
    $: first.$, // Live Preview edit tags
  };
};

export const getAiAssistantPageRes = async (entryUrl = "/ai-assistant") => {
  const response = await Stack.getEntryByUrl({
    contentTypeUid: "page",
    entryUrl,
    jsonRtePath: ["page_components.ai_assistant.hero_description"],
  });

  const entry = response?.[0]?.[0];
  if (!entry) return undefined;

  // Tags MUST be added before extracting data
  liveEdit && addEditableTags(entry, "page", true);

  return extractAiAssistantData(entry);
};
```

### Page route

```tsx
// app/ai-assistant/page.tsx
'use client';

import AiAssistant from '@/components/ai-assistant';
import { getAiAssistantPageRes } from '@/helper';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AiAssistantPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getAiAssistantPageRes('/ai-assistant').then((entry) => {
      if (!entry) notFound();
      setData(entry);
    });
  }, []);

  if (!data) return null;

  return (
    <div
      data-pageref={data.uid}
      data-contenttype="page"
      data-locale={data.locale}
    >
      <AiAssistant data={data} />
    </div>
  );
}
```

> **Live Preview:** `data-pageref`, `data-contenttype`, and `data-locale` let Contentstack Visual Builder connect the preview to your entry. Spread `{...data.$?.field_name}` on DOM elements to make fields editable inline.

---

## Step 3 — Chat UI component (20 min)

Map CMS fields to a normalized stack object, then render tabs + chat.

```tsx
// components/ai-assistant.tsx (simplified)
function mapCmsToStack(raw, id, name) {
  return {
    id,
    name,
    llm_prompt: raw.llm_prompt,
    chat_enabled: raw.chat_enabled,
    chat_tab_label: raw.system_prompt,
    chat_placeholder: raw.google_site,
    send_button_text: raw.send_button_text || 'Send',
    $: raw.$,
  };
}

// One CMS row → two platform tabs (Content Stack + Sitecore)
function expandTwoTabsFromRow(raw) {
  return [
    mapCmsToStack(raw, 'content-stack', raw.stack_name),
    mapCmsToStack(raw, 'sitecore-ai', raw.stack_slug),
  ];
}
```

### Editable tags on CMS-driven text

```tsx
<h1 {...(data.$?.hero_title as {})}>{data.hero_title}</h1>

<span {...(stack.$?.stack_name as {})}>{stack.name}</span>

<input
  placeholder={stack.chat_placeholder}
  {...(stack.$?.google_site as {})}
/>

<span {...(stack.$?.send_button_text as {})}>
  {stack.send_button_text || 'Send'}
</span>
```

### Send message + call API

```tsx
async function handleSendChat(e) {
  e.preventDefault();
  const text = chatInput.trim();
  if (!text || isChatLoading) return;

  const priorMessages = messagesByStack[activeStackId] ?? [];

  // 1. Show user message immediately
  setMessagesByStack((prev) => ({
    ...prev,
    [activeStackId]: [
      ...(prev[activeStackId] ?? []),
      { id: `user-${Date.now()}`, role: 'user', content: text },
    ],
  }));
  setChatInput('');
  setIsChatLoading(true);

  try {
    // 2. Call your server-side API (never call Gemini from the browser)
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: priorMessages,
        systemPrompt: currentStack.llm_prompt,
        stackName: currentStack.name,
      }),
    });

    const { reply, error } = await res.json();
    if (!res.ok) throw new Error(error);

    // 3. Show assistant reply
    setMessagesByStack((prev) => ({
      ...prev,
      [activeStackId]: [
        ...(prev[activeStackId] ?? []),
        { id: `assistant-${Date.now()}`, role: 'assistant', content: reply },
      ],
    }));
  } catch (err) {
    setChatError(err.message);
  } finally {
    setIsChatLoading(false);
  }
}
```

### Message bubbles

```tsx
{messages.map((msg) => (
  <div
    key={msg.id}
    className={`bubble bubble--${msg.role}`}
  >
    {msg.content}
  </div>
))}

{isChatLoading && (
  <div className="bubble bubble--assistant bubble--typing">
    <span /><span /><span />
  </div>
)}
```

```css
.bubble--user {
  align-self: flex-end;
  background: #715cdd;
  color: #fff;
}

.bubble--assistant {
  align-self: flex-start;
  background: #f1f5f9;
  color: #334155;
}
```

---

## Step 4 — Gemini API route (15 min)

**Never expose your API key in the browser.** Use a Next.js Route Handler.

```typescript
// app/api/ai/chat/route.ts
import { NextResponse } from 'next/server';

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
const FALLBACK_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
];

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key missing.' }, { status: 500 });
  }

  const { message, history = [], systemPrompt, stackName } = await request.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
  }

  const systemInstruction = systemPrompt?.trim()
    ? `You are an AI assistant for ${stackName}. ${systemPrompt}`
    : `You are a helpful assistant for ${stackName}.`;

  // Gemini uses "model" for assistant, "user" for user
  const contents = [
    ...history.slice(-10).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  const models = [
    process.env.GEMINI_MODEL || DEFAULT_MODEL,
    ...FALLBACK_MODELS,
  ];

  for (const model of [...new Set(models)]) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
      }),
    });

    const data = await res.json();

    if (res.ok) {
      const reply = data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .join('')
        .trim();

      if (reply) return NextResponse.json({ reply, model });
    }

    // Try next model on quota errors
    const errMsg = data?.error?.message || '';
    if (res.status !== 429 && !/quota/i.test(errMsg)) break;
  }

  return NextResponse.json(
    { error: 'AI quota reached. Try again shortly or switch GEMINI_MODEL.' },
    { status: 429 },
  );
}
```

---

## Step 5 — Environment variables (5 min)

```env
# .env.local

# Contentstack
CONTENTSTACK_API_KEY=your_api_key
CONTENTSTACK_DELIVERY_TOKEN=your_delivery_token
CONTENTSTACK_ENVIRONMENT=development
CONTENTSTACK_LIVE_PREVIEW=true
CONTENTSTACK_LIVE_EDIT_TAGS=true

# Gemini (server-side only — no NEXT_PUBLIC_ prefix)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_FALLBACK_MODELS=gemini-3.1-flash-lite,gemini-2.5-flash
```

Get a free Gemini key at [Google AI Studio](https://aistudio.google.com/apikey).

Restart the dev server after changing `.env.local`:

```bash
npm run dev
```

---

## Common issues we hit (and fixes)

### 1. Content not showing
- Entry must be **Published**, not Draft
- URL must match exactly: `/ai-assistant`

### 2. Live Preview editing not working
- Set `CONTENTSTACK_LIVE_EDIT_TAGS=true`
- Call `addEditableTags()` **before** extracting data
- Spread `{...$?.field}` on the element that displays the value
- Wrap page in `data-pageref`, `data-contenttype`, `data-locale`

### 3. Gemini quota errors
Older models (`gemini-1.5-flash`, `gemini-2.0-flash`) are shut down or have **limit: 0** on the free tier.

**Use current free-tier models:**
- `gemini-2.5-flash-lite` ← recommended default
- `gemini-3.1-flash-lite`
- `gemini-2.5-flash`

### 4. API key in browser
Never call Gemini from client components. Always go through `/api/ai/chat`.

---

## What marketers control vs what developers control

| Marketers (CMS) | Developers (Code) |
|-----------------|-------------------|
| Tab names, labels, placeholders | API route, model selection |
| `llm_prompt` (AI personality) | Chat UI, message history |
| Enable/disable chat & search | Error handling, fallbacks |
| Button text | Live Preview tag wiring |

---

## Optional next steps

- **Search tab** — wire blog + Google CSE + Stack Overflow APIs
- **Streaming** — use Gemini `streamGenerateContent` for typing effect
- **Per-stack prompts** — separate `llm_prompt` per `tech_stack` row when Multiple is ON
- **Remote Config** — change `GEMINI_MODEL` without redeploying

---

## Final checklist

- [ ] CMS `ai_assistant` block with `tech_stack` fields
- [ ] Page entry at `/ai-assistant` published
- [ ] `getAiAssistantPageRes()` fetches and extracts block data
- [ ] `AiAssistant` component renders CMS labels + chat UI
- [ ] `POST /api/ai/chat` calls Gemini server-side
- [ ] `GEMINI_API_KEY` in `.env.local` (not exposed to client)
- [ ] `llm_prompt` filled in CMS for each stack
- [ ] Live Preview tags on editable fields

---

## Summary

In one hour you can ship a production-style AI chatbot where:

1. **Contentstack** owns the content — labels, prompts, toggles
2. **Next.js** owns the UI and API layer
3. **Gemini** owns the intelligence — behind a secure server route

The pattern scales: swap Gemini for OpenAI, add RAG over your blog entries, or connect Contentstack Automate — the CMS-driven shell stays the same.

---

*Built with Contentstack Academy Playground · Next.js 16 · React 19 · Google Gemini 2.5 Flash-Lite*
