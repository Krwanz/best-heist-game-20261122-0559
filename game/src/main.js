// The Star Sapphire Caper — game loop, input, alarm, tools and screens.
// State machine: title -> playing -> caught | levelComplete -> playing ...
// -> win. URL ?shot=cover|gallery|vault|tools stages a mid-heist frame so
// screenshots are real renders of the game's own code.

import { LEVELS } from './levels.js';
import { Guard } from './guards.js';
import { Camera } from './cameras.js';
import { TOOLS, NoiseMaker } from './tools.js';
import { SoundBank } from './audio.js';
import * as R from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = 1280;
const H = 720;
const PLAYER_R = 13;
const WALK_SPEED = 165;
const SNEAK_SPEED = 95;
const PAR_TIME = 150; // seconds shown as a soft countdown per wing

const params = new URLSearchParams(location.search);
const shot = params.get('shot');

const sound = new SoundBank();

const game = {
  screen: 'title', // title | playing | caught | levelComplete | win | paused
  levelIndex: 0,
  level: null,
  walls: [],
  guards: [],
  cameras: [],
  loot: [],
  player: null,
  alarm: 0,
  lootValue: 0, // this wing
  totalScore: 0,
  time: 0,
  levelTime: 0,
  makers: [],
  message: '',
  messageAge: 99,
  vaultUnlocked: false,
  picking: 0, // lockpick progress 0..1
  keys: {},
  mouse: { x: 0, y: 0 },
  caughtReason: '',
  alarmTickTimer: 0,
  pauseFrom: null,
};

function loadLevel(index) {
  const def = LEVELS[index];
  game.levelIndex = index;
  game.level = def;
  game.walls = def.walls.map((w) => ({ ...w }));
  game.guards = def.guards.map((g) => new Guard(g));
  game.cameras = def.cameras.map((c) => new Camera(c));
  game.loot = def.loot.map((l) => ({ ...l, taken: false }));
  game.player = {
    x: def.playerStart.x,
    y: def.playerStart.y,
    angle: 0,
    sneaking: false,
    picking: false,
  };
  game.alarm = 0;
  game.lootValue = 0;
  game.levelTime = 0;
  game.makers = [];
  game.vaultUnlocked = false;
  game.picking = 0;
  setMessage(def.name + ' — ' + def.subtitle);
}

function setMessage(text) {
  game.message = text;
  game.messageAge = 0;
}

function startGame() {
  game.totalScore = 0;
  loadLevel(0);
  game.screen = 'playing';
  sound.ensure();
}

function nextLevel() {
  if (game.levelIndex + 1 >= LEVELS.length) {
    game.screen = 'win';
    sound.win();
    return;
  }
  loadLevel(game.levelIndex + 1);
  game.screen = 'playing';
}

function caught(reason) {
  game.screen = 'caught';
  game.caughtReason = reason;
  sound.caught();
}

// --- collision ---------------------------------------------------------------

function circleHitsWall(x, y, walls) {
  for (const w of walls) {
    if (w.kind === 'door' && game.vaultUnlocked) continue;
    if (x + PLAYER_R > w.x && x - PLAYER_R < w.x + w.w && y + PLAYER_R > w.y && y - PLAYER_R < w.y + w.h) {
      return true;
    }
  }
  return false;
}

function movePlayer(dt) {
  const p = game.player;
  let dx = 0;
  let dy = 0;
  if (game.keys['arrowup'] || game.keys['w']) dy -= 1;
  if (game.keys['arrowdown'] || game.keys['s']) dy += 1;
  if (game.keys['arrowleft'] || game.keys['a']) dx -= 1;
  if (game.keys['arrowright'] || game.keys['d']) dx += 1;
  if (dx === 0 && dy === 0) return;
  const len = Math.hypot(dx, dy);
  dx /= len;
  dy /= len;
  p.sneaking = !!game.keys['shift'];
  const speed = p.sneaking ? SNEAK_SPEED : WALK_SPEED;
  p.angle = Math.atan2(dy, dx);
  const nx = p.x + dx * speed * dt;
  const ny = p.y + dy * speed * dt;
  if (!circleHitsWall(nx, p.y, game.walls)) p.x = nx;
  if (!circleHitsWall(p.x, ny, game.walls)) p.y = ny;
  game.picking = 0;
  p.picking = false;
}

function tryPickup() {
  const item = nearestLoot();
  if (!item) return;
  item.taken = true;
  game.lootValue += item.value;
  if (item.kind === 'sapphire') {
    sound.win();
    setMessage('THE STAR SAPPHIRE! Now get to the getaway van!');
  } else {
    sound.pickup();
    setMessage(`${item.label} grabbed — $${item.value}!`);
  }
}

function nearestLoot() {
  const p = game.player;
  let best = null;
  let bestD = 34;
  for (const item of game.loot) {
    if (item.taken) continue;
    const d = Math.hypot(item.x - p.x, item.y - p.y);
    if (d < bestD) { bestD = d; best = item; }
  }
  return best;
}

function nearVaultDoor() {
  const p = game.player;
  for (const w of game.walls) {
    if (w.kind !== 'door' || game.vaultUnlocked) continue;
    const cx = Math.max(w.x, Math.min(p.x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(p.y, w.y + w.h));
    if (Math.hypot(p.x - cx, p.y - cy) < 46) return w;
  }
  return null;
}

// --- tools -------------------------------------------------------------------

function throwNoiseMaker() {
  if (game.lootValue < TOOLS[0].cost) {
    setMessage('Not enough loot for a noise-maker — grab something first!');
    return;
  }
  game.lootValue -= TOOLS[0].cost;
  const m = new NoiseMaker(game.mouse.x, game.mouse.y);
  game.makers.push(m);
  for (const g of game.guards) g.hearNoise(m.x, m.y);
  sound.noiseMaker();
  setMessage('Noise-maker thrown — the guards go to look!');
}

function loopCameras() {
  if (game.lootValue < TOOLS[1].cost) {
    setMessage('Not enough loot for a camera loop — grab something first!');
    return;
  }
  game.lootValue -= TOOLS[1].cost;
  for (const c of game.cameras) c.loop(8, game.time);
  sound.lockpick();
  setMessage('Cameras looped for 8 seconds — move now!');
}

function updateLockpick(dt) {
  const p = game.player;
  const door = nearVaultDoor();
  if (!door) { game.picking = 0; p.picking = false; return; }
  if (!game.keys['3']) { game.picking = 0; p.picking = false; return; }
  // Must stand still while picking.
  const moving = game.keys['w'] || game.keys['a'] || game.keys['s'] || game.keys['d'] ||
    game.keys['arrowup'] || game.keys['arrowdown'] || game.keys['arrowleft'] || game.keys['arrowright'];
  if (moving) { game.picking = 0; p.picking = false; return; }
  p.picking = true;
  game.picking += dt / 2.5;
  if (Math.random() < dt * 6) sound.lockpick();
  if (game.picking >= 1) {
    game.vaultUnlocked = true;
    p.picking = false;
    sound.vaultOpen();
    setMessage('Vault door picked — the Star Sapphire is inside!');
  }
}

// --- update ------------------------------------------------------------------

function update(dt) {
  game.time += dt;
  game.levelTime += dt;
  game.messageAge += dt;
  const p = game.player;

  movePlayer(dt);
  updateLockpick(dt);

  // Loot pickup happens on the E keypress itself (see the keydown handler):
  // a quick tap must never fall between two frames and be missed.

  // Noise-makers fade.
  game.makers = game.makers.filter((m) => m.update(dt));

  // Guards and cameras raise the alarm while they see the thief.
  let seenByGuard = false;
  let seenByCamera = false;
  for (const g of game.guards) {
    const seen = g.update(dt, p, game.walls, game.alarm);
    if (seen) seenByGuard = true;
    if (g.state === 'chase') seenByGuard = true;
  }
  for (const c of game.cameras) {
    if (c.update(dt, game.time, p, game.walls)) seenByCamera = true;
  }

  const rate = game.level.detectRate;
  if (seenByGuard) game.alarm = Math.min(100, game.alarm + dt * 34 * rate);
  else if (seenByCamera) game.alarm = Math.min(100, game.alarm + dt * 22 * rate);
  else game.alarm = Math.max(0, game.alarm - dt * 9);

  if (game.alarm >= 100 && game.screen === 'playing') {
    // The alarm is maxed: guards hunt. The player can still break away.
    game.alarmTickTimer += dt;
    if (game.alarmTickTimer > 0.5) {
      game.alarmTickTimer = 0;
      sound.alarmTick();
    }
  }

  // Caught: a chasing guard touches the thief.
  for (const g of game.guards) {
    if (g.state === 'chase' && Math.hypot(g.x - p.x, g.y - p.y) < 26) {
      caught('A guard grabbed you in the gallery. The crew bails you out — retry the wing.');
      return;
    }
  }
  // Caught by a camera stare at full alarm with no cover: a patrol is sent.
  if (game.alarm >= 100) {
    let anyChasing = game.guards.some((g) => g.state === 'chase');
    if (!anyChasing) {
      // Alarm maxed but nobody chasing yet: nearest guard starts the hunt.
      let best = null;
      let bestD = Infinity;
      for (const g of game.guards) {
        const d = Math.hypot(g.x - p.x, g.y - p.y);
        if (d < bestD) { bestD = d; best = g; }
      }
      if (best) {
        best.state = 'chase';
        best.suspicion = 100;
        sound.spotted();
        setMessage('SPOTTED! Break line of sight — now!');
      }
    }
  }

  // Escape: inside the exit zone with the target loot.
  const e = game.level.exit;
  if (game.lootValue >= game.level.target &&
      p.x > e.x && p.x < e.x + e.w && p.y > e.y && p.y < e.y + e.h) {
    const bonus = Math.max(0, Math.round((PAR_TIME - game.levelTime) * 2));
    game.totalScore += game.lootValue + bonus;
    game.screen = 'levelComplete';
    game.levelBonus = bonus;
    sound.win();
  }
}

// --- draw --------------------------------------------------------------------

function draw() {
  const now = game.time;
  if (game.screen === 'title') {
    R.drawFloor(ctx, game.level || LEVELS[0]);
    R.drawTitle(ctx, now);
    return;
  }
  const level = game.level;
  R.drawFloor(ctx, level);
  // Cones first, under the walls, so the walls occlude them.
  R.drawCones(ctx, game.guards, game.cameras);
  R.drawLoot(ctx, game.loot, now);
  R.drawWalls(ctx, game.walls, game.vaultUnlocked);
  if (level.vault) {
    ctx.fillStyle = '#c9b18a';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(level.vault.label, level.vault.x + level.vault.w / 2, level.vault.y + 24);
    if (game.vaultUnlocked) {
      ctx.fillStyle = '#5ec98a';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText('UNLOCKED', level.vault.x + level.vault.w / 2, level.vault.y + 42);
    }
  }
  R.drawGuards(ctx, game.guards);
  R.drawCameras(ctx, game.cameras, now);
  R.drawNoiseMakers(ctx, game.makers);
  R.drawPlayer(ctx, game.player, now);
  R.drawExit(ctx, level.exit, game.lootValue, level.target, now);
  R.drawHUD(ctx, {
    level,
    lootValue: game.lootValue,
    alarm: Math.round(game.alarm),
    levelIndex: game.levelIndex,
    tools: TOOLS,
    message: game.message,
    messageAge: game.messageAge,
    timeLeft: PAR_TIME - game.levelTime,
  });

  if (game.screen === 'caught') R.drawCaught(ctx, game.caughtReason);
  else if (game.screen === 'levelComplete') R.drawLevelComplete(ctx, level, game.lootValue, game.levelBonus || 0);
  else if (game.screen === 'win') R.drawWin(ctx, game.totalScore);
  else if (game.screen === 'paused') R.drawPaused(ctx);
}

// --- screenshot staging ------------------------------------------------------
// ?shot= stages a real mid-heist frame: the game's own code renders it.

function stageShot(kind) {
  startGame();
  if (kind === 'cover' || kind === 'vault') {
    loadLevel(1); // the vault wing: guards, cameras, loot, vault, alarm
    game.screen = 'playing';
    const p = game.player; // loadLevel replaces the player object
    p.x = 640; p.y = 560; p.angle = -Math.PI / 2;
    game.alarm = 55;
    game.lootValue = 950;
    game.guards[0].x = 420; game.guards[0].y = 330; game.guards[0].angle = Math.PI / 2;
    game.guards[1].x = 420; game.guards[1].y = 470; game.guards[1].angle = 0;
    game.guards[2].x = 980; game.guards[2].y = 600; game.guards[2].angle = Math.PI;
    game.guards[0].suspicion = 62;
    game.cameras[0].angle = Math.PI / 2 + 0.4;
    game.cameras[1].angle = Math.PI / 2 - 0.3;
    game.makers.push(new NoiseMaker(700, 420));
    setMessage('The vault is ahead — pick the lock (3)!');
  } else if (kind === 'gallery') {
    loadLevel(0);
    game.screen = 'playing';
    const p = game.player;
    p.x = 560; p.y = 300; p.angle = Math.PI / 4;
    game.alarm = 30;
    game.lootValue = 650;
    game.guards[0].x = 500; game.guards[0].y = 350; game.guards[0].angle = -Math.PI / 2;
    game.guards[1].x = 640; game.guards[1].y = 420; game.guards[1].angle = Math.PI;
    game.cameras[0].angle = Math.PI / 2 + 0.5;
    setMessage('Two guards, one camera — read the cones, then move.');
  } else if (kind === 'tools') {
    loadLevel(2);
    game.screen = 'playing';
    const p = game.player;
    p.x = 640; p.y = 560; p.angle = -Math.PI / 2;
    game.alarm = 70;
    game.lootValue = 1180;
    game.guards[0].x = 520; game.guards[0].y = 300; game.guards[0].angle = Math.PI / 2;
    game.guards[0].suspicion = 80;
    game.guards[1].x = 640; game.guards[1].y = 300; game.guards[1].angle = 0;
    game.guards[2].x = 900; game.guards[2].y = 480; game.guards[2].angle = Math.PI;
    for (const c of game.cameras) c.loop(8, game.time);
    game.makers.push(new NoiseMaker(760, 300));
    setMessage('Cameras looped — the noise-maker pulls the guards away!');
  }
  game.messageAge = 0;
}

// --- input -------------------------------------------------------------------

function keyName(e) {
  return e.key.toLowerCase();
}

window.addEventListener('keydown', (e) => {
  const k = keyName(e);
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  sound.ensure();
  if (k === 'm') {
    sound.muted = !sound.muted;
    return;
  }
  if (game.screen === 'title') {
    if (k === 'enter' || k === ' ') startGame();
    return;
  }
  if (game.screen === 'caught') {
    if (k === 'r') { loadLevel(game.levelIndex); game.screen = 'playing'; }
    return;
  }
  if (game.screen === 'levelComplete' || game.screen === 'win') {
    if (k === 'enter') {
      if (game.screen === 'win') startGame();
      else nextLevel();
    }
    return;
  }
  if (k === 'p') {
    game.screen = game.screen === 'paused' ? 'playing' : 'paused';
    return;
  }
  if (game.screen !== 'playing') return;
  game.keys[k] = true;
  if (k === 'r') { loadLevel(game.levelIndex); return; }
  if (k === '1') throwNoiseMaker();
  if (k === '2') loopCameras();
  if (k === 'e') tryPickup();
});

window.addEventListener('keyup', (e) => {
  game.keys[keyName(e)] = false;
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  game.mouse.x = ((e.clientX - rect.left) / rect.width) * W;
  game.mouse.y = ((e.clientY - rect.top) / rect.height) * H;
});

canvas.addEventListener('click', (e) => {
  sound.ensure();
  const rect = canvas.getBoundingClientRect();
  game.mouse.x = ((e.clientX - rect.left) / rect.width) * W;
  game.mouse.y = ((e.clientY - rect.top) / rect.height) * H;
  if (game.screen === 'title') { startGame(); return; }
  if (game.screen === 'levelComplete') { nextLevel(); return; }
  if (game.screen === 'win') { startGame(); return; }
  if (game.screen === 'caught') { loadLevel(game.levelIndex); game.screen = 'playing'; return; }
  if (game.screen === 'playing') throwNoiseMaker();
});

// --- loop --------------------------------------------------------------------

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (game.screen === 'playing') update(dt);
  else game.time += dt;
  draw();
  requestAnimationFrame(frame);
}

loadLevel(0);
if (shot) {
  stageShot(shot);
} else {
  game.screen = 'title';
}
requestAnimationFrame(frame);

// Expose a little debug surface for play-testing (not part of the game).
window.__heist = game;
