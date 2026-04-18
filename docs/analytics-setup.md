# Analytics Setup (v3)

## What changed

The analytics endpoint (`/api/analytics/track`) used to write every event
to `data/analytics.json` via the GitHub Contents API. Because Vercel's
filesystem is read-only outside `/tmp`, every visitor event fell through
to the GitHub fallback, producing a commit titled `Track analytics event`.
Each such commit triggered `.github/workflows/vercel-deploy.yml`, which
produced another deploy, which accepted more visitors, which produced
more commits — an unbounded feedback loop that burned CI minutes,
polluted git history, and caused race-conditioned event loss.

The new endpoint (`src/app/api/analytics/track/route.ts`, v3):

- Does **no** filesystem or GitHub writes
- Does bot/crawler filtering via User-Agent
- Does per-IP rate limiting (500ms minimum between events per IP)
- Truncates fields to cap payload size
- Fires events to Upstash Redis via REST (fire-and-forget, 1.5s timeout)
- Always returns 200

## Option A: Use Vercel Analytics (simplest, free)

If you don't need custom events, enable Vercel Analytics from the
Vercel dashboard → Project → Analytics → Enable. No code needed.

## Option B: Upstash Redis (for custom events)

1. Sign up at https://upstash.com (free tier: 10,000 commands/day).
2. Create a new Redis database (any region — pick one near your users).
3. Copy the REST URL and REST Token.
4. Add to Vercel environment variables (Production + Preview):

   ```
   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-rest-token
   ```

5. Redeploy. Events will be pushed to the `analytics:events` Redis list,
   capped at the 10,000 most recent.

### Reading events

From any admin route or server component:

```ts
const r = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/lrange/analytics:events/0/99`, {
  headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
  cache: "no-store",
});
const { result } = await r.json();
const events = result.map((s: string) => JSON.parse(s));
```

## Option C: No analytics storage (zero-cost)

Leave the env vars unset. The endpoint will accept events, filter bots,
rate-limit, and silently drop. Useful if you only care about Vercel's
built-in request logs.

## Cleanup note

`data/analytics.json` has been removed from git tracking and added to
`.gitignore`. It will continue to live on developers' local machines as
an untracked file — feel free to delete it manually.

## History cleanup (optional)

The hundreds of `Track analytics event` commits in history are harmless
but noisy. To suppress them in readable logs:

```bash
git log --oneline --invert-grep --grep="Track analytics event"
```

Rewriting history with `git filter-repo` is **not recommended** because
Vercel has cached deployments keyed by commit SHA. Leave history alone.
