# DB02 Program duration and department reassignment parity decision

**Date:** 2026-10-10  
**W01 issue:** #21  
**Legacy backend:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy frontend:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`

## Source behavior

Legacy `NewProgram` persists `duration_years`, the request DTO accepts an integer year count, and the current admin UI constrains it to 1–10 years. The legacy update path also writes `dept_id`, so moving a program between departments is an active admin workflow. The backend's duration-reduction guard converts years to a semester maximum with `durationYears * 2`, which is direct evidence that the active contract assumes two academic terms per year.

## vNext decision

vNext keeps normalized `programs.duration_terms` as the stored field. The admin/API compatibility contract now accepts either:
- `durationTerms` (native vNext callers), or
- `durationYears` (legacy parity callers).

When years are supplied, the service stores `durationTerms = durationYears * 2`. If both are supplied, validation requires exact agreement. Program list/create/update responses expose derived `durationYears = durationTerms / 2` in addition to `durationTerms`.

Program department reassignment is permitted only when the target department is active and belongs to the **same college** as the existing program. Cross-college reassignment fails with `PROGRAM_DEPARTMENT_COLLEGE_MISMATCH`; this intentionally strengthens tenant integrity while preserving the legacy same-college edit job.

## Evidence and remaining gate

An integration regression was authored in `tests/integration/academics-core.test.ts` for year conversion, same-college reassignment, response compatibility and cross-college denial. It remains **authored, not runtime-verified** until W01 obtains a functioning disposable PostgreSQL/CI runner.

This decision resolves the W06 Programs domain-contract handoff. It does not by itself close every DB02 source field or the overall Programs UI parity contract.
