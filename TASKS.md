# TASKS

Work through this in order. Check off as you go. Do not skip phases. Run TESTING.md tests after each phase before proceeding.

---

## Phase 0 — Project Setup
- [ ] Vite + React + TypeScript scaffolded
- [ ] vite-plugin-pwa configured (manifest, service worker, installable)
- [ ] Tailwind CSS configured
- [ ] Framer Motion installed
- [ ] TensorFlow.js + face-landmarks-detection installed
- [ ] Supabase client configured
- [ ] Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] Vercel config (`vercel.json`) with SPA routing
- [ ] App loads in mobile Chrome without errors
- [ ] PWA install prompt works on Android Chrome

---

## Phase 1 — Auth + Database
- [ ] Supabase schema designed and all migrations run
- [ ] Auth: sign up / sign in / sign out (magic link or email+password)
- [ ] Row-level security on all tables
- [ ] Supabase Edge Function: `generate-friend-stats` (calls Gemini, returns structured JSON)
- [ ] Edge function handles bad input gracefully (returns error, doesn't crash)

---

## Phase 2 — User Profile + Face Registration
- [ ] Profile setup flow: username → selfie (front camera) → 5 personality questions → confirm
- [ ] Selfie stored to Supabase Storage, URL saved to profile
- [ ] Face fingerprint derived on-device from selfie using TensorFlow.js, stored to DB
- [ ] On profile complete: call `generate-friend-stats` to pre-generate own Pokédex entry
- [ ] Own entry persisted to DB — never regenerated unless user resets profile
- [ ] Profile screen: shows own card, username, stats, type, moves

---

## Phase 3 — Camera Scan Screen
- [ ] Camera turns on immediately when app loads (after auth)
- [ ] `getUserMedia` with rear camera default, front camera toggle
- [ ] TensorFlow.js face detection runs on video stream
- [ ] When face detected + matched to a registered user:
  - [ ] Bottom pill animates up: "✦ Try capturing [username]?"
  - [ ] Pill is tappable
- [ ] When no face: pill hidden, subtle hint text only
- [ ] Unrecognized face: pill says "Unknown Trainer — invite them?"
- [ ] Multiple faces: match the most prominent (largest bounding box)
- [ ] No UI chrome cluttering the camera — clean full-screen

---

## Phase 4 — Catch Screen
- [ ] Tapping the pill transitions to catch screen (slide up or fade)
- [ ] Catch screen is full-screen, Pokémon GO encounter layout (see DESIGN.md)
- [ ] Environment background: grassy field image (see ASSETS.md for source)
- [ ] Friend's photo rendered as their "sprite" — positioned center-lower screen
- [ ] Name + CP pill floating above their photo
- [ ] Pokéball rendered at bottom center
- [ ] Swipe-up gesture on Pokéball initiates throw:
  - [ ] Ball follows swipe direction/speed as a physics arc
  - [ ] Rotation during flight
  - [ ] Ball travels toward friend photo
- [ ] On arrival: friend photo "absorbed" (scale down + flash)
- [ ] Wobble animation x3
- [ ] RNG catch check runs (with modifiers — never caught, already caught count, etc.)
- [ ] **Fail:** ball bursts, friend photo pops back, "escaped" message, stays on catch screen
- [ ] **Success:** ball snaps shut → star particles → white flash → transition to loading screen

---

## Phase 5 — Stat Generation + Reveal
- [ ] Loading screen: spinning Pokéball, rotating flavor text lines
- [ ] Call `generate-friend-stats` edge function with target's personality answers
- [ ] Gemini prompt returns: primaryType, secondaryType, CP, stats (6), moves (4), description, flavorText
- [ ] Parse and validate response — handle malformed JSON gracefully
- [ ] Save entry to `caught_friends` table
- [ ] Reveal screen:
  - [ ] Friend's photo large, centered
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
- [ ] Detail screen: full photo, name, types, Pokédex description, all 6 stats, all 4 moves
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
