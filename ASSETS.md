# ASSETS

These are the assets Claude cannot generate in code. Source them and drop into `/public/assets/`. Update the path column when ready. Claude will build coded fallbacks for everything until real assets arrive.

---

## Critical — App Won't Look Real Without These

| Asset | Description | Format | Status | Path |
|---|---|---|---|---|
| Environment background | Painterly grassy field + sky, like Pokémon GO encounter screen. NOT a photo — illustrated/stylized. | PNG or JPG, 1080×1920 | ⬜ needed | — |
| Pokéball sprite | Classic red/white Pokéball, clean, no background | PNG, 256×256 | ⬜ needed | — |
| Great Ball sprite | Blue Pokéball variant (shown in screenshot) | PNG, 256×256 | ⬜ optional | — |
| App icon | Pokéball or Frienddex logo | PNG, 512×512 | ⬜ needed | — |
| Pokéball throw animation | Lottie: throw arc → wobble x3 → success snap OR fail burst | Lottie JSON | ⬜ needed | — |
| Star burst / catch success | Lottie: gold stars radiating outward | Lottie JSON | ⬜ needed | — |
| Ball crack / fail | Lottie: Pokéball cracking and bursting open | Lottie JSON | ⬜ optional | — |

---

## Audio

| Asset | Description | Format | Status | Path |
|---|---|---|---|---|
| Catch success jingle | Short 1-2s sound when ball locks | MP3 | ⬜ needed | — |
| Catch fail sound | Ball bursting, "escaped" | MP3 | ⬜ optional | — |
| Ball throw whoosh | Brief whoosh on throw | MP3 | ⬜ optional | — |
| Battle music loop | Loopable background for battle screen | MP3 | ⬜ optional | — |
| KO sound | Dramatic short sound | MP3 | ⬜ optional | — |

---

## Where To Get These

**Environment background:**
- Search "pokemon go encounter background" on Google Images for reference
- Commission on Fiverr: "Pokémon GO style environment background illustration" (~$30–60)
- Or use a free illustrated nature scene from [freepik.com](https://freepik.com) and adjust colors to match

**Pokéball sprites:**
- High-res Pokéball PNGs are widely available via Pokémon fan asset sites (Spriters Resource, etc.)
- Use at your own risk re: Nintendo IP — for a hackathon/demo this is fine

**Lottie animations:**
- [lottiefiles.com](https://lottiefiles.com) — search "pokeball", "star burst", "sparkle"
- Pokéball wobble/throw: may need custom — commission on Fiverr (~$50)
- Star burst: many free options on LottieFiles

**Audio:**
- [freesound.org](https://freesound.org) — search "jingle", "sparkle", "whoosh"
- Actual Pokémon GO sounds are extractable from the APK but are Nintendo IP

---

## Coded Fallbacks (what Claude builds until real assets arrive)

| Asset | Fallback |
|---|---|
| Environment background | CSS gradient: sky blue top → grass green bottom, with a CSS tree silhouette layer |
| Pokéball sprite | SVG drawn in code — red top half, white bottom, black band, white center circle |
| Throw animation | `framer-motion` physics arc — no Lottie needed |
| Star burst | CSS keyframe particle animation |
| Ball crack | CSS shake + opacity fade |
| Audio | Silent — Web Audio API hooks ready for when files are dropped in |

When you drop real assets in, update the paths in this file and Claude can swap the fallbacks.

---

## Ground Shadow Under Friend Photo

The catch screen needs a subtle elliptical shadow under the friend photo (like the screenshot). This is a pure CSS/SVG effect — no asset needed. Claude handles this in code.

## Targeting Ring

The pulsing targeting circle on the ground beneath the friend (green → yellow → red pulse) is a CSS animation. No asset needed. Claude handles this.
