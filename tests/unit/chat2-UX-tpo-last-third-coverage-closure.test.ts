import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {TPO_EVERYONE_DESCRIPTION,TPO_EVERYONE_TITLE,TPO_EVERYONE_WELCOME} from "@/modules/placements/tpo-team-everyone-model";
import {tpoVerificationQuerySchema} from "@/modules/verification/tpo-queue-server-model";

describe("TPO last third page-level UX coverage closure",()=>{
 it("UX-tpo-team-everyone-01 retains permission-scoped, recoverable Everyone messages with paging and IST dates",()=>{
  const s=readFileSync("src/app/(authenticated)/tpo/team/everyone/page.tsx","utf8");
  expect(s).toContain('hasMembershipRole(context,"TPO")');
  expect(s).toContain("AuthorizationError");
  expect(s).toContain('result.status==="NOT_REGISTERED"');
  expect(s).toContain('result.status==="FAILED"');
  expect(s).toContain("Retry Everyone");
  expect(s).toContain('role="status"');
  expect(s).toContain('aria-label="Everyone messages"');
  expect(s).toContain("Newer messages");
  expect(s).toContain("Older messages");
  expect(s).toContain('timeZone:"Asia/Kolkata"');
  expect(s).toContain("TpoEveryoneControls");
  expect(TPO_EVERYONE_TITLE).toBeTruthy();
  expect(TPO_EVERYONE_DESCRIPTION).toBeTruthy();
  expect(TPO_EVERYONE_WELCOME).toBeTruthy();
  expect(s).not.toContain("min-h-10");
 });
 it("UX-tpo-verification-01 preserves invalid, denied, disabled, unavailable, empty and paginated states",()=>{
  const s=readFileSync("src/app/(authenticated)/tpo/verification/page.tsx","utf8");
  expect(s).toContain("Invalid verification filters");
  expect(s).toContain("Clear filters");
  expect(s).toContain("Could not load the queue. Please try again");
  expect(s).toContain("You cannot verify profiles here");
  expect(s).toContain("Your college admin has not allowed");
  expect(s).toContain("Your verification access has been removed");
  expect(s).toContain("TpoVerificationPanel");
  expect(s).toContain("tpoVerificationHref");
  expect(s).toContain('aria-label="Verification pages"');
  expect(s).toContain("Showing the first 1,000 students");
  expect(s).toContain("TpoSafeCsvDownload");
  expect(s).toContain('className="min-h-11');
  expect(s).not.toContain("min-h-10");
 });
 it("UX-tpo-verification-02 rejects invalid query values before loading private queue",()=>{
  const valid=tpoVerificationQuerySchema.safeParse({});
  expect(valid.success).toBe(true);
  expect(tpoVerificationQuerySchema.safeParse({page:"-1",tab:"WAITING"}).success).toBe(false);
  expect(tpoVerificationQuerySchema.safeParse({page:"1",tab:"GARBAGE"}).success).toBe(false);
 });
});
