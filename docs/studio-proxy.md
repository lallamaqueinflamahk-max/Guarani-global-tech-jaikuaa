# Studio mount

jaikuaa.com is hosted by Lovable, not Vercel, so a `vercel.json` rewrite in this repo has no effect. The rewrite is implemented as TanStack Start server routes (`src/routes/studio.index.ts`, `src/routes/studio.$.ts`) using `src/lib/studio-proxy.ts`.

- Only `/studio` and `/studio/*` are forwarded, to the fixed origin `https://jaikuua-studio-app.vercel.app`, **keeping the `/studio` prefix** (Studio is built with Next.js `basePath: "/studio"`). Equivalent to:
  - `/studio` → `https://jaikuua-studio-app.vercel.app/studio`
  - `/studio/:path*` → `https://jaikuua-studio-app.vercel.app/studio/:path*`
- No other Jaikuaa path or asset is proxied. The origin can never be chosen by the request.

## Security policy

- Vercel/Studio keeps all authorization (middleware, admin certificate). Its 401/403 responses pass through unchanged. No admin secret is injected here; `ADMIN_CERT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, etc. live only in Vercel.
- The visitor IP is sent as `x-forwarded-for` (from the edge's own header); client-sent forwarded headers are discarded.
- Redirects from Studio stay under `/studio`; cookies are host-only and scoped under `/studio`, keeping Secure/HttpOnly/SameSite.

## Requirement on the Studio deployment

The production deployment on Vercel must actually be built with `basePath: "/studio"`: pages and assets must answer at `/studio/...` (assets at `/studio/_next/...`). On 2026-10-17 the live deployment still served pages at `/` and `/lab` with assets at `/_next/...`, and `/studio/*` returned `ADMIN_CERT_REQUIRED` — so the basePath build must be redeployed before `/studio` works on jaikuaa.com.

## Verification

Unit tests (`src/lib/studio-proxy.test.ts`) cover destinations with the prefix, mount isolation, POST forwarding, unchanged 403s, visitor IP, redirects and cookies without a doubled prefix. Live checks after both deploys: `https://www.jaikuaa.com/studio` and `/studio/lab` render, assets load from `/studio/_next/`, and `/studio/api/analyze` answers.
