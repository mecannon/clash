# Typeclash art direction: "Gen 5 spirit, our own world"

The target is the feeling of Pokémon Black/White and Black 2/White 2, not their assets. Everything stays original. Never copy Pokémon designs, logos, UI layouts pixel-for-pixel, or names.

## What makes Gen 5 distinctive (and what we chase)
1. **2D sprites in a 3D world.** Pixel-art characters and creatures are camera-facing cards standing in a world with real depth: perspective, buildings with volume, and a camera that moves dramatically. It swoops into battles, pulls back on bridges, and tilts for big moments.
2. **Always alive.** Sprites never freeze. Idle breathing or bobbing, animated water, swaying grass, drifting particles, flickering lamps.
3. **Strong silhouettes and confident outlines.** Outlines are 1px, dark, and hue-tinted rather than flat black. Colour ramps have 3–5 shades with **hue shifting**: shadows lean cool (blue/purple), highlights lean warm (yellow/cream). Minimal dithering and no noisy pillow shading.
4. **Vibrant, punchy battle effects.** Layered effects: a bright white core, a type-coloured mid layer and a dark rim. Use additive glows, short screen flashes, hit-stop, speed lines, shockwave rings, and camera kick on big hits. Every type gets a distinct effect language:
   - fire: embers and heat shimmer
   - water: droplets and arcs
   - grass: leaves and petals
   - ice: shards and sparkle
   - dark: violet-black smoke and crescents
   - steel: white sparks
   - fighting: impact stars
   - bug: chitin flecks
   - normal: white streaks
   - and so on for the rest
5. **Dramatic environments.** Clear value structure (dark frames, bright focal paths), varied heights, atmospheric depth (distance haze or fog, light colour grading per area), and polished tile edges with no hard seams or random noise.
6. **Clean, modern UI with attitude.** BW-era HUDs are sleek, high-contrast panels with angled or slanted edges, bold accent strips, and crisp readable type on light panels with thick dark borders. HP bars are green → yellow → red with a darker trough. Menus slide in with snappy easing.

## Palette anchors (keep cohesive)
- Grass ramp (hue-shifted): `#1f4a2c` `#2f6e34` `#4f9a3e` `#7cc457` `#b8e27a`
- Dirt/path ramp: `#5a3a22` `#8a5e36` `#c49a5c` `#e6c98c` `#f6e6b8`
- Water ramp: `#1a3a78` `#2a5cb8` `#3f86e0` `#7cc0f4` `#d8f4ff`
- Stone/cobble ramp: `#2e2c3a` `#55546a` `#82839a` `#b2b4c6` `#e2e4ee`
- UI: panel white `#f8f8f4`, ink `#1c1c28`, accent per context (player `#e8502a`, foe `#2a6ee8`), gold `#f8c838`.
- Outlines: the darkest ramp colour of that material (for example grass objects outline in `#14301e`), never pure `#000`.

## Pixel rules
- Integer pixel art only. Textures use NearestFilter. No blurry scaling of sprites.
- A light source from the top-left everywhere (matches the existing `part()` shading).
- Objects sit on the ground: every standing object gets a soft contact shadow.
- Keep the established scale: tiles are 16px, humans 16x24, creatures 32x32 (rendered at 0.5–1x depending on the view).
