# Buildable — a lovable.dev-style AI app builder (MVP)

Describe an app in chat → Claude generates a complete, working single-page app (HTML/CSS/JS, optionally React via CDN) → it renders live in a sandboxed iframe → follow-up messages iterate on the same app.

## How it works

- `app/page.tsx` — chat UI + live `<iframe srcDoc>` preview + code view + download button.
- `app/api/generate/route.ts` — server route that calls the Claude API with the current app's HTML (if any) plus the new instruction, and returns the updated HTML.
- `lib/builder.ts` — the system prompt that constrains the model to always return one complete, runnable HTML document in a fenced code block, plus the parser that extracts it.

State (chat history + current HTML) lives in the browser only — nothing is persisted to a database in this MVP. Refreshing the page starts a new project. (See "Next steps" below for adding persistence.)

## Setting up Google sign-in (required)

The app now requires Google sign-in before anyone can generate apps or call the API — this is what stops anonymous strangers from running up charges on your Anthropic key.

1. **Create OAuth credentials in Google Cloud Console.**
   - Go to https://console.cloud.google.com/apis/credentials
   - Create a project if you don't have one
   - Click **Create Credentials → OAuth client ID** → Application type: **Web application**
   - Under **Authorized redirect URIs**, add:
     - `http://localhost:3000/api/auth/callback/google` (for local dev)
     - `https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/callback/google` (for production — add this after your first deploy once you know the domain)
   - Save, then copy the **Client ID** and **Client Secret**

2. **Generate a NextAuth secret.**
   ```bash
   openssl rand -base64 32
   ```

3. **Set environment variables** (locally in `.env.local`, and in Vercel under Settings → Environment Variables):
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` — `http://localhost:3000` locally, your real Vercel URL in production
   - `ANTHROPIC_API_KEY` — as before
   - Optional `ALLOWED_EMAILS` — comma-separated list of Google emails allowed to sign in. If unset, **any** Google account can sign in and use your API key, which may not be what you want for a personal project. Set this if you want to restrict access to just yourself and a few people.
   - Optional `DAILY_GENERATION_LIMIT` — max generations per signed-in user per 24h (default 30)

4. After adding env vars on Vercel, **redeploy** so they take effect, then go back to the Google Cloud Console and add your live Vercel URL to the authorized redirect URIs (step 1) if you haven't already.

### What login does and doesn't solve
- It stops anonymous/random visitors from calling your API — that's the main "API key build up" problem.
- It does **not** stop a logged-in user from generating a lot of apps. The daily per-user limit (`DAILY_GENERATION_LIMIT`) bounds that, but it's enforced with an in-memory counter — fine for low traffic, but not airtight on Vercel's serverless platform, since instances can reset. For solid enforcement, set `ALLOWED_EMAILS` to just trusted people, or swap the rate limiter for Vercel KV / a database counter (a few lines of change in `lib/rateLimit.ts`).



## Local setup

```bash
npm install
cp .env.example .env.local
# edit .env.local: paste your Anthropic key + Google OAuth credentials (see section above)
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login` until you sign in with Google.

## Deploying to Vercel

1. **Push this project to GitHub.**
   ```bash
   cd lovable-clone
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/buildable.git
   git push -u origin main
   ```

2. **Import into Vercel.**
   - Go to https://vercel.com/new
   - Select "Import Git Repository" and pick the repo you just pushed
   - Framework preset should auto-detect as **Next.js** — leave build settings as default (`npm run build`, output handled automatically)

3. **Add your environment variables.**
   - In the Vercel project, go to **Settings → Environment Variables**
   - Add: `ANTHROPIC_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` (set this to your actual Vercel URL, e.g. `https://buildable-yourname.vercel.app` — you'll know it after the first deploy; update it once you do)
   - Apply each to Production, Preview, and Development
   - Go back to Google Cloud Console and add `https://YOUR-DOMAIN.vercel.app/api/auth/callback/google` to the authorized redirect URIs
   - These are required — the app will return a clear error in the UI if `ANTHROPIC_API_KEY` is missing, and sign-in will fail without the Google/NextAuth vars

4. **Deploy.**
   - Click **Deploy** (or it will auto-deploy after the env var is saved, depending on timing — if you added the env var after the first deploy, go to **Deployments → ⋯ → Redeploy** so it picks up the variable)
   - Vercel will give you a live URL like `https://buildable-yourname.vercel.app`

5. **Done.** Open the URL, type a prompt, and the app will generate and preview live.

### Notes on Vercel limits for this MVP
- API routes on Vercel's default plan have execution timeouts (10s on Hobby, longer on Pro). Generating a full HTML app can occasionally take 15–30+ seconds for complex requests on Hobby — if you hit timeouts, either upgrade to Pro (60s+ limit) or reduce `max_tokens` in `app/api/generate/route.ts`.
- This MVP has no auth, no rate limiting, and no per-user usage caps. Anyone with your URL can trigger API calls billed to your Anthropic key. Before sharing the link widely, add at minimum a simple rate limiter (e.g. Vercel KV + a per-IP counter) or basic auth.

## Next steps to take this from MVP toward a real product

- **Persistence**: add a database (Supabase/Postgres is fastest) to save projects, chat history, and HTML versions so users can come back to past projects and see version history.
- **Auth**: add NextAuth or Clerk so each user has their own project list.
- **Multi-file projects**: swap the single-HTML-file sandbox for WebContainers (StackBlitz's in-browser Node runtime) to support real multi-file React/Vite projects instead of one HTML file.
- **Rate limiting / billing**: add per-user generation limits and a Stripe paywall if you want to charge for usage.
- **Streaming**: stream the model's response token-by-token into the code view for a more "live build" feel, instead of waiting for the full response.
- **Export to GitHub**: add a "Push to GitHub" button using the GitHub API so users can take their generated app to a real repo.
