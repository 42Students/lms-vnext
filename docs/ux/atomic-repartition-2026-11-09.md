# vNext UX atomic repartition — 2026-11-09

## Purpose

The original 188-group UX queue had 73 open groups, and 71 of those open groups contained more than 10 tracked surfaces. Many route groups combined 5–6 independent page journeys, preventing evidence-based closure when only one workflow remained unverified. This changes **tracking granularity only**, not UX behavior or acceptance standards.

Canonical board: `docs/tracker.json#uxReview.groups`
Committed split: `665aaca0cfe0d87b771672c1b3c775f4c738e0a7`

## Board snapshot immediately after migration

| Status | Before | After |
| --- | ---: | ---: |
| DONE | 115 | 115 |
| DOING | 54 | 54 |
| PICKED | 0 | 0 |
| UNPICKED | 19 | 170 |
| **Total** | **188** | **339** |

- **73** open groups were partitioned into **224** independently tracked atomic groups.
- **151** new sibling groups (`UX-G189`–`UX-G339`) were added, initially `UNPICKED`.
- Every still-open group contains **at most six source files**. Route-local `page.tsx`, `loading.tsx`, `error.tsx` are kept in the same part; neighboring related route bundles may share one part. Component-only groups use up to five component files.
- The original **2,080 registered surfaces plus 83 route-only entries = 2,163** remain exactly assigned once.
- All 115 DONE group records and their evidence remain unchanged. No DONE was claimed as part of this administrative split.
- Surface-weighted progress remains **941 / 2,163** in DONE groups immediately after the migration. Total group percentages are not comparable across the split (the denominator changes).

## How original IDs and new IDs relate

The *original* group ID remains in the board but now represents **only the first reduced slice**. Its existing `pickedBy`, `status`, original `evidence` and notes are preserved. Additional sibling IDs are listed in `splitMeta.siblingIds` and have their own source/surface references.

Examples:

- `UX-G005` → `UX-G005`, `UX-G189`, `UX-G190` (Admin academics, sections, announcements/assignments/attendance).
- `UX-G030` → `UX-G030`, `UX-G225`, `UX-G226` (College promotion, batches, branding/classes).
- `UX-G098` → `UX-G098`, `UX-G269`, `UX-G270` (TPO announcements, audit, batches/home).
- `UX-G127` → `UX-G127`, `UX-G310`, `UX-G311` (Admin interactive components).
- `UX-G151` → `UX-G151`, `UX-G332`, `UX-G333` (Projects interactive components).
- `UX-G161` → `UX-G161`, `UX-G339` (Tracker interactive components).

Important: legacy evidence attached to the original group may describe the **entire pre-split scope**. It is a historical pointer, **not automatic acceptance** of any one new slice. Review exact file and functionality coverage before concluding DONE. New siblings start with no evidence and no owner.

## Instructions for every parallel chat

1. **Fetch the latest `main` before selecting or closing UX work.** Any locally cached pre-migration group assignment is obsolete for scope; reconcile your original ID's `splitMeta.siblingIds`. Work already implemented in a sibling's source files is not discarded, but must be attached to that sibling's evidence instead of claiming the original group covers it.
2. Use `node scripts/ux-groups.mjs --summary`, `--unpicked --area admin --limit 50` and `--group UX-Gnnn` to inspect exact tracked files and route-only scope. Claim one available group with `--pick UX-Gnnn --by <chat-identifier>`, then `--start` before editing; newly created siblings are independently claimable.
3. Keep the UX acceptance gates: real functionality and negative/error/empty/loading states, keyboard/focus accessibility, desktop and mobile Chromium evidence on the **exact code SHA**, scoped tests, shared/role regression and privacy/tenant invariants where applicable.
4. Mark DONE **only** with the script's required commit + parity document + passing tests + desktop/mobile browser proofs + regression/security review. Do not infer DONE from route-only recovery, a source review, mocked-only checks, historical parent proof or an unrelated successful CI run.
5. Parallel edits to `docs/tracker.json` must be serialized/reconciled against fresh main. Never force-push, overwrite another chat's ownership, duplicate source file/surface IDs, or weaken security gates. The migration is **independent** of SECURITY and release readiness.
6. If acceptance requires checking an adjacent shard (e.g. one end-to-end action spans two pages), test that cross-shard behavior. Keep file ownership clear and record shared evidence with the exact relevant subgroups.

## Structural validation at migration

The migration checked that:
- all original `surfaceId → sourceFile` pairs remain present exactly once;
- all route-only entries remain present exactly once;
- all DONE records are byte-for-byte equivalent as JSON objects;
- no group ID is duplicated and all original DOING owners are retained;
- all still-open groups have at most six source files;
- 2,080 registered + 83 route-only scope items are preserved.

This was a **tracker-only** change; these structural checks do not substitute for application unit, browser, CI or release tests. 
