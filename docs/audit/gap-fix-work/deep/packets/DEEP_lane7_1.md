# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-4-031-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [x] G2-4-031-071  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [x] G2-5-005-005  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-5-006-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-5-007-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-5-009-037  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-5-011-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-5-024-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-11-020-050  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-11-026-027  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)

## Results
- G2-5-005-005: FIXED — commit `18372ffcf909a3dc8612a62b35c6c1cc940993c0`, `src/app/(authenticated)/hr/calendar/page.tsx`. Monday-start seven-day week now defaults to compact nonempty-day agenda; legacy `docs/legacy-source/frontend/src/pages/recruiter/calendar.js:29-42,92-124`.
- G2-4-031-071: OK — `src/modules/auth/runtime.ts:38-48` enforces tenant sign-in channel capability for OTP initiation; `src/app/api/auth/login/start/route.ts:51-58` supplies guarded host tenant ID; matches configured channel policy in `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:8-17,103-115`.
- G2-4-031-067: OK — `src/components/admin/college-signin-method-form.tsx:34,49-80` guards dirty navigation and reports dirty/busy to parent; matches `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:78-88`.

