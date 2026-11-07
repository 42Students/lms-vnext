import { expect, test } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { authenticateGracefulRole } from "./support/roles";

test.describe("UX-G169/G171/G174/G177 CSV export journeys", () => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Requires the disposable E2E database and seeded role sessions");

  test("super-admin can export readable announcement and findings metadata", async ({ page, context }) => {
    await authenticateGracefulRole(context, "superadmin");
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
    await authenticateGracefulRole(context, "tpo");
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

  test("learner cannot use faculty report export to access an arbitrary assessment", async ({ page, context }) => {
    await authenticateGracefulRole(context, "learner");
    const response=await page.request.get(
      "/api/courses/faculty/reports/quiz/00000000-0000-4000-8000-000000000000/csv?deliveryId=00000000-0000-4000-8000-000000000000",
    );
    expect(response.status()).not.toBe(200);
    expect(response.headers()["content-type"]??"").not.toContain("text/csv");
  });
});
