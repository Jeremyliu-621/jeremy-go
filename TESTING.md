# TESTING

After completing each phase, run the tests below. Fix every failure before moving on. Log pass/fail and any fixes in DECISIONS.md.

---

## Phase 0 — Setup
- [ ] `npx tsc --noEmit` exits 0 errors
- [ ] `npm run build` succeeds with no warnings
- [ ] App loads in mobile Chrome (Android) without console errors
- [ ] App loads in Safari (iOS) without console errors
- [ ] PWA manifest valid — Chrome DevTools > Application > Manifest shows no errors
- [ ] Service worker registered successfully
- [ ] Install prompt appears on Android Chrome after 30s on site

---

## Phase 1 — Auth + Database
- [ ] New user can sign up
- [ ] Existing user can sign in
- [ ] Signed-in user can sign out
- [ ] Unauthenticated user is redirected to auth screen
- [ ] RLS: simulate two users — User A cannot read User B's caught_friends
- [ ] Edge function deploys: `curl` test with valid payload returns structured JSON
- [ ] Edge function: malformed payload returns 400 error, not 500 crash

---

## Phase 2 — Profile + Face Registration
- [ ] Profile setup completes on mobile Chrome without crash
- [ ] Selfie capture works (front camera opens correctly)
- [ ] All 5 personality questions required — cannot submit with blanks
- [ ] Selfie URL saved to Supabase Storage and is publicly accessible
- [ ] Face fingerprint row exists in `user_faces` after setup
- [ ] Gemini generates a valid response: has primaryType, 6 stats, 4 moves
- [ ] Generated entry is in DB — refreshing the app shows same entry, no re-call to Gemini
- [ ] Profile screen renders without errors

---

## Phase 3 — Camera Scan
- [ ] Camera permission prompt appears correctly on first load
- [ ] Denied permission: fallback UI shown, no crash, no blank screen
- [ ] Camera feed is full-screen, no letterboxing on iPhone and Android
- [ ] TensorFlow.js model loads without blocking UI (show loading state while it initializes)
- [ ] Face detection runs live — confirmed via bounding box in dev mode
- [ ] Registered user detected: pill appears within 2 seconds of stable face lock
- [ ] Pill disappears when face leaves frame
- [ ] Unknown face: "Unknown Trainer" pill shown
- [ ] No face: no pill, hint text only
- [ ] Multiple faces: no crash, most prominent face used

---

## Phase 4 — Catch Screen
- [ ] Transition from scan screen to catch screen is smooth (no flash/jump)
- [ ] Environment background renders correctly on all screen sizes
- [ ] Friend photo renders centered in the grass area, not floating
- [ ] Name + CP pill positioned correctly above photo
- [ ] Pokéball renders at bottom center
- [ ] Swipe-up gesture recognized correctly (test on physical phone — not just mouse)
- [ ] Ball arc looks physical — not linear, not too fast, not too slow (~1.5s flight)
- [ ] Ball rotation happens during flight
- [ ] Hit detection: ball reaches friend photo area
- [ ] Friend photo "absorbed" animation plays
- [ ] Wobble animation: 3 wobbles with decreasing amplitude
- [ ] Fail path: ball bursts, "escaped" message, catch screen remains
- [ ] Success path: ball snaps, stars, white flash, transitions to loading
- [ ] Can throw multiple times after fail without UI breaking

---

## Phase 5 — Stat Generation + Reveal
- [ ] Loading screen shows immediately after success — no blank gap
- [ ] Flavor text rotates (not static)
- [ ] Gemini response arrives and is valid JSON — test 5 different personality combos
- [ ] Bad Gemini response (simulate): error shown gracefully, not a white screen
- [ ] Caught friend row exists in DB after successful generation
- [ ] Reveal screen: all 6 stats shown with correct values
- [ ] Reveal screen: all 4 moves shown
- [ ] Stat bars animate on first render
- [ ] "View in Frienddex" navigates correctly
- [ ] Catching same person twice: blocked before catch screen opens

---

## Phase 6 — Frienddex
- [ ] All caught friends load from DB on screen mount
- [ ] 0 friends: empty state renders
- [ ] 20+ friends: grid scrolls smoothly, no layout overflow
- [ ] Friend cards show correct photo, name, CP, type
- [ ] Tap card → detail screen navigates correctly
- [ ] Detail screen: all data correct (stats, moves, description)
- [ ] Sort by date: correct order
- [ ] Sort by CP: correct order
- [ ] Filter by type: correct subset shown

---

## Phase 7 — Battle
- [ ] Battle code generates and displays
- [ ] Second browser/device joins via code successfully
- [ ] Battle starts only after both players joined
- [ ] Realtime: Player 1 selects move → Player 2 sees result within 1 second
- [ ] Realtime: Player 2 selects move → Player 1 sees result within 1 second
- [ ] Timer counts down visually, auto-selects on expire
- [ ] Damage formula produces reasonable numbers (not 0, not 9999)
- [ ] Type effectiveness: test Fire vs Grass (should be super effective)
- [ ] HP bars animate correctly, never go negative
- [ ] KO triggers correctly at 0 HP
- [ ] Win/loss screen shows correct winner
- [ ] Disconnect: other player sees disconnect message within 15 seconds
- [ ] Reconnect: battle state correctly restored from DB

---

## Phase 8 — Polish + Security
- [ ] `grep -r "GEMINI_API_KEY\|service_role" ./src` returns nothing
- [ ] Catching yourself: blocked with message before catch screen
- [ ] All network errors show toast, not console errors
- [ ] Frienddex loads from service worker cache when offline
- [ ] No TypeScript errors: `npx tsc --noEmit` clean

---

## Phase 9 — Deploy
- [ ] Vercel deployment succeeds with 0 build errors
- [ ] App accessible at public URL
- [ ] Camera works on deployed URL (HTTPS required)
- [ ] PWA installable from deployed URL on Android
- [ ] PWA installable from deployed URL on iOS (Safari > Share > Add to Home Screen)
- [ ] Full catch flow on physical phone against deployed URL
- [ ] Full battle on two physical phones against deployed URL
