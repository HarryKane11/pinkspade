import type { FalModel } from "./fal";

/**
 * For image_size mode models: pass exact pixel dimensions directly.
 * Fal API accepts custom {width, height} objects.
 */
export function mapToImageSize(
  width: number,
  height: number
): { width: number; height: number } {
  return { width, height };
}

/**
 * For aspect_ratio mode models: find the closest supported ratio.
 * Compares the target ratio (w/h) against all supported enum values.
 */
export function mapToAspectRatio(
  width: number,
  height: number,
  supported: string[]
): string {
  if (!supported.length) return "1:1";

  const target = width / height;
  let closest: string | null = null;
  let minDiff = Infinity;

  for (const ratio of supported) {
    if (ratio === "auto") continue;
    const parts = ratio.split(":").map(Number);
    if (parts.length !== 2 || !parts[0] || !parts[1]) continue;
    const diff = Math.abs(target - parts[0] / parts[1]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = ratio;
    }
  }

  // Fallback: if no valid ratio found (all "auto" or empty), return "1:1"
  return closest ?? "1:1";
}

/**
 * Get the appropriate size parameter for a model given pixel dimensions.
 * Returns either { image_size: {width, height} } or { aspect_ratio: string }.
 */
export function getSizeParams(
  model: FalModel,
  width: number,
  height: number
): Record<string, unknown> {
  if (model.sizeMode === "aspect_ratio" && model.supportedAspectRatios) {
    return {
      aspect_ratio: mapToAspectRatio(width, height, model.supportedAspectRatios),
    };
  }
  return {
    image_size: mapToImageSize(width, height),
  };
}
