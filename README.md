# best-heist-game-20261122-0559

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Krwanz/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Krwanz/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**The Star Sapphire Caper** — a midnight museum heist in the browser. Slip past patrolling guards and sweeping security cameras, lift the loot, pick the vault, and vanish in the getaway van. Three wings, three ways through each room, tools that cost loot, and an alarm meter that decides whether the night ends in champagne or handcuffs.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network — plain static files under `game/`.

## How to play

- **WASD / arrow keys** — move · **Shift** — sneak (harder to spot, slower)
- **Mouse click** — throw a noise-maker ($20) to pull guards away
- **1** — noise-maker · **2** — camera loop, freezes cameras 8s ($30) · **3** — lockpick (hold still at a locked vault door)
- **E** — grab loot · **R** — retry wing · **P** — pause · **M** — mute

Grab the target loot in each wing, then reach the green **GETAWAY** door. If the alarm maxes out, the guards hunt you — break line of sight to cool it down. The Star Sapphire itself waits behind a locked vault door in the second wing.

## Layout

- `game/index.html` — the page; loads the game as ES modules
- `game/src/main.js` — game loop, input, alarm, screens, screenshot staging
- `game/src/levels.js` — the three museum wings (walls, loot, patrols, cameras)
- `game/src/guards.js` — guard patrols, vision cones, suspicion, chase
- `game/src/cameras.js` — sweeping security cameras and camera loops
- `game/src/tools.js` — the thief's tools and their costs
- `game/src/audio.js` — procedural WebAudio effects (no audio files)
- `game/src/render.js` — all drawing: floor, cones, guards, HUD, screens
- `main.ts` — hands `game/` and `screenshots/` in with a dossier (`MAKEFUN_OUTPUT_DIR=out node main.ts`)
- `screenshots/` — real renders of the game's own code (cover first)

---

<sub>Entered on [make.fun](https://make.fun/?ref=a15ed58m&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
