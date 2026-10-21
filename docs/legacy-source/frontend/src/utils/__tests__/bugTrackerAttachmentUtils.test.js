import {
  TRACKER_SCREENSHOT_MAX_BYTES,
  mergeTrackerScreenshots,
  validateTrackerScreenshot,
} from "../bugTrackerAttachmentUtils";

function fakeFile(overrides = {}) {
  return {
    name: "screen.png",
    type: "image/png",
    size: 1024,
    lastModified: 1,
    ...overrides,
  };
}

describe("bug tracker screenshot validation", () => {
  test("accepts png jpeg and webp within 8 MB", () => {
    expect(validateTrackerScreenshot(fakeFile())).toBeNull();
    expect(validateTrackerScreenshot(fakeFile({ type: "image/jpeg", name: "screen.jpg" }))).toBeNull();
    expect(validateTrackerScreenshot(fakeFile({ type: "image/webp", name: "screen.webp" }))).toBeNull();
  });

  test("rejects unsupported and oversized files", () => {
    expect(validateTrackerScreenshot(fakeFile({ type: "application/pdf" }))).toMatch(/PNG, JPEG and WebP/);
    expect(validateTrackerScreenshot(fakeFile({ size: TRACKER_SCREENSHOT_MAX_BYTES + 1 }))).toMatch(/8 MB/);
  });

  test("deduplicates and caps reports at three screenshots", () => {
    const a = fakeFile({ name: "a.png", lastModified: 1 });
    const b = fakeFile({ name: "b.png", lastModified: 2 });
    const c = fakeFile({ name: "c.png", lastModified: 3 });
    const d = fakeFile({ name: "d.png", lastModified: 4 });

    const result = mergeTrackerScreenshots([a], [a, b, c, d]);
    expect(result.files).toHaveLength(3);
    expect(result.files.map((file) => file.name)).toEqual(["a.png", "b.png", "c.png"]);
    expect(result.error).toMatch(/up to 3/);
  });
});
