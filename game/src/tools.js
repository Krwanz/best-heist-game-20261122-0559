// The thief's tools. Every tool costs loot — the crew only pays for what
// works — so the player trades score for safety.
//
//   1  Noise-maker — thrown at the mouse; guards in earshot investigate it.
//   2  Camera loop — freezes every camera for 8 seconds.
//   3  Lockpick   — hold still beside a locked vault door to pick it open.

export const TOOLS = [
  {
    key: '1',
    name: 'Noise-maker',
    cost: 20,
    desc: 'Throw it — guards go look',
  },
  {
    key: '2',
    name: 'Camera loop',
    cost: 30,
    desc: 'Freezes cameras 8s',
  },
  {
    key: '3',
    name: 'Lockpick',
    cost: 0,
    desc: 'Hold still at a locked door',
  },
];

export class NoiseMaker {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.age = 0;
    this.rang = false;
  }

  update(dt) {
    this.age += dt;
    if (this.age > 0.15 && !this.rang) this.rang = true;
    return this.age < 1.1;
  }
}
