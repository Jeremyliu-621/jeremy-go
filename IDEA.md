# FRIENDDEX

## What We're Building

A mobile browser app (PWA) where you catch your friends like Pokémon.

Open the app on your phone → camera turns on immediately → point at a friend → a pill appears at the bottom saying "Try capturing [name]?" → tap it → transitions to a full catch screen (like Pokémon GO's encounter screen) where your friend's face photo is shown in the environment → swipe/throw a Pokéball at them → RNG determines success or fail → on success, Gemini generates their Pokédex entry (type, stats, 4 moves, description) based on their personality → they're added to your Frienddex → you can battle other users using your caught friends.

## Reference Screenshot

The catch screen should match the provided Pokémon GO screenshot exactly in layout:
- Full screen environment background (grassy field, sky)
- Friend's photo rendered as the "Pokémon" standing in the environment (center-lower area)
- Name + CP pill floating above them
- Pokéball at bottom center (throwable via swipe up gesture)
- Berry button bottom left, ball selector bottom right

## Stack

- **Frontend:** Vite + React + TypeScript (PWA via vite-plugin-pwa)
- **Camera:** browser `getUserMedia` API
- **Face detection:** TensorFlow.js `@tensorflow-models/face-landmarks-detection`
- **Animations:** Framer Motion + CSS animations
- **Backend:** Supabase (auth, postgres, realtime, storage, edge functions)
- **AI:** Google Gemini API (via Supabase Edge Function — never expose key client-side)
- **Deployment:** Vercel

## Core Flows

**Scan:** Camera on immediately on load → TensorFlow.js detects faces live → matched face gets a pill at the bottom: "✦ Try capturing Alex?" → tap pill → catch screen

**Catch screen:** Full-screen Pokémon GO-style encounter. Friend's photo in the environment. Name + CP above them. Pokéball at bottom. User swipes up to throw. Ball follows swipe arc toward friend. RNG: success locks ball, fail bursts open.

**On success:** Pokéball shake animation → white flash → loading screen ("Generating Pokédex entry...") → Gemini generates stats → reveal screen with fanfare → added to Frienddex.

**Frienddex:** Grid of caught friends. Tap any to see their full entry: photo, types, stats, moves, description.

**Battle:** Pick a caught friend → share code → real-time 1v1 turn-based battle.

## Hard Constraints

- HTTPS required (camera access). Deploy to Vercel, not localhost in production.
- Face photos stay on-device for recognition. Only the captured selfie (used as the "sprite") goes to Supabase Storage.
- Gemini API calls go through a Supabase Edge Function. Key never in client code.
- PWA: must be installable (manifest.json, service worker, HTTPS). Works offline for Frienddex viewing.
- Stat generation runs once per caught friend and is persisted.
- Battles sync via Supabase Realtime.

## How To Work

Read all .md files before writing any code: IDEA.md → TASKS.md → DESIGN.md → ASSETS.md.

Work through TASKS.md in order. Document every significant decision in DECISIONS.md as you go. After each phase, run the tests in TESTING.md and fix all failures before moving on.
