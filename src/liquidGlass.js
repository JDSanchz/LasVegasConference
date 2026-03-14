const SURFACE_FUNCTIONS = {
  "convex-circle": (x) => 1 - (1 - x) ** 2,
  "convex-squircle": (x) => Math.pow(1 - (1 - x) ** 4, 1 / 4),
  concave: (x) => 1 - Math.pow(1 - (1 - x) ** 4, 1 / 4),
  lip: (x) => {
    const convex = Math.pow(1 - (1 - x) ** 4, 1 / 4);
    const concave = 1 - convex;
    return mix(convex, concave, smootherstep(x));
  },
};

function mix(a, b, t) {
  return a * (1 - t) + b * t;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function smootherstep(x) {
  const t = clamp(x, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function derivativeAt(surfaceFn, x) {
  const delta = 0.001;
  const x1 = clamp(x - delta, 0, 1);
  const x2 = clamp(x + delta, 0, 1);
  const y1 = surfaceFn(x1);
  const y2 = surfaceFn(x2);
  return (y2 - y1) / (x2 - x1 || 1);
}

function displacementFromSlope(slope, ior, thickness) {
  const incidence = Math.atan(Math.abs(slope));
  const sinRefraction = clamp(Math.sin(incidence) / ior, -1, 1);
  const refraction = Math.asin(sinRefraction);
  return Math.tan(incidence - refraction) * thickness;
}

function nearestEdgeDirection(x, y) {
  const left = x;
  const right = 1 - x;
  const top = y;
  const bottom = 1 - y;
  const minDistance = Math.min(left, right, top, bottom);
  const epsilon = 0.0001;
  const leftWeight = 1 / (left + epsilon);
  const rightWeight = 1 / (right + epsilon);
  const topWeight = 1 / (top + epsilon);
  const bottomWeight = 1 / (bottom + epsilon);

  const vx = leftWeight - rightWeight;
  const vy = topWeight - bottomWeight;
  const length = Math.hypot(vx, vy) || 1;

  return {
    x: vx / length,
    y: vy / length,
    distance: minDistance,
  };
}

function computeMagnitudeSamples({
  samples,
  surface,
  ior,
  thickness,
}) {
  const fn = SURFACE_FUNCTIONS[surface] || SURFACE_FUNCTIONS["convex-squircle"];
  const values = new Array(samples).fill(0);

  for (let i = 0; i < samples; i += 1) {
    const t = i / (samples - 1);
    const slope = derivativeAt(fn, t);
    values[i] = displacementFromSlope(slope, ior, thickness);
  }

  const max = Math.max(...values, 0.0001);
  return {
    maxDisplacement: max,
    normalized: values.map((value) => value / max),
  };
}

function mapToDataUrl(data, size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) {
    return "";
  }

  context.putImageData(new ImageData(data, size, size), 0, 0);
  return canvas.toDataURL("image/png");
}

export function createLiquidGlassMap({
  size = 128,
  samples = 127,
  bezel = 0.28,
  ior = 1.46,
  thickness = 20,
  surface = "convex-squircle",
} = {}) {
  const { normalized, maxDisplacement } = computeMagnitudeSamples({
    samples,
    surface,
    ior,
    thickness,
  });

  const data = new Uint8ClampedArray(size * size * 4);

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const x = px / (size - 1);
      const y = py / (size - 1);
      const edge = nearestEdgeDirection(x, y);
      const borderDistance = edge.distance;
      const t = clamp(borderDistance / bezel, 0, 1);
      const sampleIndex = Math.round(t * (samples - 1));
      const falloff = 1 - smootherstep(t);
      const edgeGuard = smootherstep(clamp(t / 0.12, 0, 1));
      const magnitude = normalized[sampleIndex] * falloff * edgeGuard;

      const dx = edge.x * magnitude;
      const dy = edge.y * magnitude;

      const offset = (py * size + px) * 4;
      data[offset] = Math.round(128 + dx * 127);
      data[offset + 1] = Math.round(128 + dy * 127);
      data[offset + 2] = 128;
      data[offset + 3] = 255;
    }
  }

  const dataUrl = mapToDataUrl(data, size);
  return { dataUrl, maxDisplacement };
}
