import { describe, expect, it, vi } from "vitest";
import {
  facultyContentDraftChanged, facultyContentMayChangeOpen,
  facultyContentMaySave, facultyContentPatch, facultyContentSaveReceiptMatches,
} from "@/modules/courses/faculty-content-edit-model";
import { facultyYouTubeEmbed } from "@/modules/courses/faculty-content-preview-model";
const id = "11111111-1111-4111-8111-111111111111";
const youtubeId = "AbcdeFGh123";
const content = (url: string) => ({
  kind: "YOUTUBE" as const, title: "Lecture", notes: "", url, duration: "600",
});
describe("FAC-CONTENT-AUTHORING-01 safe teacher video and save receipts", () => {
  it("accepts only the same YouTube video hosts as the private preview", () => {
    for (const url of [
      "https://youtube.com/watch?v=" + youtubeId,
      "https://www.youtube.com/shorts/" + youtubeId,
      "https://m.youtube.com/watch?v=" + youtubeId,
      "https://youtu.be/" + youtubeId,
      "https://www.youtube-nocookie.com/embed/" + youtubeId,
    ]) {
      expect(facultyContentPatch(content(url))).toMatchObject({ externalUrl: url, durationSeconds: 600 });
      expect(facultyYouTubeEmbed(url)).not.toBeNull();
    }
    for (const url of [
      "https://music.youtube.com/watch?v=" + youtubeId,
      "https://attacker.youtube.com/watch?v=" + youtubeId,
      "https://youtube.com.attacker.test/watch?v=" + youtubeId,
      "https://example.org/watch?v=" + youtubeId,
    ]) {
      expect(() => facultyContentPatch(content(url))).toThrow("Use a youtube.com or youtu.be link.");
      expect(facultyYouTubeEmbed(url)).toBeNull();
    }
  });

  it("rejects insecure protocols, credentials, private hosts and unsafe points", () => {
    for (const url of [
      "http://youtube.com/watch?v=" + youtubeId,
      "https://user:password@youtube.com/watch?v=" + youtubeId,
      "https://localhost/watch?v=" + youtubeId,
      "https://127.0.0.1/watch?v=" + youtubeId,
      "javascript:alert(1)",
    ]) {
      expect(() => facultyContentPatch(content(url))).toThrow();
    }
    for (const points of ["", "-1", "1.5", "1001", "NaN"]) {
      expect(() => facultyContentPatch({ ...content("https://youtu.be/" + youtubeId), points }))
        .toThrow();
    }
  });

  it("does not report Save success for a conflicting persisted content receipt", () => {
    const expected = facultyContentPatch({
      kind: "RESOURCE", title: " Note ", notes: "Teacher instruction", url: "", points: "10",
    });
    const receipt = { content: {
      id, title: "Note", notes: "Teacher instruction", externalUrl: null, points: 10,
    } };
    expect(facultyContentSaveReceiptMatches(id, expected, receipt)).toBe(true);
    expect(facultyContentSaveReceiptMatches(id, expected, {
      content: { ...receipt.content, id: "other-college" },
    })).toBe(false);
    expect(facultyContentSaveReceiptMatches(id, expected, {
      content: { ...receipt.content, points: 9 },
    })).toBe(false);
    expect(facultyContentSaveReceiptMatches(id, expected, { status: "success" })).toBe(false);
    expect(facultyContentSaveReceiptMatches(id, expected, null)).toBe(false);
  });

  it("confirms changed Faculty editor forms and blocks close/save during pending mutation", () => {
    const snapshot = { title: "A", notes: "", url: "", duration: "", starts: "", ends: "" };
    const modified = { ...snapshot, title: "B" };
    expect(facultyContentDraftChanged(snapshot, snapshot)).toBe(false);
    expect(facultyContentDraftChanged(snapshot, modified)).toBe(true);
    const confirm = vi.fn(() => true);
    expect(facultyContentMayChangeOpen(false, true, true, confirm)).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
    expect(facultyContentMayChangeOpen(false, true, false, confirm)).toBe(true);
    expect(confirm).toHaveBeenCalledOnce();
    expect(facultyContentMaySave(true, false, true)).toBe(false);
    expect(facultyContentMaySave(false, true, true)).toBe(false);
    expect(facultyContentMaySave(false, false, true)).toBe(true);
  });
});
