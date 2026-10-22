# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-19-001-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-19-001-059  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [x] G2-19-010-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [x] G2-19-010-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [x] G2-19-010-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-2-001-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-2-002-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-2-006-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-2-006-058  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-2-010-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)

## Results

- G2-19-010-002 OK — vNext `src/components/tpo/tpo-campaign-compose.tsx:79-85` uses a scoped draft endpoint, and `src/components/tpo/tpo-campaign-send-control.tsx:26-28` uses explicit draft send; original direct GET/POST mapping is `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoEmailCampaignController.java:17-42`. The entry explicitly announces the intentional draft/confirm routing change, not a hidden direct send.
- G2-19-010-004 FIXED — [chat-11] 4f95894d `src/components/tpo/tpo-campaign-compose.tsx` retains the legacy `Email N recruiter(s)` heading (including singular) and Subject/Email controls, with the new draft step disclosed; old modal: `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:20-44`.
- G2-19-010-021 FIXED — [chat-11] f3135b97 `src/components/tpo/tpo-campaign-send-control.tsx` retains the legacy singular/plural confirmation count. `src/components/tpo/tpo-campaign-compose.tsx:56-70` validates the draft and `src/components/tpo/tpo-campaign-send-control.tsx:61-66` gates actual send behind an explicit confirm; legacy direct send `docs/legacy-source/frontend/src/components/tpo/engage/Campaigns.jsx:22-29`.

- G2-19-001-018 FIXED — [chat-11] 892971f5, af6a5ff5, 6b62c65d: `src/modules/admin-ui/super-admin-read-directory-model.ts` preserves validated sortBy/sortOrder in URL and pagination; `src/components/admin/admin-scoped-read-page.tsx` provides accessible Name/Roll No. sort controls; `src/modules/admin-ui/super-admin-scoped-people-service.ts` orders before LIMIT/OFFSET with numeric-aware roll key. Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:930-936`.
