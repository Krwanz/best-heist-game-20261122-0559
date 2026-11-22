// Guards: patrol routes, vision cones, suspicion, chase and investigation.
// A guard sees the thief only inside its cone, within range, and with a clear
// line of sight (walls block sight). Sneaking halves the range.

export const CONE_RANGE = 230;
export const CONE_HALF_ANGLE = 0.55; // ~63 degrees total

// --- geometry helpers -------------------------------------------------------

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab test: does the segment cross the rectangle?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  for (const [p, q] of [
    [-dx, x1 - r.x],
    [dx, r.x + r.w - x1],
    [-dy, y1 - r.y],
    [dy, r.y + r.h - y1],
  ]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > tMax) return false;
        if (t > tMin) tMin = t;
      } else {
        if (t < tMin) return false;
        if (t < tMax) tMax = t;
      }
    }
  }
  return true;
}

export function hasLineOfSight(x1, y1, x2, y2, walls) {
  for (const w of walls) {
    if (segmentHitsRect(x1, y1, x2, y2, w)) return false;
  }
  return true;
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Is (tx, ty) inside the vision cone of an observer at (ox, oy) facing
// `angle`, with the given range? Walls must not block the view.
export function inVisionCone(ox, oy, angle, range, tx, ty, walls) {
  const dx = tx - ox;
  const dy = ty - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return { seen: false, dist };
  if (dist < 26) return { seen: true, dist }; // too close to miss
  const toTarget = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(toTarget, angle)) > CONE_HALF_ANGLE) return { seen: false, dist };
  if (!hasLineOfSight(ox, oy, tx, ty, walls)) return { seen: false, dist };
  return { seen: true, dist };
}

// --- guard -----------------------------------------------------------------

export class Guard {
  constructor(def) {
    this.waypoints = def.waypoints;
    this.speed = def.speed;
    this.x = def.waypoints[0].x;
    this.y = def.waypoints[0].y;
    this.wpIndex = 1;
    this.angle = 0;
    this.suspicion = 0; // 0..100, per-guard; 100 = chase
    this.state = 'patrol'; // patrol | investigate | chase | return
    this.investigateTarget = null;
    this.lookTimer = 0;
    this.chaseLostTimer = 0;
    this.pauseTimer = 0;
  }

  update(dt, player, walls, alarm) {
    const sneaking = player.sneaking;
    const range = sneaking ? CONE_RANGE * 0.55 : CONE_RANGE;

    if (this.state === 'chase') {
      this.moveToward(player.x, player.y, this.speed * 1.55, dt, walls);
      this.angle = Math.atan2(player.y - this.y, player.x - this.x);
      const seen = inVisionCone(this.x, this.y, this.angle, range * 1.4, player.x, player.y, walls);
      if (!seen.seen) {
        this.chaseLostTimer += dt;
        if (this.chaseLostTimer > 3) {
          this.state = 'return';
          this.suspicion = 55;
        }
      } else {
        this.chaseLostTimer = 0;
      }
      return;
    }

    if (this.state === 'investigate' && this.investigateTarget) {
      const t = this.investigateTarget;
      const d = Math.hypot(t.x - this.x, t.y - this.y);
      if (d > 10) {
        this.moveToward(t.x, t.y, this.speed * 1.25, dt, walls);
        this.angle = Math.atan2(t.y - this.y, t.x - this.x);
      } else {
        this.lookTimer += dt;
        this.angle += dt * 1.8; // scan the room
        if (this.lookTimer > 2.2) {
          this.state = 'return';
          this.investigateTarget = null;
          this.lookTimer = 0;
        }
      }
    } else if (this.state === 'return') {
      // Walk back to the nearest waypoint, then resume the patrol.
      let best = 0;
      let bestD = Infinity;
      this.waypoints.forEach((w, i) => {
        const d = Math.hypot(w.x - this.x, w.y - this.y);
        if (d < bestD) { bestD = d; best = i; }
      });
      const target = this.waypoints[best];
      const d = Math.hypot(target.x - this.x, target.y - this.y);
      if (d > 8) {
        this.moveToward(target.x, target.y, this.speed, dt, walls);
        this.angle = Math.atan2(target.y - this.y, target.x - this.x);
      } else {
        this.wpIndex = (best + 1) % this.waypoints.length;
        this.state = 'patrol';
        this.suspicion = Math.min(this.suspicion, 30);
      }
    } else {
      // Patrol: walk the waypoints, pausing briefly at each end.
      if (this.pauseTimer > 0) {
        this.pauseTimer -= dt;
      } else {
        const target = this.waypoints[this.wpIndex];
        const d = Math.hypot(target.x - this.x, target.y - this.y);
        if (d < 8) {
          this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
          this.pauseTimer = 0.9;
        } else {
          this.moveToward(target.x, target.y, this.speed, dt, walls);
          this.angle = Math.atan2(target.y - this.y, target.x - this.x);
        }
      }
    }

    // Vision: suspicion rises while the thief is in the cone, falls otherwise.
    const seen = inVisionCone(this.x, this.y, this.angle, range, player.x, player.y, walls);
    if (seen.seen) {
      const closeness = 1 - seen.dist / range;
      this.suspicion = Math.min(100, this.suspicion + dt * (28 + 55 * closeness));
      if (this.suspicion >= 100 && this.state !== 'chase') {
        this.state = 'chase';
        this.chaseLostTimer = 0;
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - dt * 22);
    }
    return seen.seen;
  }

  hearNoise(x, y) {
    const d = Math.hypot(x - this.x, y - this.y);
    if (d < 420 && this.state !== 'chase') {
      this.state = 'investigate';
      this.investigateTarget = { x, y };
      this.lookTimer = 0;
      this.suspicion = Math.max(this.suspicion, 35);
    }
  }

  moveToward(tx, ty, speed, dt, walls) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.01) return;
    const stepX = (dx / d) * speed * dt;
    const stepY = (dy / d) * speed * dt;
    if (!this.hitsWall(this.x + stepX, this.y, walls)) this.x += stepX;
    if (!this.hitsWall(this.x, this.y + stepY, walls)) this.y += stepY;
  }

  hitsWall(x, y, walls) {
    const r = 13;
    for (const w of walls) {
      if (x + r > w.x && x - r < w.x + w.w && y + r > w.y && y - r < w.y + w.h) return true;
    }
    return false;
  }
}
