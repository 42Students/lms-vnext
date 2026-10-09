import { describe, expect, it } from "vitest";
import {
  BUG_SCREENSHOT_MAX_BYTES,
  BUG_SCREENSHOT_MAX_PER_ISSUE,
  bugScreenshotType,
  canMutateBugTrackerWorkflow,
  canReadBugTrackerIssue,
  validateBugScreenshotUpload,
  validateBugScreenshotConfirmation,
} from "@/modules/bug-tracker/access-and-attachments";

describe("DB10 tracker access policy", () => {
  it("denies anonymous issue reads and every reporter mutation", () => {
    const issue = { reporterAccessId: "reporter-1" };
    expect(canReadBugTrackerIssue({ kind: "ANONYMOUS" }, issue)).toBe(false);
    expect(canMutateBugTrackerWorkflow({ kind: "ANONYMOUS" })).toBe(false);
    expect(canMutateBugTrackerWorkflow({
      kind: "REPORTER", accessId: "reporter-1", active: true,
    })).toBe(false);
  });

  it("only permits owner reporters or authenticated active super-admins to read", () => {
    const issue = { reporterAccessId: "reporter-1" };
    expect(canReadBugTrackerIssue({
      kind: "REPORTER", accessId: "reporter-1", active: true,
    }, issue)).toBe(true);
    expect(canReadBugTrackerIssue({
      kind: "REPORTER", accessId: "reporter-2", active: true,
    }, issue)).toBe(false);
    expect(canReadBugTrackerIssue({
      kind: "REPORTER", accessId: "reporter-1", active: false,
    }, issue)).toBe(false);
    expect(canReadBugTrackerIssue({
      kind: "SUPER_ADMIN", id: "superadmin", active: true,
    }, issue)).toBe(true);
    expect(canReadBugTrackerIssue({
      kind: "SUPER_ADMIN", id: "superadmin", active: false,
    }, issue)).toBe(false);
    expect(canMutateBugTrackerWorkflow({
      kind: "SUPER_ADMIN", id: "superadmin", active: true,
    })).toBe(true);
  });
});

describe("DB10 screenshot validation without public object URLs", () => {
  const id = "LMS-0001";
  const key = "bug-tracker/LMS-0001/550e8400-e29b-41d4-a716-446655440000.png";

  it("retains three screenshots of at most 8MiB and only supported formats", () => {
    expect(BUG_SCREENSHOT_MAX_PER_ISSUE).toBe(3);
    expect(BUG_SCREENSHOT_MAX_BYTES).toBe(8388608);
    expect(bugScreenshotType(" IMAGE/PNG; charset=utf-8 ")).toEqual({
      contentType: "image/png", extension: "png",
    });
    expect(validateBugScreenshotUpload({
      fileName: " screen.png ", contentType: "image/png",
      contentLength: BUG_SCREENSHOT_MAX_BYTES, currentCount: 2,
    })).toEqual({
      originalFilename: "screen.png",
      contentType: "image/png", extension: "png",
    });
  });

  it.each(["image/svg+xml", "image/gif", "application/pdf", "text/html"])(
    "refuses unsupported content type %s",
    (contentType) => {
      expect(() => validateBugScreenshotUpload({
        fileName: "file.svg", contentType, contentLength: 10, currentCount: 0,
      })).toThrow("INVALID_FILE");
    },
  );

  it.each([
    "../escape.png", "x/y.png", "x\\y.png", "screenshot\n.png", " ",
  ])("rejects filename path injection %s", (fileName) => {
    expect(() => validateBugScreenshotUpload({
      fileName, contentType: "image/png", contentLength: 10, currentCount: 0,
    })).toThrow("INVALID_FILE");
  });

  it.each([0, -1, BUG_SCREENSHOT_MAX_BYTES + 1, 1.5, Number.NaN])(
    "rejects invalid object content size %s", (contentLength) => {
      expect(() => validateBugScreenshotUpload({
        fileName: "valid.png", contentType: "image/png", contentLength,
        currentCount: 0,
      })).toThrow("INVALID_FILE");
    },
  );

  it("refuses fourth attachment even if MIME and size are valid", () => {
    expect(() => validateBugScreenshotUpload({
      fileName: "screen.png", contentType: "image/png",
      contentLength: 1, currentCount: 3,
    })).toThrow("TOO_MANY_ATTACHMENTS");
  });

  it("confirms only object whose metadata matches its issue-bound UUID key", () => {
    expect(validateBugScreenshotConfirmation({
      publicId: id, storageKey: key, originalFilename: "screen.png",
      storedContentType: "image/png", storedLength: 123,
      currentCount: 2,
    })).toEqual({
      storageKey: key, originalFilename: "screen.png",
      contentType: "image/png", sizeBytes: 123,
    });
    for (const storageKey of [
      key.replace("LMS-0001", "LMS-9999"),
      key.replace(".png", ".jpg"),
      key + "/../a",
      "bug-tracker/LMS-0001/fake.png",
      "bug-tracker/LMS-0001/550e8400-e29b-41d4-a716-446655440000.png/evil",
    ]) {
      expect(() => validateBugScreenshotConfirmation({
        publicId: id, storageKey, originalFilename: "screen.png",
        storedContentType: "image/png", storedLength: 123,
        currentCount: 0,
      })).toThrow("INVALID_STORAGE_KEY");
    }
  });

  it("uses actual object metadata and prevents forged JPEG extension", () => {
    expect(() => validateBugScreenshotConfirmation({
      publicId: id, storageKey: key, originalFilename: "screen.png",
      storedContentType: "image/jpeg", storedLength: 123,
      currentCount: 0,
    })).toThrow("INVALID_STORAGE_KEY");
  });
});
