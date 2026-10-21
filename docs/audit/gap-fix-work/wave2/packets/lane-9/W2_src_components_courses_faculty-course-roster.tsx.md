# Work packet (wave 2): edit src/components/courses/faculty-course-roster.tsx

32 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u001-faculty-course-tab.md, docs/audit/gap2/lane-3/course-student-roster.md

## G2-18-001-011  [P2] GAP  facet F02  effort M
- Legacy: Legacy Students tab uses sr-only title, visible `Class list` hero and metric chips before class select/search. `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:310-386`
- vNext now: vNext Students route adds PageHeader and roster with separate grid metrics and filters. `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:33-46`, `src/components/courses/faculty-course-roster.tsx:123-183`
- Fix: Align students hierarchy, hero typography, metric chip style, and toolbar sequence.

## G2-18-001-023  [P2] GAP  facet F04  effort S
- Legacy: Legacy student display uses first_name+last_name, missing name `—`, roll `Roll not assigned`. `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:64-95`, `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:118-141`
- vNext now: vNext uses displayName or email or `Learner <uuid>`, and a roll StatusBadge. `src/components/courses/faculty-course-roster.tsx:27-42`, `src/components/courses/faculty-course-roster.tsx:200-210`
- Fix: Align displayed name, fallback and roll formatting to legacy and document migration mapping.

## G2-18-001-024  [P2] GAP  facet F04  effort M
- Legacy: Legacy shows avatar image from known URL with colored initials fallback. `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:73-113`
- vNext now: vNext only uses optional authorized photoDownloadUrl; initials when not provisioned. `src/components/courses/faculty-course-roster.tsx:18-23`, `src/components/courses/faculty-course-roster.tsx:200-206`, `src/components/courses/faculty-course-roster.tsx:241-250`
- Fix: Connect authorized profile photo route where available without exposing third-party image URLs.

## G2-18-001-031  [P2] GAP  facet F05  effort M
- Legacy: Legacy mobile roster switches to independently rendered cards instead of desktop table. `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:431-475`
- vNext now: vNext renders responsive table layout with generic pagination. `src/components/courses/faculty-course-roster.tsx:189-235`
- Fix: At mobile breakpoint render compact cards with identity, Roll No and Contact, same sort.

## G2-18-001-048  [P2] GAP  facet F09  effort S
- Legacy: Legacy student photo Modal centered max width min(360px, viewport minus 32px), shows image or initials, name and roll. `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:479-500`
- vNext now: vNext photo preview uses different UI and says `No photo is available for this student.` `src/components/courses/faculty-course-roster.tsx:239-251`
- Fix: Match legacy modal dimensions, text, portrait fallback and close semantics.

## G2-18-001-077  [P2] GAP  facet F16  effort M
- Legacy: Legacy mobile roster switches table to cards at Antd `Grid.useBreakpoint` xs/sm. `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:205-206`, `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:412-475`
- vNext now: vNext roster uses a general responsive data table and pagination. `src/components/courses/faculty-course-roster.tsx:187-235`
- Fix: Render the legacy phone-specific card structure at xs/sm viewport and check 375/768 widths.

## G2-3-009-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:317-349`
- vNext now: `src/components/courses/faculty-course-roster.tsx:122-153`
- Fix: Old Class list hero title, explanatory copy and three inline metric chips before toolbar, new numeric 3-column stat sections before Class list area.

## G2-3-009-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:351-382`
- vNext now: `src/components/courses/faculty-course-roster.tsx:144-184`
- Fix: Legacy class selector and search share one toolbar, new class switch via `?cls` route but no select in roster toolbar.

## G2-3-009-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:411-467`
- vNext now: `src/components/courses/faculty-course-roster.tsx:193-236`
- Fix: Legacy desktop Table plus intentionally separate phone cards, new responsive DataTable and pager; clone mobile cards.

## G2-3-009-007  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:7-15`; `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:326-347`
- vNext now: `src/components/courses/faculty-course-roster.tsx:124-143`
- Fix: Legacy Students icon badges Team/Idcard/Phone and colored metric chips, vNext text-only sections. Restore icons and exact colored tones.

## G2-3-009-008  [P2] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:352-365`
- vNext now: `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:18-26`; `src/components/courses/faculty-course-roster.tsx:154-184`
- Fix: Legacy class Select popup accessible from roster toolbar if >1 assignment, vNext has no visible selector though query transition exists.

## G2-3-009-009  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:366-374`
- vNext now: `src/components/courses/faculty-course-roster.tsx:154-166`
- Fix: Legacy prefix SearchOutlined and allowClear X with placeholder `Search by name, roll no, phone or email`; new no icon/clear and different placeholder.

## G2-3-009-010  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:375-381`
- vNext now: `src/components/courses/faculty-course-roster.tsx:180-183`
- Fix: Legacy search chip `Showing X of Y` only when searching, new `Showing {pageRows} of {filtered} students` always, mixed denominators.

## G2-3-009-011  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:98-115`
- vNext now: `src/components/courses/faculty-course-roster.tsx:199-216`
- Fix: Legacy avatar 8 deterministic tints and image preview, vNext uniform primary-subtle circle and initials while photo fallback only in modal.

## G2-3-009-012  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:64-96`
- vNext now: `src/components/courses/faculty-course-roster.tsx:15-32`
- Fix: Old fallback name `—` and roll missing `Roll not assigned`, new name email/membership ID fallback and same roll label; match privacy-safe fallback decision.

## G2-3-009-013  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:53-62`
- vNext now: `src/components/courses/faculty-course-roster.tsx:219-223`
- Fix: Legacy Indian mobile formats 98765 43210 / +91 98765 43210, new displays E.164 raw string.

## G2-3-009-015  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:336-348`
- vNext now: `src/components/courses/faculty-course-roster.tsx:124-141`
- Fix: Old `X students`, `N without a roll number`/`All have roll numbers`, `N contacts` chips; new metrics use title first and contact count includes email-only contact, different denominator.

## G2-3-009-019  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:433-459`
- vNext now: `src/components/courses/faculty-course-roster.tsx:193-230`
- Fix: Phone cards legacy show avatar,name,Roll No, Contact, no Email; new DataTable priority includes email/phone differently.

## G2-3-009-026  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:469-498`
- vNext now: `src/components/courses/faculty-course-roster.tsx:238-251`
- Fix: Legacy centered photo Modal width min(360px,100vw-32px), h3 student name, Roll N; vNext Dialog description policy and `No photo is available` text.

## G2-3-009-027  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:98-115`
- vNext now: `src/components/courses/faculty-course-roster.tsx:199-216`
- Fix: Legacy clicking avatar opens photo preview of validated image URL or initials, new always initials in table and photo URL restricted same-origin; preserve safe preview.

## G2-3-009-034  [P2] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:290-293`
- vNext now: `src/components/courses/faculty-course-roster.tsx:90-94`
- Fix: Legacy `contacts` metric counts students with nonblank mobile only, new counts email OR phone; change formula or label.

## G2-3-009-042  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:203-206`; `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:411-465`
- vNext now: `src/components/courses/faculty-course-roster.tsx:193-236`
- Fix: Legacy below md/768 mounts mobile cards instead of table; vNext uses DataTable responsive cell priority, no explicit separate card DOM.

## G2-3-009-043  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:433-459`
- vNext now: `src/components/courses/faculty-course-roster.tsx:199-229`
- Fix: Old mobile shows Contact as text, intentionally not actionable call/email, vNext phone/email link remains available on responsive table.

## G2-3-009-044  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:102-115`; `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:469-498`
- vNext now: `src/components/courses/faculty-course-roster.tsx:199-215`; `src/components/courses/faculty-course-roster.tsx:238-251`
- Fix: Legacy avatar aria `View {student.name} profile photo`, vNext `Preview avatar for ...` and modal title `Photo preview`; align semantic name.

## G2-3-009-046  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:327-349`
- vNext now: `src/components/courses/faculty-course-roster.tsx:124-151`
- Fix: Old `Students enrolled in {selectedClass}.` and `Class list` eyebrow, new h2 is actual sectionName with no enrollment sentence.

## G2-3-009-047  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:366-374`
- vNext now: `src/components/courses/faculty-course-roster.tsx:154-166`
- Fix: Legacy exact placeholder `Search by name, roll no, phone or email`, new `Name, roll number, phone or email`.

## G2-3-009-048  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:295-307`
- vNext now: `src/components/courses/faculty-course-roster.tsx:186-190`
- Fix: Legacy title `No matching students`, new `No students match this search`.

## G2-3-009-055  [P2] GAP  facet F22  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:64-96`
- vNext now: `src/components/courses/faculty-course-roster.tsx:21-23`
- Fix: Legacy profile-image fallback fields image_url/profilePhoto etc vs vNext photoDownloadUrl requires managed storage; no auto conversion, expected default initials.

## G2-18-001-030  [P3] GAP  facet F05  effort S
- Legacy: Legacy roster filtering has an explicit `Showing X of Y` only while search has text. `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:365-385`
- vNext now: vNext filter summary is always in a separate paragraph beneath toolbar. `src/components/courses/faculty-course-roster.tsx:154-182`
- Fix: Show filtered total only when active query, with exact legacy wording.

## G2-18-001-035  [P3] GAP  facet F06  effort S
- Legacy: Legacy student search allowClear with search icon, placeholder `Search by name, roll no, phone or email`. `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:366-373`
- vNext now: vNext text Input says `Name, roll number, phone or email`; separate search label. `src/components/courses/faculty-course-roster.tsx:155-166`
- Fix: Set exact placeholder and clear affordance; retain case-insensitive four-field query.

## G2-18-001-078  [P3] GAP  facet F16  effort S
- Legacy: Legacy photo modal width at most viewport minus 32px, centered. `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:479-486`
- vNext now: vNext modal image has max-height 60vh, rounded controls. `src/components/courses/faculty-course-roster.tsx:239-250`
- Fix: Constrain dialog width to 360px and viewport minus 32px; compare image crop.

## G2-18-001-086  [P3] GAP  facet F18  effort S
- Legacy: Legacy faculty roster search says `Search by name, roll no, phone or email`. `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:366-372`
- vNext now: vNext says `Name, roll number, phone or email`. `src/components/courses/faculty-course-roster.tsx:155-166`
- Fix: Set exact legacy placeholder.
