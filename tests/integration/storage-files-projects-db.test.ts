import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import type { MembershipRole } from "@/modules/identity/constants";
import { addProjectMember } from "@/modules/projects/member-service";
import { createProjectInstance } from "@/modules/projects/instance-service";
import { createProjectResource } from "@/modules/projects/resource-service";
import {
  assignProjectTemplateToCollege,
  createProjectTemplate,
  publishProjectTemplate,
} from "@/modules/projects/template-service";
import {
  completeProjectFileUpload,
  issueProjectFileDownloadGrant,
  issueProjectFileUploadGrant,
  listProjectFiles,
  removeProjectFile,
  updateProjectFileDetails,
} from "@/modules/projects/project-resource-file-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { deleted, pdfBytes, putFromGrant, resetFakeObjectStore, touchObject, objects } from "../support/fake-object-store";

vi.mock("@/modules/storage/s3-client", async (importOriginal) => {
  const fake = await import("../support/fake-object-store");
  return {
    ...(await importOriginal<typeof import("@/modules/storage/s3-client")>()),
    headObject: fake.fakeHead,
    getObjectStream: fake.fakeGetObjectStream,
    deleteObject: fake.fakeDelete,
  };
});

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("TEST_DATABASE_URL or DATABASE_URL is required for DB integration tests");
}
const pool = new Pool({ connectionString: databaseUrl, max: 1 });

const user = (id: string, uid: string, membership: RequestContext["membership"], systemRoles: ("SUPER_ADMIN")[] = []): RequestContext => ({
  user: { id, identityUid: uid, platformStatus: "ACTIVE", systemRoles },
  membership,
  ...(systemRoles.length ? { adminScope: null } : {}),
});
const member = (id: string, collegeId: string, roles: MembershipRole[]) => ({
  id,
  collegeId,
  organizationId: SEED_IDS.organization,
  status: "ACTIVE" as const,
  roles,
});
const superAdmin = user(SEED_IDS.superAdminUser, "seed-superadmin", null, ["SUPER_ADMIN"]);
const scopedSuperAdmin: RequestContext = {
  ...superAdmin,
  adminScope: { organizationId: SEED_IDS.organization, collegeId: SEED_IDS.collegeA },
};
const collegeAdmin = user(SEED_IDS.collegeAdminUser, "seed-college-admin", member(SEED_IDS.collegeAdminMembership, SEED_IDS.collegeA, ["COLLEGE_ADMIN"]));
const learner = user(SEED_IDS.learnerUser, "seed-learner", member(SEED_IDS.learnerCollegeAMembership, SEED_IDS.collegeA, ["LEARNER"]));
const mentor = user(SEED_IDS.facultyUser, "seed-faculty", member(SEED_IDS.facultyCollegeAMembership, SEED_IDS.collegeA, ["FACULTY", "MENTOR"]));
const outsider = user(SEED_IDS.facultyUser, "seed-faculty-b", member(SEED_IDS.facultyCollegeBMembership, SEED_IDS.collegeB, ["FACULTY", "MENTOR"]));

const SLUG = "sfp-";

async function cleanup() {
  const projects = `select id from project_instances where slug like '${SLUG}%'`;
  await pool.query(`delete from storage_file_events where subject_id in (select id from project_resource_files)`);
  await pool.query(`delete from project_resource_files where project_id in (${projects})`);
  await pool.query(`delete from project_members where project_id in (${projects})`);
  await pool.query(`delete from project_resource_audit where project_id in (${projects})`);
  await pool.query(`delete from project_resources where project_id in (${projects})`);
  await pool.query(`delete from project_tasks where project_id in (${projects})`);
  await pool.query(`delete from project_sprints where project_id in (${projects})`);
  await pool.query(`delete from project_releases where project_id in (${projects})`);
  await pool.query(`delete from project_resource_audit where project_id in (${projects})`);
  await pool.query(`delete from project_instances where slug like '${SLUG}%'`);
  await pool.query(`delete from project_template_college_assignments where template_id in (select id from project_templates where slug like '${SLUG}%')`);
  await pool.query(`delete from project_template_versions where template_id in (select id from project_templates where slug like '${SLUG}%')`);
  await pool.query(`delete from project_templates where slug like '${SLUG}%'`);
}

async function createProject() {
  const template = await createProjectTemplate(superAdmin, {
    slug: "sfp-template",
    title: "SFP Template",
    blueprint: {
      overview: { goal: "files", deliverables: ["demo"] },
      releases: [{ key: "release-1", title: "R1", sequence: 0 }],
      sprints: [{ key: "sprint-1", releaseKey: "release-1", title: "S1", sequence: 0 }],
      tasks: [{ key: "task-1", sprintKey: "sprint-1", title: "T1", priority: "MEDIUM" as const, sequence: 0 }],
      resources: [{ key: "guide", title: "Guide", url: "https://example.com/guide", required: true, sequence: 0 }],
    },
  });
  await publishProjectTemplate(superAdmin, template.template.id);
  await assignProjectTemplateToCollege(scopedSuperAdmin, template.template.id, SEED_IDS.collegeA);
  const project = await createProjectInstance(collegeAdmin, {
    collegeId: SEED_IDS.collegeA,
    templateId: template.template.id,
    slug: "sfp-project",
    title: "SFP Project",
  });
  await addProjectMember(collegeAdmin, project.id, { membershipId: SEED_IDS.learnerCollegeAMembership, role: "LEARNER" });
  await addProjectMember(collegeAdmin, project.id, {
    membershipId: SEED_IDS.facultyCollegeAMembership,
    role: "MENTOR",
    isPrimary: true,
  });
  return project;
}

async function readyFile(projectId: string, actor: RequestContext = mentor, name = "brief.pdf") {
  const bytes = pdfBytes("project brief");
  const { grant, file } = await issueProjectFileUploadGrant(actor, projectId, {
    originalName: name,
    contentType: "application/pdf",
    sizeBytes: bytes.length,
    title: "Project brief",
  });
  putFromGrant(grant, bytes);
  const done = await completeProjectFileUpload(actor, projectId, file.id);
  return { done, grant };
}

beforeAll(() => {
  process.env.APP_ENV = "test";
  process.env.R2_ACCOUNT_ID = "test-account";
  process.env.R2_ACCESS_KEY = "TESTACCESSKEYID";
  process.env.R2_SECRET_KEY = "test-secret-not-real";
  process.env.R2_PRIVATE_BUCKET = "test-private";
  delete process.env.R2_BUCKET_NAME;
  delete process.env.R2_PRIVATE_PREFIX;
});
beforeEach(async () => {
  resetFakeObjectStore();
  await cleanup();
});
afterAll(async () => {
  await cleanup();
  await pool.end();
  await closeDatabaseConnection();
});

describe("project resource files against PostgreSQL", () => {
  it("denies file signing, completion and edits after soft deletion even for admin",async()=>{
    const project=await createProject();
    const {done}=await readyFile(project.id);
    const bytes=pdfBytes("pending");
    const uploading=await issueProjectFileUploadGrant(mentor,project.id,{
      originalName:"pending.pdf",contentType:"application/pdf",
      sizeBytes:bytes.length,title:"Pending resource",
    });
    putFromGrant(uploading.grant,bytes);
    await pool.query("update project_instances set deleted_at=now() where id=$1",[project.id]);
    await expect(issueProjectFileDownloadGrant(collegeAdmin,project.id,done.id))
      .rejects.toMatchObject({code:"STORAGE_NOT_FOUND"});
    await expect(completeProjectFileUpload(collegeAdmin,project.id,uploading.file.id))
      .rejects.toMatchObject({code:"STORAGE_NOT_FOUND"});
    await expect(updateProjectFileDetails(collegeAdmin,project.id,done.id,{
      title:"Invalid change",
    })).rejects.toMatchObject({code:"STORAGE_NOT_FOUND"});
    await expect(removeProjectFile(collegeAdmin,project.id,done.id))
      .rejects.toMatchObject({code:"STORAGE_NOT_FOUND"});
    const saved=await pool.query<{status:string;title:string}>(
      "select status,title from project_resource_files where id=$1",[done.id]);
    expect(saved.rows[0]).toMatchObject({status:"READY",title:"Project brief"});
    const pending=await pool.query<{status:string}>(
      "select status from project_resource_files where id=$1",[uploading.file.id]);
    expect(pending.rows[0]?.status).toBe("UPLOADING");
  });

  it("lets mentors upload and members download verified files only", async () => {
    const project = await createProject();
    const { done } = await readyFile(project.id);
    expect(done).toMatchObject({ status: "READY", title: "Project brief", originalName: "brief.pdf" });
    expect(JSON.stringify(done)).not.toMatch(/private\/|https?:/);

    const learnerList = await listProjectFiles(learner, project.id);
    expect(learnerList.map((file) => file.id)).toEqual([done.id]);
    const grant = await issueProjectFileDownloadGrant(learner, project.id, done.id);
    expect(grant.url).toContain("X-Amz-Signature=");
    expect(grant.expiresInSeconds).toBeLessThanOrEqual(900);
    expect(new URL(grant.url).searchParams.get("response-content-disposition")).toMatch(/^attachment;/);
    expect((await issueProjectFileDownloadGrant(collegeAdmin, project.id, done.id, { disposition: "inline" })).file.id).toBe(done.id);

    // Learners may upload only while the project is ACTIVE (this one is not
    // started), and can never edit or delete; denial does not leak existence.
    await expect(
      issueProjectFileUploadGrant(learner, project.id, { originalName: "x.pdf", contentType: "application/pdf", sizeBytes: 10 }),
    ).rejects.toMatchObject({ code: "STORAGE_PARENT_NOT_AVAILABLE" });
    await expect(updateProjectFileDetails(learner, project.id, done.id, { title: "x" })).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
    await expect(removeProjectFile(learner, project.id, done.id)).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });

    // A mentor from another college sees nothing.
    await expect(listProjectFiles(outsider, project.id)).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
    await expect(issueProjectFileDownloadGrant(outsider, project.id, done.id)).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });

    const events = await pool.query<{ event_type: string; detail: unknown }>(
      `select event_type, detail from storage_file_events where subject_id = $1`,
      [done.id],
    );
    expect(events.rows.filter((row) => row.event_type === "DOWNLOAD_GRANTED")).toHaveLength(2);
    expect(JSON.stringify(events.rows)).not.toMatch(/https?:|X-Amz|private\//);
  });

  it("hides in-flight and failed files from learners but shows them to mentors", async () => {
    const project = await createProject();
    const bytes = pdfBytes();
    const { file } = await issueProjectFileUploadGrant(mentor, project.id, {
      originalName: "draft.pdf",
      contentType: "application/pdf",
      sizeBytes: bytes.length,
    });
    expect(file.title).toBe("draft");
    expect(await listProjectFiles(learner, project.id)).toEqual([]);
    expect((await listProjectFiles(mentor, project.id)).map((f) => f.id)).toEqual([file.id]);
    await expect(issueProjectFileDownloadGrant(learner, project.id, file.id)).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
    await expect(issueProjectFileDownloadGrant(mentor, project.id, file.id)).rejects.toMatchObject({ code: "STORAGE_FILE_NOT_READY" });
    await expect(completeProjectFileUpload(mentor, project.id, file.id)).rejects.toMatchObject({ code: "STORAGE_UPLOAD_NOT_FOUND" });
  });

  it("updates details, soft deletes and stops serving the file", async () => {
    const project = await createProject();
    const { done } = await readyFile(project.id);
    const updated = await updateProjectFileDetails(mentor, project.id, done.id, { title: "Renamed", description: "Read first" });
    expect(updated).toMatchObject({ title: "Renamed", description: "Read first" });
    const removed = await removeProjectFile(mentor, project.id, done.id);
    expect(removed.status).toBe("DELETED");
    expect(deleted).toHaveLength(1);
    expect(await listProjectFiles(mentor, project.id)).toEqual([]);
    await expect(issueProjectFileDownloadGrant(learner, project.id, done.id)).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
    expect((await removeProjectFile(mentor, project.id, done.id)).status).toBe("DELETED");
  });

  it("links a file to an active project resource and rejects foreign resources", async () => {
    const project = await createProject();
    const resource = await createProjectResource(mentor, project.id, { title: "Spec", description: "Spec document" });
    const bytes = pdfBytes();
    const linked = await issueProjectFileUploadGrant(mentor, project.id, {
      originalName: "spec.pdf",
      contentType: "application/pdf",
      sizeBytes: bytes.length,
      resourceId: resource.id,
    });
    expect(linked.file.resourceId).toBe(resource.id);
    await expect(
      issueProjectFileUploadGrant(mentor, project.id, {
        originalName: "spec.pdf",
        contentType: "application/pdf",
        sizeBytes: bytes.length,
        resourceId: "70000000-0000-4000-8000-0000000000aa",
      }),
    ).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
  });

  it("blocks uploads to archived projects, honours limits and requires an uploader membership", async () => {
    const project = await createProject();
    await expect(
      issueProjectFileUploadGrant(scopedSuperAdmin, project.id, { originalName: "a.pdf", contentType: "application/pdf", sizeBytes: 10 }),
    ).rejects.toMatchObject({ code: "STORAGE_UPLOADER_MEMBERSHIP_REQUIRED" });
    await expect(
      issueProjectFileUploadGrant(mentor, project.id, { originalName: "big.zip", contentType: "application/zip", sizeBytes: 60 * 1024 * 1024 }),
    ).rejects.toMatchObject({ code: "STORAGE_FILE_TOO_LARGE" });
    await expect(
      issueProjectFileUploadGrant(mentor, project.id, { originalName: "page.html", contentType: "text/html", sizeBytes: 10 }),
    ).rejects.toMatchObject({ code: "STORAGE_TYPE_NOT_ALLOWED" });
    expect(
      (await issueProjectFileUploadGrant(mentor, project.id, { originalName: "notes.md", contentType: "text/markdown", sizeBytes: 10 })).file.status,
    ).toBe("UPLOADING");

    await pool.query(`update project_instances set status = 'ARCHIVED' where id = $1`, [project.id]);
    await expect(
      issueProjectFileUploadGrant(mentor, project.id, { originalName: "a.pdf", contentType: "application/pdf", sizeBytes: 10 }),
    ).rejects.toMatchObject({ code: "STORAGE_PARENT_NOT_AVAILABLE" });
  });

  it("does not serve a file whose object was replaced after verification", async () => {
    const project = await createProject();
    const { done } = await readyFile(project.id);
    touchObject([...objects.keys()][0]!);
    await expect(issueProjectFileDownloadGrant(learner, project.id, done.id)).rejects.toMatchObject({ code: "STORAGE_FILE_NOT_READY" });
  });
});

describe("database guarantees for project resource files", () => {
  it("rejects college and project mismatches through composite foreign keys", async () => {
    const project = await createProject();
    const insert = (collegeId: string, uploader: string, resourceId: string | null, key: string) =>
      pool.query(
        `insert into project_resource_files
          (college_id, project_id, resource_id, uploader_membership_id, title, object_key, upload_token_hash,
           upload_expires_at, original_name, declared_content_type, declared_size_bytes, created_by_user_id)
         values ($1,$2,$3,$4,'t',$5,$6, now() + interval '10 minutes','a.pdf','application/pdf',10,$7)`,
        [collegeId, project.id, resourceId, uploader, key, "c".repeat(64), SEED_IDS.facultyUser],
      );
    const keyFor = (college: string, uploader: string, id: string) => `private/${college}/${uploader}/project-resource/${id}`;

    // The project belongs to college A, so college B cannot own a file for it.
    await expect(
      insert(SEED_IDS.collegeB, SEED_IDS.facultyCollegeBMembership, null, keyFor(SEED_IDS.collegeB, SEED_IDS.facultyCollegeBMembership, "70000000-0000-4000-8000-000000000021")),
    ).rejects.toMatchObject({ constraint: "project_resource_files_project_college_fk" });
    // The uploader membership must belong to the stated college.
    await expect(
      insert(SEED_IDS.collegeA, SEED_IDS.facultyCollegeBMembership, null, keyFor(SEED_IDS.collegeA, SEED_IDS.facultyCollegeBMembership, "70000000-0000-4000-8000-000000000022")),
    ).rejects.toMatchObject({ constraint: "project_resource_files_uploader_college_fk" });
    // A resource that is not part of the project is rejected.
    await expect(
      insert(SEED_IDS.collegeA, SEED_IDS.facultyCollegeAMembership, "70000000-0000-4000-8000-0000000000bb", keyFor(SEED_IDS.collegeA, SEED_IDS.facultyCollegeAMembership, "70000000-0000-4000-8000-000000000023")),
    ).rejects.toMatchObject({ constraint: "project_resource_files_resource_project_fk" });
    // A key outside the college and uploader scope is rejected.
    await expect(
      insert(SEED_IDS.collegeA, SEED_IDS.facultyCollegeAMembership, null, "private/elsewhere/project-resource/x"),
    ).rejects.toMatchObject({ constraint: "project_resource_files_object_key_ck" });
    await insert(SEED_IDS.collegeA, SEED_IDS.facultyCollegeAMembership, null, keyFor(SEED_IDS.collegeA, SEED_IDS.facultyCollegeAMembership, "70000000-0000-4000-8000-000000000024"));
  });
});
