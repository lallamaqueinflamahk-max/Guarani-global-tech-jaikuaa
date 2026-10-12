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
