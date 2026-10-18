import { describe, expect, it } from "vitest";
import {
  facultyContentExternalHref, facultyYouTubeEmbed,
} from "@/modules/courses/faculty-content-preview-model";

const videoId = "AbcdeFGh123";
const embed = "https://www.youtube-nocookie.com/embed/" + videoId;

describe("FAC-VIDEO-PREVIEW-01 safe Faculty teaching media links", () => {
  it("projects a YouTube watch, shortened, shorts, live and embedded URL to one privacy-safe player", () => {
    for (const url of [
      "https://www.youtube.com/watch?v=" + videoId,
      "https://m.youtube.com/watch?v=" + videoId + "&t=5",
      "https://youtu.be/" + videoId,
      "https://youtube.com/shorts/" + videoId,
      "https://www.youtube.com/live/" + videoId,
      "https://www.youtube.com/embed/" + videoId,
      "https://www.youtube-nocookie.com/embed/" + videoId,
    ]) {
      expect(facultyYouTubeEmbed(url)).toBe(embed);
    }
  });

  it("rejects hostile protocols, credentials, fake YouTube subdomains and malformed IDs", () => {
    const hostile = [
      null, "", "javascript:alert(1)", "http://youtube.com/watch?v=" + videoId,
      "https://youtube.com.evil.test/watch?v=" + videoId,
      "https://fakeyoutube.com/watch?v=" + videoId,
      "https://username:password@youtube.com/watch?v=" + videoId,
      "https://youtu.be/short",
      "https://www.youtube.com/embed/not-an-id",
      "https://www.youtube.com/watch?v=" + videoId + "%0A",
      "not a URL",
    ];
    for (const value of hostile) {
      expect(facultyContentExternalHref("YOUTUBE", value)).toBe(
        value && value.startsWith("https://") &&
        !value.includes("password@") &&
        (value.includes("youtube.com/embed/not-an-id") ||
         value.includes("youtu.be/short") ||
         value.includes("youtube.com/watch?v=" + videoId + "%0A"))
          ? new URL(value).toString() : null,
      );
      expect(facultyYouTubeEmbed(value)).toBeNull();
    }
  });

  it("allows HTTPS resource and live-session links without treating them as YouTube embeds", () => {
    expect(facultyContentExternalHref("RESOURCE", "https://example.org/course/handout")).toBe(
      "https://example.org/course/handout",
    );
    expect(facultyContentExternalHref("LIVE_CLASS", "https://meet.example.org/class")).toBe(
      "https://meet.example.org/class",
    );
    expect(facultyContentExternalHref("RESOURCE", "http://example.org/file")).toBeNull();
    expect(facultyContentExternalHref("OTHER", "https://example.org/file")).toBeNull();
    expect(facultyYouTubeEmbed("https://meet.example.org/class")).toBeNull();
  });
});
