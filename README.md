## What it does

- Chud GO! is a playful, location‑based scavenger game. Explore your city, scan real‑world QR tags, and “catch” characters to fill your Frienddex.
- Track progress, view fun character profiles, and race friends on local leaderboards.

## How we built it

- Frontend: React + TypeScript with Vite for fast dev and builds.
- Mobile‑first PWA with offline caching for scan‑and‑collect on the go.
- Camera‑based QR scanning using browser APIs for instant captures.
- Local persistence for collections; sync‑ready hooks for a future backend.

## Challenges we ran into

- Mobile browser quirks for camera permissions and autofocus consistency.
- Tuning QR scan performance across a range of devices and lighting.
- Keeping UI snappy offline while preventing duplicate scans.
- Balancing playful animations with battery/performance constraints outdoors.

## Accomplishments that we're proud of

- Smooth, reliable QR capture flow with clear feedback and a Pokéball‑style spinner.
- A clean, delightful Frienddex UI that makes collecting feel rewarding.
- Fully mobile‑ready PWA you can “install” and play immediately.
- Solid foundations for syncing, trading, and events.

## What we learned

- Practical tricks for camera/QR UX on mobile (focus, exposure, framing).
- How to structure a Vite + React + TS app for fast iteration and painless deploys.
- Designing offline‑first flows without confusing users.
- Small micro‑interactions go a long way toward perceived quality.

## What's next for Chud GO!

- Real‑time trading and friend challenges.
- Time‑boxed city events with rare characters and map pins.
- Anti‑spoofing and duplicate‑scan protection with light server verification.
- AR view and haptics for more immersive “catch” moments.
- Accessibility and onboarding polish, plus global leaderboards.

