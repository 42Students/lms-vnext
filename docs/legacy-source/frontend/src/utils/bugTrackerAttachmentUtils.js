export const TRACKER_SCREENSHOT_MAX_FILES = 3;
export const TRACKER_SCREENSHOT_MAX_BYTES = 8 * 1024 * 1024;
export const TRACKER_SCREENSHOT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

export function validateTrackerScreenshot(file) {
  if (!file) return "Choose a screenshot.";
  if (!TRACKER_SCREENSHOT_TYPES.includes(file.type)) {
    return "Only PNG, JPEG and WebP screenshots are supported.";
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return "Screenshot cannot be empty.";
  }
  if (file.size > TRACKER_SCREENSHOT_MAX_BYTES) {
    return "Each screenshot must be 8 MB or smaller.";
  }
  return null;
}

export function trackerScreenshotIdentity(file) {
  return [
    file?.name || "",
    Number(file?.size || 0),
    Number(file?.lastModified || 0),
  ].join(":");
}

export function mergeTrackerScreenshots(existing = [], incoming = []) {
  const accepted = [...existing];
  const errors = [];
  const seen = new Set(accepted.map(trackerScreenshotIdentity));

  for (const file of incoming) {
    const error = validateTrackerScreenshot(file);
    if (error) {
      errors.push(error);
      continue;
    }

    const identity = trackerScreenshotIdentity(file);
    if (seen.has(identity)) continue;

    if (accepted.length >= TRACKER_SCREENSHOT_MAX_FILES) {
      errors.push("You can attach up to 3 screenshots.");
      break;
    }

    accepted.push(file);
    seen.add(identity);
  }

  return {
    files: accepted,
    error: errors[0] || "",
  };
}
