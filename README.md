## What it does

- Chud GO! is a playful, location‑based scavenger game. Explore your city, scan real‑world QR tags, and “catch” characters to fill your Frienddex.
- Track progress, view fun character profiles, and race friends on local leaderboards.

## How we built it

- Frontend: React + TypeScript with Vite for fast dev and builds.[Verse 1]
Hold me close 'til I get up
Time is barely on our side
I don't wanna waste what's left
The storms we chase are leadin' us
And love is all we'll ever trust, yeah
No, I don't wanna waste what's left

[Chorus]
And on and on we'll go
Through the wastelands, through the highways
'Til my shadow turns to sun rays
And on and on we'll go
Through the wastelands, through the highways
And on and on we'll go

[Drop]

[Bridge]
Oh, on we'll go

[Verse 2]
Finding life along the way
Melodies we haven't played
No, I don't want no rest (Yeah, yeah)
Echoing around these walls
Fighting to create a song (Yeah)
I don't wanna miss a beat

[Chorus]
And on and on we'll go
Through the wastelands, through the highways
'Til my shadow turns to sun rays
And on and on we'll go
Through the wastelands, through the highways
And on and on we'll go

[Drop]

[Bridge]
And we'll grow in number
Fueled by thunder, see the horizon
Turn us to thousands
And we'll grow in number
Fueled by thunder, see the horizon
Turn us to thousands

[Chorus]
And on and on we'll go
Through the wastelands, through the highways
'Til my shadow turns to sunrays
And on and on we'll go
Through the wastelands, through the highways
And on and on we'll go
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

