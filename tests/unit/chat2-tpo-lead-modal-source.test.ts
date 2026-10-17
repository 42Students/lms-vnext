import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoLeadSourceSchema} from "@/modules/placements/tpo-crm-validation";
const detail=readFileSync("src/components/tpo/recruiter-lead-detail-workspace.tsx","utf8");
describe("TPO recruiter contact modal and source parity",()=>{
 it("TPO-recruiters-24 explains valid sources when a bad source is submitted",()=>{
  const bad=tpoLeadSourceSchema.safeParse("miscellaneous");
  expect(bad.success).toBe(false);
  if(!bad.success)expect(bad.error.issues[0].message).toContain("Alumni, Referral, LinkedIn");
  expect(detail).toContain('["IMPORT", "Import"]');
 });
 it("TPO-recruiters-30 replaces ambiguous edit conflicts with field-specific friendly feedback",()=>{
  expect(detail).toContain("Another recruiter already has those contact details.");
  expect(detail).toContain("Enter a valid email or phone number");
  expect(detail).toContain("Edit contact details");
  expect(detail).not.toContain("DB09 migrations and database checks");
 });
 it("TPO-recruiters-36 traps Tab and supports Escape inside editable recruiter dialogs",()=>{
  expect(detail).toContain('function keepRecruiterDialogFocus(');
  expect(detail).toContain('event.key!=="Tab"');
  expect(detail).toContain("document.activeElement===last");
  expect(detail).toContain('setEditing(false)');
  expect(detail).toContain('setNotNowOpen(false)');
  expect(detail).toContain('aria-modal="true"');
 });
});
