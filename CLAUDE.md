# FRIENDDEX — Agent Directives

## THE ONE RULE

**There is ONE app: `/frienddex`.** The root `/src` is a deprecated prototype. Do NOT build new features in root `/src`. All new code goes in `/frienddex/src`.

The catch screen components from root `/src` have been ported into `/frienddex/src/components/catch/` and `/frienddex/src/screens/CatchScreen.tsx`. Use those. Do not reference or import from root `/src`.

---

## Before You Write Any Code

1. Read: IDEA.md → TASKS.md → DESIGN.md → ASSETS.md → DECISIONS.md
2. Check TASKS.md for what phase you're assigned to
3. Run `cd frienddex && npx tsc --noEmit` to confirm the build isn't already broken
4. If the build IS broken, fix it before doing anything else

---

## Conventions

- **File naming:** PascalCase for components/screens (`CatchScreen.tsx`), camelCase for hooks/lib (`useCamera.ts`, `catchMechanics.ts`)
- **Stats keys:** Always use **camelCase** (`spAttack`, `spDefense`) — this matches the Gemini edge function output. The database stores stats as JSONB so key format doesn't matter at the DB level.
- **Types:** Import from `@/types/database` for DB-related types, `@/types` for battle/game types
- **Styling:** Tailwind CSS. Follow the color system in DESIGN.md. No default blue (`#007AFF`, `#3B82F6`). No emoji as icons.
- **Animations:** Framer Motion. No generic spinners — use PokeballSpinner.
- **Errors:** Toast notifications (use the Toast context), never `alert()`, never blank screens
- **Photos:** Always circular crop or soft-cutout. Never rectangles.
- **Fonts:** Poppins or Nunito via Google Fonts. Never system fonts for visible text.

---

## Architecture

```
frienddex/src/
├── components/       # Reusable UI pieces
│   ├── catch/        # Catch screen sub-components
│   └── ...
├── contexts/         # React contexts (Auth, Toast)
├── hooks/            # Custom hooks (useCamera, useFaceDetection, useSwipeThrow)
├── lib/              # Pure logic (catchMechanics, supabase client, constants)
├── screens/          # Full-page screens (one per route)
├── types/            # TypeScript interfaces
├── App.tsx           # Router + auth guard
└── main.tsx          # Entry point
```

---

## Supabase

- **Client:** `frienddex/src/lib/supabase.ts`
- **Migrations:** `frienddex/supabase/migrations/`
- **Edge Functions:** `frienddex/supabase/functions/`
- **Never** put `GEMINI_API_KEY` or `service_role` key in client code
- Edge function returns camelCase keys — do NOT convert to snake_case

---

## What NOT To Do

- Do NOT create new files in root `/src` — that codebase is dead
- Do NOT install new dependencies without checking if an existing one covers it
- Do NOT add backwards-compatibility shims or feature flags
- Do NOT add docstrings/comments to code you didn't change
- Do NOT build Phase N+1 features while Phase N has failing tests
- Do NOT use `alert()`, `confirm()`, or `prompt()` — use Toast context
- Do NOT leave `console.log` in production code (use `console.warn` for recoverable issues only)

---

## Testing

After finishing any phase, run the tests in TESTING.md. Every failure must be fixed before moving on. Log pass/fail in DECISIONS.md.

---

## Decision Logging

Every significant choice goes in DECISIONS.md using the format:
```
## [Phase X] Decision Title
**Decision:** What was decided
**Reasoning:** Why this over alternatives
**Tradeoffs:** What was sacrificed
```
