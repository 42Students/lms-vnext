# Work packet (wave 2): edit src/app/api/people/faculty-self-document/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md, docs/audit/gap2/lane-20/teacher-profile.md

## G2-1-003-001  [P2] GAP  facet F01  effort M
- Legacy: `FacultyProfileController.java:24-28` declares `/api/v1/profile/faculty/{facultyId}/*` for any authorized faculty/admin.
- vNext now: `src/app/(authenticated)/teacher/profile/page.tsx:8-22` and `details/page.tsx:11-24` split read-only overview and self editor; `src/app/api/people/faculty-self-document/route.ts:10-27` uses selected membership.
- Fix: Route legacy profile links to new self and scoped college-admin destinations; retain exact profile entry points.

## G2-1-003-019  [P2] GAP  facet F04  effort M
- Legacy: `FacultyProfileController.java:307-358,445-779` list section GET responses are `Response<List<DTO>>`, JSON wrapper status/message/data.
- vNext now: `src/app/api/people/faculty-self-document/route.ts:10-27` returns complete document/version and PATCH receipt.
- Fix: Adapt old consumer field mapping to section-based document and revision; do not assume list endpoints exist.

## G2-20-030-052  [P2] GAP  facet F10  effort L
- Legacy: Legacy indexed POST/PUT/DELETE for awards, experiences, qualifications, languages etc (`docs/legacy-source/frontend/src/api/Services/ProfileService.js:267-305`, `docs/legacy-source/frontend/src/components/profile/about.js:295-349`, `docs/legacy-source/frontend/src/components/profile/about.js:774-817`)
- vNext now: New section PATCH /api/people/faculty-self-document with expectedVersion (`src/app/api/people/faculty-self-document/route.ts:16-27`, `src/components/people/faculty-profile-editor.tsx:47-63`)
- Fix: Preserve item CRUD outcome and source-specific authorization in single-section patch

## G2-20-030-068  [P3] GAP  facet F15  effort S
- Legacy: Legacy profile updates trigger local profileUpdated CustomEvent but no external email from page (`docs/legacy-source/frontend/src/components/profile/about.js:267-271`, `docs/legacy-source/frontend/src/components/profile/about.js:295-319`)
- vNext now: vNext success state updated and receipt version increment, no email in route (`src/components/people/faculty-profile-editor.tsx:60-67`, `src/app/api/people/faculty-self-document/route.ts:16-27`)
- Fix: Preserve in-app profile completeness refresh event equivalent; no email parity identified
