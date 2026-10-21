# Work packet (wave 2): edit src/components/placements/tpo-round-drive-day-read-only.tsx

29 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drive-day-roundid.md

## G2-11-008-001  [P2] GAP  facet F01  effort S
- Legacy: The header title is `${company} · ${round.name}`, fallback `Drive day`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:240`
- vNext now: TPO has similar title, adds eyebrow `TPO · Drive Day`. `src/components/placements/tpo-round-drive-day-read-only.tsx:83`
- Fix: Remove eyebrow and match fallback/text metrics.

## G2-11-008-002  [P2] GAP  facet F01  effort S
- Legacy: `Back` returns to `/tpo/drive-day`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:249`
- vNext now: `← Back to job Drive Day` goes to job workspace, not round list. `src/components/placements/tpo-round-drive-day-read-only.tsx:91`
- Fix: Restore list Back link; keep job route as separate extra action.

## G2-11-008-004  [P2] GAP  facet F01  effort S
- Legacy: At header, completed/cancelled have explicit status wording. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:244`
- vNext now: Generic status badge is inside Round details. `src/components/placements/tpo-round-drive-day-read-only.tsx:124`
- Fix: Display `LIVE`/`Round done`/`Round cancelled` adjacent to Back.

## G2-11-008-007  [P2] MISSING  facet F02  effort M
- Legacy: Sticky controls card follows count strip. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:288`
- vNext now: No sticky search/room/filter card. `src/components/placements/tpo-round-drive-day-read-only.tsx:226`
- Fix: Add sticky search + room + filtered count row.

## G2-11-008-008  [P2] GAP  facet F02  effort L
- Legacy: Each student is individual compact Card with action grids. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:309`
- vNext now: Roster represented as DataTable with embedded controls. `src/components/placements/tpo-round-drive-day-read-only.tsx:242`
- Fix: Port compact card layout and small-screen grid.

## G2-11-008-009  [P2] GAP  facet F03  effort S
- Legacy: `Round done` green, `Round cancelled` red, otherwise `LIVE` indicator. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:245`
- vNext now: Status raw `COMPLETED`, `CANCELLED`, etc. `src/components/placements/tpo-round-drive-day-read-only.tsx:124`
- Fix: Use exact state labels and colors.

## G2-11-008-012  [P2] MISSING  facet F03  effort S
- Legacy: 42px avatar uses photo URL or UserOutlined fallback. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:314`
- vNext now: Text-only student identity. `src/components/placements/tpo-round-drive-day-read-only.tsx:249`
- Fix: Show authorized avatar with same fallback and dimensions.

## G2-11-008-018  [P2] GAP  facet F03  effort M
- Legacy: Per-applicant quick `Result` select offers three options. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:338`
- vNext now: Full result recorder is inline instead of quick select. `src/components/placements/tpo-round-drive-day-read-only.tsx:280`
- Fix: Preserve low-friction three-outcome entry while keeping validation.

## G2-11-008-019  [P2] GAP  facet F04  effort S
- Legacy: Subtitle shows job title then `N students on this roster`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:241`
- vNext now: Subtitle says role + `Round-focused operational overview`. `src/components/placements/tpo-round-drive-day-read-only.tsx:86`
- Fix: Use exact roster-count subtitle.

## G2-11-008-022  [P2] GAP  facet F04  effort S
- Legacy: Attendance labels mapped `Waiting`, `Present`, `In interview`, `Done`, `Absent`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:324`
- vNext now: Underscores replaced in uppercase status token. `src/components/placements/tpo-round-drive-day-read-only.tsx:259`
- Fix: Use old titlecase LABEL mapping and status color map.

## G2-11-008-023  [P2] GAP  facet F04  effort M
- Legacy: Strip contains six clickable totals: roster, checked-in, not here, in interview, done, absent. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:279`
- vNext now: Summary has eight numbers, adds result counts, `Present` separate from checked-in. `src/components/placements/tpo-round-drive-day-read-only.tsx:70`
- Fix: Restore six operational quick filters; put result counts elsewhere.

## G2-11-008-024  [P2] GAP  facet F04  effort S
- Legacy: Checked in = present+interviewing+done, rounded attendance/completion rates computed. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:65`
- vNext now: No checked-in aggregate in TPO summary. `src/components/placements/tpo-round-drive-day-read-only.tsx:73`
- Fix: Compute and display legacy aggregate; verify live rate usage.

## G2-11-008-026  [P2] MISSING  facet F05  effort M
- Legacy: Filter supports ALL/CHECKED_IN/WAITING/PRESENT/IN_INTERVIEW/DONE/ABSENT. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:85`
- vNext now: Status tiles not clickable. `src/components/placements/tpo-round-drive-day-read-only.tsx:185`
- Fix: Implement exact status-filter transitions on clicking tile.

## G2-11-008-027  [P2] MISSING  facet F05  effort M
- Legacy: Filter supports room/assignedRoom. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:86`
- vNext now: No room chips or room filter. `src/components/placements/tpo-round-drive-day-read-only.tsx:242`
- Fix: Add room filter to round roster.

## G2-11-008-028  [P2] MISSING  facet F05  effort S
- Legacy: Toolbar displays `N students shown` plus conditional `Clear filters`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:301`
- vNext now: No shown count/reset pair. `src/components/placements/tpo-round-drive-day-read-only.tsx:230`
- Fix: Add counter and reset.

## G2-11-008-033  [P2] GAP  facet F06  effort M
- Legacy: Result selector: PASS `Pass`, FAIL `Not cleared`, HOLD `Waitlist`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:343`
- vNext now: Separate expanded result editor fields. `src/components/placements/tpo-round-drive-day-read-only.tsx:280`
- Fix: Offer original quick result option labels and submission flow.

## G2-11-008-044  [P2] MISSING  facet F09  effort S
- Legacy: Cancel with nonempty paste prompts `Discard this pasted attendance list?`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:361`
- vNext now: No pending attendance clipboard content. `src/components/placements/tpo-round-drive-day-read-only.tsx:290`
- Fix: Protect unsaved pasted content.

## G2-11-008-050  [P2] GAP  facet F10  effort M
- Legacy: POST `/api/v1/tpo/rounds/{roundId}/results` with source `DRIVE_DAY`. `docs/legacy-source/frontend/src/api/Services/TpoService.js:51`
- vNext now: Uses confirmed result recorder rather than immediate quick selector. `src/components/placements/tpo-round-drive-day-read-only.tsx:280`
- Fix: Preserve source/audit distinction while supporting quick result selection.

## G2-11-008-060  [P2] MISSING  facet F12  effort S
- Legacy: Paste splits spaces, commas, semicolons/newlines, uppercases, deduplicates, removes list markers. `docs/legacy-source/frontend/src/components/tpo/ui/rollParser.js:4`
- vNext now: vNext only bulk-result tokens; not attendance. `src/components/placements/tpo-round-drive-day-read-only.tsx:290`
- Fix: Port exact parseRolls/matchRolls for attendance.

## G2-11-008-065  [P2] GAP  facet F13  effort S
- Legacy: Empty distinguishes `No students are on this round's roster.` and `No student matches your search.` `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:304`
- vNext now: No eligible applicants currently appear in this round’s roster. `src/components/placements/tpo-round-drive-day-read-only.tsx:246`
- Fix: Use legacy empty copy and filter distinction.

## G2-11-008-070  [P2] GAP  facet F16  effort M
- Legacy: At max-width 640px attendance actions shift from four to two columns. `docs/legacy-source/frontend/src/styles/components/_tpo-drive-day.scss:425`
- vNext now: DataTable responsive rather than four-action grid. `src/components/placements/tpo-round-drive-day-read-only.tsx:242`
- Fix: Match 375px two-column action layout.

## G2-11-008-071  [P2] MISSING  facet F16  effort M
- Legacy: Room actions and controls collapse to full-width on phone. `docs/legacy-source/frontend/src/styles/components/_tpo-drive-day.scss:428`
- vNext now: New stacked links, absent room panel. `src/components/placements/tpo-round-drive-day-read-only.tsx:103`
- Fix: Port operator room controls and compare 375/768/1280 widths.

## G2-11-008-072  [P2] MISSING  facet F17  effort S
- Legacy: Gate has `aria-label=Roll number to mark present` and autoFocus. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:265`
- vNext now: No focused gate. `src/components/placements/tpo-round-drive-day-read-only.tsx:242`
- Fix: Add labelled keyboard-first roll entry.

## G2-11-008-073  [P2] MISSING  facet F17  effort S
- Legacy: Call-next button has room-specific aria-label. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:272`
- vNext now: No accessible call-next control. `src/components/placements/tpo-round-drive-day-read-only.tsx:103`
- Fix: Preserve room names for screen readers.

## G2-11-008-075  [P2] MISSING  facet F18  effort S
- Legacy: Exact action `Paste a list of roll numbers`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:270`
- vNext now: `Bulk stage round results` describes another action. `src/components/placements/tpo-round-drive-day-read-only.tsx:290`
- Fix: Restore literal attendance action separately.

## G2-11-008-077  [P2] MISSING  facet F18  effort S
- Legacy: `Clear filters` when status or room is active. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:301`
- vNext now: No clear link. `src/components/placements/tpo-round-drive-day-read-only.tsx:242`
- Fix: Add same wording and behavior.

## G2-11-008-085  [P2] GAP  facet F21  effort S
- Legacy: Browser polling timer cleaned up on unmount. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:50`
- vNext now: TPO server-only overview does not run background refresh. `src/components/placements/tpo-round-drive-day-read-only.tsx:81`
- Fix: Add and cleanup client polling loop.

## G2-11-008-021  [P3] GAP  facet F04  effort S
- Legacy: Null roll renders `-`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:318`
- vNext now: Roll null renders `—`. `src/components/placements/tpo-round-drive-day-read-only.tsx:252`
- Fix: Use legacy hyphen placeholder.

## G2-11-008-061  [P3] GAP  facet F12  effort S
- Legacy: Attendance and completion rates round Math.round in legacy memo. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:65`
- vNext now: Raw counts; no rate display in TPO. `src/components/placements/tpo-round-drive-day-read-only.tsx:70`
- Fix: Verify live whether rate visible and implement same rounding if surfaced.
