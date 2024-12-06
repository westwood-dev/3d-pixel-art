export function easeInOutCubic(x: number) {
  return x ** 2 * 3 - x ** 3 * 2;
}

export function clamp(x: number, min: number, max: number) {
  return Math.min(max, Math.max(min, x));
}

export function sawtooth(x: number, radius = 1, height = 1) {
  x = Math.abs(x) / radius;
  let rising = x % 2;
  let falling = Math.max(0, rising * 2 - 2);
  return (rising - falling) * height;
}

export function linearStep(x: number, edge0: number, edge1: number) {
  let w = edge1 - edge0;
  let m = 1 / w; // slope with a rise of 1
  let y0 = -m * edge0;
  return clamp(y0 + m * x, 0, 1);
}

export function stopGo(x: number, downtime: number, period: number) {
  let cycle = (x / period) | 0;
  let tween = x - cycle * period;
  let linStep = linearStep(tween, downtime, period);
  return cycle + linStep;
}

export function stopGoEased(x: number, downtime: number, period: number) {
  let cycle = (x / period) | 0;
  let tween = x - cycle * period;
  let linStep = easeInOutCubic(linearStep(tween, downtime, period));
  return cycle + linStep;
}
