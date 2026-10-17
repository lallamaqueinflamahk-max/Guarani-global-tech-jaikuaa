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

- Certificates: one row per user in certificates (random code), issued only via issueCertificate after a server-side completion check; /verificar/$code is public and returns only printed fields — keeps certificates verifiable without exposing other data.
- Studio is an isolated external app: the /studio root and splat server routes proxy to a fixed Vercel origin, preserving upstream security and using full-page navigation; never import Next.js into Jaikuaa or intercept existing root APIs/assets, to avoid collisions.
