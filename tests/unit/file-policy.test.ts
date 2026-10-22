import { describe, expect, it } from "vitest";
import {
  MAX_DOCUMENT_BYTES,
  MAX_THUMBNAIL_BYTES,
  MAX_VIDEO_BYTES,
  acceptAttributeFor,
  allowedMimeTypesFor,
  guessContentTypeFromName,
  magicBytesMatch,
  maxBytesFor,
  namespaceForKind,
  normalizeContentType,
  validateStorageDeclaration,
  validateLegacyFolderDeclaration,
} from "@/modules/storage/file-policy";

import { lessonVideoPreselection, LESSON_VIDEO_SINGLE_PUT_LIMIT_TEXT } from "@/modules/storage/video-preselection";

const bytes = (...values: number[]) => Uint8Array.from(values);
const text = (value: string) => new TextEncoder().encode(value);

describe("storage limits (taken from the legacy LMS)", () => {
  it("uses 50 MiB for documents, 4900 MiB for videos and 5 MiB for thumbnails", () => {
    expect(maxBytesFor("assignment-submission")).toBe(50 * 1024 * 1024);
    expect(maxBytesFor("project-resource")).toBe(MAX_DOCUMENT_BYTES);
    expect(maxBytesFor("lesson-video")).toBe(MAX_VIDEO_BYTES);
    expect(MAX_VIDEO_BYTES).toBeLessThan(5120 * 1024 * 1024);
    expect(maxBytesFor("lesson-video-thumbnail")).toBe(MAX_THUMBNAIL_BYTES);
  });

  it("maps thumbnails into the lesson-video namespace", () => {
    expect(namespaceForKind("lesson-video-thumbnail")).toBe("lesson-video");
    expect(namespaceForKind("assignment-submission")).toBe("assignment-submission");
  });
});

describe("validateStorageDeclaration", () => {
  const pdf = { originalName: "report.pdf", contentType: "application/pdf", sizeBytes: 1000 };

  it("accepts a consistent declaration and normalizes the type", () => {
    const result = validateStorageDeclaration("assignment-submission", {
      ...pdf,
      contentType: "Application/PDF; charset=binary",
    });
    expect(result).toEqual({ ok: true, value: pdf });
  });

  it("rejects names with path separators, control characters or dot names", () => {
    for (const originalName of ["a/b.pdf", "a\\b.pdf", "..", ".", "", "x\n.pdf", "a\0.pdf"]) {
      const result = validateStorageDeclaration("assignment-submission", { ...pdf, originalName });
      expect(result).toEqual({ ok: false, code: "STORAGE_NAME_INVALID" });
    }
  });

  it("rejects executable, html and svg uploads that legacy blocked", () => {
    for (const [name, type] of [
      ["setup.exe", "application/x-msdownload"],
      ["page.html", "text/html"],
      ["logo.svg", "image/svg+xml"],
      ["run.sh", "application/x-sh"],
      ["app.jar", "application/java-archive"],
    ]) {
      const result = validateStorageDeclaration("project-resource", {
        originalName: name!,
        contentType: type!,
        sizeBytes: 10,
      });
      expect(result).toEqual({ ok: false, code: "STORAGE_TYPE_NOT_ALLOWED" });
    }
  });

  it("requires the extension to match the declared type", () => {
    expect(
      validateStorageDeclaration("assignment-submission", { ...pdf, originalName: "report.docx" }),
    ).toEqual({ ok: false, code: "STORAGE_EXTENSION_MISMATCH" });
    expect(
      validateStorageDeclaration("assignment-submission", { ...pdf, originalName: "report" }),
    ).toEqual({ ok: false, code: "STORAGE_EXTENSION_MISMATCH" });
  });

  it("enforces size bounds per kind", () => {
    expect(
      validateStorageDeclaration("assignment-submission", { ...pdf, sizeBytes: 0 }),
    ).toEqual({ ok: false, code: "STORAGE_SIZE_INVALID" });
    expect(
      validateStorageDeclaration("assignment-submission", { ...pdf, sizeBytes: 1.5 }),
    ).toEqual({ ok: false, code: "STORAGE_SIZE_INVALID" });
    expect(
      validateStorageDeclaration("assignment-submission", { ...pdf, sizeBytes: MAX_DOCUMENT_BYTES + 1 }),
    ).toEqual({ ok: false, code: "STORAGE_FILE_TOO_LARGE" });
    expect(
      validateStorageDeclaration("assignment-submission", { ...pdf, sizeBytes: MAX_DOCUMENT_BYTES }).ok,
    ).toBe(true);
  });

  it("accepts the legacy video formats up to the video cap only", () => {
    for (const [name, type] of [
      ["lecture.mp4", "video/mp4"],
      ["lecture.webm", "video/webm"],
      ["lecture.mov", "video/quicktime"],
      ["lecture.avi", "video/x-msvideo"],
      ["lecture.m4v", "video/x-m4v"],
    ]) {
      expect(
        validateStorageDeclaration("lesson-video", { originalName: name!, contentType: type!, sizeBytes: MAX_VIDEO_BYTES }).ok,
      ).toBe(true);
    }
    expect(
      validateStorageDeclaration("lesson-video", {
        originalName: "lecture.mp4",
        contentType: "video/mp4",
        sizeBytes: MAX_VIDEO_BYTES + 1,
      }),
    ).toEqual({ ok: false, code: "STORAGE_FILE_TOO_LARGE" });
    expect(
      validateStorageDeclaration("lesson-video", { ...pdf }),
    ).toEqual({ ok: false, code: "STORAGE_TYPE_NOT_ALLOWED" });
  });

  it("allows markdown only for project resources", () => {
    const md = { originalName: "notes.md", contentType: "text/markdown", sizeBytes: 10 };
    expect(validateStorageDeclaration("project-resource", md).ok).toBe(true);
    expect(validateStorageDeclaration("assignment-submission", md).ok).toBe(false);
  });

  it("limits thumbnails to JPEG, PNG and WebP up to 5 MiB", () => {
    expect(
      validateStorageDeclaration("lesson-video-thumbnail", {
        originalName: "poster.png",
        contentType: "image/png",
        sizeBytes: MAX_THUMBNAIL_BYTES,
      }).ok,
    ).toBe(true);
    expect(
      validateStorageDeclaration("lesson-video-thumbnail", {
        originalName: "poster.png",
        contentType: "image/png",
        sizeBytes: MAX_THUMBNAIL_BYTES + 1,
      }),
    ).toEqual({ ok: false, code: "STORAGE_FILE_TOO_LARGE" });
  });
});

describe("helpers", () => {
  it("builds accept attributes and guesses types from names", () => {
    expect(acceptAttributeFor("lesson-video")).toBe(".mp4,.m4v,.webm,.mov,.avi");
    expect(allowedMimeTypesFor("lesson-video-thumbnail")).toEqual(["image/jpeg", "image/png", "image/webp"]);
    expect(guessContentTypeFromName("project-resource", "notes.MD")).toBe("text/markdown");
    expect(guessContentTypeFromName("assignment-submission", "notes.md")).toBeNull();
    expect(normalizeContentType(" Video/MP4 ; codecs=x")).toBe("video/mp4");
  });
});

describe("magicBytesMatch", () => {
  it("recognises common signatures", () => {
    expect(magicBytesMatch("application/pdf", text("%PDF-1.7\n"))).toBe(true);
    expect(magicBytesMatch("application/pdf", text("<html>"))).toBe(false);
    expect(magicBytesMatch("image/png", bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toBe(true);
    expect(magicBytesMatch("image/jpeg", bytes(0xff, 0xd8, 0xff, 0xe0))).toBe(true);
    expect(magicBytesMatch("image/webp", text("RIFF\0\0\0\0WEBPVP8 "))).toBe(true);
    expect(magicBytesMatch("image/webp", text("RIFF\0\0\0\0WAVEfmt "))).toBe(false);
    expect(magicBytesMatch("application/zip", bytes(0x50, 0x4b, 0x03, 0x04))).toBe(true);
    expect(
      magicBytesMatch(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        bytes(0x50, 0x4b, 0x03, 0x04),
      ),
    ).toBe(true);
    expect(magicBytesMatch("application/msword", bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1))).toBe(true);
    expect(magicBytesMatch("application/rtf", text("{\\rtf1\\ansi"))).toBe(true);
  });

  it("rejects NUL bytes in text types and unknown types", () => {
    expect(magicBytesMatch("text/plain", text("hello"))).toBe(true);
    expect(magicBytesMatch("text/csv", bytes(0x61, 0, 0x62))).toBe(false);
    expect(magicBytesMatch("application/x-msdownload", bytes(0x4d, 0x5a))).toBe(false);
    expect(magicBytesMatch("application/pdf", new Uint8Array())).toBe(false);
  });

  it("recognises video containers", () => {
    const mp4 = new Uint8Array(12);
    mp4.set(text("ftypisom"), 4);
    expect(magicBytesMatch("video/mp4", mp4)).toBe(true);
    expect(magicBytesMatch("video/quicktime", mp4)).toBe(true);
    expect(magicBytesMatch("video/webm", bytes(0x1a, 0x45, 0xdf, 0xa3, 1))).toBe(true);
    expect(magicBytesMatch("video/x-msvideo", text("RIFF\0\0\0\0AVI LIST"))).toBe(true);
    expect(magicBytesMatch("video/mp4", text("not a video at all"))).toBe(false);
  });
});

describe("E2E-safe video preflight and legacy thumbnail limits", () => {
  const mib = 1024 * 1024;
  it("accepts expected single-PUT upload declarations at 100 MiB, 1 GiB and 4900 MiB", () => {
    for (const size of [100 * mib, 1024 * mib, 4900 * mib]) {
      expect(lessonVideoPreselection({
        name: "recording.mp4", type: "video/mp4", size,
      })).toEqual({ ok: true, maxBytes: MAX_VIDEO_BYTES });
    }
    expect(lessonVideoPreselection({
      name: "recording.mp4", type: "video/mp4", size: 4900 * mib + 1,
    })).toEqual({ ok: false, message: LESSON_VIDEO_SINGLE_PUT_LIMIT_TEXT });
  });

  it("accepts missing browser MIME from the extension without loosening mismatches", () => {
    expect(lessonVideoPreselection({
      name: "capture.MOV", type: "", size: 100 * mib,
    }).ok).toBe(true);
    expect(lessonVideoPreselection({
      name: "fake.mp4", type: "image/png", size: 100 * mib,
    }).ok).toBe(false);
    expect(lessonVideoPreselection({
      name: "capture.avi", type: "video/mp4", size: 100 * mib,
    })).toEqual({ok:false,message:"The video extension does not match its file type."});
  });

  it("distinguishes empty videos and folder-specific 5 MiB thumbnail caps", () => {
    expect(lessonVideoPreselection({
      name: "empty.mp4", type: "video/mp4", size: 0,
    })).toEqual({ok:false,message:"The video file is empty. Choose a nonempty video."});
    expect(validateLegacyFolderDeclaration("course-images", {
      originalName: "poster.png", contentType: "image/png", sizeBytes: 5 * mib,
    }).ok).toBe(true);
    expect(validateLegacyFolderDeclaration("course-images", {
      originalName: "poster.png", contentType: "image/png", sizeBytes: 5 * mib + 1,
    })).toEqual({ok:false,code:"STORAGE_FILE_TOO_LARGE"});
  });
});
