# Live Preview — Localhost Editing (Onboarding & Troubleshooting)

This guide connects this Next.js starter to **Contentstack Live Preview** so editors can preview and edit on `http://localhost:3000` from the CMS.

Official reference: [Set Up Live Preview with REST for CSR](https://www.contentstack.com/docs/developers/set-up-live-preview/set-up-live-preview-with-rest-for-client-side-rendering)

---

## How it works

| Mode | What you see |
|------|----------------|
| Open `http://localhost:3000` directly | Normal site (published content) |
| Click **Preview** on an entry in Contentstack | Your local site loads **inside the CMS preview panel** with live updates |

You edit in Contentstack → changes appear on localhost in real time (no publish required for preview).

---

## Part 1 — App configuration (this repo)

### 1. Environment variables (`.env.local`)

**GCP North America (training stacks):**

```env
CONTENTSTACK_API_KEY=your_api_key
CONTENTSTACK_DELIVERY_TOKEN=your_delivery_token
CONTENTSTACK_PREVIEW_TOKEN=your_preview_token
CONTENTSTACK_ENVIRONMENT=development
CONTENTSTACK_BRANCH=main
CONTENTSTACK_REGION=gcp-na

CONTENTSTACK_API_HOST=gcp-na-cdn.contentstack.com
CONTENTSTACK_APP_HOST=gcp-na-app.contentstack.com
CONTENTSTACK_PREVIEW_HOST=gcp-na-rest-preview.contentstack.com

CONTENTSTACK_LIVE_PREVIEW=true
CONTENTSTACK_LIVE_EDIT_TAGS=true
NEXT_PUBLIC_HOSTED_URL=http://localhost:3000
```

> **Important:** Use a **Preview token**, not a Management token, for Live Preview.

### 2. Code already wired in this project

| Piece | Location |
|-------|----------|
| Delivery SDK + preview config | `contentstack-sdk/index.js` |
| Live Preview Utils init (browser) | `initLivePreviewSDK()` + `LivePreviewProvider` |
| Refresh on entry save | `onEntryChange()` on pages, header, footer |
| Live Edit tags | `CONTENTSTACK_LIVE_EDIT_TAGS=true` + `addEditableTags()` in `helper/index.js` |
| Reusable hook | `helper/use-live-preview.ts` |

### 3. Start the local server

```bash
cd contentstack-academy-playground-main
npm run dev
```

Keep this running while using Live Preview.

---

## Part 2 — Contentstack stack configuration

### Step A — Environment Base URL

1. **Settings → Environments**
2. Open **`development`** (must match `CONTENTSTACK_ENVIRONMENT`)
3. Set **Base URL:** `http://localhost:3000`
4. **Save**

### Step B — Enable Live Preview

1. **Settings → Visual Experience** (or **Live Preview**)
2. Enable **Live Preview**
3. **Default Preview Environment:** `development`
4. Enable **Display Setup Status** (helps verify config)
5. **Save**

### Step C — Tokens (branch + environment)

When creating **Delivery** and **Preview** tokens:

- **Branch:** `main` (match `CONTENTSTACK_BRANCH`)
- **Environment:** `development`

### Step D — Open preview from an entry

1. **Entries → Pages → Home** (or any page)
2. Click **Preview** (top right)
3. Localhost should load in the preview iframe

---

## Part 3 — Verification checklist

- [ ] `npm run dev` running on port **3000**
- [ ] `.env.local` uses **GCP NA** hosts if stack is on Google Cloud
- [ ] Preview token (not delivery-only) is in `.env.local`
- [ ] Environment Base URL = `http://localhost:3000`
- [ ] Live Preview enabled in stack settings
- [ ] Entry has a **URL** field matching the route (e.g. `/` for home)
- [ ] Open preview via **Preview** button (not only the entry editor)

---

## Troubleshooting

### Error 109 — "We can't find that Stack" / invalid API key

**Cause:** Wrong CDN region.

| Stack region | Use |
|--------------|-----|
| AWS NA | `cdn.contentstack.io` |
| **GCP NA (training)** | **`gcp-na-cdn.contentstack.com`** |

Fix `CONTENTSTACK_API_HOST` and `CONTENTSTACK_REGION=gcp-na` in `.env.local`.

---

### Preview opens in CMS but not localhost / blank iframe

| Check | Fix |
|-------|-----|
| Dev server not running | Run `npm run dev` |
| Wrong Base URL | Set `http://localhost:3000` in Environments |
| Wrong port | App must be on port 3000, or update Base URL |
| Firewall/VPN | Allow localhost; try disabling VPN |

---

### "Live Preview SDK is not initialized in the browser"

**Cause:** SDK ran on the server, or page loaded outside preview iframe.

**Fix:** Already handled by `LivePreviewProvider` + `initLivePreviewSDK()` before `onEntryChange`. Restart dev server after `.env` changes.

Enable debug logs:

```env
CONTENTSTACK_LIVE_PREVIEW_DEBUG=true
```

---

### Changes in CMS don't update on localhost

| Check | Fix |
|-------|-----|
| `CONTENTSTACK_LIVE_PREVIEW=false` | Set to `true` |
| Missing preview token | Add `CONTENTSTACK_PREVIEW_TOKEN` |
| Wrong preview host | GCP NA: `gcp-na-rest-preview.contentstack.com` |
| Page missing `onEntryChange` | Home uses it in `app/page.tsx`; pattern in `helper/use-live-preview.ts` |

---

### Live Edit tags / Edit buttons don't appear

1. Set `CONTENTSTACK_LIVE_EDIT_TAGS=true`
2. Publish is **not** required for preview, but entries must load in preview mode
3. Components must spread `$` attributes from Contentstack (e.g. `{...banner.$?.banner_title}`)

---

### Branch not found (token creation)

1. **Settings → Branches** — note branch name (usually `main`)
2. Select that branch when creating tokens
3. Set `CONTENTSTACK_BRANCH=main` in `.env.local`

---

### Preview works but shows old published content only

You may be viewing the site **outside** the CMS preview panel. Use **Preview** on the entry so the iframe loads with preview query parameters.

---

## Quick test (PowerShell)

```powershell
$headers = @{
  "api_key" = "YOUR_API_KEY"
  "access_token" = "YOUR_DELIVERY_TOKEN"
  "branch" = "main"
}
Invoke-RestMethod -Uri "https://gcp-na-cdn.contentstack.com/v3/content_types/page/entries?environment=development" -Headers $headers
```

Success → credentials OK. Then configure Live Preview in the CMS UI.

---

## Related docs

- [Live Preview for your Stack](https://www.contentstack.com/docs/developers/set-up-live-preview/set-up-live-preview-for-your-stack)
- [GCP NA API endpoints](https://www.contentstack.com/docs/developers/contentstack-regions/api-endpoints)
- [Live Edit Tags](https://www.contentstack.com/docs/developers/set-up-live-preview/set-up-live-edit-tags-for-entries-with-rest)

---

## Vercel deployment (hosted site)

Your live site: [cs-academy-parth-1780473660-8ed4e.vercel.app](https://cs-academy-parth-1780473660-8ed4e.vercel.app/)

### Why Vercel shows empty / skeleton pages

`.env.local` is **not deployed** (listed in `.gitignore`). Vercel builds without Contentstack credentials unless you add them in the dashboard.

### Fix — add environment variables on Vercel

1. Open [Vercel Dashboard](https://vercel.com) → your project → **Settings → Environment Variables**
2. Add **every** variable from `.env.vercel.example` (copy values from your `.env.local`)
3. Set `NEXT_PUBLIC_HOSTED_URL` to your Vercel URL:
   ```
   https://cs-academy-parth-1780473660-8ed4e.vercel.app
   ```
4. Enable for **Production**, **Preview**, and **Development**
5. **Redeploy:** Deployments → latest → **Redeploy**

### Contentstack Base URL for Vercel preview

For Live Preview on the **hosted** site (not localhost):

1. **Settings → Environments → `development`**
2. Set **Base URL** to:
   ```
   https://cs-academy-parth-1780473660-8ed4e.vercel.app
   ```
3. Save

> Use localhost Base URL for local dev, or Vercel URL for hosted preview — one Base URL per environment. For academy, pick the one you use most or ask your instructor.

### Vercel root directory

If the repo root is the outer folder, set **Root Directory** to:
```
contentstack-academy-playground-main
```

### Verify after redeploy

- Site loads header, hero, footer (not endless skeletons)
- Browser console has no Contentstack 109 errors
- Entries are **published** to `development`
