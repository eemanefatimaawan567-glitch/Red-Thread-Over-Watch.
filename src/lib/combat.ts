export type Point = { x: number; y: number };
export type Box = { x1: number; x2: number; y1: number; y2: number };

// Segment/rectangle clipping: a solid obstacle blocks both sides' bullets.
export function clearSight(a: Point, b: Point, boxes: readonly Box[]) {
  return !boxes.some(box => {
    let near = 0; let far = 1;
    for (const [start, delta, low, high] of [
      [a.x, b.x - a.x, box.x1, box.x2],
      [a.y, b.y - a.y, box.y1, box.y2],
    ]) {
      if (Math.abs(delta) < 0.000001) {
        if (start <= low || start >= high) return false;
      } else {
        const first = (low - start) / delta; const last = (high - start) / delta;
        near = Math.max(near, Math.min(first, last));
        far = Math.min(far, Math.max(first, last));
        if (near >= far) return false;
      }
    }
    return far > 0.001 && near < 0.999;
  });
}

export function quietAccess(fragments: boolean[], enemies: number[], crouched: boolean, exposure: number) {
  return fragments.every(Boolean) && (enemies.every(hp => hp <= 0) || (crouched && exposure < 35));
}
