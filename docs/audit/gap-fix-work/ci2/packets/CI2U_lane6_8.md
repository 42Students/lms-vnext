# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-tpo-reports-duplicate-params-break-15.test.ts (1 failing)
- UX-tpo-LAST-THIRD-01: reports refuse ambiguous scope/filters without inventing zeros > renders an honest 14-route recovery state without a fictitious placement count

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  +
  ```

## tests/unit/chat3-faculty-attendance-exhaustive-r1.test.ts (1 failing)
- FAC attendance time, edit-state and version boundaries > FAC-ATT-05 schedule schema requires confirmation, strict inputs and valid ordering

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat3-superadmin-academics-people-audit-r2.test.ts (4 failing)
- Chat-3 second-eye Super Admin academics and people audit > SA3-ACADEMICS-01 selected college controls workspace and no-scope state

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="Select a college scope"'
  - Expected
  + Received
  - title="Select a college scope"
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { isSuperAdmin } from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- Chat-3 second-eye Super Admin academics and people audit > SA3-PEOPLE-04 directory has explicit no-scope state, read-only masking, URL filter and pagination

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'data.contactVisible?(row.email??"No e…'
  - Expected
  + Received
  - data.contactVisible?(row.email??"No email recorded"):"Email masked"
  + import Link from "next/link";
  + import { SuperAdminPeopleCsvControl } from "@/components/admin/super-admin-people-csv-control";
  + import { superAdminPeopleExportHref } from "@/modules/people/admin-users-export-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- Chat-3 second-eye Super Admin academics and people audit > SA3-RECRUITERS-01 alias reuses canonical HR permissions and does not fork data

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'export { default } from "../hr/page"'
  - Expected
  + Received
  - export { default } from "../hr/page"
  + import Link from "next/link";
  + import {PageHeader} from "@/components/ui/page-header";
  + import SuperAdminHrPage from "../hr/page";
  + /** Legacy Recruiter accounts is a Placements section, not a separate
  ```
- Chat-3 second-eye Super Admin academics and people audit > SA3-PEOPLE-08 membership list retains version-safe page limits and explicit empty copy

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'empty={<p className="m-0 text-sm text…'
  - Expected
  + Received
  - empty={<p className="m-0 text-sm text-muted-foreground">No records to show.</p>}
  + import Link from "next/link";
  + import { SuperAdminPeopleCsvControl } from "@/components/admin/super-admin-people-csv-control";
  + import { superAdminPeopleExportHref } from "@/modules/people/admin-users-export-model";
  + import { redirect } from "next/navigation";
  ```

## tests/unit/chat4-college-contacts-and-groups-input-hardening.test.ts (1 failing)
- College Admin contact directory and study-group export boundaries > COL-CONTACTS-BOUNDARY-01 rejects exponent, hex, signed, whitespace and fractional URL page controls

  ```
  AssertionError: expected [Function] to throw an error
  ❯ tests/unit/chat4-college-contacts-and-groups-input-hardening.test.ts:33:71
  31|     expect(collegeContactsQuerySchema.parse({ page: 3, pageSize: 50 })…
  32|     for (const value of ["0x10", "1e2", " 2", "+2", "2.0", "2 ", "-1",…
  33|       expect(() => parseCollegeContactsSearchParams({ page: value })).…
  |                                                                       ^
  34|     }
  35|     for (const value of ["0x14", "2e1", " 20", "+20", "20.0", "20 ", "…
  ```

## tests/unit/chat4-college-ux-redirect-coverage.test.ts (4 failing)
- chat-4 College UX canonical redirects and shared-kit coverage > COL-ux-redirect-01 People entry lands on read-only contacts rather than privileged account management

  ```
  AssertionError: expected 'import CollegeContactsPage from "../c…' to contain 'redirect("/college/contacts")'
  - Expected
  + Received
  - redirect("/college/contacts")
  + import CollegeContactsPage from "../contacts/page";
  +
  + /** Keep the historical /college-admin/people destination on the canonical
  +  * college workspace URL. The old shared directory maps to role-specific
  ```
- chat-4 College UX canonical redirects and shared-kit coverage > COL-ux-redirect-02 legacy workspace list resolves to one canonical Projects list

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'redirect("/college/projects")'
  - Expected
  + Received
  - redirect("/college/projects")
  + import { redirect } from "next/navigation";
  +
  + /** Preserve old Workspaces bookmarks and the selected project filter/tab context. */
  + export default async function LegacyCollegeWorkspacesRedirect({searchParams}:{
  ```
- chat-4 College UX canonical redirects and shared-kit coverage > COL-ux-redirect-03 legacy workspace identifiers are URL-encoded to avoid forged segments

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'redirect("/college/projects/"'
  - Expected
  + Received
  - redirect("/college/projects/"
  + import { redirect } from "next/navigation";
  +
  + /** Existing bookmarks, including deep-linked template prompts, remain usable. */
  + export default async function LegacyCollegeWorkspaceRedirect({
  ```
- chat-4 College UX canonical redirects and shared-kit coverage > COL-ux-scroll-01 wide people lists and imports have a labelled scroll cue through DataTable

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain '<ScrollCue'
  - Expected
  + Received
  - <ScrollCue
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat4-project-archive-dialog-guard.test.tsx (2 failing)
- PROJ-BREAK-COLLEGE-04-ARCHIVE-08 double submit and modal safety > shows Archive only for mutable workspaces and Restore for archived ones

  ```
  Error: [vitest] No "usePathname" export is defined on the "next/navigation" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("next/navigation"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- PROJ-BREAK-COLLEGE-04-ARCHIVE-08 double submit and modal safety > uses synchronous re-entrancy guards for both archive and restore and only releases them in finally

  ```
  AssertionError: Target cannot be null or undefined.
  ❯ tests/unit/chat4-project-archive-dialog-guard.test.tsx:29:58
  27|  it("uses synchronous re-entrancy guards for both archive and restore …
  28|   const source=readFileSync("src/components/projects/project-archive-c…
  29|   expect(source.match(/if\(inFlight.current\)return;/g)).toHaveLength(…
  |                                                          ^
  30|   expect(source.match(/inFlight.current=true;/g)).toHaveLength(2);
  31|   expect(source.match(/inFlight.current=false;/g)).toHaveLength(2);
  ```
