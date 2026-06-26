## What's broken

In `src/routes/_authenticated/curso.$lang.tsx`, each unlocked lesson is a `<Link>` wrapping a div that contains a `<Button>` ("Empezar"). That nests a `<button>` inside an `<a>`, which is invalid HTML — browsers (especially Chromium) cancel the anchor activation when the inner button receives the click, so nothing navigates. The button also has no `onClick` of its own.

The lesson detail route, vocab list, speaker buttons, and exercises already exist at `src/routes/_authenticated/curso.$lang.leccion.$n.tsx` and work — they're just unreachable.

## Fix

1. In `curso.$lang.tsx`, replace the nested `<Button>` with a non-interactive styled `<span>` ("Empezar") so the whole card is a single valid `<Link>`. Add visible `hover:` and `active:` states (border, shadow, slight bg shift) to make clickability obvious.
2. Keep locked rows as a plain div with the 🔒.
3. Leave the lesson detail page as-is (already renders vocab, 🔊 speaker, multiple-choice and matching exercises, completion screen). Confirm the "Volver" link in its header points back to `/curso/$lang`.
4. Verify with Playwright: log in via injected session, click "Lección 1", confirm `/curso/guarani/leccion/1` loads with "Mba'éichapa", run through exercises.

No backend or data changes.