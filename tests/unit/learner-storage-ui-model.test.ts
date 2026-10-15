import { describe, expect, it } from "vitest";
import {
  canRemoveStagedFile, canSubmitStagedFiles, parseFileDownloadGrant,
  parseLearnerPlaybackGrant, parseLearnerVideos, parseStagedUploadGrant,
  parseSubmissionFiles, readySubmissionFileIds, videoForContent,
} from "@/modules/courses/learner-storage-ui-model";

const uuid = (n: number) => "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
const file = {
  id: uuid(1), assignmentId: uuid(2), deliveryId: uuid(3), submissionId: null, sequence: null,
  originalName: "answer.pdf", contentType: "application/pdf", sizeBytes: 8,
  status: "UPLOADING", failureCode: null, createdAt: "2026-10-16T10:00:00Z", completedAt: null,
};
const now = Date.parse("2026-10-16T10:00:00Z");
const headers = {
  "content-type": "application/pdf", "x-amz-meta-upload-token": "secret",
  "x-amz-meta-owner-membership-id": uuid(4), "x-amz-meta-college-id": uuid(5),
  "x-amz-meta-expected-size": "8", "x-amz-meta-malware-scan-status": "PENDING",
};
const grant = {
  receiptId: file.id, uploadUrl: "https://storage.example.test/?sig=private", method: "PUT",
  expiresAt: "2026-10-16T10:10:00Z", requiredHeaders: headers, originalName: "answer.pdf",
};
describe("learner storage UI boundary", () => {
  it("accepts a sibling file record but rejects forged receipt, header or URL", () => {
    expect(parseStagedUploadGrant({file, grant}, now).file.id).toBe(file.id);
    for (const invalid of [
      {...grant, receiptId: uuid(8)}, {...grant, expiresAt: "2026-10-16T10:00:00Z"},
      {...grant, uploadUrl: "http://storage.example.test"},
      {...grant, requiredHeaders: {...headers, cookie: "session"}},
      {...grant, requiredHeaders: {...headers, "x-amz-meta-expected-size": "3"}},
      {...grant, requiredHeaders: {...headers, "x-amz-meta-upload-token": "x\r\nfoo"}},
    ]) expect(() => parseStagedUploadGrant({ file, grant: invalid }, now)).toThrow();
  });
  it("permits submission only with READY staged files, max ten, no submitted rows", () => {
    const ready = {...file, status: "READY"};
    const staged = parseSubmissionFiles({ files: [ready] });
    expect(canSubmitStagedFiles(staged)).toBe(true);
    expect(readySubmissionFileIds(staged)).toEqual([file.id]);
    expect(canSubmitStagedFiles(parseSubmissionFiles({ files: [file] }))).toBe(false);
    expect(canSubmitStagedFiles([])).toBe(false);
    expect(canSubmitStagedFiles(Array.from({length:11},(_, i)=>({...ready,id:uuid(i+10)})).map(value=>parseSubmissionFiles({files:[value]})[0]!))).toBe(false);
    expect(canRemoveStagedFile({status:"VERIFYING",submissionId:null})).toBe(true);
    expect(canRemoveStagedFile({status:"READY",submissionId:uuid(9)})).toBe(false);
  });
  it("never accepts download links for non-ready files or insecure URLs", () => {
    const readyFile = {...file, status:"READY"};
    const read = { url:"https://storage.example.test/private?sig=x",
      expiresAt:"2026-10-16T10:05:00Z",expiresInSeconds:300,file:readyFile };
    expect(parseFileDownloadGrant({ grant:read },now).url).toBe(read.url);
    expect(() => parseFileDownloadGrant({grant:{...read,file}},now)).toThrow();
    expect(() => parseFileDownloadGrant({grant:{...read,url:"https://name:pass@storage.example.test/x"}},now)).toThrow();
  });
  it("finds only authorised listed video by linked content or matching asset key", () => {
    const v = {id:uuid(4),lessonId:uuid(5),lessonContentId:uuid(7),
      title:"Lecture",sequence:0,durationSeconds:120,contentType:"video/mp4",hasThumbnail:false};
    const videos = parseLearnerVideos({videos:[v]});
    expect(videoForContent(videos,uuid(7),null)?.id).toBe(uuid(4));
    expect(videoForContent(videos,uuid(9),"video-asset/"+uuid(4))).toBe(null);
    expect(videoForContent(videos,uuid(9),"https://example.test")).toBe(null);
    expect(videoForContent(parseLearnerVideos({videos:[{...v,lessonContentId:null}]}),uuid(9),"video-asset/"+uuid(4))?.id).toBe(uuid(4));
  });
  it("validates brief range-capable grants and matching video identity", () => {
    const v={id:uuid(4),lessonId:uuid(5),lessonContentId:uuid(7),
      title:"Lecture",sequence:0,durationSeconds:120,contentType:"video/mp4",hasThumbnail:false};
    const playable={url:"https://storage.example.test/private?sig=1",expiresAt:"2026-10-16T11:00:00Z",
      expiresInSeconds:3600,resumePositionSeconds:75,supportsRange:true,durationSeconds:120,
      thumbnailUrl:null,video:v};
    expect(parseLearnerPlaybackGrant({grant:playable},uuid(4),now).resumePositionSeconds).toBe(75);
    expect(() => parseLearnerPlaybackGrant({grant:playable},uuid(9),now)).toThrow();
    expect(() => parseLearnerPlaybackGrant({grant:{...playable,supportsRange:false}},uuid(4),now)).toThrow();
    expect(() => parseLearnerPlaybackGrant({grant:{...playable,url:"javascript:bad"}},uuid(4),now)).toThrow();
  });
});
