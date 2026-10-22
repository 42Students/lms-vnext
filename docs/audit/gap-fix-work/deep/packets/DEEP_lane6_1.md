# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-19-023-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-19-023-058  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-3-014-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [x] G2-3-014-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-3-014-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-3-014-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-3-014-055  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-3-028-084  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [x] G2-4-014-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [x] G2-4-028-007  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)

## Results

- G2-3-014-018: OK — `src/components/shell/topbar/command-search.tsx:47-65,154-162,175-178` records authorized course selections from both Enter and result clicks; `src/app/api/courses/search/selection/route.ts:11-16,35-74` validates the selected delivery UUID, checks same-origin, reloads scoped learner deliveries and writes the selection event after active-member validation. This is the vNext delivery-ID equivalent of `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:269-303`, which checks principal/course access before recording a course selection.

- G2-4-014-022: OK — `src/app/(authenticated)/admin/colleges/page.tsx:178-180,210-241` loads the authorized full college directory, narrows by organization, city and state, scores and filters the search across that full scoped set, then applies page slicing only after matching. This preserves potential query matches rather than pre-limiting the organization subset, addressing the legacy organization-search behavior in `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchController.java:140-151` (`getByOrganization` then query filter). No code change required.

- G2-4-028-007: OK — `src/app/(authenticated)/tpo/messages/page.tsx:1,86-96,105-109,137,175,202` imports and renders `TpoTeamMessagesDirectory`, exposes the `Team` tab and `Recruiters` tab through `TpoMessagesTabs`, and selects via `?tab=team`; matches `docs/legacy-source/frontend/src/pages/tpo/messages.js:10-13,25-27,39-48,55-64` (legacy Team/Recruiters tablist and TeamConversations). No code change required.

