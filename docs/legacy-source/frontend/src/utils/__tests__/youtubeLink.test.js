import { extractYouTubeId, toYouTubeEmbedUrl } from "@/utils/youtubeLink";

describe("extractYouTubeId", () => {
  test.each([
    ["https://www.youtube.com/watch?v=NxaOvaO_cXo", "NxaOvaO_cXo"],
    ["https://youtu.be/NxaOvaO_cXo?t=30", "NxaOvaO_cXo"],
    ["https://www.youtube.com/shorts/NxaOvaO_cXo", "NxaOvaO_cXo"],
    ["https://m.youtube.com/watch?v=NxaOvaO_cXo&feature=share", "NxaOvaO_cXo"],
    ["https://www.youtube.com/embed/NxaOvaO_cXo", "NxaOvaO_cXo"],
    ["https://www.youtube.com/live/NxaOvaO_cXo", "NxaOvaO_cXo"],
  ])("%s -> %s", (input, id) => {
    expect(extractYouTubeId(input)).toBe(id);
  });

  test.each(["https://vimeo.com/123", "https://www.youtube.com/channel/abc", "not a url", "https://www.youtube.com/watch?v=short"])(
    "rejects %s", (input) => {
      expect(extractYouTubeId(input)).toBeNull();
      expect(toYouTubeEmbedUrl(input)).toBe("");
    }
  );
});
