# UX-G182 — Projects export readability and data boundary review

**Tracker:** `docs/tracker.json#uxReview` · **Status:** DOING until browser/CI evidence is recorded.  
**Scope:** Seven registered outbound serializers in `src/modules/projects`.

## Changes

| Registered export | Verified contract / improvement |
| --- | --- |
| Class team roster | Retains exact authorized roster and spreadsheet-formula escaping; adds UTF-8 signature for non-Latin team/roll labels |
| Learner project activity | Preserves existing `UTC time,Actor,Subject,Summary` header contract; truncates by Unicode code point to avoid broken surrogate pairs; keeps the authorized 100-row limit |
| Mentor project activity | Adds a defensive 200-row cap inside the serializer and counts both supplied omitted rows and accidental overflow; rejects invalid omission counts |
| Mentor calendar | Puts the export-truncated notice in a clearly identified first column |
| Mentor portfolio activity | Puts the export-truncated notice in the first column without exposing actor identities or URLs |
| Mentor reviews | Moves the export-capped label out of the assigned-project column |
| Mentor task-review history | Puts the truncated-export label in the first column; maintains the redacted reviewed-decision fields |

## Security and compatibility boundaries

- Data selection, tenant authorization, project assignment checks, route permissions, server filters, and CSV response cache-control are unchanged.
- Text is still passed through existing per-model spreadsheet-formula sanitization. No columns for actor email, review notes, project files, direct meeting links, or private metadata were added.
- Existing learner CSV header tests explicitly require the header without a UTF-8 signature; that compatibility contract is preserved.
- The existing truncation limits of other export models are unchanged.

## Test and acceptance plan

New unit suite: `tests/unit/ux-g182-project-export-ux.test.ts` (seven scenarios).
Existing regressions worth executing together:
```sh
npx vitest run tests/unit/ux-g182-project-export-ux.test.ts \
  tests/unit/project-class-team-csv-export.test.ts \
  tests/unit/learner-project-activity-csv-model.test.ts \
  tests/unit/mentor-project-activity-export.test.ts \
  tests/unit/mentor-calendar-export-model.test.ts \
  tests/unit/mentor-activity-portfolio-csv.test.ts \
  tests/unit/mentor-task-review-export.test.ts \
  tests/unit/PROJ-BREAK-chat6-export-integrity.test.ts \
  tests/unit/PROJ-BREAK-LEARNER-02.test.ts \
  tests/unit/PROJ-BREAK-SA-42-learner-activity-export-unicode.test.ts
npm run typecheck
npm run ux:groups -- --check
```

For DONE, require a successful exact-commit CI/test run, desktop and mobile browser download/encoding/empty/truncated cases on authorized screens, and scoped regression/security sign-off. A cancelled workflow is **not** a pass. Do not mark this group DONE from source review alone.

## Browser acceptance package added — 8 November 2026

- Development-only route `/e2e/ux-g182-export-downloads` is enabled only when `NODE_ENV=development` and `UX_G182_EXPORT_FIXTURE=1`. It calls the seven **real** CSV serializers on synthetic, deterministic inputs. No database, tenant or authenticated user is read.
- `tests/e2e/ux-g182-project-downloads.spec.ts` performs **14 responsive serializer download scenarios** (seven sample+empty CSV pairs at 1280px and 390px) plus **one anonymous API export-denial scenario** over the five protected mentor export endpoints. It checks exact filenames, downloaded bytes, headers, Unicode/emoji, spreadsheet formula escaping, first-column truncation guidance, empty exports, no restricted PII columns, and horizontal overflow.
- `.github/workflows/ux-g182-project-export-acceptance.yml` runs an exact-trigger-SHA check, scoped ESLint, full TypeScript, seven-model focused/legacy unit regressions, and exactly 15 Chromium scenarios with zero unexpected/flaky/skipped results. The workflow stores browser screenshots and traces.
- This is an **auth-safe, synthetic formatter browser witness**, not yet a positive signed-in mentor/learner download or tenant-crossing PostgreSQL witness. Those remain prerequisites for full requested group closure alongside executed CI results. Do not promote `UX-G182` from DOING on workflow creation alone.

## Executed exact-SHA partial acceptance — 8 November 2026

- [Run 42461048230](https://github.com/42Students/lms-vnext/actions/runs/42461048230) executed on commit `c234a180ef32171d1ed4a90b231fbabf0aa0238b` and **SUCCEEDED**: exact checkout, scoped ESLint, full-project TypeScript, **41/41** model and compatibility Vitest tests across 10 files, and **15/15** Chromium browser cases (14 responsive real-serializer file downloads plus anonymous export API denial; no skips/flaky/unexpected).
- [Screenshots and download traces](https://github.com/42Students/lms-vnext/actions/runs/42461048230/artifacts/13609811143) (artifact `13609811143`) include desktop/mobile synthetic serializer bytes and filenames.
- These downloads used a strictly development-only fixture; they prove actual serializer/client downloads, not successful privileged Mentor export API delivery. The five protected mentor export routes require current **fresh device OTP** via `stepUp: true` and must not accept seeded E2E impersonation as a substitute. A real authorized test-device acceptance or independently verified trusted-device harness, plus data/tenant scope validation, remains open. **Status remains DOING, not DONE.**

## Additional seeded-user step-up negative witness — 8 November 2026

- [Shared exact-SHA CI run 42469427421](https://github.com/42Students/lms-vnext/actions/runs/42469427421) **SUCCEEDED** at `9eedcf0e661d63ca383f03e66d47f9bda721d8b6`. The added `tests/e2e/ux-five-group-batch-20261107.spec.ts` uses an actually seeded Super Admin test identity to issue requests to all five Mentor export endpoints. It confirms seeded browser identity alone cannot satisfy the device step-up boundary; none returns a CSV attachment.
- This is **negative authorization** only. Together with previously green 41/41 serializer units and 15/15 synthetic browser download cases, the missing proof remains real recent-OTP-enabled positive route download and data/role/tenant scoping on a trusted test device. No test or application bypass has been introduced; **G182 remains DOING.**

## Grapheme-safe CSV truncation — 8 November 2026

- `e1452ce8f1f0a1434f0ea068f6d1dcbf239d342e` changes only the learner project activity CSV cell formatter: the existing 240-Unicode-code-point bound now stops **before** a grapheme cluster (such as a Devanagari conjunct or an emoji joined with ZWJ) would be split. CSV headers, authorized row cap, formula sanitization and export permission checks are unchanged.
- `6429344afd8af0548e4c40f7affe833916fd9179` adds regression cases for both multi-code-point script and emoji sequences at the truncation boundary.
- [Exact-SHA acceptance run 42487701732](https://github.com/42Students/lms-vnext/actions/runs/42487701732) **SUCCEEDED** for that test commit: scope lint, full TypeScript, ten existing/focused unit suites, synthetic desktop/mobile browser downloads and anonymous endpoint denial.
- **Group status remains DOING:** the 15 green Chromium scenarios still use intentionally synthetic development-only exports, not an OTP-authenticated positive export from a real tenant. Device step-up, role/tenant scoping, and positive user download remain mandatory; no test-mode auth bypass was added.


## Genuine OTP/device browser acceptance added — 8 November 2026

- [Browser spec](https://github.com/42Students/lms-vnext/blob/main/tests/e2e/ux-g182-real-device-exports.spec.ts) at commit `dca5552db7e38688db025e722b14a5ed5bda965d` signs in via **real first-party OTP start/verify** for the seeded Faculty+Mentor, selects the persisted college-A Mentor membership, and exercises five protected Mentor project CSV endpoints (calendar, task-review history, portfolio activity, review queue, project activity) at desktop 1280×800 and mobile 390×844.
- [Dedicated PG17/Chromium CI](https://github.com/42Students/lms-vnext/actions/runs/42489661370) at `80dc3ef76f612c9e1cde6748a999870a84b0303a` uses an isolated seeded Mentor project, randomized development-only allowlisted OTP, actual server-issued device cookie, real browser file download, CSV bytes and header checks, and a second college/role denial. It does not configure a production OTP override or an E2E impersonation to satisfy device authentication.
- **This is an authored and triggered acceptance gate, not a pass claim.** Record its exact-SHA conclusion and screenshot artifact. Only then evaluate full DONE criteria alongside the existing successful seven-serializer synthetic and unit regression run; canonical status stays DOING meanwhile.


## Completed authenticated export acceptance — 8 November 2026

- **PASS:** [exact-SHA workflow 42489661370](https://github.com/42Students/lms-vnext/actions/runs/42489661370), commit `80dc3ef76f612c9e1cde6748a999870a84b0303a`. Scoped ESLint, full TypeScript, focused export regression suites, isolated seeded PostgreSQL, development-only real first-party OTP and three authenticated Chromium tests all succeeded, without skips/flaky/unexpected outcomes.
- [Browser artifact 13622105420](https://github.com/42Students/lms-vnext/actions/runs/42489661370/artifacts/13622105420) contains desktop 1280×800 and mobile 390×844 page screenshots/download traces. Actual server CSVs include calendar, task-review history, portfolio activity, review queue and project activity, and the browser saves a downloaded file with the expected bytes. The same authenticated person switching from Mentor college A to Faculty college B was denied access to scoped Mentor project export.
- Earlier [formatter/empty/truncation/Unicode and anonymous-denial workflow 42461048230](https://github.com/42Students/lms-vnext/actions/runs/42461048230) passed 41/41 unit checks and 15/15 synthetic actual-browser file downloads across **all seven** registered serializers; [grapheme-boundary follow-up 42487701732](https://github.com/42Students/lms-vnext/actions/runs/42487701732) succeeded; [seeded-user-only step-up denial 42469427421](https://github.com/42Students/lms-vnext/actions/runs/42469427421) succeeded. Together these witnesses cover the positive and negative authentication paths and serializer compatibility, including both real tenant routes and bounded synthetic edge cases.
- Regression sign-off: CSV headers, strict row caps, truncation markers, empty and non-Latin cells, Unicode formula injection prevention, no PII/meeting links/review notes, response attachment and cache controls, and existing exported-bytes contracts verified by the above executed suites. Security sign-off: no production auth bypass, true device-session OTP, persisted Mentor membership, wrong-college denial and unchanged server data selection/permission checks. This provides the required group-wide acceptance basis for the canonical DONE transition.
