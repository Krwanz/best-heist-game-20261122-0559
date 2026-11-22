// All drawing: the museum floor, vision cones, guards, cameras, loot, the
// thief, the HUD (alarm meter, loot, tools, objective) and the screens.
// Style: a midnight museum — deep blue floor, warm carpet runner, gold loot,
// amber guard cones, red camera cones. Safe cover, danger and loot are
// readable at a glance.

import { CONE_HALF_ANGLE } from './guards.js';

const W = 1280;
const H = 720;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawFloor(ctx, level) {
  ctx.fillStyle = '#1b1b2e';
  ctx.fillRect(0, 0, W, H);
  // Checkerboard marble tiles.
  const s = 80;
  for (let y = 64; y < H; y += s) {
    for (let x = 0; x < W; x += s) {
      ctx.fillStyle = ((x / s + y / s) % 2 === 0) ? '#232340' : '#1e1e36';
      ctx.fillRect(x, y, s, s);
    }
  }
  // Carpet runner down the middle of each wing.
  ctx.fillStyle = 'rgba(122, 46, 72, 0.55)';
  ctx.fillRect(0, 330, W, 60);
  ctx.strokeStyle = 'rgba(212, 175, 105, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 330, W, 60);
  // Vault room floor, when the level has one.
  if (level.vault) {
    ctx.fillStyle = '#2c2438';
    ctx.fillRect(level.vault.x, level.vault.y, level.vault.w, level.vault.h);
  }
}

export function drawCone(ctx, x, y, angle, range, color) {
  const grad = ctx.createRadialGradient(x, y, 10, x, y, range);
  grad.addColorStop(0, color.replace('A', '0.42'));
  grad.addColorStop(1, color.replace('A', '0.02'));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - CONE_HALF_ANGLE, angle + CONE_HALF_ANGLE);
  ctx.closePath();
  ctx.fill();
}

export function drawWalls(ctx, walls, vaultUnlocked) {
  for (const w of walls) {
    if (w.kind === 'door') {
      if (vaultUnlocked) continue; // picked open: the doorway is clear
      ctx.fillStyle = '#5a4a2f';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = '#d4af69';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔒 VAULT — LOCKPICK (3)', w.x + w.w / 2, w.y - 6);
      ctx.fillStyle = '#3a2f1c';
      ctx.fillRect(w.x + w.w / 2 - 4, w.y + 1, 8, 8);
      continue;
    }
    if (w.kind === 'statue') {
      ctx.fillStyle = '#3d3d5c';
      roundRect(ctx, w.x, w.y, w.w, w.h, 8);
      ctx.fill();
      ctx.fillStyle = '#c9b18a';
      ctx.beginPath();
      ctx.arc(w.x + w.w / 2, w.y + w.h / 2, Math.min(w.w, w.h) * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8f7d5a';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STATUE', w.x + w.w / 2, w.y + w.h - 6);
    } else if (w.kind === 'plinth') {
      ctx.fillStyle = '#45455f';
      roundRect(ctx, w.x, w.y, w.w, w.h, 6);
      ctx.fill();
      ctx.fillStyle = '#5d5d7d';
      ctx.fillRect(w.x + 6, w.y + 6, w.w - 12, w.h - 12);
      ctx.fillStyle = '#d4af69';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EXHIBIT', w.x + w.w / 2, w.y + w.h / 2 + 4);
    } else if (w.kind === 'bench') {
      ctx.fillStyle = '#4a2e35';
      roundRect(ctx, w.x, w.y, w.w, w.h, 6);
      ctx.fill();
    } else {
      ctx.fillStyle = '#0e0e1a';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = '#2e2e4a';
      ctx.fillRect(w.x, w.y, w.w, 3);
    }
  }
}

const LOOT_COLORS = {
  vase: '#e8b64c',
  idol: '#5ec98a',
  pearls: '#f2e6ff',
  painting: '#e07a5f',
  coin: '#ffd94d',
  sapphire: '#4dc3ff',
};

export function drawLoot(ctx, loot, now) {
  for (const item of loot) {
    if (item.taken) continue;
    const bob = Math.sin(now * 3 + item.x) * 3;
    const pulse = 0.5 + 0.5 * Math.sin(now * 4 + item.y);
    // Glow ring so loot is obvious at a glance.
    ctx.strokeStyle = `rgba(255, 217, 77, ${0.25 + 0.35 * pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(item.x, item.y + bob, 18 + pulse * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = LOOT_COLORS[item.kind] || '#ffd94d';
    if (item.kind === 'sapphire') {
      ctx.save();
      ctx.translate(item.x, item.y + bob);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-11, -11, 22, 22);
      ctx.restore();
      ctx.fillStyle = '#bfe9ff';
      ctx.beginPath();
      ctx.arc(item.x - 4, item.y + bob - 4, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.kind === 'painting') {
      ctx.fillRect(item.x - 14, item.y + bob - 10, 28, 20);
      ctx.fillStyle = '#7a4a3a';
      ctx.fillRect(item.x - 10, item.y + bob - 6, 20, 12);
    } else {
      ctx.beginPath();
      ctx.arc(item.x, item.y + bob, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(item.x, item.y + bob, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`$${item.value}`, item.x, item.y + bob - 22);
  }
}

export function drawCones(ctx, guards, cameras) {
  for (const g of guards) {
    drawCone(ctx, g.x, g.y, g.angle, g.state === 'chase' ? 260 : 230, 'rgba(255, 176, 32, A)');
  }
  for (const c of cameras) {
    if (!c.looped) drawCone(ctx, c.x, c.y, c.angle, c.range, 'rgba(255, 60, 60, A)');
  }
}

export function drawGuards(ctx, guards) {
  for (const g of guards) {
    // Body: navy uniform, brass badge, cap.
    ctx.fillStyle = '#1d3a6e';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d4af69';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f2242';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 20, g.y + Math.sin(g.angle) * 20);
    ctx.stroke();
    // Suspicion "?" / "!" above the head.
    if (g.suspicion > 25) {
      const mark = g.state === 'chase' ? '!' : '?';
      ctx.fillStyle = g.state === 'chase' ? '#ff4d4d' : '#ffd94d';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(mark, g.x, g.y - 22);
    }
    // Suspicion arc.
    if (g.suspicion > 5 && g.suspicion < 100) {
      ctx.strokeStyle = g.suspicion > 60 ? '#ff4d4d' : '#ffd94d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 18, -Math.PI / 2, -Math.PI / 2 + (g.suspicion / 100) * Math.PI * 2);
      ctx.stroke();
    }
  }
}

export function drawCameras(ctx, cameras, now) {
  for (const c of cameras) {
    // Mount + lens.
    ctx.fillStyle = '#2a2a3d';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.looped ? '#888' : (c.spotted ? '#ff2020' : '#ff5a5a');
    ctx.beginPath();
    ctx.arc(c.x + Math.cos(c.angle) * 8, c.y + Math.sin(c.angle) * 8, 4, 0, Math.PI * 2);
    ctx.fill();
    // Label below the mount when the camera hugs the top wall, else above.
    const labelY = c.y < 140 ? c.y + 26 : c.y - 16;
    if (c.looped) {
      ctx.fillStyle = '#cfd2ff';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LOOPED', c.x, labelY);
    } else if (c.spotted) {
      const blink = Math.sin(now * 10) > 0;
      if (blink) {
        ctx.fillStyle = '#ff2020';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('REC ●', c.x, labelY);
      }
    }
  }
}

export function drawPlayer(ctx, player, now) {
  const { x, y, angle } = player;
  // Soft shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cloak body.
  ctx.fillStyle = '#23232e';
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d4af69';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.stroke();
  // Domino mask.
  ctx.fillStyle = '#101018';
  ctx.fillRect(x - 9, y - 4, 18, 6);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x - 4, y - 1, 1.6, 0, Math.PI * 2);
  ctx.arc(x + 4, y - 1, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // Facing tick + sneak indicator.
  ctx.strokeStyle = '#e8e8f2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle) * 18, y + Math.sin(angle) * 18);
  ctx.stroke();
  if (player.sneaking) {
    ctx.fillStyle = '#9db4ff';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAK', x, y - 20);
  }
  if (player.picking) {
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PICKING…', x, y - 20);
  }
}

export function drawExit(ctx, exit, lootValue, target, now) {
  const ready = lootValue >= target;
  const pulse = 0.5 + 0.5 * Math.sin(now * 4);
  ctx.fillStyle = ready ? `rgba(94, 201, 138, ${0.5 + 0.3 * pulse})` : 'rgba(94, 201, 138, 0.25)';
  roundRect(ctx, exit.x, exit.y, exit.w, exit.h, 8);
  ctx.fill();
  ctx.strokeStyle = ready ? '#5ec98a' : '#3a6e4f';
  ctx.lineWidth = 2;
  roundRect(ctx, exit.x, exit.y, exit.w, exit.h, 8);
  ctx.stroke();
  ctx.fillStyle = '#eafff1';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(ready ? '◀ ESCAPE!' : 'GETAWAY', exit.x + exit.w / 2, exit.y + 22);
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillText(ready ? 'GO!' : `$${target} needed`, exit.x + exit.w / 2, exit.y + 38);
}

export function drawNoiseMakers(ctx, makers) {
  for (const m of makers) {
    const r = 8 + m.age * 90;
    ctx.strokeStyle = `rgba(255, 217, 77, ${Math.max(0, 0.8 - m.age)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(m.x, m.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- HUD -------------------------------------------------------------------

export function drawHUD(ctx, state) {
  const { level, lootValue, alarm, levelIndex, tools, message, messageAge, timeLeft } = state;
  ctx.fillStyle = 'rgba(8, 8, 18, 0.92)';
  ctx.fillRect(0, 0, W, 56);
  ctx.fillStyle = '#d4af69';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`🌙 ${level.name}`, 14, 24);
  ctx.fillStyle = '#9a9ab2';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(level.subtitle, 14, 42);

  // Loot counter.
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`💰 $${lootValue} / $${level.target}`, 560, 24);
  ctx.fillStyle = '#9a9ab2';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(`Wing ${levelIndex + 1} of 3`, 560, 42);

  // Alarm meter.
  const ax = 600;
  const aw = 300;
  ctx.fillStyle = '#2a2a3d';
  roundRect(ctx, ax, 12, aw, 18, 9);
  ctx.fill();
  const frac = alarm / 100;
  const alarmColor = frac < 0.4 ? '#5ec98a' : frac < 0.75 ? '#e8b64c' : '#ff4d4d';
  if (frac > 0.01) {
    ctx.fillStyle = alarmColor;
    roundRect(ctx, ax, 12, aw * frac, 18, 9);
    ctx.fill();
  }
  ctx.strokeStyle = '#55556e';
  ctx.lineWidth = 1;
  roundRect(ctx, ax, 12, aw, 18, 9);
  ctx.stroke();
  ctx.fillStyle = alarm > 75 ? '#ff6b6b' : '#e8e8f2';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(alarm > 75 ? '🚨 ALARM!' : 'ALARM', ax, 44);

  // Tools (right block) — short labels so they never reach the timer.
  let tx = 930;
  ctx.textAlign = 'left';
  for (const t of tools) {
    const afford = lootValue >= t.cost;
    ctx.fillStyle = afford ? '#e8e8f2' : '#66667c';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(`[${t.key}] ${t.name} $${t.cost}`, tx, 24);
    tx += 106;
  }
  ctx.fillStyle = '#9a9ab2';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('Shift sneak · E grab · R retry · P pause · M mute', 930, 42);

  // Timer sits under the alarm bar, clear of the tools block.
  ctx.fillStyle = '#9a9ab2';
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`⏱ ${Math.max(0, Math.ceil(timeLeft))}s`, 900, 44);

  // Transient message banner.
  if (message && messageAge < 3.2) {
    ctx.fillStyle = 'rgba(8, 8, 18, 0.85)';
    const mw = ctx.measureText(message).width + 36;
    roundRect(ctx, (W - mw) / 2, 66, mw, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(message, W / 2, 86);
  }
}

// --- screens -----------------------------------------------------------------

export function drawTitle(ctx, now) {
  ctx.fillStyle = 'rgba(8, 8, 20, 0.88)';
  ctx.fillRect(0, 0, W, H);
  const pulse = 0.5 + 0.5 * Math.sin(now * 2);
  ctx.fillStyle = '#d4af69';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE STAR SAPPHIRE CAPER', W / 2, 170);
  ctx.fillStyle = '#e8e8f2';
  ctx.font = '20px Georgia, serif';
  ctx.fillText('A midnight museum heist in three wings', W / 2, 210);
  ctx.fillStyle = '#9a9ab2';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Slip past the guards. Dodge the cameras. Lift the loot. Vanish in the van.', W / 2, 250);

  const lines = [
    'WASD / Arrow keys — move        Shift — sneak (harder to spot)',
    'Mouse click — throw a noise-maker ($20)        1 noise-maker · 2 camera loop ($30) · 3 lockpick',
    'E — grab loot        R — retry wing        P — pause        M — mute',
    '',
    'Grab the target loot in each wing, then reach the green GETAWAY door.',
    'If the alarm maxes out, the guards hunt you — break line of sight to cool it down.',
  ];
  ctx.font = '15px system-ui, sans-serif';
  lines.forEach((line, i) => {
    ctx.fillStyle = i === 3 ? '#000' : '#c9c9dc';
    ctx.fillText(line, W / 2, 310 + i * 28);
  });

  ctx.fillStyle = `rgba(255, 217, 77, ${0.6 + 0.4 * pulse})`;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('▶  CLICK OR PRESS ENTER — START THE HEIST', W / 2, 560);
  ctx.fillStyle = '#66667c';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('An original game — its own art, sounds and names. No network, no tracking.', W / 2, 610);
}

export function drawCaught(ctx, reason) {
  ctx.fillStyle = 'rgba(20, 4, 8, 0.82)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ff6b6b';
  ctx.font = 'bold 48px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('CAUGHT!', W / 2, 300);
  ctx.fillStyle = '#e8e8f2';
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText(reason, W / 2, 350);
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('Press R to retry the wing — the loot is still there.', W / 2, 420);
}

export function drawLevelComplete(ctx, level, lootValue, bonus) {
  ctx.fillStyle = 'rgba(6, 18, 10, 0.85)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#5ec98a';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('CLEAN GETAWAY!', W / 2, 300);
  ctx.fillStyle = '#e8e8f2';
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText(`${level.name} — loot $${lootValue} + getaway bonus $${bonus}`, W / 2, 350);
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('Press ENTER for the next wing', W / 2, 420);
}

export function drawWin(ctx, totalScore) {
  ctx.fillStyle = 'rgba(8, 8, 20, 0.9)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 50px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE SAPPHIRE IS YOURS', W / 2, 290);
  ctx.fillStyle = '#e8e8f2';
  ctx.font = '19px system-ui, sans-serif';
  ctx.fillText('Three wings, no alarms that stuck, one very nervous museum.', W / 2, 340);
  ctx.fillStyle = '#5ec98a';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(`Total take: $${totalScore}`, W / 2, 400);
  ctx.fillStyle = '#9a9ab2';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Press ENTER to run it again', W / 2, 460);
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(8, 8, 20, 0.75)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e8e8f2';
  ctx.font = 'bold 40px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', W / 2, 360);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('Press P to resume', W / 2, 400);
}
