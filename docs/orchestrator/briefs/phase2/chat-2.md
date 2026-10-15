# Phase 2 brief: chat-2 (TPO + recruiter logic and wording)
Branch chatgpt/chat-2. Scope: TPO account and recruiter CRM.
## Tasks in order
1. Placements logic fixes, TPO side (backlog section A): P-S1-01 (enforce placement_college_rules), P-S1-02 (debarment enforced in apply/offer/drive-day), P-S1-05/P-S1-06 (held-offer rule and accept cascade) in the TPO-facing services and drive-day, P-S1-08 (count-based debarments counted at publish), P-S2-06 min response window default, P-S2-07/P-S2-12 job CANCELLED and offer EXPIRED handling where no schema change is needed (otherwise stage SQL).
2. TPO/recruiter CRM (backlog section E, not the security/schema items): T-S1-02 lead stage must call deriveTpoRecruiterLeadStage with the own-drives rule, T-S2-01 lead chips, T-S2-02 phone validation, T-S2-03 invite preview records first open, T-S2-07 announcements audience/preview fix, T-S2-08 public placements page live aggregates.
3. Wording: compare every TPO and Recruiter sidebar item, top navbar item, page title and tab name in vNext with docs/audit/legacy-copy-B.md and fix mismatches; add a unit test per navigation asserting the exact legacy labels.
## Rules for this round (all lanes)
- Push ONLY to your own branch chatgpt/chat-N; merge latest main into it first (keep main's version of files you did not intend to change; never re-add AI code, drafts of registered tables, or schema files).
- OWNER RULE: every user-visible word must match the OLD LMS exactly (sidebar, top navbar, page titles, tab names, buttons, field labels, modal titles, table headers, messages). Source of truth: docs/audit/legacy-copy-A.md (Learner/Faculty/Mentor/College) and docs/audit/legacy-copy-B.md (TPO/Recruiter/Super Admin/Public); route inventory in docs/audit/legacy-inventory-A.md / -B.md. Never invent wording. Where the legacy dev branch renamed something, use the dev branch name.
- Small rounds: at most 10 commits per round, push after each commit, one logical change per commit, unit tests with every change.
- Logic fixes come from docs/audit/logic-fix-backlog.md (IDs like P-S1-01). Do S1 first, then S2, then S3/S4. Cite the backlog ID in each commit message. Mark an item done in your docs/parity file with the commit reference.
- Do NOT touch protected paths: src/auth, src/security, src/modules/storage, drizzle/, src/db/schema/, .github, deploy, scripts, package files, env. New tables/columns only as staged schema (src/modules/<area>/staged-schema.ts) + docs/proposed-migrations/<name>.sql; the orchestrator registers migrations.
- Pitfalls: cast reused SQL params; alias duplicate Drizzle columns; ::enum casts; no setState in useEffect; no Date.now() in render; no eslint-disable; no JSX inside try/catch; escape apostrophes in JSX; every POST/PUT/PATCH/DELETE route handler needs isSameOriginRequest; GET handlers never call write services; keep multi-line layout/guard code that existing tests grep for; CRLF-safe string matching in tests.
- No AI features of any kind.

