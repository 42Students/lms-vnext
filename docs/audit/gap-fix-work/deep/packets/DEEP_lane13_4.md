# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-11-013-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-013-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-013-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-013-076  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-013-086  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-013-088  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-013-090  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-013-091  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-12-019-015  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-12-019-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)

## Results

- G2-11-013-030: FIXED — per-round kind and name were already editable (src/components/placements/placement-job-create-form.tsx round rows) but mode was missing; added a per-round "On campus / Virtual" Select (aria-label "Round N mode"), default ON_CAMPUS, kept in the browser backup, and src/modules/placements/validation.ts createPlacementRoundInputSchema now accepts a bare mode on a pending round (placement_job_rounds_lifecycle_ck allows mode on PENDING). Matches DriveFormPage.js:711.
- G2-11-013-044: OK — deliberate, safe difference: vNext create form keeps a debounced (400ms) per-user/college browser backup with restore and an honest status line "Changes not saved to the server · Browser backup at …" (placement-job-create-form.tsx:384-400,493,1096-1102) and creates the draft only on an explicit save with partial-create recovery (TPO-drives-41/43, :338-360), instead of silently creating server drafts on every edit as DriveFormPage.js:327 does.
- G2-11-013-045: OK — vNext placement-job-create-form.tsx:232-262,2128-2145 fetches a debounced server audience estimate from src/app/api/placements/tpo/drives/reach-preview/route.ts before publishing, with unavailable state and scope note; matches DriveFormPage.js:18 pre-publish eligibility preview.
- G2-11-013-076: OK — same deliberate decision as G2-11-013-044: draft persistence parity is provided by the idempotent explicit draft create with partial-draft resume (placement-job-create-form.tsx:203,417-430, createdJobRef) plus the debounced browser backup, not a silent 1200ms server autosave (DriveFormPage.js:327).
- G2-11-013-086: OK — vNext create flow submits role options/packages, job type/category label, eligibility policy and planned rounds (placement-job-create-form.tsx:975-1010 package/round saves, round POST now includes mode) covering the DriveFormPage.js:248 payload; reach and eligibility are saved to their own scoped tables.
- G2-11-013-088: FIXED — round mode now included in the create DTO: planned rounds carry mode (ON_CAMPUS default / VIRTUAL) and POST /api/placements/jobs/[jobId]/rounds receives {kind,name,mode} (placement-job-create-form.tsx planned rows), accepted by validation.ts; matches DriveFormPage.js:711.
- G2-11-013-090: OK — vNext placement-job-create-form.tsx is the unified full editor (company/role, pay packages via extraPackages, eligibility presets, editable rounds incl. mode after this packet, reach estimate, browser backup); safety additions (partial-create recovery, confirm step) are kept; matches DriveFormPage.js:41.
- G2-11-013-091: OK — vNext placement-job-create-form.tsx:2128-2145 shows the truthful pre-publication reach preview (active learners per branch, scopeNote "Counts reflect…") and src/components/placements/tpo-drive-lifecycle-controls.tsx:196,213 shows eligible/excluded counts at publish; matches DriveFormPage.js:737.
- G2-12-019-015: OK — vNext src/modules/placements/college-application-stage-service.ts:199-242 stores the staff-only reason in internalReason while the learner-facing candidateMessage is a fixed neutral text ("Your application was not selected.") or null; matches docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:83-96,151-160 (@JsonIgnore internal notes).
- G2-12-019-026: OK — vNext src/modules/placements/application-service.ts:572-645,767,976,1023 resolves an owner-verified private resume receipt (resumeReceiptId, never a public URL) per application, snapshots it into placement_application_private_artifacts with resumeHistory (src/db/schema/placements.ts:1388-1415), distinct from the profile resume; matches JobApplication.java:62-82.
