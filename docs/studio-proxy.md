# Studio mount

Jaikuaa handles only `/studio` and `/studio/*`, forwarding to the fixed origin `https://jaikuaa-studio.vercel.app` with the prefix removed. Next.js code and environment variables remain on Vercel. Navigation uses full-page links so the TanStack shell does not wrap the external page.

## Security policy

- Vercel remains responsible for all Studio authorization. Its 401/403 responses are returned unchanged. No admin secret is injected and no certificate is forged.
- HTTP methods, bodies, query parameters and streaming responses are forwarded. Same-origin upstream redirects remain under `/studio`.
- Studio response cookies are host-only and scoped under `/studio`; their Secure, HttpOnly and SameSite flags are retained.
- No existing Jaikuaa root API or asset path is proxied. The origin cannot be chosen through a query parameter or path.

## External deployment requirement

These are the exact requested prefix-stripping rules, not a complete Next.js base-path conversion. The current upstream serves root-relative `/_next/*`, links such as `/lab`, and calls such as `/api/analyze`. They must be emitted under `/studio` by the external app for the embedded URL to function completely. Proxying those root paths here would conflict with existing Jaikuaa paths and is deliberately not done. Do not change Next.js `basePath` blindly: it also changes the upstream paths, so the stripping rules must be adjusted together with that deployment.

The external repository has no `.env.example` in the inspected main snapshot. Credentials are not configured or copied here. Public page access does not verify authenticated Studio operations or its engine.

## Verification

Unit tests cover the exact root and descendant destinations, query parameters, mount isolation, POST forwarding, unchanged 403 responses, redirect mapping and separate secure cookies. Live verification must separately check markup, assets, internal navigation and authenticated APIs; a 200 HTML response alone is insufficient.