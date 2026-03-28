# DESIGN

The visual bar is the provided Pokémon GO screenshot. Every screen should feel like it belongs in that app. Nothing templated, nothing generic, nothing that looks like a default component library.

---

## Color System

```
Primary Blue:     #0075BE
Pokémon Yellow:   #FFCB05
Dark Navy:        #1A1A2E
Off-White:        #F5F5F5
Overlay Dark:     rgba(0,0,0,0.55)
Pill Background:  rgba(30,30,30,0.75)  (frosted dark, like the name pill in screenshot)

Type colors:
  Normal:   #A8A878    Fire:     #F08030    Water:    #6890F0
  Grass:    #78C850    Electric: #F8D030    Ice:      #98D8D8
  Fighting: #C03028    Poison:   #A040A0    Ground:   #E0C068
  Flying:   #A890F0    Psychic:  #F85888    Bug:      #A8B820
  Rock:     #B8A038    Ghost:    #705898    Dragon:   #7038F8
  Dark:     #705848    Steel:    #B8B8D0    Fairy:    #EE99AC
```

---

## Fonts

- **UI font:** `Nunito` or `Poppins` — bold, rounded, loaded via Google Fonts
- **Pokédex numbers:** monospaced, muted
- **CP values:** bold, slightly larger than name
- Never use system fonts for visible text

---

## Screen-by-Screen Specs

### Camera / Scan Screen

- Full-screen camera feed. Zero padding. No chrome.
- When no face: single line of muted hint text at the very bottom center: `Point at a friend to capture them`
- When face detected + matched: pill slides up from bottom
  - Pill: dark frosted background, rounded pill shape, white text: `✦ Try capturing alex?`
  - Tap anywhere on pill triggers catch screen transition
  - Pill disappears if face leaves frame
- Top bar: minimal — just app name top-left, profile avatar top-right. Semi-transparent.

### Catch Screen (most important — reference the screenshot)

Layout from top to bottom:
```
[ AR toggle top-right, camera icon top-center, run away top-left ]

[ environment background — grassy field, sky, trees ]

[ Name + CP pill — centered, dark frosted, "◉ Alex / CP 247" ]

[ friend's photo — rendered as the "Pokémon", standing in the grass ]
[ subtle shadow under their photo ]

[ lots of breathing room / grass ]

[ Pokéball — large, bottom center, throwable ]
[ Berry btn bottom-left ]   [ Ball selector bottom-right ]
```

Key details from the screenshot to match exactly:
- The name/CP pill has a Pokéball icon on the left (◉ symbol or actual icon)
- The environment background is a painterly/illustrated grassy field — NOT a photo
- The Pokémon (friend photo) sits ON the grass, not floating
- The Pokéball is large (~120px), centered, sits above a subtle count label
- Friend photo should be cropped to a circle or soft-edged cutout so it feels like a sprite, not a literal photo rectangle
- Subtle targeting ring/circle on the ground beneath the friend (green → yellow → red as it pulses)

### Pokéball Throw

- User swipes UP from the Pokéball
- Ball follows the exact swipe vector, with a physics arc toward the friend
- Ball rotates 360° during flight
- Speed and angle slightly influenced by swipe speed (faster swipe = straighter, more accurate)
- On hit: quick scale flash, friend photo shrinks into ball
- Wobble: 3 wobbles with decreasing amplitude (damped spring)
- Fail: crack lines appear on ball, burst apart, friend re-emerges
- Success: ball clicks shut, gold star particles radiate, brief white screen flash

### Loading Screen (post-catch)

- Dark background
- Spinning Pokéball centered
- Rotating flavor text below:
  - "Consulting the Frienddex..."
  - "Analyzing trainer aura..."
  - "Cross-referencing personality data..."
  - "Professor Oak is busy, hold on..."
- Progress dots or subtle animation — not a generic spinner

### Reveal Screen

- Friend's photo large and centered, circular crop, glowing border in their primary type color
- Their name + Pokédex number
- Type badge(s) slide in from left
- CP number counts up
- Stat bars fill left-to-right one by one (staggered 150ms each)
- Move cards appear with fade-stagger
- "✦ Added to your Frienddex!" in Pokémon yellow
- Subtle confetti or star particle burst

### Frienddex Screen

- Header: `FRIENDDEX` bold caps, trainer avatar top right
- 2-column card grid
- Each card:
  - Friend's photo (circular crop, type-colored border)
  - Name below, bold
  - CP value small, muted
  - Type badge(s) at the bottom of the card
  - Subtle shadow, white background, 16px border radius
- Tapping card expands to detail view (slide up modal or push navigation)

### Friend Detail Screen

- Friend photo wide banner crop at top
- Name large, Pokédex # small below it
- Type badge(s) row
- Pokédex description in italic, readable, muted
- Stat section: 6 bars, each labeled and filled to value
- Moves: 2×2 grid of move cards
  - Move name bold
  - Type badge small
  - Category (Physical/Special/Status)
  - Power value
  - Short description on tap

### Battle Screen

```
[ Opponent name + HP bar ]
[ Opponent's friend photo — circular ]

[ arena / field area ]

[ Battle log — last 3 lines visible ]

[ Your friend photo — circular ]
[ Your name + HP bar ]

[ 2×2 move grid ]
[ Timer countdown ]
```

- Dark navy background overall
- HP bars: green > 50%, yellow 25–50%, red < 25%
- Move buttons: background tinted to move's type color, darkened
- Active player's moves are fully opaque; waiting player's are dimmed with "Waiting..." overlay
- Battle log text: monospace-ish, small, left-aligned, newest at bottom

---

## Interaction Principles

- Every tap has an immediate visual response (scale, color, haptic via `navigator.vibrate`)
- No jarring cuts between screens — use slide or fade transitions (Framer Motion)
- Camera screen has no UI clutter when idle
- Loading states always use the Pokéball spinner — never a browser default loader
- Errors appear as top toast, auto-dismiss 3s, never block the UI
- Disabled buttons still respond to tap with a subtle shake + haptic

---

## What Not To Do

- No white cards with colored borders
- No gradients on flat UI surfaces (gradients only on the environment background)
- No default blue (`#007AFF` or `#3B82F6`) anywhere
- No emoji as icons
- No friend photo displayed as a rectangle — always circular or soft-cutout
- No generic spinner — always Pokéball
- No screen that looks like it came out of a Tailwind UI template unchanged
