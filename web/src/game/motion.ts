export function expSmoothing(current: number, target: number, deltaSec: number, speed = 10): number {
  const t = 1 - Math.exp(-speed * deltaSec);
  return current + (target - current) * t;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpAgentSnapshots<T extends { x: number; y: number; bubbleTimer?: number }>(
  from: T,
  to: T,
  alpha: number,
): T {
  return {
    ...to,
    x: lerp(from.x, to.x, alpha),
    y: lerp(from.y, to.y, alpha),
    bubbleTimer: to.bubbleTimer,
  };
}
