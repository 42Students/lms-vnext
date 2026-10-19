# NORTH STAR — chat-5 expanded cross-portal sweep (2026-10-19)

## Objective and sources

Owner target: vNext should appear as a module **inside the legacy LMS**, using a single white page canvas and old topbar/sidebar, not nested cards. Reference measurements: `docs/design/old-lms-pages.md`, `old-lms-shell.css`, `old-lms-shell-spec.md`, and `docs/design/legacy-styles/`.

This file covers lane chat-5's additional source-only pass. It does not replace `north-star-sweep-chat-5.md`.

## Branch and delivery

- Started by confirming `chatgpt/chat-5-b` was 2,168 commits behind `main` with **zero commits ahead**, then fast-forwarded safely to `main` `3de148112368b7201378f721841a5d4348ec9f6d`.
- All subsequent commits prefixed `[chat-5]`, pushed exclusively to `chatgpt/chat-5-b`.
- Before this log was written: **111 new source commits over 111 unique files**. No app code, typecheck, lint, tests or CI were run.

## State coverage

The Git tree at start contained **996 authenticated route-state files**: 490 `loading.tsx`, 491 `error.tsx` and 15 `not-found.tsx`, plus approximately **500 authenticated page.tsx routes**. These counts establish the audit horizon, **not** a claim that every file was individually modified or inspected.

- The shared `GracefulPageLoading` now paints inline heading and compact row skeletons rather than two nested rectangular card skeletons, while keeping its slow-request recovery button. The shared `Skeleton` row primitive is compact.
- The shared `ErrorState` adopts a slim hairline section instead of a strong error-coloured nested card. Routes that already render these shared primitives inherit the change.
- Replaced dozens of remaining hand-painted loading placeholders with `GracefulPageLoading`, across TPO, HR, College Admin, Faculty, Learner and Mentor. These have an explicit route label and old-LMS directory/row skeleton.
- Flattened custom error panels in TPO and Faculty routes without removing their error text or retry handler. Two TPO job-route errors migrated to the shared `ErrorState` and `Button`.
- Updated all 15 authenticated `not-found.tsx` routes in the tree, removing public-style full-screen fallbacks from role shells, retaining existing route destinations and recovery copy; already shell-native HR/Recruiter variants received proper secondary styling. The public root `src/app/not-found.tsx` intentionally continues to use the legacy-branded public screen.

## Page-anatomy pass

- Added or reused shared `PageHeader` on the TPO company-share audit, interview slot proposals, candidate schedule and drive closeout pages; the Faculty calendar and Mentor Projects filter-invalid states now use `PageHeader` instead of standalone headings.
- Flattened extra inner cards for TPO selection, applicant lists, reports, drive workspace, waitlist/round preview, and Faculty Courses/calendar errors, retaining all domain sections, actions and copy.
- Ensured export/download actions are secondary rather than consuming the one primary teal action when appropriate; kept real submit/confirm actions white on teal.

## Source boundaries and remaining review

- Checked touched code locally as **source text** and re-read component closing tags for the JSX changed (no incomplete closing tag found in the inspected blocks). This was not a TypeScript compiler check.
- Shared shell components (`topbar` and `sidebar`) were not overwritten; their dedicated owners continue that work.
- **Remaining:** an exhaustive per-file inspection of all 996 state files and 500 page files is not complete from this pass. The common primitives establish broad parity, but bespoke unmodified loading/error pages and any unreviewed page heads/nested cards still need enumeration and validation. An integrated browser side-by-side check is required to establish pixel-level parity.
