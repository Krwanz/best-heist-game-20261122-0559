// Security cameras: fixed mounts that sweep their cone back and forth.
// A camera that spots the thief raises the alarm; a camera loop (tool)
// freezes the sweep for a few seconds.

import { inVisionCone, CONE_HALF_ANGLE } from './guards.js';

export { CONE_HALF_ANGLE };

export class Camera {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.baseAngle = def.baseAngle;
    this.sweep = def.sweep;
    this.range = def.range;
    this.speed = def.speed;
    this.phase = Math.random() * Math.PI * 2;
    this.angle = def.baseAngle;
    this.loopedUntil = 0; // game time until which the camera is frozen
    this.spotted = false;
  }

  get looped() {
    return this.loopedUntil > 0;
  }

  update(dt, now, player, walls) {
    if (this.loopedUntil > 0) {
      if (now >= this.loopedUntil) this.loopedUntil = 0;
      this.spotted = false;
      return false;
    }
    this.phase += dt * this.speed;
    this.angle = this.baseAngle + Math.sin(this.phase) * this.sweep;
    const range = player.sneaking ? this.range * 0.6 : this.range;
    const seen = inVisionCone(this.x, this.y, this.angle, range, player.x, player.y, walls);
    this.spotted = seen.seen;
    return seen.seen;
  }

  loop(seconds, now) {
    this.loopedUntil = now + seconds;
  }
}
