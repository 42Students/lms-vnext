# Phase 2 build brief: close Recruiter page-audit gaps (S1 first, then S2, then S3/S4)

Source of truth: `docs/audit/pages/recruiter/home-drives.md` and `docs/audit/pages/recruiter/calendar-messages-profile.md` (gap tables with IDs, legacy evidence, vNext evidence). Re-check current `main` before each gap (some may already be fixed). The common rules are the same as in `docs/orchestrator/briefs/phase2/fix-tpo.md` (push only your branch, merge main first, max 10 commits per round, cite the gap ID in each commit, exact legacy wording from `docs/audit/legacy-copy-A.md`/`-B.md`, no protected paths, staged schema + `docs/proposed-migrations/*.sql` for new tables or columns because migrations up to 0098 are real, `can()`/`requirePermission`, `isSameOriginRequest` on mutating routes, GET never writes, tests for every change, no AI features, never touch production).

## Lane chat-7 (Recruiter account)
Order:
1. `REC-home-drives-21` (S1): "Request a drive" must create a real drive request (status REQUEST) that appears in the TPO Requests tab, with trusted-recruiter auto-approval as in legacy. Coordinate with the TPO lane chat-5 which builds the TPO side (`TPO-drives-02`, `TPO-requests-verification-33/34/35`); build the recruiter-side create/list/edit/resubmit and statuses, using the same job statuses and tables that chat-5 uses (read their branch or `main` first; if the shared schema is not on `main` yet, stage it and write the proposal).
2. `REC-home-drives-12` (S1): Drives list must show every legacy status (requests, drafts, declined, cancelled), and the "Waiting" count must be real.
3. `REC-home-drives-51` (S1): "Send a selection list" (recruiter sends selection to TPO with the legacy flow).
4. `REC-calendar-messages-profile-38`, `-44` (S1): recruiter onboarding (Join button, send-code route and form, accept flow without needing a signed-in session where legacy does not) and the `/company-join/[token]` public page: the public API and join transaction are built by chat-2 (`TPO-campaigns-public-18..29`); you build the recruiter-side screens and the accept/onboarding path, and reuse chat-2's services when they land on `main`.
5. Then S2 in the order of the two files: `REC-calendar-messages-profile-01, 08, 17, 21, 22, 25, 31, 39, 40, 43, 45, 46` and `REC-home-drives-01, 13, 14, 22..26, 33, 35, 37, 38, 39, 42, 43, 49`. Skip any gap marked blocked on storage (JD upload, resumes ZIP) and list it under "Needs owner decision".

Final summary: gap IDs finished / remaining / what was not run.
