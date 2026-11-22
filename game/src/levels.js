// Level layouts for The Star Sapphire Caper.
// One level = one museum wing the thief crosses. Walls are solid rectangles;
// loot is grabbed with E; the vault door is lockpicked with 3; the exit is
// the getaway door. Coordinates are canvas pixels (1280 x 720, HUD at top).

export const TILE = {
  floorA: '#23233a',
  floorB: '#1e1e31',
  carpet: '#3a2333',
};

function wall(x, y, w, h, opts = {}) {
  return { x, y, w, h, ...opts };
}

function loot(x, y, value, kind, label) {
  return { x, y, value, kind, label, taken: false };
}

function guard(waypoints, speed = 62, opts = {}) {
  return { waypoints, speed, ...opts };
}

function camera(x, y, baseAngle, sweep, range = 250, speed = 0.55) {
  return { x, y, baseAngle, sweep, range, speed };
}

// Border walls every level shares (top wall sits under the HUD strip).
export function borderWalls() {
  return [
    wall(0, 64, 1280, 10),
    wall(0, 710, 1280, 10),
    wall(0, 64, 10, 656),
    wall(1270, 64, 10, 656),
  ];
}

export const LEVELS = [
  {
    id: 1,
    name: 'The Grand Gallery',
    subtitle: 'Opening night. Grab $1,000 of loot, then slip out the east door.',
    target: 1000,
    detectRate: 1.0,
    playerStart: { x: 70, y: 650 },
    exit: { x: 1150, y: 640, w: 100, h: 56, label: 'GETAWAY VAN' },
    vault: null,
    walls: [
      ...borderWalls(),
      wall(280, 190, 100, 64, { kind: 'plinth' }),
      wall(700, 170, 100, 64, { kind: 'plinth' }),
      wall(470, 400, 140, 80, { kind: 'statue' }),
      wall(170, 470, 90, 90, { kind: 'plinth' }),
      wall(950, 430, 100, 64, { kind: 'plinth' }),
      wall(1050, 180, 80, 150, { kind: 'plinth' }),
      wall(340, 560, 220, 26, { kind: 'bench' }),
      wall(820, 560, 220, 26, { kind: 'bench' }),
    ],
    loot: [
      loot(330, 150, 300, 'vase', 'Gold Vase'),
      loot(750, 140, 400, 'idol', 'Jade Idol'),
      loot(640, 560, 350, 'pearls', 'Pearl Necklace'),
      loot(1150, 600, 500, 'painting', 'Moonlit Painting'),
      loot(120, 300, 250, 'coin', 'Coin Hoard'),
    ],
    guards: [
      guard([{ x: 220, y: 350 }, { x: 1020, y: 350 }], 66),
      guard([{ x: 640, y: 120 }, { x: 640, y: 640 }], 58),
    ],
    cameras: [
      camera(640, 76, Math.PI / 2, 0.9, 260, 0.5),
    ],
  },
  {
    id: 2,
    name: 'The Vault Corridor',
    subtitle: 'The Star Sapphire sleeps behind a locked vault door. Pick it (3), grab it, run.',
    target: 1200,
    detectRate: 1.15,
    playerStart: { x: 70, y: 650 },
    exit: { x: 1150, y: 640, w: 100, h: 56, label: 'GETAWAY VAN' },
    vault: { x: 880, y: 74, w: 380, h: 200, label: 'STAR SAPPHIRE VAULT' },
    walls: [
      ...borderWalls(),
      // Vault room: solid walls with one locked door gap on its south side.
      wall(880, 74, 380, 10),
      wall(880, 74, 10, 200),
      wall(1250, 74, 10, 200),
      wall(880, 264, 150, 10),
      wall(1130, 264, 130, 10),
      wall(1030, 264, 100, 10, { kind: 'door', locked: true, doorId: 'vault' }),
      // Corridor cover.
      wall(200, 180, 90, 90, { kind: 'plinth' }),
      wall(500, 150, 120, 60, { kind: 'plinth' }),
      wall(200, 470, 90, 90, { kind: 'plinth' }),
      wall(520, 430, 140, 80, { kind: 'statue' }),
      wall(760, 470, 100, 60, { kind: 'plinth' }),
      wall(980, 380, 90, 90, { kind: 'plinth' }),
    ],
    loot: [
      loot(245, 150, 300, 'vase', 'Gold Vase'),
      loot(560, 120, 350, 'idol', 'Jade Idol'),
      loot(245, 440, 300, 'coin', 'Coin Hoard'),
      loot(590, 400, 400, 'pearls', 'Pearl Necklace'),
      loot(1025, 350, 250, 'coin', 'Coin Hoard'),
      loot(1070, 170, 2500, 'sapphire', 'Star Sapphire'),
    ],
    guards: [
      guard([{ x: 180, y: 330 }, { x: 820, y: 330 }], 70),
      guard([{ x: 420, y: 120 }, { x: 420, y: 640 }], 62),
      guard([{ x: 900, y: 600 }, { x: 1150, y: 600 }], 74),
    ],
    cameras: [
      camera(320, 76, Math.PI / 2, 0.8, 250, 0.55),
      camera(1030, 76, Math.PI / 2, 0.7, 240, 0.7),
    ],
  },
  {
    id: 3,
    name: "The Collector's Wing",
    subtitle: 'The richest wing — and the most watched. Grab $1,500 and vanish.',
    target: 1500,
    detectRate: 1.4,
    playerStart: { x: 70, y: 650 },
    exit: { x: 1150, y: 640, w: 100, h: 56, label: 'GETAWAY VAN' },
    vault: null,
    walls: [
      ...borderWalls(),
      wall(180, 150, 100, 70, { kind: 'plinth' }),
      wall(420, 130, 90, 150, { kind: 'plinth' }),
      wall(700, 150, 110, 70, { kind: 'plinth' }),
      wall(980, 140, 90, 150, { kind: 'plinth' }),
      wall(300, 360, 150, 80, { kind: 'statue' }),
      wall(700, 380, 150, 80, { kind: 'statue' }),
      wall(1050, 400, 100, 70, { kind: 'plinth' }),
      wall(180, 540, 200, 26, { kind: 'bench' }),
      wall(880, 540, 200, 26, { kind: 'bench' }),
      wall(560, 540, 120, 26, { kind: 'bench' }),
    ],
    loot: [
      loot(230, 120, 350, 'vase', 'Gold Vase'),
      loot(465, 110, 400, 'idol', 'Jade Idol'),
      loot(755, 120, 450, 'pearls', 'Pearl Necklace'),
      loot(1025, 110, 500, 'painting', 'Moonlit Painting'),
      loot(375, 330, 300, 'coin', 'Coin Hoard'),
      loot(775, 350, 300, 'coin', 'Coin Hoard'),
      loot(1100, 370, 400, 'vase', 'Gold Vase'),
      loot(120, 620, 250, 'coin', 'Coin Hoard'),
    ],
    guards: [
      guard([{ x: 200, y: 300 }, { x: 1080, y: 300 }], 78),
      guard([{ x: 640, y: 120 }, { x: 640, y: 640 }], 66),
      guard([{ x: 120, y: 480 }, { x: 1160, y: 480 }], 72),
    ],
    cameras: [
      camera(320, 76, Math.PI / 2, 0.9, 260, 0.6),
      camera(960, 76, Math.PI / 2, 0.9, 260, 0.6),
      camera(640, 706, -Math.PI / 2, 0.8, 240, 0.7),
    ],
  },
];
