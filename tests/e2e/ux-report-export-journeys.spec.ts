import { expect, test, type BrowserContext } from "@playwright/test";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { authenticateGracefulRole } from "./support/roles";

/** Real first-party OTP/device-session acceptance on the disposable E2E DB.
 * Bare E2E identity cookies never satisfy privileged export step-up checks.
 * Only development-allowlisted seeded contacts receive the workflow QA code.
 */
async function signInWithSeededOtp(
  context: BrowserContext,
  email: "superadmin.seed@example.com" | "faculty.seed@example.com",
  {superAdmin = false, selectedRole}: {superAdmin?: boolean; selectedRole?: "TPO" | "FACULTY"} = {},
) {
  const baseUrl = "http://localhost:3000";
  const otp = process.env.AUTH_TEST_OTP;
  expect(otp, "dedicated development-only OTP fixture must be configured").toMatch(/^\d{6}$/);
  await context.clearCookies();
  const started = await context.request.post(baseUrl + "/api/auth/login/start", {
    headers: {origin: baseUrl}, data: {channel: "EMAIL", contact: email},
  });
  expect(started.status(), "seeded sign-in challenge must be issued").toBe(200);
  const attempt = await started.json() as {attemptId: string; requiresSecondFactor: boolean};
  expect(attempt.requiresSecondFactor).toBe(superAdmin);
  const verified = await context.request.post(baseUrl + "/api/auth/login/verify", {
    headers: {origin: baseUrl},
    data: {
      attemptId: attempt.attemptId, code: otp,
      ...(superAdmin ? {secondCode: otp} : {}),
    },
  });
  expect(verified.status(), "OTP verification must issue a real device session").toBe(200);
  expect((await verified.json() as {ok: boolean}).ok).toBe(true);
  const cookies = await context.cookies(baseUrl);
  expect(cookies.some(cookie => cookie.name === "lms_session"),
    "step-up acceptance requires a first-party device cookie").toBe(true);

  if (selectedRole) {
    // The E2E preparation script grants TPO to this seeded faculty membership;
    // a role-selection cookie alone is never a permission or membership grant.
    const selection = await context.request.post(baseUrl + "/api/auth/memberships", {
      headers: {origin: baseUrl},
      data: {membershipId: SEED_IDS.facultyCollegeAMembership, role: selectedRole},
    });
    expect(selection.status(), "TPO role must be a persisted, selectable grant").toBe(200);
  }
}


test.describe("UX-G169/G171/G174/G177 CSV export journeys", () => {
  // Shared seeded Super Admin identity uses one live OTP challenge per login.
  // Do not invalidate another browser case's OTP via concurrent sign-in.
  test.describe.configure({mode:"serial"});
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Requires the disposable E2E database and seeded role sessions");

  test("super-admin can export readable announcement and findings metadata", async ({ page, context }) => {
    await signInWithSeededOtp(context, "superadmin.seed@example.com", {superAdmin: true});
    await page.setViewportSize({width:1280,height:800});
    for (const [url,filename,header] of [
      ["/api/admin/announcements/export","ux-g169-announcements.csv","Notice ID"],
      ["/api/tracker/audit-findings/export","ux-g171-findings.csv","Finding ID"],
    ] as const) {
      const response=await page.request.get(url);
      expect(response.status(), `authorized GET ${url}`).toBe(200);
      expect(response.headers()["content-type"]).toContain("text/csv");
      const csv=await response.text();
      expect(csv.startsWith("\uFEFF")).toBe(true);
      expect(csv).toContain(header);
      expect(csv).not.toMatch(/sender email|reporter email|recipient_phone|private notes/i);
      writeFileSync(`test-results/${filename}`,csv,"utf8");
    }
  });

  test("UX-G168 freshly signed-in Super Admin downloads bounded private faculty CSV",async({page,context})=>{
    await signInWithSeededOtp(context,"superadmin.seed@example.com",{superAdmin:true});
    // The faculty directory is college-scoped and does not widen a global
    // Super Admin's audience by default. Choose an authorized persisted college.
    const scoped=await context.request.post("http://localhost:3000/api/auth/admin-scope",{
      headers:{origin:"http://localhost:3000"},
      data:{kind:"college",collegeId:SEED_IDS.collegeA},
    });
    expect(scoped.status(),"authorized college selection").toBe(200);
    await page.setViewportSize({width:1280,height:850});
    const response=await page.request.get("/api/admin/faculty/export");
    expect(response.status(),"authorized Super Admin faculty roster").toBe(200);
    expect(response.headers()["content-type"]).toContain("text/csv");
    expect(response.headers()["content-disposition"]).toContain("attachment;");
    expect(response.headers()["cache-control"]).toContain("private");
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-export-row-cap"]).toBe("250");
    const csv=await response.text();
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Record ID","Name","Context","Status","Additional persisted fields"');
    expect(csv).not.toMatch(/password|otp|auth_secret|phoneE164/i);
    writeFileSync("test-results/ux-g168-authorized-faculty.csv",csv,"utf8");
    const invalid=await page.request.get("/api/admin/faculty/export?page=2");
    expect(invalid.status(),"client page override rejected").toBeGreaterThanOrEqual(400);
    expect(invalid.headers()["content-type"]??"").not.toContain("text/csv");
  });

  test("learner cannot download privileged announcement, findings or TPO exports", async ({ page, context }) => {
    await authenticateGracefulRole(context, "learner");
    await page.setViewportSize({width:390,height:844});
    for (const url of [
      "/api/admin/announcements/export",
      "/api/tracker/audit-findings/export",
      "/api/placements/tpo/campaigns/history/export",
    ]) {
      const response=await page.request.get(url);
      expect([401,403], `read must fail closed: ${url}`).toContain(response.status());
      expect(response.headers()["content-type"]).not.toContain("text/csv");
    }
  });

  test("TPO messaging history CSV keeps nine fields and provider-only acceptance", async ({ page, context }) => {
    await signInWithSeededOtp(context, "faculty.seed@example.com", {selectedRole: "TPO"});
    await page.setViewportSize({width:320,height:780});
    const response=await page.request.get("/api/placements/tpo/campaigns/history/export");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/csv");
    const csv=await response.text();
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"provider_accepted"');
    expect(csv).toContain('"matching_total"');
    expect(csv).not.toMatch(/recipient_email|recipient_phone|handset_delivered/i);
    writeFileSync("test-results/ux-g177-messaging.csv",csv,"utf8");
  });

  test("Faculty exports persisted Section assignment and quiz, not another Section", async ({page,context}) => {
    const fixture=JSON.parse(readFileSync(join(tmpdir(),"lms-vnext-ux-g174-fixture.json"),"utf8")) as {
      assignmentId:string;quizId:string;deliveryId:string;otherDeliveryId:string;
    };
    await signInWithSeededOtp(context,"faculty.seed@example.com",{selectedRole:"FACULTY"});
    await page.setViewportSize({width:390,height:844});
    for(const [kind,assessmentId] of [
      ["assignment",fixture.assignmentId],["quiz",fixture.quizId],
    ] as const){
      const url="/api/courses/faculty/reports/"+kind+"/"+assessmentId+
        "/csv?deliveryId="+fixture.deliveryId;
      const result=await page.request.get(url);
      expect(result.status(),"Faculty should download authorized "+kind).toBe(200);
      expect(result.headers()["content-type"]).toContain("text/csv");
      expect(result.headers()["content-disposition"]).toContain("attachment;");
      const csv=await result.text();
      expect(csv.startsWith("\uFEFF")).toBe(true);
      expect(csv).toContain('"Learner","Response"');
      expect(csv).not.toMatch(/learner.seed@example.com|membershipId|phoneE164/);
      writeFileSync("test-results/ux-g174-"+kind+".csv",csv);
      const mismatched=await page.request.get(
        "/api/courses/faculty/reports/"+kind+"/"+assessmentId+
        "/csv?deliveryId="+fixture.otherDeliveryId);
      expect(mismatched.status(),"other Section rejected").not.toBe(200);
      expect(mismatched.headers()["content-type"]??"").not.toContain("text/csv");
      const duplicate=await page.request.get(url+"&deliveryId="+fixture.otherDeliveryId);
      expect(duplicate.status(),"duplicate Section selector rejected").toBeGreaterThanOrEqual(400);
    }
  });

  test("Learner cannot export real faculty assessments",async ({page,context})=>{
    const fixture=JSON.parse(readFileSync(join(tmpdir(),"lms-vnext-ux-g174-fixture.json"),"utf8")) as {
      assignmentId:string;quizId:string;deliveryId:string;
    };
    await authenticateGracefulRole(context,"learner");
    for(const [kind,id] of [
      ["assignment",fixture.assignmentId],["quiz",fixture.quizId],
    ] as const){
      const r=await page.request.get("/api/courses/faculty/reports/"+kind+
        "/"+id+"/csv?deliveryId="+fixture.deliveryId);
      expect([401,403],"Learner is not Faculty").toContain(r.status());
      expect(r.headers()["content-type"]??"").not.toContain("text/csv");
    }
  });

  test("learner cannot use faculty report export to access an arbitrary assessment", async ({ page, context }) => {
    await authenticateGracefulRole(context, "learner");
    const response=await page.request.get(
      "/api/courses/faculty/reports/quiz/00000000-0000-4000-8000-000000000000/csv?deliveryId=00000000-0000-4000-8000-000000000000",
    );
    expect(response.status()).not.toBe(200);
    expect(response.headers()["content-type"]??"").not.toContain("text/csv");
  });
});
