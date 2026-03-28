# TASKS

Work through this in order. Check off as you go. Do not skip phases. Run TESTING.md tests after each phase before proceeding.

**IMPORTANT: All work happens in `/frienddex`. Root `/src` is deprecated — do not build there.**

---

## Phase 0 — Project Setup ✅ DONE
- [x] Vite + React + TypeScript scaffolded
- [x] vite-plugin-pwa configured (manifest, service worker, installable)
- [x] Tailwind CSS configured
- [x] Framer Motion installed
- [x] TensorFlow.js + face-landmarks-detection installed
- [x] Supabase client configured
- [x] Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [x] Vercel config (`vercel.json`) with SPA routing
- [x] App loads without errors
- [x] PWA install prompt works

---

## Phase 1 — Auth + Database ✅ DONE
- [x] Supabase schema designed and migration run (`001_initial_schema.sql`)
- [x] Auth: sign up / sign in / sign out (email+password)
- [x] Row-level security on all tables
- [x] Supabase Edge Function: `generate-friend-stats` (calls Gemini 2.0 Flash)
- [x] Edge function handles bad input gracefully (returns 400, not crash)

---

## Phase 2 — User Profile + Face Registration ✅ DONE
- [x] Profile setup flow: username → selfie → 5 personality questions → confirm
- [x] Selfie stored to Supabase Storage
- [x] Face descriptor derived on-device via TensorFlow.js
- [x] On profile complete: call `generate-friend-stats` to pre-generate own entry
- [x] Own entry persisted to DB
- [x] Profile screen: shows own card, username, stats, type, moves

---

## Phase 3 — Camera Scan Screen 🔴 NEXT UP
- [ ] Replace placeholder ScanScreen with real camera implementation
- [ ] Camera turns on immediately when app loads (after auth)
- [ ] `getUserMedia` with rear camera default, front camera toggle
- [ ] TensorFlow.js face detection runs on video stream
- [ ] When face detected + matched to a registered user:
  - [ ] Bottom pill animates up: "✦ Try capturing [username]?"
  - [ ] Pill is tappable → navigates to `/catch` with friend data
- [ ] When no face: pill hidden, subtle hint text only
- [ ] Unrecognized face: pill says "Unknown Trainer — invite them?"
- [ ] Multiple faces: match the most prominent (largest bounding box)
- [ ] No UI chrome cluttering the camera — clean full-screen

---

## Phase 4 — Catch Screen ✅ PORTED (needs integration)
Catch screen components are in `frienddex/src/components/catch/` and `frienddex/src/screens/CatchScreen.tsx`. Route is `/catch`.

Remaining integration work:
- [ ] Wire ScanScreen pill tap → navigate to `/catch` with real friend data (not mock)
- [ ] Connect catch success → call `generate-friend-stats` edge function for target
- [ ] Save caught friend to `caught_friends` table on success
- [ ] Block catching someone already in your Frienddex
- [ ] Block catching yourself
- [ ] Navigate to loading/reveal screen after success transition

Already working:
- [x] Full-screen Pokémon GO encounter layout
- [x] Environment background (CSS fallback)
- [x] Friend photo as sprite with type-colored border
- [x] Name + CP pill floating above photo
- [x] Pokéball at bottom center with swipe-up throw
- [x] Ball physics arc with rotation during flight
- [x] Friend photo "absorbed" animation
- [x] Wobble animation x3 with decreasing amplitude
- [x] RNG catch check with modifiers
- [x] Fail: ball bursts, "escaped" message, stays on catch screen
- [x] Success: ball snaps, star particles, white flash

---

## Phase 5 — Stat Generation + Reveal
- [ ] Loading screen: spinning Pokéball, rotating flavor text lines
- [ ] Call `generate-friend-stats` edge function with target's personality answers
- [ ] Parse and validate response — handle malformed JSON gracefully
- [ ] Save entry to `pokedex_entries` table
- [ ] Save record to `caught_friends` table
- [ ] Reveal screen:
  - [ ] Friend's photo large, centered, type-colored glow border
  - [ ] Type badge(s) slide in
  - [ ] Stats animate up one by one
  - [ ] Moves appear with stagger
  - [ ] "Added to your Frienddex!"
  - [ ] Button: "View in Frienddex"

---

## Phase 6 — Frienddex Screen
- [ ] Grid of all caught friends (2 columns)
- [ ] Each card: photo, name, CP, type badge(s)
- [ ] Empty state with instructions
- [ ] Tap card → friend detail screen
- [ ] Detail screen: full photo, name, types, description, all 6 stats, all 4 moves
- [ ] Sort: by date caught, by CP
- [ ] Filter: by type

---

## Phase 7 — Battle System
- [ ] Battle lobby: select fighter from Frienddex, generate 6-char code
- [ ] Join screen: enter code → both players see each other's fighter
- [ ] Supabase Realtime: both subscribe to battle channel
- [ ] Battle screen (see DESIGN.md for layout)
- [ ] Turn-based: speed stat determines order, 30s timer per turn
- [ ] Move selection → damage calc → HP bars animate → battle log updates
- [ ] Type effectiveness applied (full 18-type chart)
- [ ] KO detection → win/loss screen
- [ ] Disconnect handling: 2min timeout → battle abandoned

---

## Phase 8 — Polish
- [ ] Can't catch yourself
- [ ] Catching someone already in your Frienddex: blocked with message
- [ ] All loading / error / empty states handled everywhere
- [ ] Works offline for Frienddex viewing (service worker caches)
- [ ] HTTPS enforced (Vercel handles this)
- [ ] No API keys in client bundle (`grep` check)

---

## Phase 9 — Deploy
- [ ] Deployed to Vercel
- [ ] Custom domain or `.vercel.app` URL
- [ ] PWA installable from deployed URL on physical Android + iOS
- [ ] Full catch flow tested on physical phone
- [ ] Full battle flow tested on two physical phones
