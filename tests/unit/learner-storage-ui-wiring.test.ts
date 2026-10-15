import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (file: string) => readFileSync(`src/components/courses/${file}`, "utf8");
describe("learner file/video UI route wiring", () => {
  it("uses staged files, upload completion and atomic multi-file submit, never legacy receipts", () => {
    const picker = source("assignment-file-submission-control.tsx");
    const transfer = source("assignment-staged-file-transfer.ts");
    expect(picker).toContain("/submit-files");
    expect(picker).toContain("/submission-files");
    expect(transfer).toContain("/submission-files/");
    expect(transfer).toContain("/complete");
    expect(transfer).toContain('method: "PUT"');
    expect(transfer).toContain("withCredentials = false");
    expect(transfer).not.toContain("/file-upload");
    expect(picker).not.toContain('uploadReceiptId');
  });
  it("downloads only after granting access to the specific stored file", () => {
    const viewer = source("assignment-file-open-control.tsx");
    expect(viewer).toContain("/assignment-submission-files/");
    expect(viewer).toContain("/download-grant");
    expect(viewer).toContain("parseFileDownloadGrant");
    expect(viewer).not.toContain("/file`");
  });
  it("loads learner-visible lesson videos and short playback grants, never raw file keys", () => {
    const player = source("learner-video-player.tsx");
    expect(player).toContain("/learner-videos?");
    expect(player).toContain("/playback-grant");
    expect(player).toContain("parseLearnerPlaybackGrant");
    expect(player).toContain("playbackGrantRefreshDelay");
    expect(player).not.toContain("/contents/");
    expect(player).not.toContain("localStorage");
    expect(player).not.toContain("sessionStorage");
  });
});
