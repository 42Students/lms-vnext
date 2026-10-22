# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-5-032-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-032-015  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [x] G2-5-032-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-13-024-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-13-024-035  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-13-025-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-8-022-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-8-024-035  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-8-025-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-9-002-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)

## Results

- G2-5-032-016: OK — `src/modules/operations/tpo-scheduled-job-registry.ts:25-29` declares 15-minute schedule/12-minute lease, `src/app/api/internal/placements/tpo/withdrawal-escalations/run/route.ts:19-30` enforces authenticated fenced execution, and `src/modules/placements/tpo-withdrawal-escalation-service.ts:11-38,55-60,94-107` enforces the 24-hour window and per-request durable dedupe. Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:51-52`.

- G2-5-032-014: OK — `src/modules/operations/tpo-scheduled-job-registry.ts:17-22` specifies hourly offers-expiring cadence and 50-minute lease; `src/modules/operations/tpo-offer-expiry-worker.ts:70-86` runs fenced 15-minute sweeps meeting the hourly reminder bound, with `src/modules/placements/placement-offer-expiry-sweep-service.ts:168-229` event deduplication. Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:45-46`.

