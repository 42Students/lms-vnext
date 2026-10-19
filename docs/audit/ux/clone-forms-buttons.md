# Chat-17 strict UI clone audit — A1–A4, C, D

**Owner:** chat-17 · **Reference:** `docs/design/ui-clone-checklist.md` STRICT TICK RULE · **Source:** `docs/design/legacy-styles/`, measured `docs/design/old-lms-shell-spec.md`.

**Decision:** No item is checked. The work below includes actual changes and file:line property comparisons, but global grep coverage, *every* state, phone/tablet comparison and browser-computed values remain unproven. The strict rule prohibits checking a partly verified item. Old SCSS and the measured shell spec sometimes disagree; such conflicts are stated rather than concealed.

## A1. Typography roles

- [ ] A1 typography (missing: full h1–h6/table/caption/helper/button/text-field role matrix, global hard-coded typography grep, computed weights and responsive side-by-side measurements).

| Property / role | Legacy file:line and value | vNext file:line and value | Result |
| --- | --- | --- | --- |
| Base font family | `legacy-styles/components___variables.scss:169` — Lato/system stack; measured `old-lms-shell-spec.md:26-27` — Inter | `src/app/globals.css:152` and `src/app/layout.tsx:2,8` — Inter loaded through next/font | **Conflict** between legacy SCSS and measured old shell |
| Text base size | `legacy-styles/components___variables.scss:184` — 14px | `src/app/globals.css:830` — 14px token; body has further override | Token match; body cascade unverified |
| Title | `old-lms-shell-spec.md:27` — 30px, weight 600 | `src/app/globals.css:349-356` — 30px, weight 600 | Match in shared rules; all portals unverified |
| Form label | `legacy-styles/components___form.scss:110-115` — 13px/600/16px | `src/components/ui/form-field.tsx:31` — 13px/600/16px | Match |
| Field text | `legacy-styles/components___form.scss:123-127` — 14px/400/20px/0.2px | `src/components/ui/input.tsx:7`, `select.tsx:7` and `textarea.tsx:8` — same | Match in classes |
| Button text | `old-lms-shell-spec.md:23` — 14px/650 | `src/components/ui/button.tsx:16-27` — 14px/650 default | Match measured shell |
| Numeric/table typography | `legacy-styles/components___variables.scss:183-193` — type tokens | `src/app/globals.css:308-310` — tabular numbers + mono for code | Partial: all numeric roles not inspected |

## A2. Palette

- [ ] A2 colour palette (missing: global arbitrary/hex scan across `src`; all hover, selection, visited/disabled, dark/portal scopes; link mismatch).

| Property | Legacy source | vNext source | Result |
| --- | --- | --- | --- |
| Brand accent | `legacy-styles/components___variables.scss:10` #26bac7 | `src/app/globals.css:14` #26bac7 | Match |
| Measured primary button | `old-lms-shell-spec.md:23` #0a7c88/white | `src/app/globals.css:17-19`, `src/components/ui/button.tsx:11` | Match |
| Shell background | `legacy-styles/components___variables.scss:31,52` #f1f4f9 | `src/app/globals.css:33,59` #f1f4f9 | Match |
| Borders | `legacy-styles/components___variables.scss:30` #e5e9f0 | `src/app/globals.css:32` #e5e9f0 | Match |
| Heading ink token | `legacy-styles/components___variables.scss:24` #1a1d21; measured title #172033 | `src/app/globals.css:28,320` same separate roles | Match roles; raw headings unverified |
| Success | `legacy-styles/components___variables.scss:68` #059669 | `src/app/globals.css:41` #059669 | Match |
| Warning | `legacy-styles/components___variables.scss:69` #d97706 | `src/app/globals.css:43` #d97706 | Match |
| Error | `legacy-styles/components___variables.scss:71` #ef4444 | `src/app/globals.css:45` #ef4444 | Match |
| Info | `legacy-styles/components___variables.scss:73` #26bac7 | `src/app/globals.css:51` #26bac7 | Match |
| Link default | `legacy-styles/components___common.scss:68-75` #26bac7 | `src/app/globals.css:20` #26bac7 | **Match at token**; link consumers and hover still unverified |
| Disabled text | `legacy-styles/components___variables.scss:29` #a9a7ae | `src/app/globals.css:30`, `src/components/ui/input.tsx:7` #a9a7ae | Match |

## A3. Spacing, radii, shadows and transitions

- [ ] A3 scale and effects (missing: all consumer/component rules and active/pressed states; two incompatible legacy radius systems; complete z-layer/responsive comparison).

| Property | Legacy source | vNext source | Result |
| --- | --- | --- | --- |
| Spacing 1–6 | `legacy-styles/components___variables.scss:208-213` 4/8/12/16/24/32px | `src/app/globals.css:332-337` same | Match |
| Spacing 7–8 **effective** | `legacy-styles/components___variables.scss:214-215` 48/64px (overrides earlier lines 122–123) | `src/app/globals.css:339-340` 48/64px | Match after correction |
| Control radius | `legacy-styles/components___variables.scss:133` 6px; measured `old-lms-shell-spec.md:23` 9px | `src/app/globals.css:326-327` 9px button, 10px field | **Role-specific**; measured button and `.ln-in2` field declarations match |
| Card radius | `legacy-styles/components___variables.scss:134` 12px | `src/app/globals.css:327` 12px | Match |
| Primary shadow | `legacy-styles/components___antddesign.scss:153-158` none | `src/components/ui/button.tsx:27` shadow-none | Match |
| Elevation 1 | `legacy-styles/components___variables.scss:226` dual subtle layers | `src/app/globals.css:837` dual subtle layers | Match tokens |
| Fast transition | `legacy-styles/components___variables.scss:252` fast duration; `components___button.scss:11` 150ms | `src/app/globals.css:190`, `src/components/ui/button.tsx:27` 150ms | Match |
| Motion easing | `legacy-styles/components___variables.scss:258` std easing | `src/app/globals.css:194` cubic-bezier(0.2,0,0,1) | Compare effective compiled easing before tick |
| Z-layers | `legacy-styles/components___variables.scss:284+` z-index scale | `src/app/globals.css:820-824` semantic layers | Incomplete mapping |

## A4. Scrollbars, focus, cursor and selection

- [ ] A4 interaction foundations (missing: every scroll container, hover-only chrome, OS/browser selection and tap-highlight values, keyboard/mobile focus order and state-by-state proof).

| Property | Legacy source | vNext source | Result |
| --- | --- | --- | --- |
| Scrolling with hidden chrome | `legacy-styles/components___common.scss:303-311,329-338` scrollbar-width none + webkit hidden | `src/app/globals.css:176-186` none + hidden | Match specified chrome, global scope differs |
| Editable mouse focus | `legacy-styles/components___form.scss:24-37` suppress pointer-only outline | `src/app/globals.css:859-861` suppress :focus:not(:focus-visible) | Match intent |
| Keyboard field focus | `legacy-styles/components___form.scss:130-133` teal 2px/15% | `src/app/globals.css:876-881` teal 2px/15% | Match halo; full cascade unverified |
| Invalid field focus | `legacy-styles/components___form.scss:136-143` error 2px/20% | `src/app/globals.css:883-889` error 2px/20% | Match halo |
| Number spinner chrome | `legacy-styles/components___form.scss:14-19` no native spin buttons | `src/app/globals.css:1097-1101` hidden webkit/textfield | Match |
| Scrollbar thumb on explicit scrollbar | `legacy-styles/components___common.scss:294-298` 8px gray thumb for module | `src/app/globals.css:1000-1008` opt-in 8px / 1px thumb | **Matches WebKit declaration**, scrollbar runtime unverified |

## C. ALL FORM CONTROLS

- [ ] C1 text, number, search, password, OTP, textarea (missing: every field subtype and state, searchable field display/accessibility on phone/tablet, global raw-control grep).
- [ ] C2 native/AntD/multi/searchable/tag/creatable selects (missing: AntD-style dropdown/menu parity, keyboard/typeahead listbox and tag removal UX; non-creatable enforcement is not implemented).
- [ ] C3 date/time/range pickers and popup calendar (missing: native browser popups are not AntD calendar overlays; range popup/month grid and all keyboard states unverified).
- [ ] C4 checkbox/radio/switch/slider/segmented (missing: complete ant switch geometry/animation, checked/indeterminate/error states, responsive screenshot comparisons).
- [ ] C5 file/image upload/dropzone/progress/list (missing: image preview/crop; picker and drag/drop now expose opt-in selected-file lists and caller-owned real progress but need legacy file-list geometry, adoption, drag-drop/mobile picker comparison, and full-source grep).
- [ ] C6 labels/helper/errors/readonly/disabled/input groups/layout (missing: global form layout grid grep, every helper/required/readonly mismatch and responsive proof).
- [ ] C7 rich-text/long-form editors (missing: actual rich-text toolbar and format state parity; shared Textarea only covers plain text).

| Form control / state | Legacy source/value | vNext source/value | Result |
| --- | --- | --- | --- |
| Text field background | `legacy-styles/components___variables.scss:43` #fbfcfd; `components___form.scss:119` $grayCFD | `src/app/globals.css:852` #fbfcfd, `src/components/ui/input.tsx:7` | Match |
| Input content | `legacy-styles/components___form.scss:123-127` 14/400/20, tracking .2 | `src/components/ui/input.tsx:7` | Match |
| Input error surface | `legacy-styles/components___form.scss:136-142` #ef4444 border, 6% fill, 20% focus halo | `src/components/ui/input.tsx:7` and `src/app/globals.css:883-889` | Match token intentions |
| Textarea | `legacy-styles/components___form.scss:117-143` form inputs' family | `src/components/ui/textarea.tsx:8` min-height 112px, native resize | **Unverified**: legacy textarea height/rules vary |
| Select font | `legacy-styles/components___form.scss:3-5` Lato family | `src/components/ui/select.tsx:7` inherited Inter | **Mismatch** to literal legacy SCSS; measured old shell font differs |
| Multi-select | `legacy-styles/components___antddesign.scss:134-140` AntD selected teal with white text | `src/components/ui/multi-select.tsx:9-12` native multiple select | **Mismatch** selected-option rendering |
| Searchable/creatable select | `legacy-styles/components___common.scss:256-262` AntD searchable selector | `src/components/ui/searchable-select.tsx:10-17` keyboard combobox/listbox | **Popup source matched**, keyboard/visual verification pending |
| Native date/time | `legacy-styles/components___antddesign.scss:93-97` AntD picker focus handling | `src/components/ui/date-input.tsx:8-10` native date/time | **Different picker technology**, visuals unverified |
| Date range | Legacy AntD range popup rules (picker family above) | `src/components/ui/date-range-picker.tsx:21-30` two native dates | **Missing** popup/range drag/day-cell parity |
| OTP | `legacy-styles/components___form.scss:174-195` login input form style | `src/components/ui/otp-input.tsx:5-10` numeric/OS one-time-code | Style/behaviour not fully compared |
| Checkbox checked | `legacy-styles/components___antddesign.scss:123-131` #26bac7 | `src/components/ui/checkbox.tsx:7`, `selection-controls.tsx:20` | Accent match; geometry unverified |
| Radio checked | `legacy-styles/components___variables.scss:10` teal accent | `src/components/ui/radio.tsx:7`, `selection-controls.tsx:21` | Accent match; native rendering unverified |
| Switch checked | `legacy-styles/components___common.scss:226-229` teal | `src/components/ui/selection-controls.tsx:22-30` teal token in checked state | Colour match; size/animation not certified |
| Slider | `legacy-styles/components___variables.scss:10` teal | `src/components/ui/range-slider.tsx:5-9` native range | Only colour; thumb/track parity missing |
| Segmented | Legacy AntD tab/selection variants | `src/components/ui/segmented-control.tsx:14-25` native radio group | Keyboard semantics present; geometry unverified |
| Upload validations | `legacy-styles/components___button.scss:295+` image upload affordance | `src/components/ui/file-upload.tsx:74-108` type/size + selected names + caller progress, `file-dropzone.tsx:27-49` | File-list and progress additions; preview/crop and parity remain absent |
| Required label | `legacy-styles/components___form.scss:110-115` 13/600 | `src/components/ui/form-field.tsx:30-34` 13/600, required star | Base match; asterisk placement/colour not fully compared |
| Error helper | `legacy-styles/components___form.scss:136-143` red error | `src/components/ui/form-field.tsx:37` 12px error role alert | Error text metrics need comparison |
| Read-only/disabled | `legacy-styles/components___variables.scss:29` disabled ink #a9a7ae | `src/components/ui/input.tsx:7`, `src/app/globals.css:869-875` | Partial; all native input types unverified |

## D. BUTTONS

- [ ] D all variants, sizes, groups, split, icon, focus/hover/active/loading/disabled (missing: *every* property and state matrix, zero global raw buttons, split/button-group parity and measured browser comparison).

| Button property/state | Legacy source | vNext source | Result |
| --- | --- | --- | --- |
| Measured primary background | `old-lms-shell-spec.md:23` #0a7c88 | `src/app/globals.css:17,615-620`, `src/components/ui/button.tsx:11` | Match |
| Measured white text | `old-lms-shell-spec.md:23` #fff | `src/app/globals.css:19,615-620`, `src/components/ui/button.tsx:11` | Match |
| Measured 36px height | `old-lms-shell-spec.md:23` 36px | `src/app/globals.css:324`, `src/components/ui/button.tsx:27` | Match desktop |
| Measured 9px radius | `old-lms-shell-spec.md:23` 9px | `src/app/globals.css:326`, `src/components/ui/button.tsx:27` | Match measured |
| Measured 14px/650 | `old-lms-shell-spec.md:23` 14px/650 | `src/components/ui/button.tsx:16-27` | Match default |
| Literal old `.ln-btn` | `legacy-styles/components___button.scss:1-18` 40px, 8px, 700 | Shared Button 36px, 9px, 650 | **Source conflict**; measured shell takes precedence for owner target |
| Hover | `old-lms-shell-spec.md:23` measured + design token #086873 | `src/app/globals.css:18,621-625` | Match intended hover |
| Active | `legacy-styles/components___antddesign.scss:170-176` 1px translate | `src/app/globals.css:626-628`, `src/components/ui/button.tsx:27` | Match intent, disabled/loading CSS interplay unverified |
| Secondary | `legacy-styles/components___button.scss:120-139` border #bfc9da, fill teal on hover | `src/components/ui/button.tsx:12`, `src/app/globals.css:635-644` | Token match; all nested contents unverified |
| Danger | `legacy-styles/components___variables.scss:71` #ef4444 | `src/components/ui/button.tsx:14` #ef4444, hover #dc2626 | Base match; hover source not exhaustively mapped |
| Ghost/link | `legacy-styles/components___button.scss:188+` transparent controls | `src/components/ui/button.tsx:13-14` | Link variant added, raw usage unverified |
| Icon sizes | `old-lms-shell-spec.md:24` 36px icon controls | `src/components/ui/button.tsx:16-23` 36px icons, mobile 44px | Desktop base match; tablet/phone verification missing |
| Loading | `legacy-styles/components___antddesign.scss:153-185` no hover while loading | `src/components/ui/button.tsx:25-28` aria-busy, disabled, spinner | Pending/double-submit behavior to verify |
| Disabled | `legacy-styles/components___antddesign.scss:179-184` #e5e9f0, #6b7280 | `src/components/ui/button.tsx:11,27`, `src/app/globals.css:629-633` | Match primary base; other variants unverified |
| Keyboard focus | `legacy-styles/components___antddesign.scss:172-177` teal visible focus | `src/app/globals.css:862-866`, `src/components/ui/button.tsx:27` | Width/opacity still need computed comparison |
| Sizes / groups / split | `legacy-styles/components___button.scss:1-18,53-58` base/xs plus app-specific groups | `src/components/ui/button.tsx:16-23`, `button-group.tsx:13-20`, `split-button.tsx:20-40` | Compositions added; legacy geometry source matched where measured, browser proof incomplete |

## Coverage and regression evidence — strict rule

The expected commands are:

```bash
grep -rlE '<button([[:space:]]|>)' src --include='*.tsx'
grep -rlE '<input([[:space:]]|>)' src --include='*.tsx'
grep -rlE '<select([[:space:]]|>)' src --include='*.tsx'
grep -rlE '<textarea([[:space:]]|>)' src --include='*.tsx'
grep -rnE '#[0-9A-Fa-f]{3,8}\b' src --include='*.tsx' --include='*.css'
grep -rlE '<input[^>]+type="file"' src --include='*.tsx'
```

**Whole-`src` grep output/count: NOT RUN / NOT VERIFIED.** Work in this session used the connected GitHub repository API, not a local Git checkout; do not substitute capped indexed code-search hits for command outputs or claim a zero. Therefore NO category can pass the COVERAGE PROOF.

Observed residuals from directly read files include `src/components/tpo/recruiter-saved-view-controls.tsx` (9 raw action buttons at inspection), `src/components/placements/college-hiring-funnel.tsx` (2 hidden native fields), `src/components/courses/college-quiz-create.tsx` and `faculty-quiz-learner-preview.tsx` (dynamic choice controls, subsequently converted to `ChoiceInput`), and the shared native implementation files `src/components/ui/input.tsx`, `checkbox.tsx`, `radio.tsx`, `select.tsx`, `textarea.tsx`, `range-slider.tsx`, `segmented-control.tsx`. Native hidden fields are a documented semantic exemption; residual visible native buttons and fields are **not** exempt.

**Source-only regression review:** inspected changed TSX files for shared-element opening/closing pairs, duplicate primitive imports, and `"use client"` directive ordering. This does **not** replace TypeScript parsing, accessibility/browser interaction testing or the phone/tablet side-by-side visual comparison. Existing fields preserve native `name`, `value`, `checked`, `onChange`, `disabled`, `required`, and forwarded input props wherever migrated. No app, lint, typecheck, unit test or CI command was run as instructed.

## Work summary and outstanding integration

- Pulled current `main` through a merge before beginning; preserved previous lane audit.
- More than 60 `[chat-17]` commits pushed in several batches on `chatgpt/chat-17-b` for shared controls, inherited state CSS, and page migrations.
- Introduced native wrappers for `DateInput`, `DateRangePicker`, `MultiSelect`, `SearchableSelect`, `OtpInput`, `RangeSlider`, `SearchField`, `PasswordInput`, `SegmentedControl`, `InputGroup`, `FileDropzone`, `ChoiceInput`, while reusing existing `FileUpload`, `FormField`, `selection-controls`.
- Do **not** force a branch sync over overlapping upstream changes from other lanes. Reconcile the latest upstream versions, run the recorded greps and computed-style browser comparison, and only then tick individual items when the whole strict rule is satisfied.


## 2026-10-19 bounded follow-up — 30 source-only commits, all 12 items remain open

The lane branch was **2,351 commits behind** current main and **zero ahead** at intake, so it was fast-forwarded without rewriting any unique work. The following commits were written directly to `chatgpt/chat-17-b`; each successful `update_file` or `create_file` is a remote GitHub commit, so work is already pushed rather than held in a local working tree. No test, typecheck, runtime, CI or browser screenshot was executed. The connected GitHub API cannot produce an authoritative whole-`src` `grep -rl` count or responsive computed-style proof, so **do not tick** any item based on these changes alone.

### Confirmed source comparisons made this turn

| Rule / state | Legacy source/value | vNext source/value | Finding |
| --- | --- | --- | --- |
| Link text and hovered underline | `legacy-styles/components___common.scss:68-75` #26bac7, underline on hover | `src/app/globals.css:20` #26bac7; `src/components/ui/button.tsx:13` link variant | Token + shared button now agree; global raw links not verified |
| Spacing step 7 | `legacy-styles/components___variables.scss:214` effective 48px | `src/app/globals.css:339` 48px | Match |
| Spacing step 8 | `legacy-styles/components___variables.scss:215` effective 64px | `src/app/globals.css:340` 64px | Match |
| Standard form field rounding | `legacy-styles/components___form.scss:120` 10px (.ln-in2) | `src/app/globals.css:325` 10px; `input.tsx:7`, `select.tsx:7`, `textarea.tsx:8` | Match the common form field; all other source-specific form shapes still need review |
| Primary/button shell rounding | `old-lms-shell-spec.md:23-24` 9px | `src/app/globals.css:327`, `button.tsx:27` 9px | Matches measured TPO action |
| Label line height | `legacy-styles/components___form.scss:110-115` 13px/600/16px | `src/app/globals.css:600` 13px/600/16px; `form-field.tsx:31` | Fixes prior cascade mismatch |
| Visible scrollbar width | `legacy-styles/components___common.scss:294-300` 8px gray #c4c4c4, thumb radius 1px | `src/app/globals.css:1000-1008` opt-in 8px, 1px radius, gray token | WebKit property match; Firefox/browser output not verified |
| Legacy selected option | `legacy-styles/components___antddesign.scss:134-137` #26bac7/white | `src/app/globals.css:1151-1154` on native selected option | Declaration matches; native browser popup differs from Ant Design |
| Button loading lockout | `legacy-styles/components___antddesign.scss:153-185` retains teal, no hover when loading | `button.tsx:26` explicit data-loading and native disabled; `globals.css:1204-1219` brand color while pending | Shared primary/danger pending styles fixed; global caller double submits unverified |
| Nonprimary disabled opacity | `legacy-styles/components___button.scss:146-150` 50% and no pointer events | `globals.css:1199-1203` 50% and pointer-events none | Matches source declaration, keyboard behavior requires browser check |
| Search input width | `legacy-styles/components___form.scss:38-61` clamp(180px,20vw,280px), 14px | `search-field.tsx:16-17` clamp + existing 14px Input | Match dimensions in source; page-level overrides and mobile not proven |
| Responsive form grid breakpoints | `legacy-styles/components___variables.scss:145-157` 767/991px cutoffs | `form-grid.tsx:19`; `globals.css:1184-1194` 768/992px min widths | Equivalent cutoffs for one/two/three columns; no page adoption proof |
| Required/error message relation | `legacy-styles/components___form.scss:110-115,136-143` required label and error styling | `form-field.tsx:15,24,31-37` field ARIA invalid/errormessage and label | Improved semantics; no full rendered DOM proof |
| Upload selected file list | Legacy upload affordance: `legacy-styles/components___button.scss:295+` | `file-upload.tsx:99-106`, `file-dropzone.tsx:40-49` optional lists and real percentage | Functional addition, **not** proof of visual parity or of server upload progress |
| Searchable non-creatable select | Legacy AntD search popup: `legacy-styles/components___form.scss:64-108` | `searchable-select.tsx:25-48` native datalist, validity alert and error relation | Validity improved; popup remains a **mismatch** |
| Split/group buttons | `legacy-styles/components___button.scss:1-18`, `old-lms-shell-spec.md:23-24` 9px/36px measured | `button-group.tsx:13-20`, `split-button.tsx:20-40`, `globals.css:1123-1177` | New shared compositions; no global callers migrated and no responsive screenshot |

### 12-item STRICT TICK RULE ledger — intentionally not checked

- [ ] A1 typography roles (missing: complete portal text-role matrix, every compiled weight/line-height/letter spacing, body/page responsive measurements).
- [ ] A2 colour palette (missing: `src` hex/alias scans, visited/disabled/selection/hover states at rendered sites; link token only fixed).
- [ ] A3 scales, radii, shadows and timing (missing: all component and portal consumer values; conflicting legacy `.ln-btn` and measured TPO button sizes to be distinguished by role).
- [ ] A4 scrollbars/focus/cursors/selection (missing: scrollbar opt-in coverage, Firefox/mobile/browser focus and native selection measurements).
- [ ] C1 text/textarea/number/search/password/OTP (missing: full source scan and phone/tablet states, autocomplete and error/empty proof).
- [ ] C2 all select kinds (missing: AntD menu geometry, option selection, popup keyboard/typeahead, creatable/required validation flow; native datalist is not parity).
- [ ] C3 date/time/range/calendar (missing: AntD calendar popup and every state; native browser date fields still used).
- [ ] C4 checkbox/radio/switch/slider/segmented (missing: exact geometry, indeterminate, focus/hover/pressed and responsive proof).
- [ ] C5 uploads (missing: image preview/crop, upload server progress adoption and full file-list parity).
- [ ] C6 labels/layout/helpers/groups/readonly (missing: source-wide replacement of native labels/layout grids, complete form spacing proof and real-page adoption).
- [ ] C7 rich-text editors (missing: a shared rich-text toolbar and editor selection/formatting states).
- [ ] D buttons (missing: global zero raw-button grep, exact variants/sizes/split menu screenshots, every caller migration and disabled/loading proof).

### Work queue (next bounded turn; do not restart category planning)

1. `src/components/ui/searchable-select.tsx` — replace native datalist popup with a visually matching, keyboard-operable 12px AntD-style search menu **without changing input onChange contracts**.
2. `src/components/ui/multi-select.tsx` — verify native popup/selection limitations and implement matching selected-chip and removable-tag UX while preserving existing select props.
3. `src/components/ui/date-range-picker.tsx` and `date-input.tsx` — calendar month/day popup parity, keyboard and focus transitions.
4. `src/components/ui/file-upload.tsx` and `file-dropzone.tsx` — image preview, upload list/progress adoption and mobile file picker states; preserve server validation.
5. `src/components/ui/selection-controls.tsx`, `range-slider.tsx`, `segmented-control.tsx` — measured geometry and keyboard-disabled-error matrices.
6. `src/components/ui/form-grid.tsx`, `form-section.tsx`, `form-field.tsx` — migrate raw form section layouts only in lane-owned source; coordinate pages with portal owners.
7. `src/components/ui/button.tsx`, `button-group.tsx`, `split-button.tsx` — global caller migration, measured grouped/split/hover/disabled/loading states.
8. `src/app/globals.css` — responsive token/cascade proof and full hex/font/scrollbar inventory without changing other lanes' components.

**Whole-`src` grep commands still required before any tick:**

```bash
grep -rlE '<button([[:space:]]|>)' src --include='*.tsx'
grep -rlE '<input([[:space:]]|>)' src --include='*.tsx'
grep -rlE '<select([[:space:]]|>)' src --include='*.tsx'
grep -rlE '<textarea([[:space:]]|>)' src --include='*.tsx'
grep -rnE '#[0-9A-Fa-f]{3,8}\\b' src --include='*.tsx' --include='*.css'
```

**Output counts: not run/unknown** (no mounted checkout; GitHub code-search indexing cannot substitute for the mandatory full-tree grep). Required page-wide raw-control migration is assigned to portal lanes, so their unchecked residuals also prevent this category from being ticked.


## 2026-10-19 follow-up after latest main sync — source evidence, do not tick without full proof

**Integration:** `chatgpt/chat-17-b` fast-forwarded to main after earlier work had been merged; later shared a non-overlapping upstream merge. All updates are on the lane branch via GitHub commits. **No application execution, TypeScript compile, lint, tests, CI or visual comparison.** The repository could not be mounted to execute `grep` against the entire source tree, so the strict coverage rule remains unsatisfied.

### A1–A4 source value and state matrix

| Item / state | Old LMS evidence (path:line, value) | vNext evidence (path:line, value) | Result / remaining difference |
| --- | --- | --- | --- |
| A1 body font | `docs/design/legacy-styles/components___variables.scss:169` Lato/system fallback; `docs/design/old-lms-shell-spec.md:27` measured Inter | `src/app/globals.css:152` Inter + system fallback | Measured shell match; legacy SCSS family conflict unresolved |
| A1 base text | `components___variables.scss:184,193-195` 14px, leading 1.6 | `src/app/globals.css:342-345` 14px/400/1.6 | CSS declarations match; page roles not exhausted |
| A1 label | `components___form.scss:110-115` 13px/600/16px | `src/app/globals.css:600`; `src/components/ui/form-field.tsx:31` 13px/600/16px | Match shared label, page labels unverified |
| A1 field type | `components___form.scss:123-127` 14px/400/20px, +0.2px | `src/app/globals.css:415-419`; `input.tsx:7`, `select.tsx:7`, `textarea.tsx:8` | Match CSS properties; all field variants and h1–h6 unverified |
| A2 accent/hover | `components___variables.scss:10-13` teal #26bac7, dark #1e9aa8 | `src/app/globals.css:14,21-23` same | Match tokens; all consumers unverified |
| A2 shell/link/error/disabled | `components___variables.scss:28,30-31,71`, `components___common.scss:68-75` | `src/app/globals.css:20,30,32-33,44` | Match shared tokens; visited, selection, dark and page hex scan incomplete |
| A3 canonical spacing | `components___variables.scss:208-215` 4,8,12,16,24,32,48,64px effective | `src/app/globals.css:333-340` same | Match final SCSS assignments; consumer override scan incomplete |
| A3 field vs button radius | `components___form.scss:120` 10px field; `old-lms-shell-spec.md:23` 9px action; `components___variables.scss:134` 12px card | `src/app/globals.css:326-328,407-412` 9px action/10px field/12px canvas | Source declarations match role-specific design |
| A3 motion | `components___variables.scss:252,258` 150ms standard easing | `src/app/globals.css:190,194`; `button.tsx:28` | Match shared timing/ease; consumer hover/active not exhaustive |
| A4 hidden scrolling | `components___common.scss:307-311,329-331` chrome hidden | `src/app/globals.css:176-186` hidden | Selector scope differs; browser proof missing |
| A4 visible scrollbar | `components___common.scss:294-300` width 8px, thumb #c4c4c4, radius 1px | `src/app/globals.css:1000-1008` 8px, same thumb and radius | Declaration match; Firefox and hover variants unverified |
| A4 pointer/keyboard focus | `components___form.scss:23-36,130-143` pointer outline none, focus teal 2px, error red 2px | `src/app/globals.css:860-889` equivalent focus/invalid halo | Match primary field rules; native OS focus and phone still unverified |

### C1–C7 and D: form-control value/state matrix

| Item / state | Old LMS evidence (path:line, value or behavior) | vNext evidence (path:line, value or behavior) | Result / remaining difference |
| --- | --- | --- | --- |
| C1 text/number | `components___form.scss:14-19,117-143` number spinners hidden; 14px/20px/0.2px, #fbfcfd; error #ef4444 | `src/app/globals.css:407-457,1098-1101`, `src/components/ui/input.tsx:7-8` | Main declarations match; raw input source coverage unknown |
| C1 textarea | `components___form.scss:117-143` form-family type/error; no fixed universal height | `src/components/ui/textarea.tsx:8-9`, `src/app/globals.css:427-429` 112px min, native resize disabled when disabled | Height/resizing need real legacy screen comparison |
| C1 search | `components___form.scss:38-61` width clamp(180px,20vw,280px), 14px field | `src/components/ui/search-field.tsx:12-18` clamp plus shared Input and action | Declaration match; search result panel is distinct from this control |
| C1 password/OTP | `components___form.scss:174-195` white login field, 14px/20px, teal focus | `password-input.tsx:9-13` show/hide; `otp-input.tsx:5-9` native numeric OS autofill | Type/input semantics preserved, login-specific border needs comparison |
| C2 native select error | `components___form.scss:117-143` 10px field/error halo; `components___antddesign.scss:134-137` selected teal/white | `select.tsx:7-8`, `src/app/globals.css:446-456,1148-1152` | CSS matches where native supports option styling; AntD popup is different |
| C2 searchable select popup | `components___form.scss:64-92` top +5px, max 200px, radius 12px, shadow 0 14px 16px rgba(0,0,0,.04), min item 44px, hover #d1f1f1 | `searchable-select.tsx:125-154`, `src/app/globals.css:845` | Declarations match; keyboard (Arrow/Enter/Escape), selection and validity implemented in `searchable-select.tsx:55-122`, runtime proof missing |
| C2 multi-select | `components___antddesign.scss:134-140` selected #26bac7/white, wrapped text | `multi-select.tsx:22-73` native multiple with optional removable tags, `globals.css:1148-1152` | Selected color declarations match; native dropdown/chip geometry and event propagation not verified |
| C3 day/time picker | `components___antddesign.scss:93-97,191-203,219-224` themed AntD day/time popup | `date-input.tsx:8-10`, `date-range-picker.tsx:21-32` native date fields with range validity | **Mismatch**: browser-native picker not equivalent to AntD month/day/time overlay |
| C4 checked checkbox/radio | `components___antddesign.scss:123-131,742+` teal checked state; `components___variables.scss:10` | `checkbox.tsx:7-10`, `radio.tsx:7-10`, `selection-controls.tsx:11-20` | Native teal checked, checkbox indeterminate and disabled/focus added; exact geometry missing |
| C4 switch | `components___common.scss:226-229` checked teal | `selection-controls.tsx:22-30` role switch, 48×28px, checked teal, error outline, disabled | Checked color declaration matches, legacy geometry/animation unmeasured |
| C4 slider/segment | `components___variables.scss:10,139,148-157` teal and touch 44px | `range-slider.tsx:5-9`, `segmented-control.tsx:16-25` keyboard radios; mobile 44px | Missing thumb/track comparison and full focus/pressed state |
| C5 file selection and progress | `components___button.scss:295+` upload affordance | `file-upload.tsx:74-109`, `file-dropzone.tsx:27-50`: validation, aria-errormessage, opt-in file list, real caller-owned progress | Preview/crop and file-list parity not yet complete |
| C6 required/help/error | `components___form.scss:110-115,136-143` 13px/600/16px label, red 2px/20% focus | `form-field.tsx:13-38`, `globals.css:600,883-889` | Label/error declarations match; every caller spread and reading order unverified |
| C6 grid/breakpoints | `components___variables.scss:148-157` <=767 phone, >=768 tablet, >=992 desktop | `form-grid.tsx:15-22`, `globals.css:1154-1165` 1/2/3 cols | Source breakpoint parity, page-wide migration not proven |
| C7 rich text | `components___common.scss:7-8` Jodit-specific styling (editor in legacy stack) | Shared `textarea.tsx:8-9` plain long-form only | **Missing:** editor toolbar, selection and formatting parity |
| D primary button default | `old-lms-shell-spec.md:23` #0a7c88/white, 36px, radius 9px, 14px/650 | `src/app/globals.css:17-19,324,326,615-620`, `button.tsx:11,16-28` | Measured shell declarations match |
| D hover/active | `components___antddesign.scss:160-169` dark teal/translateY(1px); shell spec teal #086873 | `src/app/globals.css:621-628`, `button.tsx:28` | Measured button hover/active match; source variants conflict with literal .ln-btn |
| D focus/disabled | `components___antddesign.scss:171-181` 3px teal 35% ring offset 2, disabled grey #e5e9f0/#6b7280 | `globals.css:629-633,1200-1206`, `button.tsx:26-29` | Source state declarations match on primary; full keyboard and all variants unverified |
| D loading/groups/split | `components___antddesign.scss:153-185` pending not hoverable; `old-lms-shell-spec.md:23-24` grouped control 9px/36px | `globals.css:1123-1144,1168-1197`, `button-group.tsx:13-20`, `split-button.tsx:20-40` | Branded pending and group seams; no browser simulation or caller inventory |

### Responsive proof status (source media rules only)

| Viewport rule | Legacy source | vNext source | Result |
| --- | --- | --- | --- |
| Phone at 767px | `components___variables.scss:148`, `components___antddesign.scss:67,780+` | `globals.css:1005-1009,1192-1197`; `date-range-picker.tsx:23`; `segmented-control.tsx:19-23` | Code-reviewed phone breakpoint; **no screenshot/interaction proof** |
| Tablet 768–991px | `components___variables.scss:149,155` | `globals.css:1158-1161` 2 columns; `date-range-picker.tsx:23` 2 dates | Breakpoint declaration matches; real layout unknown |
| Desktop >=992px | `components___variables.scss:156` | `globals.css:1162-1164` 3 columns | Declaration matches; no CSS computed measurements |
| Touch >=44px | `components___variables.scss:139`, `components___antddesign.scss:780+` | `globals.css:606,1192-1196`, `segmented-control.tsx:19-23` | Source targets checked; all interactive elements not inventoried |

### Coverage proof status — STRICT TICK RULE intentionally blocks completion

Required full source commands (not executed, counts **unknown**):

```bash
grep -rlE '<button([[:space:]]|>)' src --include='*.tsx'
grep -rlE '<input([[:space:]]|>)' src --include='*.tsx'
grep -rlE '<select([[:space:]]|>)' src --include='*.tsx'
grep -rlE '<textarea([[:space:]]|>)' src --include='*.tsx'
grep -rnE '#[0-9A-Fa-f]{3,8}\\b' src --include='*.tsx' --include='*.css'
```

GitHub indexed searches for `<button`, `<input`, `<select`, `<textarea` returned respectively **50 (capped), 26, 35, 36 candidate files**; these are **not actual raw JSX tag counts** and cannot substitute for the required grep. A targeted complete-file inspection of six indexed candidates (`tpo-team-rename.tsx`, `tpo-team-search.tsx`, `tracker-report-form.tsx`, `workspace-brief-editor.tsx`, `tpo-inbox-search.tsx`, `college-logo-uploader.tsx`) found **zero raw button/input/select/textarea tags in these six files only**, consistent with the earlier codemod having handled those samples. This does not prove that other files contain zero instances. Native fields inside the shared primitives are intentional exemptions, but must still be inventoried in complete grep results.

### STRICT TICK LEDGER — 12 open, 0 ticked (latest)

- [ ] A1 font and type roles (missing: global role census, dynamic type and phone/tablet computed proof).
- [ ] A2 colors (missing: exhaustive hardcoded color grep, all visited/selection/disabled and tracker-dark effects).
- [ ] A3 spacing/radius/shadow/transitions (missing: every consumer and role-specific variant state, browser computed proof).
- [ ] A4 scrollbar/focus/selection/cursor (missing: complete scrolling component inventory and phone/Firefox/browser check).
- [ ] C1 inputs and OTP/password/textarea (missing: all variants and real mobile keyboard/error/readonly comparisons).
- [ ] C2 selects/searchable/multi/tag/creatable (missing: AntD parity for native select popup and tag UI, all keyboard modes verified).
- [ ] C3 date/time/range (missing: fully custom/AntD-like popup and month/day keyboard states).
- [ ] C4 checkbox/radio/switch/slider/segmented (missing: exact geometry, animations, touch and screen-reader results).
- [ ] C5 file/image upload (missing: image preview/crop and end-to-end progress/list visual comparison).
- [ ] C6 labels/helper/error/disabled/readonly/layout (missing: full form caller migration and fieldset/focus proof).
- [ ] C7 rich text (missing: rich-text toolbar/editor and format-state parity).
- [ ] D buttons (missing: complete raw markup grep, icon/sizes/variants caller migration, focused/hovered/disabled browser proof).

**Next exact source file:** `src/components/ui/date-input.tsx`, then `date-range-picker.tsx`: replace the native-only date picker interaction with an accessible legacy-styled date/month popup, keeping `DateInputProps` and existing value/change handlers working. Once that is stable, finish `multi-select.tsx` selected-tags geometry, `selection-controls.tsx` geometry and run authoritative whole-tree grep + responsive source/browser verification before ticking.


## Global skin layer — SMARTER PLAN implementation, 2026-10-19

**Files:** `src/styles/legacy-skin.css` (scoped, standalone) and **one** `@import "../styles/legacy-skin.css";` in `src/app/globals.css`. The stylesheet is read after the existing Tailwind and overlay imports, and overrides page-level utility paint where needed. It does **not** replace the other lanes' shared component files, page structure, or JSX.

**Scope/escape:** Every element selector starts with `:where(main, [data-slot="canvas"], [data-slot="page-canvas"])`. Every selector excludes `:where([data-unskin], [data-unskin] *)`, so an attribute on an element **or any ancestor** opts its entire subtree out of this layer. Plain native buttons are further excluded when marked `[data-slot="button"]`, `[role="tab"]`, `[aria-pressed]`, `[aria-expanded]`, `[role="menuitem"]` or `[role="switch"]`. Native checkbox/radio/hidden/file/range/color and button-like inputs are excluded from general text-field paint. Shared dropdown `details[data-slot="dropdown-root"]` are excluded from disclosure paint.

**Legacy values/source mapping (CSS comments beside rules):**

| Skin family | SCSS or measured source | Scoped effective paint |
| --- | --- | --- |
| Tables: header, hairlines, rows, hover, selection | `components___common.scss:700-713,831-837`; `components___variables.scss:10-13,24-32`; `old-lms-shell.css:45-48` | #fafbfc head, muted #a9a7ae headings, #e5e9f0 hairlines, white body, teal-tinted hover/selected states |
| Native text inputs/select/textareas | `components___form.scss:117-143`; `components___antddesign.scss:511-523`; `components___variables.scss:28,30,46,71,91` | 10px radius, #fbfcfd surface, 14px/400, teal focus halo, red invalid halo, disabled/read-only muted paint |
| Plain buttons | `old-lms-shell-spec.md:23-24`; `components___antddesign.scss:153-189`; `components___variables.scss:252,258` | #0a7c88/white, radius 9px, 14px/650, hover #086873, disabled grey, keyboard focus |
| h1–h6 | `old-lms-shell-spec.md:26-28`; `components___typo.scss:3-40`; `components___variables.scss:176-190` | h1 30px/600 #172033 desktop, 24px on phones; legacy h2/h3 768/992px type scale; remaining heading roles 16/14/13 |
| Links/labels | `components___common.scss:68-75`; `components___form.scss:110-115` | Teal links with hover underline; 13px/600 muted form labels |
| Dialogs, summaries, hr | `components___antddesign.scss:1033-1061,143-146`; `components___common.scss:118-120,1322-1326` | White 12px modal surfaces, neutral 10px disclosures, subdued rules and backdrops |
| Placeholder/selection/scrollbar/focus | `components___form.scss:57-60`; `components___accessibility.scss:13-35`; `components___common.scss:294-311`; `components___variables.scss:10-13,28,48` | Muted placeholder, teal selection/focus paint, neutral scrollbar thumb when visible |

**No layout overrides:** the skin does not assign `margin`, `padding`, `width`, `height`, `position`, `display`, `flex`, `grid`, `transform`, or table row padding/height. Existing page owners retain those values. The style of visually different hand-rolled controls that have explicitly set `[data-unskin]` is preserved.

**Verification performed:** compared the connected repository's exact `globals.css` and new stylesheet content. Exactly **one** import was found. CSS static delimiter scan returned **zero unmatched braces/brackets/parentheses and zero unterminated quoted strings**. Inspected **53 non-@ selectors**: all start in authenticated `main` or a canvas and include the `[data-unskin]` ancestor escape. No app, browser, typecheck, tests, or CI were run. Source-only checks do **not** prove computed-style parity; per SMARTER PLAN the orchestrator's browser-based `docs/audit/ux/parity-report.md` should identify concrete remaining mismatches. This does not entitle any of the prior 12 audit items to a strict tick.
