<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- User progress (XP, streak, badges) lives in user_stats/xp_transactions, written only via record_activity RPC from progress.functions.ts; localStorage is just a cache — keeps metrics verifiable across devices.
- Curso de Guaraní lessons live in lessons + lesson_words (linked to corpus_words); the course shows only published words, so docentes control what students see. No hardcoded lesson files.
- Pilot page (/piloto-ateneo) text lives only in src/lib/pilot-content.server.ts and is returned by getPilotPage only when published or to an admin — so draft content never reaches non-admin browsers.

- Penales keeps canvas physics and rendering in isolated browser-safe modules; React owns questions and match state to keep animation independent of UI updates.
- Penales LED text is an app_settings value accessed through authenticated server functions; only the existing admin settings function writes it.
- Games share mascot, synthesized effects, mute preference and help through the game kit; keep match rules and server progress unchanged so presentation does not duplicate domain logic.
- Sections with hardcoded Guaraní not yet reviewed by docentes (Guaraní Escolar, Trivia, Ñe'ẽ Mbytépe) show ValidationNotice and an "En validación" badge on the dashboard; remove them only once the content is validated or moved to the corpus.
- Only languages with content are enabled in src/lib/languages.ts; the PWA manifest (public/manifest.webmanifest) makes the app installable — no service worker yet.
- Support WhatsApp number lives only in src/lib/contact.ts; the floating button (SupportWhatsApp in __root) hides on /juegos, /admin and /piloto-ateneo.
- Sponsor slots (Palabra del día + each game) and the founders wall live in app_settings, defined in src/lib/sponsor-slots.ts and edited from the admin Auspiciantes tab; empty values are hidden. GameShell shows the sponsor via its sponsorSlot prop.
- Game end screens share results with ShareResult (wa.me text + link to the landing page).
- Public sales pages: /instituciones (pilot offer) and /auspiciantes (sponsor slots) share src/components/marketing/page-parts.tsx; only real backing (Senado 547, SPL 116, Convenio Ateneo) and no user counts.
- Weekly ranking (/ranking) sums xp_transactions since Monday 00:00 Paraguay time within the user's cohort, first names only, admins excluded. Certificate (/certificado) requires every published Guaraní lesson completed (source_ref guarani:N) and prints via window.print; no Ateneo logo, states it is not an official title.
- Dark mode and large text are per-device prefs (src/lib/display-prefs.ts, localStorage with try/catch) applied on <html>; toggles live in the dashboard and landing headers.

## Informe para auspiciante (14/10/2026)
- Ruta admin `/admin/informe-auspiciante?sponsor=…&days=7|30|90` (registrada a mano en routeTree.gen.ts). Usa `getSponsorReport` (solo admin, rpc `sponsor_impressions_report`). Imprimible A4 vertical con window.print. Acceso: botón "Informe para el auspiciante" en Admin → Auspiciantes.
- No suma "usuarios distintos" entre espacios (una persona puede ver varios).

## Vista previa al compartir (14/10/2026)
- `public/og-instituciones.png` y `public/og-auspiciantes.png` (1200x630) + og:url/og:image/twitter:* en el head de cada página.
- Offline: vite-plugin-pwa generateSW writes dist/client/sw.js, registered only via src/lib/pwa.ts (never in preview/dev); audio cached by file path ignoring signed-URL query — keeps previews safe and audio playable offline.
