import {
  describe,
  expect,
  it,
} from "vitest";
import {
  getYouTubeVideoId,
  shouldPersistPlayback,
} from "@/components/courses/course-media-model";

describe("Course media model", () => {
  it("extracts IDs from supported YouTube URL shapes", () => {
    expect(
      getYouTubeVideoId(
        "https://www.youtube.com/watch?v=abc123",
      ),
    ).toBe("abc123");
    expect(
      getYouTubeVideoId(
        "https://youtu.be/xyz789?t=20",
      ),
    ).toBe("xyz789");
    expect(
      getYouTubeVideoId(
        "https://youtube.com/embed/embed01",
      ),
    ).toBe("embed01");
    expect(
      getYouTubeVideoId(
        "https://youtube.com/shorts/short01",
      ),
    ).toBe("short01");
  });

  it("rejects non-YouTube and malformed URLs", () => {
    expect(
      getYouTubeVideoId(
        "https://example.com/watch?v=abc",
      ),
    ).toBeNull();
    expect(
      getYouTubeVideoId("not a url"),
    ).toBeNull();
  });

  it("persists periodic playback only after meaningful forward progress", () => {
    expect(
      shouldPersistPlayback(10, 14.9),
    ).toBe(false);
    expect(
      shouldPersistPlayback(10, 15),
    ).toBe(true);
    expect(
      shouldPersistPlayback(20, 18),
    ).toBe(false);
  });

  it("force-save still refuses backward or duplicate positions", () => {
    expect(
      shouldPersistPlayback(10, 10, true),
    ).toBe(false);
    expect(
      shouldPersistPlayback(10, 11, true),
    ).toBe(true);
    expect(
      shouldPersistPlayback(10, 9, true),
    ).toBe(false);
  });
});
