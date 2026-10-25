import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { mentorFinalDeliveryCanReview } from "@/modules/projects/mentor-final-delivery-decision-model";
import { createProjectEvaluationInputSchema, reviewProjectSubmissionInputSchema } from "@/modules/projects/validation";
import { projectDeliveryAttachmentsSchema, mayReopenApprovedDelivery } from "@/modules/projects/pr-s2-07-delivery-reopen-model";
import { learnerProjectTaskReviewNotice, learnerProjectDeliveryReviewNotice } from "@/modules/projects/learner-project-review-notification-model";
import { validateStorageDeclaration, MAX_DOCUMENT_BYTES, magicBytesMatch } from "@/modules/storage/file-policy";
const source = (file: string) => readFileSync(file, "utf8");
const fileId = "11111111-1111-4111-8111-111111111111";

describe("IIT Dharwad: adversarial file, submission, grading and notification rules", () => {
  it("PROJ-BREAK-file-06 rejects filename traversal, MIME confusion, oversized and empty uploads", () => {
    const valid = { originalName: "report.pdf", contentType: "application/pdf", sizeBytes: MAX_DOCUMENT_BYTES };
    expect(validateStorageDeclaration("project-resource", valid).ok).toBe(true);
    for (const name of ["../report.pdf", "..\\report.pdf", "report.pdf\r\nContent-Disposition:", ".", "report.pdf\0.exe"]) {
      expect(validateStorageDeclaration("project-resource", { ...valid, originalName: name }).ok, name).toBe(false);
    }
    for (const sizeBytes of [0, -1, MAX_DOCUMENT_BYTES + 1, Number.NaN, Number.MAX_SAFE_INTEGER + 1]) {
      expect(validateStorageDeclaration("project-resource", { ...valid, sizeBytes }).ok, String(sizeBytes)).toBe(false);
    }
    expect(validateStorageDeclaration("project-resource", { ...valid, contentType: "image/png" }).ok).toBe(false);
    expect(validateStorageDeclaration("project-resource", { ...valid, originalName: "bad.exe" }).ok).toBe(false);
    expect(magicBytesMatch("application/pdf", new TextEncoder().encode("%PDF-1.7\n"))).toBe(true);
    expect(magicBytesMatch("application/pdf", new TextEncoder().encode("not a PDF"))).toBe(false);
  });

  it("PROJ-BREAK-submissions-06 rejects duplicate attachments, forged file references and injected schemes", () => {
    const file = { kind: "FILE" as const, name: "report", fileId, url: null };
    const url = { kind: "LINK" as const, name: "demo", fileId: null, url: "https://example.org/demo" };
    expect(projectDeliveryAttachmentsSchema.safeParse([file, url]).success).toBe(true);
    expect(projectDeliveryAttachmentsSchema.safeParse([file, { ...file, name: "different display name" }]).success).toBe(false);
    expect(projectDeliveryAttachmentsSchema.safeParse([url, { ...url, name: "alias" }]).success).toBe(false);
    for (const bad of [
      { ...file, fileId: "another-college" },
      { ...file, url: "https://example.org" },
      { ...url, fileId },
      { ...url, url: "javascript:alert(1)" },
      { ...url, url: "data:text/html,hi" },
    ]) expect(projectDeliveryAttachmentsSchema.safeParse([bad]).success).toBe(false);
    expect(projectDeliveryAttachmentsSchema.safeParse(Array.from({length:11}, (_,i) => ({
      kind:"LINK",name:"link "+i,fileId:null,url:"https://example.org/"+i,
    }))).success).toBe(false);
    const service = source("src/modules/projects/submission-service.ts");
    expect(service).toContain("eq(projectResourceFiles.projectId,scope.project.id)");
    expect(service).toContain('resource.visibility!=="TEAM"');
    // The validity contract moved into one reusable proof gate rather than
    // duplicating status checks inside every mutation call site.
    expect(service).toContain("projectFinalFileEvidenceIsVerified(file)");
    const evidenceModel = source("src/modules/projects/project-final-file-evidence-model.ts");
    expect(evidenceModel).toContain('file.status==="READY"');
    expect(evidenceModel).toContain('file.scanStatus==="CLEAN"');
  });

  it("PROJ-BREAK-grading-03 completed and archived projects cannot receive new rubric evaluations", () => {
    const service = source("src/modules/projects/evaluation-service.ts");
    const create = service.slice(service.indexOf("export async function createProjectEvaluation("),
      service.indexOf("export async function getProjectEvaluation("));
    expect(create).toContain('project.status === "ARCHIVED" || project.status === "COMPLETED"');
    expect(create).toContain('.for("update")');
    expect(create).toContain('submission.status !== "APPROVED"');
    expect(create).toContain("db.transaction(async (tx)");
    expect(mayReopenApprovedDelivery("COMPLETED", false)).toBe(false);
    expect(mayReopenApprovedDelivery("ACTIVE", true)).toBe(false);
  });

  it("PROJ-BREAK-grading-04 rejects score inflation, fractional points and duplicate rubric criteria", () => {
    const good = { items: [
      { criterion:"Correctness", score:8, maxScore:10 },
      { criterion:"Testing", score:7, maxScore:10 },
    ] };
    expect(createProjectEvaluationInputSchema.safeParse(good).success).toBe(true);
    for (const items of [
      [{criterion:"Correctness",score:11,maxScore:10}],
      [{criterion:"Correctness",score:-1,maxScore:10}],
      [{criterion:"Correctness",score:1.5,maxScore:10}],
      [{criterion:"Correctness",score:1,maxScore:0}],
      [{criterion:"Correctness",score:1001,maxScore:1001}],
      [{criterion:"Correctness",score:4,maxScore:10},{criterion:"correctness",score:3,maxScore:10}],
    ]) expect(createProjectEvaluationInputSchema.safeParse({items}).success).toBe(false);
    expect(createProjectEvaluationInputSchema.safeParse({items:[]}).success).toBe(false);
    expect(createProjectEvaluationInputSchema.safeParse({...good, evaluatorUserId:fileId}).success).toBe(false);
    expect(reviewProjectSubmissionInputSchema.safeParse({decision:"CHANGES_REQUESTED"}).success).toBe(false);
    expect(reviewProjectSubmissionInputSchema.safeParse({decision:"CHANGES_REQUESTED",feedback:"Fix tests"}).success).toBe(true);
  });

  it("PROJ-BREAK-state-04 only submitted ACTIVE project deliveries offer review", () => {
    expect(mentorFinalDeliveryCanReview("SUBMITTED","ACTIVE")).toBe(true);
    for (const status of ["PLANNED","COMPLETED","ARCHIVED","DELETED"]) {
      expect(mentorFinalDeliveryCanReview("SUBMITTED",status), status).toBe(false);
    }
    for (const status of ["DRAFT","APPROVED","CHANGES_REQUESTED","REJECTED"]) {
      expect(mentorFinalDeliveryCanReview(status,"ACTIVE"), status).toBe(false);
    }
    const service = source("src/modules/projects/submission-service.ts");
    expect(service).toContain('project.status === "COMPLETED"');
  });

  it("PROJ-BREAK-notifications-01 never embeds reviewer feedback or contact details in push copy", () => {
    const projectId = "private?tenant=other";
    const taskId = "task#1";
    for (const decision of ["APPROVED", "CHANGES_REQUESTED", "REJECTED"]) {
      const task = learnerProjectTaskReviewNotice({projectId,taskId,decision});
      const delivery = learnerProjectDeliveryReviewNotice(projectId,decision);
      expect(task.actionHref).toContain(encodeURIComponent(projectId));
      expect(task.actionHref).toContain(encodeURIComponent(taskId));
      expect(delivery.actionHref).toContain(encodeURIComponent(projectId));
      for (const notice of [task,delivery]) {
        expect(notice.body).not.toContain("reviewer@example.com");
        expect(notice.actionHref).not.toMatch(/^https?:/);
      }
    }
  });

  it("PROJ-BREAK-notifications-02 persisted audience is active, same-college and idempotently deduplicated", () => {
    const service = source("src/modules/projects/project-notification-service.ts");
    expect(service).toContain("eq(projectMembers.projectId, notice.projectId)");
    expect(service).toContain("isNull(projectMembers.endedAt)");
    expect(service).toContain('eq(collegeMemberships.collegeId, notice.collegeId)');
    expect(service).toContain('eq(collegeMemberships.status, "ACTIVE")');
    expect(service).toContain('eq(users.platformStatus, "ACTIVE")');
    expect(service).toContain("new Set(rows.map(row => row.userId))");
    expect(service).toContain("id !== notice.exceptUserId");
    const writer = source("src/modules/activity/notification-service.ts");
    expect(writer).toContain(".onConflictDoNothing()");
    expect(writer).toContain("assertScopedNotificationRecipients(");
  });

  it("PROJ-BREAK-file-08 learner file listing excludes archived, draft, mentor-only and dangling linked resources", () => {
    const service = source("src/modules/projects/project-resource-file-service.ts");
    const listing = service.slice(
      service.indexOf("export async function listProjectFiles("),
      service.indexOf("export async function updateProjectFileDetails("),
    );
    expect(listing).toContain('eq(projectResourceFiles.status, "READY")');
    expect(listing).toContain("isNull(projectResourceFiles.resourceId)");
    expect(listing).toContain("exists(getDb().select");
    expect(listing).toContain('eq(projectResources.status,"ACTIVE")');
    expect(listing).toContain('eq(projectResources.visibility,"TEAM")');
    expect(listing).toContain("eq(projectResources.projectId,scope.project.id)");
    expect(listing).not.toContain("notExists(");
    const grant = service.slice(service.indexOf("export async function issueProjectFileDownloadGrant("));
    expect(grant).toContain('linked.status!=="ACTIVE"||linked.visibility!=="TEAM"');
  });

  it("PROJ-BREAK-file-09 double completion returns the READY winner without repeating SCAN_ATTESTED", () => {
    const code=source("src/modules/projects/project-resource-file-service.ts");
    const finish=code.slice(code.indexOf("export async function completeProjectFileUpload("),
      code.indexOf("export async function listProjectFiles("));
    expect(finish).toContain('if (raced.status === "READY") return toProjectFileDto(raced)');
    expect(finish).toContain('inArray(projectResourceFiles.status, ["UPLOADING", "VERIFYING"])');
    expect(finish).toContain('if (winner?.status === "READY") return {row:winner, changed:false}');
    expect(finish).toContain("if (!updated.changed) return toProjectFileDto(updated.row)");
    expect(finish).toContain('eventType: "SCAN_ATTESTED"');
    expect(finish).toContain("recordStorageFileEvent(tx, context");
    expect(finish).toContain('if (plan.status === "QUARANTINED")');
  });

  it("PROJ-BREAK-file-11 stale WAIT expiry preserves a verified winner instead of falsely failing", () => {
    const code=source("src/modules/projects/project-resource-file-service.ts");
    const finish=code.slice(code.indexOf("export async function completeProjectFileUpload("),
      code.indexOf("export async function listProjectFiles("));
    expect(finish).toContain('if (raced.status === "READY") return toProjectFileDto(raced)');
    expect(finish).toContain("const [failed] = await tx.update(projectResourceFiles)");
    expect(finish).toContain("eq(projectResourceFiles.status,row.status)");
    expect(finish).toContain("if(failed)return failed");
    expect(finish).toContain('if(expiredOrWinner?.status==="READY")return toProjectFileDto(expiredOrWinner)');
    expect(finish).toContain('throw new StorageFileError("STORAGE_UPLOAD_EXPIRED")');
  });

  it("PROJ-BREAK-file-10 double soft-delete does not double audit or surface a false storage failure", () => {
    const code=source("src/modules/projects/project-resource-file-service.ts");
    const remove=code.slice(code.indexOf("export async function removeProjectFile("),
      code.indexOf("export async function issueProjectFileDownloadGrant("));
    expect(remove).toContain('if (row.status === "DELETED") return toProjectFileDto(row)');
    expect(remove).toContain('ne(projectResourceFiles.status, "DELETED")');
    expect(remove).toContain('if (winner?.status === "DELETED") return {row:winner, changed:false}');
    expect(remove).toContain('if (!updated.changed) return toProjectFileDto(updated.row)');
    expect(remove).toContain('eventType: "DELETED"');
    expect(remove).toContain("catch { /* A retrying storage janitor can remove the orphaned object. */ }");
  });

  it("PROJ-BREAK-file-07 only ready and scanned objects can receive short-lived signed read URLs", () => {
    const service = source("src/modules/projects/project-resource-file-service.ts");
    const start = service.indexOf("export async function issueProjectFileDownloadGrant(");
    const code = service.slice(start);
    expect(code).toContain('row.status !== "READY"');
    expect(code).toContain('row.scanStatus !== "CLEAN"');
    expect(code).toContain("!row.objectGeneration");
    expect(code).toContain('linked.visibility!=="TEAM"');
    expect(code).toContain("FILE_READ_TTL_SECONDS");
    expect(code).toContain("maxTtlSeconds: 15 * 60");
    const lifecycle = source("src/modules/storage/file-lifecycle.ts");
    expect(lifecycle).toContain("head.metadata[\"college-id\"] !== object.collegeId");
    expect(lifecycle).toContain("head.metadata[\"owner-membership-id\"] !== object.ownerMembershipId");
    expect(lifecycle).toContain("head.sizeBytes !== object.sizeBytes");
  });
});
