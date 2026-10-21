# Work packet: edit src/components/courses/lesson-resource-materials-control.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/legacy-resource-viewer.md

## G2-17-008-011  [P1] GAP  facet F03  effort L
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:170-176 — FILE Open and LINK Open are similarly named; unavailable has text.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:88-93 — LINK Open link, FILE status text only.
- Fix: Provide signed FILE Open action, consistent unavailable handling.

## G2-17-008-022  [P1] GAP  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/components/Global/Offcanvas/Syallabus/ResourceComposer.js:235-240 — Admin may switch class/shared only before files added.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:13-15 — Delivery scope prop, no visible scope selector.
- Fix: Add safe shared/class selector where authorised.

## G2-17-008-035  [P1] GAP  facet F09  effort L
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:183-188 — Edit Resource passes existing data and refresh callback.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:95-125 — Inline link edit only, no full Resource editing.
- Fix: Provide complete existing Resource editor.

## G2-17-008-050  [P1] MISSING  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:69-91 — Opening by material index has individual loading/disabled guard.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:84-93 — No FILE open or busy state.
- Fix: Add per-file pending/timeout handling.

## G2-17-008-055  [P1] GAP  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:174-176 — Every healthy FILE shows Open; unavailable shows fallback.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:88-93 — File readiness text, no download action.
- Fix: Restore secure Open/Download CTA for READY files.

## G2-17-008-067  [P1] MISSING  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:69-75 — Opens blank browser tab synchronously to avoid popup blocker.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:84-93 — No Open button/path.
- Fix: Reserve safe blank tab synchronously before signing.

## G2-17-008-069  [P1] MISSING  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:76-91 — If popup blocked, current page navigates; on failure popup closes.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:84-93 — No FILE open fallback.
- Fix: Implement popup-block fallback and cleanup.

## G2-17-008-025  [P2] MISSING  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:77-89 — Grant failure toast `Resource file is unavailable. Contact your instructor.`
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:36-45 — Generic metadata load error only.
- Fix: Show file-specific error after failed signed grant.

## G2-17-008-026  [P2] MISSING  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/components/Global/Offcanvas/Syallabus/ResourceComposer.js:99-101 — Exact unsupported file warning names supported formats and 50 MB.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:105-125 — No upload/size error UI.
- Fix: Add exact formats and size warning.

## G2-17-008-028  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:146-146 — Warning `Some Resource files are unavailable. Contact your instructor.`
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:127-128 — Generic error alert.
- Fix: Show partial-file warning, keep healthy rows.

## G2-17-008-030  [P2] MISSING  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/components/Global/Offcanvas/Syallabus/ResourceComposer.js:130-132 — File upload `Resource files uploaded`, fallback `Resource upload failed`.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:69-72 — Only material link add/edit/remove notices.
- Fix: Implement upload success/failure toasts.

## G2-17-008-031  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/components/Global/Offcanvas/Syallabus/ResourceComposer.js:195-219 — Parent save toast `Resource updated` / `Resource saved`.
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:70-72 — Child material messages `Material added.` etc.
- Fix: Keep parent and child save notifications distinct.

## G2-17-008-027  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/components/Global/Offcanvas/Syallabus/ResourceComposer.js:141-143 — Bad URL wording `Enter a valid HTTPS URL without credentials or spaces.`
- vNext now: src/components/courses/lesson-resource-materials-control.tsx:57-60 — Message `Enter a material title and a secure HTTPS link.`
- Fix: Preserve precise URL and title error distinction.
