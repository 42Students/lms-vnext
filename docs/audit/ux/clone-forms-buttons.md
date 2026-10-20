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
- [ ] C5 file/image upload/dropzone/progress/list (missing: image cropping; picker and drag/drop now expose opt-in selected-file lists and caller-owned real progress but need legacy file-list geometry, adoption, drag-drop/mobile picker comparison, and full-source grep).
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
| C4 switch | `components___common.scss:226-229` checked teal | `selection-controls.tsx:22-30` role switch, 44×22px, checked #26bac7, error outline, disabled | Checked color declaration matches, legacy geometry/animation unmeasured |
| C4 slider/segment | `components___variables.scss:10,139,148-157` teal and touch 44px | `range-slider.tsx:5-9`, `segmented-control.tsx:16-25` keyboard radios; mobile 44px | Missing thumb/track comparison and full focus/pressed state |
| C5 file selection and progress | `components___button.scss:295+` upload affordance | `file-upload.tsx:74-109`, `file-dropzone.tsx:27-50`: validation, aria-errormessage, opt-in file list, real caller-owned progress | Optional local image preview implemented; crop and file-list parity not yet complete |
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
- [ ] C5 file/image upload (missing: editing/cropping, external progress adoption and end-to-end responsive/file-list visual comparison; local preview is implemented).
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

**Verification performed:** compared the connected repository's exact `globals.css` and new stylesheet content. Exactly **one** import was found. CSS static delimiter scan returned **zero unmatched braces/brackets/parentheses and zero unterminated quoted strings**. Previously inspected **53 non-@ selectors** (updated to 62 in the latest section): all start in authenticated `main` or a canvas and include the `[data-unskin]` ancestor escape. No app, browser, typecheck, tests, or CI were run. Source-only checks do **not** prove computed-style parity; per SMARTER PLAN the orchestrator's browser-based `docs/audit/ux/parity-report.md` should identify concrete remaining mismatches. This does not entitle any of the prior 12 audit items to a strict tick.


## 2026-10-19 chat-17 file-completion pass — skin and form primitives

**Completed source files (checked here means the file update and its source review are complete, NOT that a category passes the strict tick rule):**

- [x] `src/styles/legacy-skin.css` — table/thead/th/td/tr, field/select/textarea, plain button, h1–h6, anchor, label, dialog/alertdialog, details/summary, hr, placeholder, selection, scrollbars and focus states; explicit SCSS file:line comments, element/ancestor `[data-unskin]`, no geometry declarations.
- [x] `src/app/globals.css` — exactly one import of the skin; existing other-lane styles unchanged in this pass.
- [x] `src/components/ui/checkbox.tsx` — teal checked/indeterminate, disabled ink, focus/error state and forwarded ref preserved.
- [x] `src/components/ui/radio.tsx` — checked teal and muted disabled state; removed duplicated utility.
- [x] `src/components/ui/selection-controls.tsx` — compact checked teal switch, labeled checkbox/radio/switch, visible invalid focus, 44px label hit target.
- [x] `src/components/ui/segmented-control.tsx` — checked teal, disabled/invalid focus, phone 44px hit target.
- [x] `src/components/ui/file-upload.tsx` — caller-owned real progress, selected-file list, optional local image preview with object URL revocation, and invalid/disabled state clearing.
- [x] `src/components/ui/file-dropzone.tsx` — drag/picker validation parity, dropped-file list, progress and optional local image preview with URL cleanup.
- [x] `src/components/ui/searchable-select.tsx` — existing keyboard-operable combobox now uses the shared Button for options, not raw skinned buttons.

**Exact source/value spot checks for the completed updates:**

| UI value/state | Legacy source file:line | Current implementation | Source-check result |
| --- | --- | --- | --- |
| Header text in table | `components___common.scss:831-837`, `components___variables.scss:28-32` — #a9a7ae muted heading, white/off-white cells | `src/styles/legacy-skin.css:40-63` | Equivalent neutral palette declarations |
| Row divider/hover | `components___common.scss:700-713` — #e5e9f0, last row borderless; `old-lms-shell.css:45-48` soft teal highlight | `src/styles/legacy-skin.css:65-96` | Same separator and hover colors without row-size changes |
| Input default/error/focus | `components___form.scss:117-143` — #fbfcfd, radius 10px, 14px, 2px teal/15% focus, red/6% error and 20% error halo | `src/styles/legacy-skin.css:99-189`, extended `.error`/`:user-invalid` rules | Same paint values; native popup geometry excluded |
| Action button default | `old-lms-shell-spec.md:23-24` — #0a7c88, white, 9px, 14px/650; `components___antddesign.scss:153-185` hover/disabled/loading | `src/styles/legacy-skin.css:190-250`, shared `button.tsx:11-29` | Equivalent painted states for ordinary/shared variants; caller audit pending |
| Choice checked teal | `components___antddesign.scss:123-131,742-745` — #26bac7; `components___common.scss:226-229` switch teal | `checkbox.tsx:7-10`, `radio.tsx:7-10`, `selection-controls.tsx:20-30`, `segmented-control.tsx:16-25` | Checked color now consistent; rendered dimensions need measurement |
| Field label | `components___form.scss:110-115` — 13px/600 and muted color; `components___antddesign.scss:213-216` checked choice label dark | `legacy-skin.css` label/choice selectors and `form-field.tsx:30-38` | Muted field vs 14px body-toned choice labels separated |
| Image upload | `components___button.scss:295+` — upload affordance | `file-upload.tsx`, `file-dropzone.tsx` preview/list/progress additions | Functional states improved; original legacy crop/preview visual geometry not fully proven |
| Responsive titles | `components___typo.scss:3-40` — 24px phone h1, 22/30px h2, 18/20px h3 | `legacy-skin.css` heading + media rules, 767/768/992px | Breakpoint rules source-matched; no viewport screenshot run |

**Static source verification on the repository's actual files (not CI):** `legacy-skin.css` currently has **64 scoped selector blocks**, 196 source-path:line references, 0 unscoped selectors, 0 selectors missing `[data-unskin]`, no unbalanced brackets/braces/quotes, and no width/height/margin/padding/display/position/flex/grid/transform/overflow/line-height declarations. The skin is imported **once** by `src/app/globals.css`. Edited JSX source was reviewed for paired opening and closing components; `searchable-select.tsx` now opens and closes `<Button>` for listbox options.

**STRICT CATEGORY TICKS: none.** The 12 existing A1–A4, C1–C7 and D categories above remain unchecked under the owner rule until global raw-element and hard-coded-color grep counts, every portal caller, responsive visual proof, and the native/AntD picker and rich-text parity are satisfied. Do **not** misrepresent the checked file ledger as completion of those 12 categories.

**Remaining material gaps (not source-complete):** native AntD-equivalent date/time calendar popups (C3), native select/menu and removable tag parity in every browser (C2), Jodit/rich-text editing (C7), image editing/crop and end-to-end upload adoption (C5), and repo-wide raw-control/code-style searches plus phone/tablet comparisons (A1–A4, C1, C4, C6, D). The orchestrator's computed-style parity report is still not available in this branch.



## Final source additions in this bounded pass

- [x] `src/components/ui/date-input.tsx` — real date-input behavior retained with an additional old-LMS-style calendar from shared `PopoverPanel` and `CalendarGrid`. Includes day selection, prev/next months, keyboard Escape and arrow navigation, min/max bounds and focus return. Existing `mode`, input attributes, `onChange` and ref remain supported.
- [x] `src/components/ui/date-range-picker.tsx` — converted labels that contained a nested calendar button into explicit `htmlFor`/input ID associations, retained both values and limits, and attached reversed-range validation to both fields.
- [x] `scripts/audit/chat17-form-skin-coverage.cjs` — committed a source-only inventory script using the TypeScript JSX AST. It reports exact raw `<button>`, `<input>`, `<select>`, `<textarea>` occurrences, hex-color matches and responsive source references; it does not run tests, CI, or browser code.

**Source evidence for date popup:** `docs/design/legacy-styles/components___antddesign.scss:93-97,191-203,219-224` gives teal focus, selected day and time-pick colors. `docs/design/legacy-styles/components___form.scss:117-143` supplies field radius/text/error rules, while `components___variables.scss:148-157` supplies the phone/tablet breakpoint. The new `date-input.tsx` implements date-mode calendar selection on the existing native input. Non-date modes remain native; a browser-verified time/month/week popup comparison is still an **open C3 gap**.

**Remaining audit commands** (not run here, as the code checkout is not mounted in this session):

```bash
node scripts/audit/chat17-form-skin-coverage.cjs --json
grep -rlE '<button([[:space:]]|>)' src --include='*.tsx'
grep -rlE '<select([[:space:]]|>)' src --include='*.tsx'
grep -rnE '#[0-9A-Fa-f]{3,8}\\b' src --include='*.tsx' --include='*.css'
```

Do not check the strict C3 category until date/time/month/week popup parity and phone/tablet keyboard behavior are actually verified. The file checkmarks above describe reviewed source updates only, not complete category proof.


## Latest completion evidence — global skin and calendar integration

- [x] `src/styles/legacy-skin.css` source review: **64** element-level selector blocks; all scoped under authenticated main/canvas, all preserve the `[data-unskin]` subtree exemption, **196** legacy reference occurrences, one import from `src/app/globals.css`, zero unbalanced CSS delimiters, and zero layout-property declarations. White table cells now clear on hover to reveal legacy teal row tracking (`components___common.scss:700-713,840-853`); form error copy follows `components___global.scss:66-70`.
- [x] `src/components/ui/date-input.tsx` source review: shared PopoverPanel + CalendarGrid month/day popup, date limits, focus return, Escape/arrow keys, and existing native input events/props retained. No hand-rolled modal/drawer.
- [x] `src/components/ui/date-range-picker.tsx` source review: start/end labels now use proper `htmlFor` relationships rather than containing a second interactive calendar button, and both inputs reference the reversed-range error.
- [x] `src/components/ui/file-dropzone.tsx` source review: stale picker selection now resets when a file is dropped; valid/invalid selections and previews cannot both display old and new files.
- [x] `src/components/ui/searchable-select.tsx` source review: listbox option action now uses the shared Button; skin also exempts role=option from generic button paint.
- [x] `scripts/audit/chat17-form-skin-coverage.cjs` source review: TypeScript AST enumerates raw JSX controls, hard-coded colors, responsive references and JSX parse diagnostics. **No run or result count claimed.**

These are file-level source completions, **not** strict A1–A4, C1–C7 or D ticks. Without actually executing the source inventory and comparing the app at phone/tablet sizes to the old LMS, the owner-defined coverage/responsive requirements are not met. Picker time/week/month equivalence, image cropping, and rich-text editor parity also remain unproven.


## 2026-10-19 next batch — complete files with source-only evidence

The following four lane-owned components have been completely reviewed and updated as **files**. Their exact-file JSX source was searched from GitHub's full fetched content; this is a narrower proof than the mandatory whole-`src` grep. Source breakpoint declarations were compared at the old-LMS phone boundary, but no browser viewport or CI was executed.

| Completed file | Legacy value / source file:line | Current implementation file:line | Source outcome |
| --- | --- | --- | --- |
| [x] `src/components/ui/multi-select.tsx` | `legacy-styles/components___antddesign.scss:134-140` selected #26bac7 / white, wrapped; `:511-524` selector 10px/14px, `variables.scss:139` 44px touch | `multi-select.tsx:64-100` native selected options, aria-labeled removable-value list, mobile 44px tag/remove; `legacy-skin.css:640-644` selected teal/white, `globals.css:1128-1133` mobile native select | Source colors and touch boundary match. Browser-native popup may differ from AntD; C2 remains open |
| [x] `src/components/ui/search-field.tsx` | `legacy-styles/components___form.scss:38-61` width clamp(180px,20vw,280px); `variables.scss:139,148-156` mobile touch and 767px boundary | `search-field.tsx:14-18` same clamp, 767px flex-column/full-width input, 44px mobile search button, disabled input blocks submit | Source values match; actual phone rendered widths unverified |
| [x] `src/components/ui/range-slider.tsx` | `legacy-styles/components___variables.scss:10` teal #26bac7; `:139,148` 44px mobile touch; `components___form.scss:110-115` 13px/600 label | `range-slider.tsx:12-29` teal native accent, valid label fallback, keyboard focus/invalid/disabled and phone min-height 44px | Matched available legacy source attributes; native thumb/track geometry not sourced or browser-verified |
| [x] `src/components/ui/input-group.tsx` | `legacy-styles/components___form.scss:117-143` 10px field radius, neutral base, teal 15% focus halo/red 20% invalid; `variables.scss:30,139` neutral border, 44px touch | `input-group.tsx:18-38` single grouped shell, compatible div/ARIA/ref props, prefix/suffix, invalid/readonly states; `legacy-skin.css:695-721` overrides nested Input skin to avoid double focus halos | Outer visual declarations match; child Input keeps its shared keyboard/phone behavior |

**Fetched-file raw JSX search (exact per-file counts):**

| File | raw `<button>` | raw `<input>` | raw `<select>` | raw `<textarea>` | Hex codes outside comments |
| --- | ---: | ---: | ---: | ---: | ---: |
| `multi-select.tsx` | 0 | 0 | 0 | 0 | 0 |
| `search-field.tsx` | 0 | 0 | 0 | 0 | 0 |
| `range-slider.tsx` | 0 | 1 (native range — intentional shared implementation) | 0 | 0 | 0 |
| `input-group.tsx` | 0 | 0 | 0 | 0 | 0 |

The searches are the exact-file equivalent of `grep -E '<(button|input|select|textarea)([[:space:]]|>)'`; comment-only hex references to #26bac7 in `multi-select.tsx` and `range-slider.tsx` are not hard-coded visual properties. All shared `<Select>` and `<Button>` opening and closing tags in `multi-select.tsx` and `search-field.tsx` balance. Responsive evidence is *source-level only*: phone is <=767px (`variables.scss:148`) and tablet begins 768px (`:155`); `multi-select.tsx:84,91`, `search-field.tsx:15-17`, `range-slider.tsx:24` and shared Input's phone rule supply the corresponding implementation. The input group inherits the child control's responsive geometry.

**Whole-tree coverage / strict categories:** Full-`src` grep results and rendered 375px/768px computed styles are still **unknown**, so A1–A4, C1–C7 and D stay unticked. Do not convert file-level checkmarks into category claims. The committed `scripts/audit/chat17-form-skin-coverage.cjs` can supply source counts when run by the orchestrator.

**Next files still needing category-complete parity:** `src/components/ui/select.tsx` (native popup vs AntD), `src/components/ui/date-input.tsx` (time/week/month popups), and rich-text editor parity. Browser comparison, upload crop behavior and whole-tree grep remain open.


## 2026-10-19 next completed batch — native fields, password and OTP

**Completed file checklist (source-level complete, category tick still requires all-screen/grep proof):**

- [x] `src/components/ui/select.tsx` — native select API preserved (form name/value, multiple, options, ref, key navigation, default/controlled state). Consolidated default/hover/focus/disabled/error paint and eliminated duplicated utilities.
- [x] `src/components/ui/textarea.tsx` — shared 10px/14px field states, native text editing, rows/cols and resizing preserved; type now admits React 19 `ref`.
- [x] `src/components/ui/input.tsx` — shared native input, one normalized `aria-invalid`, field focus/error/readonly/disabled states with the same tokens and intact type/autocomplete/ref behavior.
- [x] `src/components/ui/otp-input.tsx` — keeps mobile numeric keyboard/paste/autofill; finite integer code length 1–12 and phone 44px; no split hand-rolled inputs.
- [x] `src/components/ui/password-input.tsx` — native password-manager autofill and explicit show/hide button; disabled locks the action, `aria-controls` and `aria-pressed` exposed, phone 44px tap target.

### Per-property legacy-to-vNext value comparison

| Family and property/state | Legacy reference/value | vNext reference/value | Source result |
| --- | --- | --- | --- |
| Input/select/textarea base color | `components___form.scss:117-127` #fbfcfd background, #0a0517 ink | `src/components/ui/input.tsx:21-27`, `select.tsx:25-29`, `textarea.tsx:22-26`; `src/app/globals.css:863-869` token values | Match shared field declarations |
| Border radius | `components___form.scss:120` 10px; `components___antddesign.scss:517-519` AntD select 10px | `src/app/globals.css:344,424`; `input.tsx:21`, `select.tsx:25`, `textarea.tsx:22` use `--lms-field-radius` | Match |
| Type size/weight/leading/tracking | `components___form.scss:123-126` 14px / 400 / 20px / .2px; `components___antddesign.scss:520-523` select same | `src/components/ui/input.tsx:23`, `select.tsx:27`, `textarea.tsx:24` (14px token, 400, 20px, .2px) | Match |
| Focus paint | `components___form.scss:130-133` 2px brand teal / 15% halo | `src/components/ui/input.tsx:30-31`, `select.tsx:30-31`, `textarea.tsx:30-31`, `src/styles/legacy-skin.css:143-151` | Match halo and brand color; keyboard outline is additional accessibility protection |
| Error border/fill | `components___form.scss:136-139` #ef4444 border, 6% red fill | `input.tsx:36`, `select.tsx:34`, `textarea.tsx:36`; `legacy-skin.css:152-157` | Match, `aria-invalid` propagated |
| Error focus | `components___form.scss:140-143` 2px red / 20% halo | `input.tsx:39-40`, `select.tsx:37-39`, `textarea.tsx:39-40`; `legacy-skin.css:158-164` | Match |
| Disabled neutral | `components___variables.scss:27-32` muted #a9a7ae on neutral #fafbfc, light border #e5e9f0 | `input.tsx:33-35`, `select.tsx:32-33`, `textarea.tsx:33-35`, `legacy-skin.css:166-179` | Match paint; native disabled handling preserved |
| Hover border | `components___variables.scss:91-92` #bfc9da, `components___form.scss:117-143` | `input.tsx:28`, `select.tsx:29`, `textarea.tsx:28`, `legacy-skin.css:540-557` | Match; invalid wins over hover |
| Placeholder | `components___form.scss:57-60` muted gray / 14px | `src/styles/legacy-skin.css:476-485`; `input.tsx:27`, `textarea.tsx:27` | Match |
| Selected native multi-option | `components___antddesign.scss:134-140` #26bac7 and white | `legacy-skin.css:634-645`, `globals.css:1165-1169` | Source color match; browser popup rendering varies |
| Standard desktop control minimum | Measured `old-lms-shell-spec.md:22-24`: 36px control role; AntD select inside older forms `components___antddesign.scss:511-524` 50px-specific role | `globals.css:341` default 36px; `select.tsx:24`, `input.tsx:20` | Source role distinction documented; actual page uses require verification |
| Phone tap target | `components___variables.scss:139,148-156` >=44px at <=767px | `src/app/globals.css:618-624,1127-1133`; `otp-input.tsx:33`, `password-input.tsx:29` | Source breakpoint match, not a rendered measurement |

### Exact fetched-file grep proof (not repository-wide grep)

| File | raw `<button>` | raw `<input>` | raw `<select>` | raw `<textarea>` | hard-coded hex in declarations |
| --- | ---: | ---: | ---: | ---: | ---: |
| `select.tsx` | 0 | 0 | 1 (shared primitive) | 0 | 0 |
| `textarea.tsx` | 0 | 0 | 0 | 1 (shared primitive) | 0 |
| `input.tsx` | 0 | 1 (shared primitive) | 0 | 0 | 0 |
| `otp-input.tsx` | 0 | 0 | 0 | 0 | 0 |
| `password-input.tsx` | 0 | 0 | 0 | 0 | 0 |

Grep equivalent on full fetched file text: `/<(button|input|select|textarea)(?=[\\s>])/g`. Text inside SCSS comments is not counted as a hard-coded declaration. The `<select>...</select>` in `select.tsx` and the `<Button>...</Button>` / `<div>...</div>` in `password-input.tsx` have matching opening and closing JSX tags; the other native inputs/textarea are self-closing.

### Responsive proof boundary / limitations

At the old LMS SCSS `components___variables.scss:148-156` phone boundary 767px and tablet start 768px, shared `globals.css:618-624` sets input/select/button tap heights >=44px on phones. OTP and password-visibility controls also explicitly enforce >=44px at 767px; date/time and plain textarea remain native responsive form controls. No extra tablet grid/property overrides are introduced in these five files; they inherit the parent page and global skin rules. Source code shows input/select remain `w-full min-w-0` and textarea `w-full min-w-0`, preventing rigid desktop widths. This is **source-only responsive proof**: 375px and 768px computed-style/browser snapshots have NOT been executed.

**STRICT category tick rule remains unchanged:** C1 and C2, as well as A1–A4 / C3–C7 / D, stay open until a whole-tree raw-control grep and per-page/mobile comparison are actually performed. Native system select dropdown appearance is not equivalent to a rendered AntD popup on every OS, so C2 is not falsely completed.


### Additional completed file: shared Button

- [x] `src/components/ui/button.tsx` — verified primary/secondary/ghost/link/danger, sm/md/lg/icon/icon-sm, disabled/loading/keyboard focus contracts, and corrected the icon widths and heights to use the legacy phone cutoff at **767px**, not Tailwind's 640px `sm` cutoff. Native button implementation preserved with matched `<button>...</button>` tags, `type="button"` default, disabled double-submit prevention and pending indicator.

| Button property/state | Legacy reference | Shared source value | Result |
| --- | --- | --- | --- |
| Measured primary | `old-lms-shell-spec.md:22-24`: solid #0a7c88/white, 36px high, 9px, 14px/650 | `button.tsx:10-12,24-29` + `globals.css:17-19,341-346` | Match source role |
| Secondary | `components___button.scss:97-126`: outlined #bfc9da, dark copy, teal/white hover | `button.tsx:11`, `globals.css:627-656` | Match measured shell variant |
| Hover/active | `components___antddesign.scss:160-169` darker teal hover and pressed feedback | `button.tsx:10-15,28`, `globals.css:621-628` | Source transition and paint aligned |
| Keyboard focus | `components___antddesign.scss:171-174` teal 35% ring / 2px offset | `button.tsx:28`, `globals.css:629-635`, `legacy-skin.css:226-251` | Source paint aligned; actual native accessibility not browser-proven |
| Disabled/loading | `components___button.scss:146-149` 50% secondary opacity; `components___antddesign.scss:176-185` primary disabled/loading | `button.tsx:25-29`, `globals.css:1140-1162` | Source state separately identified; no runtime click proof |
| Touch target | `components___variables.scss:139,148` 44px phone target at 767px | `button.tsx:19-23` icon sizing uses `max-[767px]`; `globals.css:618-624` min-height >=44px | Matched breakpoint declarations |

**Exact fetched-file grep:** `button.tsx`: raw `<button>` **1** (intentional shared primitive), `<input>` **0**, `<select>` **0**, `<textarea>` **0**; 2 existing `#dc2626` danger-hover color tokens remain in the shared-component file, and the global skin's source colors are separate. **Phone/tablet source proof:** at 767px and narrower, icon buttons now meet 44px in *both dimensions*; 768px and above retain the 36px desktop action role. Whole-repository raw-button grep and browser interaction/rendered measurements are outstanding, so strict D stays **[ ]**.


 
## 2026-10-19 replacement lane — native-compatible time and month picker parity

- [x] `src/components/ui/date-input.tsx` **source file updated and checked**, not the strict C3 category. The existing `DateInputProps` union, `mode`, ref, name, value/defaultValue, onChange, min/max, disabled/readOnly, calendarPopup and form-native validation are preserved. The date grid, month grid and minute-resolution time panel are now all anchored to the shared `PopoverPanel`; seconds/any-step, week and datetime-local still deliberately retain their browser-native UI.
- [ ] C3 date/time/range category (missing: week/datetime-local AntD-equivalent popups; screenshot and keyboard/focus checks for 375px and 768px; full caller inventory and authoritative whole-src grep).

| State/property | Legacy old-LMS source and exact property | vNext source and property | Source comparison |
| --- | --- | --- | --- |
| Date selected cell | `components___antddesign.scss:191-203` selected background `$clrThird` #26bac7 | `date-input.tsx:225-238` date button selected `--lms-primary` #26bac7 | Matches role's selected paint |
| Month selected cell | `components___antddesign.scss:191-203` selected picker cell #26bac7 | `date-input.tsx:204-220` selected month #26bac7/white | Matches selected paint; old month-cell dimensions not proven |
| Time selected option | `components___antddesign.scss:204-207` #26bac7/white | `date-input.tsx:168-202` time hour/minute pressed option `--lms-primary`/white | Matches selected paint |
| Time scroll area | `components___antddesign.scss:209-215` scrollbar-width none and hidden WebKit track | `date-input.tsx:171,183` scrollbar-width none and WebKit scrollbar hidden | Matches source declarations |
| Picker selected-day border | `components___antddesign.scss:191-194` `$clrThird` before ring | `date-input.tsx:227-238` active selected button teal and existing focus outline via `Button` | Partial: old cell pseudo-border geometry is not reproduced |
| Popup surface | `components___form.scss:66-79` white #fff, 12px radius, subtle shadow | `date-input.tsx:158-164` anchored white, radius 12px, shared search-dropdown shadow | Color/radius match; original AntD picker popup shadow is not specified here |
| Default field | `components___form.scss:117-127` background #fbfcfd, 10px, 14px/20px, 400 | `date-input.tsx:139-145` delegates to `Input` and `globals.css` shared field tokens | Match shared field role |
| Error/focus | `components___form.scss:130-143` teal 15% focus and red 20% invalid halo | `date-input.tsx:139-143` shared Input error/focus styles | Matches available source states |
| Disabled/read-only | `components___antddesign.scss:153-185` disabled button neutral, `components___variables.scss:29-32` muted disabled | `date-input.tsx:70-71,93-95,150-154` noninteractive popup button and native input | States retained; visual browser proof pending |
| Time step and min/max | Native `input[type=time]` standards; legacy `components___antddesign.scss:204-215` shows minute panel without step logic | `date-input.tsx:65-82` validates integer minute step, min/max and min-based step offset; unsupported second steps fall back to native | Behaviour compatibility improvement, not claim of historical exact parity |
| Phone/tablet | `components___variables.scss:139,148-156` >=44px phone at <=767px; tablet from 768px | `date-input.tsx:154,178,191,212` popup controls >=44px on phone; shared Input and Button desktop/tablet controls | Source breakpoint agreement only; actual phone/tablet not observed |

**Exact fetched-file grep:** in `date-input.tsx`, raw `<button>`: **0**, raw `<input>`: **0**, raw `<select>`: **0**, raw `<textarea>`: **0**, hex literals in style declarations: **0**. The 24-hour/60-minute popup renders with shared `<Button>...</Button>` and `<PopoverPanel>...</PopoverPanel>` paired tags; untouched React input controls remain native only inside shared `Input`. No code, tests, browser, full-tree grep or CI was run. Strict A1–A4, C1–C7 and D remain **12 open / 0 strict ticks**.

**Next exact file:** `src/components/ui/selection-controls.tsx` (verify native checkbox/radio/switch readonly-like/invalid semantics, touch geometry and focus states), followed by `src/components/ui/file-upload.tsx` and `src/components/ui/file-dropzone.tsx` (selection/drop ownership and accessible progress).


 
## 2026-10-19 replacement lane — shared selection and dropzone source pass

**Completed/reviewed source files (not strict category ticks):**
- [x] `src/components/ui/checkbox.tsx`: preserve native ref/indeterminate/checked/disabled/error styles; when a caller explicitly passes `readOnly`, announce `aria-readonly` and prevent click/Space toggles while preserving focusability.
- [x] `src/components/ui/radio.tsx`: native radio semantics with shared teal/disabled/error; readonly suppresses click, Space and arrow-key changes, keeping the selected radio unchanged.
- [x] `src/components/ui/segmented-control.tsx`: replaced its last raw radio input with the shared `Radio`; added optional `readOnly`, mapped through to native radio and fieldset without changing existing controlled value/handler contracts.
- [x] `src/components/ui/file-dropzone.tsx`: drag highlight now persists while moving across nested picker/label children; only exits when leaving the parent region. Existing drop validation, list, previews and actual caller-owned progress are unaffected.

| Element/state | Legacy source:line and value | vNext source:line and value | Proof status |
| --- | --- | --- | --- |
| Checkbox checked | `components___antddesign.scss:123-131` checked inner border/background `$clrThird` #26bac7 | `checkbox.tsx:10-14` native checked teal `--lms-primary` | Matched color |
| Radio checked | `components___variables.scss:10` #26bac7 active accent | `radio.tsx:12-13` checked accent `--lms-primary` | Matched brand color; native glyph shape differs from AntD on some browsers |
| Switch checked | `components___common.scss:226-229` checked inner background `$clrThird` #26bac7 | `selection-controls.tsx:25-26` checked track `--lms-primary` | Matched color, geometry unproven |
| Choice labels | `components___antddesign.scss:213-216` checked label #0a0517 | `selection-controls.tsx:13-16,24-27` shared 14px body text role | Paint role aligned; computed color pending |
| Focus | `components___antddesign.scss:171-174` keyboard focus teal 35%, offset 2px on primary; form focus `components___form.scss:130-133` teal 15% | `checkbox.tsx:12-14`, `radio.tsx:11-13`, `segmented-control.tsx:23-25` token outline offset 2px | Source presence verified; exact computed halo/radius unproven |
| Disabled | `components___antddesign.scss:176-185` neutral muted; `components___variables.scss:29-32` disabled ink | `checkbox.tsx:12-14`, `radio.tsx:12-13`, `selection-controls.tsx:13,24` disabled neutral/50% | Source checked, browser native appearance pending |
| Read-only interaction | Native checkbox/radio lack enforceable HTML readonly; old LMS has no explicit readonly choice rule in `components___form.scss:110-143` | `checkbox.tsx:7-14`, `radio.tsx:7-13`, `segmented-control.tsx:10-25` prevent readonly toggles | Additional accessibility/contract guard; no pixel parity claim |
| Phone hit geometry | `components___variables.scss:139,148-156` 44px target <=767px | `selection-controls.tsx:13,24` label min-height 44px, `segmented-control.tsx:20-23` min-height 44px | Source breakpoint aligned, 375px touch testing pending |
| Picker drop hover | `components___form.scss:38-75` menu/field hover background and transitions; `components___variables.scss:252-258` motion scale | `file-dropzone.tsx:48-52` teal tinted dragging paint, stable when cursor crosses descendants | No exact legacy drag target dimensions available; C5 remains open |

**Exact fetched-file raw JSX counts:** `checkbox.tsx`: 1 raw `<input>` (intentional shared primitive); `radio.tsx`: 1 raw `<input>` (intentional shared primitive); `segmented-control.tsx`: **0** raw input/button/select/textarea tags after conversion; `selection-controls.tsx`: **0** raw input/button/select/textarea tags; `file-dropzone.tsx`: **0** raw input/button/select/textarea tags. Readonly handlers and closing component tags were reviewed from the complete GitHub source after each write. These numbers are limited to the five stated files, NOT a repo-wide grep.

**Unresolved strict requirements:** A1–A4, C1–C7 and D remain **12 unticked / 0 ticked**. No runtime, CI, tests, browser or authoritative full-tree grep was performed. C4 still needs exact switch/radio geometry + phone/tablet interaction validation, and C5 needs upload crop and whole-flow verification. The code is directly committed to `chatgpt/chat-17-b` after each file; no push to main.

**Next exact source file:** `src/components/ui/file-upload.tsx` — finish selection/preview error-state and required-label parity before proceeding to `src/components/ui/form-field.tsx`.



## 2026-10-19 continuation — shared forms and buttons: bounded file-level pass

This turn continued from \`file-upload.tsx\` after fast-forwarding \`chatgpt/chat-17-b\` to main. Checkmarks in the following **Work queue** attest only to completed **per-file source edits and complete-file searches**, not to the twelve category-wide STRICT TICK RULE items. No locally executed app, TypeScript build, CI, automated test, full-\`src\` grep or rendered viewport comparison is claimed.

### Work queue — source-complete this turn

- [x] \`src/components/ui/file-upload.tsx\` — required label/ARIA, valid and invalid picker, disabled/unavailable clearing, stable image-preview reset, externally supplied progress and keyboard-usable removal; native file field retained.
- [x] \`src/components/ui/file-dropzone.tsx\` — picker unavailable and disabled modes uniformly reject drag; group error association; drag leave over children; dropped-file removal; stale preview/progress cleared.
- [x] \`src/components/ui/search-field.tsx\` — preserve caller's React 19 ref alongside the internal search-submit ref; submit and Enter remain equivalent; search input width follows legacy clamp.
- [x] \`src/components/ui/form-section.tsx\` — visible legend and described fieldset; connect optional description to its unique id without dropping caller \`aria-describedby\`; fieldset disabled behavior unchanged.
- [x] \`src/components/ui/date-range-picker.tsx\` — visible required markers; per-input \`required\`, \`disabled\`, \`min\` and \`max\` preserved, with constrained start/end; reversed-range error linked to both inputs.
- [x] \`src/components/ui/input-group.tsx\` — preserve decorative prefix/suffix \`aria-hidden\` defaults; allow explicitly interactive adornments to stay available to keyboard and assistive technology, without changing the 10px shared group.
- [x] \`src/components/ui/button.tsx\` — all variants and sizes now inherit the 44px phone min-height at the **old-LMS 767px cutoff**, not only icon buttons and not only <=639px.
- [x] \`src/components/ui/input.tsx\` — the same phone min-height rule for native/OTP/password/search/date inputs using the shared component, without changing value, onChange or ref contracts.
- [x] \`src/components/ui/select.tsx\` — the same phone min-height for native, multiple and option-select controls; preserved typeahead, form data and default values.
- [x] \`src/components/ui/form-field.tsx\` — complete-file source review only; existing label association, helper/error description merge, required marker and disabled/readonly delegation were already implemented. No source edit necessary.

### Value proof matrix — legacy values vs updated shared components (static only)

| Property / state | Legacy SCSS/spec value (file:line) | vNext value (file:line) | Result |
| --- | --- | --- | --- |
| Field text base | \`legacy-styles/components___form.scss:123-127\` 14px, 400, 20px, letter-spacing 0.2px, ink #0a0517 | \`src/components/ui/input.tsx:24\`, \`select.tsx:27\`, \`file-upload.tsx:130\` use \`--lms-font-base\`, 400, 20px and \`--lms-form-ink\` | Match in shared declarations; computed font unverified |
| Field surface and radius | \`components___form.scss:117-123\` background #fbfcfd, 10px radius | \`globals.css:1073\` form ink and \`file-upload.tsx:130\`, \`file-dropzone.tsx:67\`, \`input-group.tsx:25-26\` use form background / field radius 10px | Matches role tokens; native file pseudo-button uses its own radius |
| Field hover and focus | \`components___form.scss:117-133\` teal 15% 2px focus halo, 0.2s | \`input.tsx:27-31\`, \`select.tsx:29-32\`, \`input-group.tsx:27\` and \`globals.css:1116-1126\` | State source matches; focus-visible keyboard safeguard retained |
| Invalid field | \`components___form.scss:135-143\` #ef4444, 6% background, red 20% halo | \`input.tsx:35-40\`, \`select.tsx:34-38\`, \`file-upload.tsx:126-130\`, \`input-group.tsx:28-29\` | Matches color/halo; error is tied to aria-describedby |
| Form label | \`components___form.scss:110-115\` muted #a9a7ae, 13px/600/16px | \`file-upload.tsx:120-123\`, \`date-range-picker.tsx:48-60\`, \`form-field.tsx:31-38\` | Match, required red asterisk rendered visually and accessible label retained |
| Helper/error type | \`components___global.scss:66-70\`, \`components___form.scss:110-115\` 12px invalid / 13px helper | \`file-upload.tsx:131-154\`, \`date-range-picker.tsx:67-71\`, \`form-field.tsx:38-39\` | Match respective role sizes/colors |
| Search width | \`components___form.scss:38-47\` clamp(180px,20vw,280px) | \`search-field.tsx:20-22\` \`w-[clamp(180px,20vw,280px)]\` | Exact source value |
| Search submit and disabled | \`components___form.scss:38-61\` white search/search action; \`components___button.scss:146-149\` disabled 50% | \`search-field.tsx:19-22\` shared secondary Button, no submit if disabled | Behaviour retained; standalone search+action spacing differs from legacy icon-only search |
| Group focus / invalid | \`components___form.scss:117-143\` radius 10px, teal 15% focus, red 20% invalid | \`input-group.tsx:25-30\` 10px shared radius, focus/invalid paint and readonly neutral | Same token role, runtime needs computed check |
| Fieldset grouping | \`components___form.scss:110-115\` form-label typography; \`variables.scss:148-157\` breakpoint contracts | \`form-section.tsx:15-26\` 14px legend, 13px description and native fieldset | Label family matched; group heading 14px distinct by design |
| Date-range label/error | \`components___form.scss:110-143\` label 13px/600 and invalid red | \`date-range-picker.tsx:33-71\` two labels with red required mark; one linked 12px invalid message | Match type and color; popups and complete calendar C3 still open |
| Upload preview frame | \`components___button.scss:319-333\` image frame with rounded corners, object-fit:cover | \`file-upload.tsx:141-145\` 10px neutral border and image object-contain | **Mismatch:** the legacy profile photo crop/cover geometry is not the same as a generic attachment preview; keep C5 unticked |
| Upload selection/removal | \`components___antddesign.scss:498-505,698-748\` AntD upload/select affordance | \`file-upload.tsx:132-141\`, \`file-dropzone.tsx:70-79\` removable native file/dropped-file list | Functional equivalents; AntD file-row layout, crop and animations remain unverified |
| Progress visual | \`components___variables.scss:10-15\` #26bac7 on #9ee4e8 light tint | \`file-upload.tsx:146-150\`, \`file-dropzone.tsx:83-87\` caller-owned percent, teal progress fill | Color tokens match; historical AntD progress geometry unproven |
| Disabled picker | \`components___variables.scss:27-32\` muted disabled ink and pale neutral surface | \`file-upload.tsx:58,73-81,124-130,152-154\`, \`file-dropzone.tsx:23-39\` disabled/unavailable clears file and rejects drag | Matching muted family; native WebView picker differences remain |
| Primary button | \`old-lms-shell-spec.md:22-24\` #0a7c88, white, radius 9px, 36px, 14px/650 | \`button.tsx:10-12,18-29\`, \`globals.css:629-648\` | Match desktop paint/geometry; every-variant interaction not browser tested |
| Button hover/loading/disabled | \`components___antddesign.scss:153-185\` darker on hover, pressed 1px, disabled neutral; \`components___button.scss:146-149\` | \`button.tsx:10-15,25-29\`, \`globals.css:1140-1162\` | Source states present; rendered click/focus proof still pending |
| Phone target (all buttons/inputs/selects) | \`components___variables.scss:139,148-156\` 44px at <=767px, tablet >=768px | \`button.tsx:28\`, \`input.tsx:21\`, \`select.tsx:24\`: \`max-[767px]:min-h-11\`; \`globals.css:1128-1133\` specialists | Source boundary matches; no browser/phone screenshot proof |
| Form layout at phone/tablet | \`components___variables.scss:148-157\` <=767px phone, >=768px tablet, >=992px desktop | \`date-range-picker.tsx:46,68\` 1 then 2 columns; \`globals.css:1171-1184\` grid rules | Source breakpoint matches; not a viewport rendering verification |

### Coverage grep proof, bounded exactly to fetched complete files

The line-by-line source scans used the equivalent regular expression \`/<(button|input|select|textarea)(?=[\\s>])/g\` on each **complete connected repository file**. Counts below are raw JSX, not references inside comments; any nonzero raw tags are intentionally the native implementation in its own shared primitive.

| Source file | \`<button>\` | \`<input>\` | \`<select>\` | \`<textarea>\` |
| --- | ---: | ---: | ---: | ---: |
| \`file-upload.tsx\` | 0 | 0 | 0 | 0 |
| \`file-dropzone.tsx\` | 0 | 0 | 0 | 0 |
| \`search-field.tsx\` | 0 | 0 | 0 | 0 |
| \`form-section.tsx\` | 0 | 0 | 0 | 0 |
| \`date-range-picker.tsx\` | 0 | 0 | 0 | 0 |
| \`input-group.tsx\` | 0 | 0 | 0 | 0 |
| \`form-field.tsx\` | 0 | 0 | 0 | 0 |
| \`button.tsx\` | 1 | 0 | 0 | 0 |
| \`input.tsx\` | 0 | 1 | 0 | 0 |
| \`select.tsx\` | 0 | 0 | 1 | 0 |

All changed JSX opening/closing names were read from each fetched file and kept paired. Direct edits use compatible optional props and preserve existing callback/ref signatures. The existing audit script \`scripts/audit/chat17-form-skin-coverage.cjs\` can produce the authoritative repository-wide counts, but it was **not run**. Neither were 375px/768px browser screenshots, min/max/keyboard actual interactions, compiled CSS comparison, lint, typecheck, tests or CI.

**STRICT ledger stays 0 ticked / 12 unticked:** A1–A4, C1–C7, D. Do not mark these complete until the global grep and browser responsive/interaction evidence is collected, and AntD native popup (C2/C3), image crop (C5), and rich editor (C7) differences are resolved.

**Next exact file:** \`src/components/ui/multi-select.tsx\` — complete selected-value tags, readonly/error, dropdown keyboard and AntD popup parity; then \`src/components/ui/searchable-select.tsx\`.



### Follow-on C2 source pass — multi-select tags and searchable selection

- [x] \`src/components/ui/multi-select.tsx\` — added optional \`readOnly\` with native multiple selection restoration, suppressed Space/arrow mutations when readonly, kept form \`value/defaultValue/name\` and \`onChange/onValuesChange\` contracts; disabled option/readonly tag removal prohibited; removable tags announce visible labels. Native \`Select\` and shared \`Button\` remain the only controls.
- [x] \`src/components/ui/searchable-select.tsx\` — controlled valid value or options refresh clears a stale native \`setCustomValidity\`/ARIA error, while free-form and invalid values keep existing keyboard/validation behavior; shared Input/PopoverListbox/Button unchanged.

| C2 property / state | Legacy reference, exact value | vNext source | Result |
| --- | --- | --- | --- |
| Selected option background/text | \`legacy-styles/components___antddesign.scss:134-140\`, brand #26bac7 with white text and wrapped labels | \`src/components/ui/multi-select.tsx:81-89\`, shared Select; \`globals.css:1165-1169\` checked native option teal/white | Same declared colors; system popup varies |
| Search option row min-height | \`legacy-styles/components___form.scss:85-93\`, 44px row with 5px/10px padding | \`src/components/ui/searchable-select.tsx:152-161\`, shared listbox option min-height 44px, 5px/10px | Source match |
| Dropdown scroll max-height | \`components___form.scss:64-78\`, 200px, radius 12px, shadow 0 14px 16px rgba(0,0,0,.04) | \`searchable-select.tsx:152-154\` max-height 200px, \`PopoverListbox\` radius 12px, shadow token | Height/radius match; shadow token needs computed verification |
| Form field border/focus | \`components___antddesign.scss:511-524\` native AntD selector 10px radius and 14px text | \`multi-select.tsx:81-83\`, \`searchable-select.tsx:139-146\`, shared Select/Input 10px/14px | Static shared role match |
| Selected tag and remove | \`components___antddesign.scss:134-140\` selected content wraps | \`multi-select.tsx:90-110\` wrapping tags, disabled/readOnly-aware shared Button, 44px phone remove | Functionality/source geometry present, exact AntD tag visual unverified |
| Keyboard and disabled state | \`components___antddesign.scss:134-140\` selected/disabled option distinction | \`multi-select.tsx:44-79\` native multiple semantics; \`searchable-select.tsx:117-145\` active-descendant + validation | Browser key traversal and OS select popup parity pending |
| Responsive | \`components___variables.scss:139,148-156\` 44px target at <=767px, tablet >=768px | \`multi-select.tsx:98-106\`, \`searchable-select.tsx:148-160\`, shared Select/Input/Button phone target | Source-only responsive proof |

**Exact fetched-file grep counts:** \`multi-select.tsx\` and \`searchable-select.tsx\` each have raw \`<button>\` **0**, \`<input>\` **0**, \`<select>\` **0**, \`<textarea>\` **0**, based on the same complete-file pattern \`/<(button|input|select|textarea)(?=[\\s>])/g\`. Both use matched shared opening/closing JSX tags and no new hard-coded hex color paint. The global all-caller scan and actual mobile/keyboard/browser checks have not been run; **C2 stays unticked**, as do the other eleven strict categories.

**Next exact file for the replacement lane:** \`src/components/ui/date-input.tsx\` (week/datetime-local/seconds/any-step native fallback vs legacy picker popup; do not tick C3 without value and viewport proof).


## 2026-10-20 — C1/C3/C4 picker, range and form-control source completion pass

**Source-level completed files** (a file-level check does not satisfy the STRICT CATEGORY TICK RULE):

- [x] `src/components/ui/date-input.tsx` — ISO week/year calculation, Monday-first week selection, min/max/step enforcement for date/month/week, minute-step time panels, a date + time popup for minute-precision datetime-local, native fallback for seconds and `step="any"`, native bubbling input/change and ref preservation, Escape/focus recovery, Home/End and arrow traversal. Uses the shared Button, Input, CalendarGrid and PopoverPanel with paired opening/closing tags.
- [x] `src/components/ui/date-range-picker.tsx` — keeps caller start/end min/max/disabled/required plus wrapper bounds, associates labels and reversed-range error with both fields; date fields stack at <=767px and form two columns from 768px.
- [x] `src/components/ui/range-slider.tsx` — readonly pointer/keyboard protection with native slider/ref/name, red invalid outline, teal checked track, disabled neutral text without compounded opacity.
- [x] `src/components/ui/selection-controls.tsx` — switch/checkbox/radio labels no longer reduce disabled control opacity twice; readonly cursor and 44px label hit areas kept.
- [x] `src/components/ui/otp-input.tsx` — integer length clamped to 1–12, caller minlength clamped to maxlength, numeric keypad and one-time-code autofill maintained, Enter key hints “done”; shared Input paints default/focus/invalid.
- [x] `src/components/ui/textarea.tsx` — explicit caller `rows` takes precedence over default 112px height; existing native `cols`, resize, value and forwarded ref unaffected; error and readonly tokens unchanged.
- [x] `src/components/ui/password-input.tsx` — user-supplied React 19 ref preserved alongside internal focus ref; Show/Hide returns keyboard focus to its field without changing controlled value or password manager autofill.
- [x] `src/components/ui/button-group.tsx` and `src/components/ui/split-button.tsx` — complete-file source review only; shared Button/group semantics already present, no edit justified.

### Legacy value/property comparison (static source evidence)

| Component/property or state | Old LMS source and exact value | Current vNext source/line | Comparison and limitation |
| --- | --- | --- | --- |
| Picker selected date/week/month | `legacy-styles/components___antddesign.scss:191-199` selected cell `$clrThird` = #26bac7, focus border teal | `date-input.tsx:335-360` selected button `--lms-primary`/white with Button focus | Source color matched; native AntD pseudo-border not pixel-proven |
| Time selected hour/minute | `components___antddesign.scss:219-222` #26bac7 fill / white text | `date-input.tsx:306-326` selected `--lms-primary`/white, pressed state | Paint matched; AntD time-column cell geometry not proven |
| Time list scrolling | `components___antddesign.scss:224-230` scrollbar-width:none plus hidden WebKit | `date-input.tsx:303-315` hidden scrollbars and max-height 14rem | Hide/show source matched; original list max-height unspecified |
| Picker outline and focus | `components___form.scss:130-143` teal 2px/15% focus, red 2px/20% error | `date-input.tsx:251-256`, shared `input.tsx:30-41`, `button.tsx:26-29` | Shared tokens match; keyboard outline additionally visible for accessibility |
| Popup shell | `components___form.scss:64-79` white, radius 12px, shadow 0 14px 16px rgba(0,0,0,.04) for legacy dropdown; AntD calendar popup separately styled | `date-input.tsx:284-288` white, radius 12px, shared shadow | Surface/radius match known popup role; calendar shadow exactness unconfirmed |
| Week Monday column order | ISO week semantics inherent to `<input type=week>`; `components___antddesign.scss:191-199` selected cell theme | `date-input.tsx:31-49,245-250,348-360` seven Monday-first days | Correct ISO week format source; not a legacy layout screenshot |
| Min, max and step | HTML native date/week/month/time constraints; `components___antddesign.scss:191-224` selected state only | `date-input.tsx:90-163,329-357` per-mode bounds, integer stepping, seconds fallback | Preserved known native validity constraints; browser execution unverified |
| Datetime date+time confirmation | `components___antddesign.scss:191-230` selected day, selected time, no mandated Apply placement | `date-input.tsx:365-380` date grid, native time entry, min/max/step gate, Apply | Functional source coverage; AntD picker panel layout and seconds support differ |
| Date/time field font and radius | `components___form.scss:117-127` 14px, 400, 20px, 0.2px tracking, #0a0517, 10px | `date-input.tsx:250-255` shared Input; `src/components/ui/input.tsx:21-26` | Shared field source match |
| Date range error and labels | `components___form.scss:110-115,136-143` 13px/600 label, #ef4444 invalid and red focus | `date-range-picker.tsx:32-76` required indicators, linked errors, strict min/max; shared DateInput error | Role colors/sizes match; runtime constraint flow unverified |
| Range slider brand | `components___variables.scss:10-14` teal #26bac7, muted/disabled neutrals | `range-slider.tsx:20-37` accent `--lms-primary`, disabled neutral | Brand matches; native OS slider thumb/track geometry cannot be inferred |
| Choice selected and switch fill | `components___antddesign.scss:123-131`, `components___common.scss:226-229`: #26bac7 | `selection-controls.tsx:11-30` shared Checkbox/Radio and 44px teal switch | Fill token matches; switch animation/track measurement unverified |
| Choice disabled state | `components___variables.scss:27-32` muted #a9a7ae on neutral surfaces | `selection-controls.tsx:13,24-26` neutral label plus one actual disabled opacity | Neutral source aligned, no double fade |
| OTP and password input | `components___form.scss:117-143` 10px radius / 14px / teal focus / red 20% invalid halo | `otp-input.tsx:20-37`, `password-input.tsx:29-40` via shared Input | Paint source matched; legacy authentication page layout belongs to chat-16 |
| Textarea default and explicit rows | `components___form.scss:117-128` text 14px/400/20px; default .ln-in2 padding 15px 10px | `textarea.tsx:14-43` shared field with explicit row-minheight and 112px default | Font/error match; textarea role-specific padding differs, remains C1 gap |
| Disabled and read-only | `components___button.scss:146-149` disabled opacity .5; `components___variables.scss:27-32` muted ink | `range-slider.tsx:17-37`, `selection-controls.tsx:13,24-26`, `password-input.tsx:31-39` | Correct neutral family; no browser interaction proof |

### Raw JSX grep proof (fetched whole files; not an exhaustive repository grep)

Per-file source was read in full and checked with the equivalent expression `/<(button|input|select|textarea)(?=[\\s>])/g`. Literal hexadecimal values in comments are not style overrides. Native raw fields occur only inside their owning primitive.

| File | Raw button | Raw input | Raw select | Raw textarea |
| --- | ---: | ---: | ---: | ---: |
| `date-input.tsx` | 0 | 0 | 0 | 0 |
| `date-range-picker.tsx` | 0 | 0 | 0 | 0 |
| `range-slider.tsx` | 0 | 1 (own slider primitive) | 0 | 0 |
| `selection-controls.tsx` | 0 | 0 | 0 | 0 |
| `otp-input.tsx` | 0 | 0 | 0 | 0 |
| `textarea.tsx` | 0 | 0 | 0 | 1 (own primitive) |
| `password-input.tsx` | 0 | 0 | 0 | 0 |
| `button-group.tsx` | 0 | 0 | 0 | 0 |
| `split-button.tsx` | 0 | 0 | 0 | 0 |
| `form-field.tsx` | 0 | 0 | 0 | 0 |
| `form-grid.tsx` | 0 | 0 | 0 | 0 |

### Responsive source proof (NOT screenshot or computed CSS evidence)

The old LMS breakpoint comes from `legacy-styles/components___variables.scss:139,148-156`: phone ends at 767px; tablet begins at 768px; standard touch target 44px; desktop layout at 992px. In vNext `date-input.tsx:275-288,340-359` expands the popup to max 22rem on phones (bounded by viewport minus 2rem), enables horizontal scrolling of 7×44px weekday cells when the phone is narrower than the grid, preserves a 36px desktop day button, and sets 44px phone calendar and picker targets. `date-range-picker.tsx:49-76` uses one column up to 767px and two at 768px. `range-slider.tsx:30-36` uses min-height 44px at <=767px; `selection-controls.tsx:13,24` labels are min-height 44px even on desktop; OTP input and password Show/Hide inherit 44px at <=767px. No browser, screenshot, mobile soft keyboard, pointer, focus order, screen reader, app runtime, build, tests or CI was run.

**STRICT CATEGORY TICK LEDGER** remains unchanged: **0 ticked / 12 unticked** (A1–A4, C1–C7, D). Outstanding blockers are real full-tree grep/consumer inventory, rendered phone/tablet proof, exact AntD geometry/popup comparisons, rich editor toolbar and sanitization (C7), image crop (C5) and native-browser popup differences (C2/C3). Do not treat these file-level checks as category closure.

**Next exact lane-owned file:** `src/app/globals.css` — foundation A1–A4 whole-token and state sweep, then `src/styles/legacy-skin.css` with any verified parity-report deltas.


### C5 follow-on — exact old-LMS profile-photo preview skin

- [x] `src/components/ui/file-upload.tsx` — optional `imagePreviewKind="profile"` selects the legacy image frame. Default `attachment` remains the existing contained preview, preserving caller props and generic file semantics.
- [x] `src/components/ui/file-dropzone.tsx` — forwards the same optional image-preview kind to its picker and matches its own dragged image preview. Drag state, progress, validation and removal remain unchanged.

| Property | Legacy SCSS file:line/value | New source file:line/value | Static result |
| --- | --- | --- | --- |
| Profile width and height | `legacy-styles/components___button.scss:304-308` width **175px**, height **194px** | `file-upload.tsx:144-150`, `file-dropzone.tsx:81-85` **w-[175px] h-[194px]** | Match |
| Profile crop position | `components___button.scss:312-318` object-fit **cover**, object-position **center** | Same source files: `object-cover object-center` | Match |
| Profile radius | `components___button.scss:311` **8px** | Same source files: `rounded-[8px]` | Match |
| Generic attachment preview | Not equivalent to the legacy profile photo frame; generic upload affordance `components___antddesign.scss:498-505` | Default `imagePreviewKind="attachment"` retains 10px container and object-contain | Backwards-compatible; separate visual role |
| Phone/tablet | `components___variables.scss:139,148-156` 44px touch, 767px phone cutoff, 768px tablet | File picker/removal Button already 44px at <=767px; profile image max-width 100% retains width limit | Source-only; actual touch layout not rendered |

**Exact fetched-file grep:** both `file-upload.tsx` and `file-dropzone.tsx` have **0 raw buttons, 0 raw inputs, 0 raw selects, 0 raw textareas**. Both use shared Input/Button; all new JSX opening and closing names remain paired. **C5 remains [ ]** because image cropping, adoption by real profile pages, actual file-picker/browser interactions, accessible preview sizing and full-portal screenshot parity are not verified.

**Current work-queue next:** `src/app/globals.css` (foundations A1–A4), then `src/styles/legacy-skin.css`. Full-stack grep, visual/browser proof and the twelve strict category closures are still pending.


## 2026-10-20 — latest-main foundation A1–A4 and C3/C4 source reconciliation

The lane was fast-forwarded to current `main` at the start, without rewriting previous `[chat-17]` work. File-level checkboxes below mean **source completed/reviewed**, not a passed STRICT CATEGORY TICK.

### Work queue: exact files

- [x] `src/styles/legacy-skin.css` — source-accurate responsive h1/h2/h3 *line heights*, alongside existing font sizes; missing native number spinner chrome; tracker-only dark heading-ink exception. Scoped old-LMS paint stays within the authenticated canvas and respects `data-unskin`.
- [x] `src/app/globals.css` — preserved Gecko/macOS grayscale font rendering; mobile native action/text/select touch-target fallback at the old 767px boundary; filled out the exact legacy eight-level stacking token ramp and the six legacy calendar color tokens. Existing measured TPO 36px/9px button versus 10px field distinction stays intact.
- [x] `src/components/ui/segmented-control.tsx` — fixed compounded label+child disabled opacity while preserving Radio control, checked value, keyboard, `readOnly`, error and 44px phone choice hit area.
- [x] `src/components/ui/date-input.tsx` — legacy Sunday heading/date color token `#ff7576` with selected (teal/white), today (teal underline), off-month (muted), disabled, and touch rows remaining higher precedence.

### A1/A2 value proof: legacy versus current file and line (effective values)

| Property / state | Legacy source:line and value | vNext source:line and value | Result |
| --- | --- | --- | --- |
| Old body font paint | `legacy-styles/components___global.scss:9-12` no synthesized weight, WebKit antialias, macOS grayscale, optimizeLegibility | `src/app/globals.css:160-170,1087-1100` real font loading, antialiased, `-moz-osx-font-smoothing:grayscale`, no synthetic weight/style | Rasterization declarations match; **Lato in SCSS versus measured Inter still conflicts** |
| Base body size | `components___global.scss:15,18-20` body 16px, paragraphs 16px/24px | `globals.css:1095-1100` body 16px, 1.5 leading =24px | Base metrics align; per-page paragraphs need full CSS cascade proof |
| h1 measured shell | `old-lms-shell-spec.md:27` 30px/600; legacy `components___typo.scss:3-10` `.h1` 36px/44px desktop versus 24px/32px phone | `legacy-skin.css:276-280,337-343` generic 30px/600 and phone 24px/32px | Phone line box matches; **desktop measured-vs-class typography conflict remains** |
| h2 phone | `components___typo.scss:13-15` 20px/30px | `legacy-skin.css:287-292` 20px/30px | Source match |
| h2 tablet 768–991px | `components___typo.scss:17-20` 22px/32px | `legacy-skin.css:345-351` 22px/32px | Source match |
| h2 desktop >=992px | `components___typo.scss:22-25` 30px/40px | `legacy-skin.css:359-365` 30px/40px | Source match |
| h3 phone | `components___typo.scss:28-30` 16px/26px | `legacy-skin.css:299-304` 16px/26px | Source match |
| h3 tablet 768–991px | `components___typo.scss:32-35` 18px/28px | `legacy-skin.css:345-357` 18px/28px | Source match |
| h3 desktop >=992px | `components___typo.scss:37-40` 20px/30px | `legacy-skin.css:359-371` 20px/30px | Source match |
| Calendar selected color | `components___variables.scss:270,272` selected ink `#000`, selected day `#26bac7` | `globals.css:60,62` `--lms-calendar-selected-ink:#000000`, `--lms-calendar-active-day:#26bac7` | Exact token correspondence |
| Calendar Sunday | `components___variables.scss:273` `#ff7576` | `globals.css:63` `--lms-calendar-sunday:#ff7576`; `date-input.tsx:350-374` applies it only to ordinary Sunday/day header, not selected/today/outside | Correct source color and state precedence |
| Calendar legend light | `components___variables.scss:271` `#a8e3e9` | `globals.css:61` `--lms-calendar-legend-light:#a8e3e9` | Token match; consumer-specific adoption pending |
| Calendar heading muted | `components___variables.scss:274` `#a9a7ae` | `globals.css:64` `--lms-calendar-title-muted:#a9a7ae` | Token match |
| Calendar table hairline | `components___variables.scss:275` `#dddddd52` | `globals.css:65` `--lms-calendar-table-border:#dddddd52` | Token match; rendered border geometry unverified |
| Tracker dark-mode heading contrast | Old white LMS has no tracker dark-mode rule | `legacy-skin.css:373-387` tracker-only `--lms-foreground` / `--lms-body-text` restores legible h2–h6, leaves standard LMS untouched | Nonlegacy compatibility guard, not strict clone proof |

### A3/A4 and C4: spacing/effects/native/mobile state proof

| Property / state | Old LMS source:line/value | vNext file:line/value | Result |
| --- | --- | --- | --- |
| Effective spacing 1–8 | `components___variables.scss:208-215` 4/8/12/16/24/32/48/64px (later values override earlier 40/48 aliases) | `globals.css:359-366` same eight values | Source match |
| Corner radii by role | `components___variables.scss:129-136` 6/12/18/999px standard; `components___form.scss:120` 10px input; measured TPO button 9px | `globals.css:344-345,831-840` scoped 9px Button, 10px Field, 6px generic and 12px card | Source match for differentiated roles; not every caller |
| All eight z-levels | `components___variables.scss:281-288` -1/0/10/100/200/500/800/1000 | `globals.css:846-853` `--lms-z-below/base/raised/dropdown/sticky/drawer/modal/toast` | Exact declarations; consumers still must use them |
| Elevation 1–4 | `components___variables.scss:226-229` two stacked shadow layers per level | `globals.css:860-863` dual-layer matching opacity/spread | Token match; actual modal/card assignment outside lane |
| Motion | `components___variables.scss:252-259` 150ms,250ms,350ms; cubic-bezier(0.2,0,0,1) | `globals.css:205-210` matching fast/base/slow/ease | Declaration match |
| Native number spinner | `components___form.scss:14-20` hide WebKit spinner and zero margin | `legacy-skin.css:143-153`, plus `globals.css:1127-1129` for shared native input | Match hidden chrome; arrow-key native validity unaffected |
| Focus ring | `components___accessibility.scss:19-23` teal-text 2px offset 3px; `components___form.scss:130-143` 2px teal/red form shadow | Existing `micro-details.css:19-35` and `legacy-skin.css:166-181` retain focus-visible styling | Static rule match; no keyboard browser proof |
| Scrolling | `components___common.scss:303-311` hidden chrome; `variables.scss:48` gray thumb #c4c4c4 | `globals.css:194-200,1027-1035` hidden default; opt-in thin; `legacy-skin.css:531-540` thumb | Same tokens/policy where opt-in; Firefox and actual overflow unverified |
| 44px phone controls | `components___variables.scss:139,148-156` 44px tap target through 767px, tablet starts 768px | `globals.css:1143-1161` shared + unconverted native action/text/select mobile min-height | Source breakpoint and min-height match; excludes checkbox/radio/range/file inner boxes deliberately |
| Segmented disabled ink and touch | `components___variables.scss:28,139` #a9a7ae muted, 44px mobile; `components___antddesign.scss:176-185` single 50% disabled paint | `segmented-control.tsx:19-25` label muted and one child disabled opacity; min-height 44px <=767px | Source declaration/state match; browser selected glyph unverified |

### Coverage grep/static check — complete fetched files only

The connected-repository source was read in full and counted with regex equivalents of `/<(button|input|select|textarea)(?=[\\s>])/g` and `/#[0-9a-fA-F]{3,8}\\b/g` after removing CSS comments. This is **not** the required whole-`src` command execution and deliberately cannot close the 12 strict categories.

| File | Lines | Raw JSX button/input/select/textarea | Hex literal count | Open/close braces (comment-stripped) |
| --- | ---: | --- | ---: | --- |
| `src/app/globals.css` | 1252 | 0 / 0 / 0 / 0 | 155 | 243 / 243 |
| `src/styles/legacy-skin.css` | 763 | 0 / 0 / 0 / 0 | 0 | 77 / 77 |
| `src/components/ui/segmented-control.tsx` | 29 | 0 / 0 / 0 / 0 | 0 | 24 / 24 |
| `src/components/ui/date-input.tsx` | 396 | 0 / 0 / 0 / 0 | 0 | 190 / 190 |

Notes: `globals.css` legitimately includes hard-coded canonical color definitions and portal/shell exceptions from other lanes. **155 is not zero**; arbitrary CSS colors across `src` remain open. Brace equality is a limited static sanity check, not a compiler, browser, JS/TSX parser or CSS validation. Shared primitive composition was inspected; no test, typecheck, lint, CI or rendered screenshot was run.

### Responsive proof boundaries and unresolved strict work

Phone: <=767px uses 24px/32px h1, 20px/30px h2, 16px/26px h3, 44px raw form/action target, 44px calendar day and segmented label target. Tablet: 768–991px uses 22px/32px h2, 18px/28px h3, native 36px button baseline and two-column forms. Desktop >=992px uses 30px/40px h2, 20px/30px h3, measured 36px shell buttons and three-column form layouts as configured. These are **source breakpoint proofs only**; no 375/768/1280px rendered before/after viewport measurement was performed.

**STRICT LEDGER: A1–A4, C1–C7 and D remain [ ] (0/12 ticked).** Missing: full tree button/input/select/textarea/hex grep and exemptions, computed style and browser focus comparisons, per-page source/caller migration, the old 36px/44px desktop `.h1` vs measured 30px portal-heading conflict, native picker OS differences, rich-text editor parity, image/upload flow and actual responsive screenshots.

**Next exact file for lane chat-17:** `src/styles/legacy-skin.css` — continue A1/A2 audit of remaining caption/helper/long-form, label/checkbox, form error states and readable contrast without altering other lanes' overlay/table ownership.


### C5 / A2 small error-state correction after main reconciliation

`src/styles/legacy-skin.css:723-736` now limits the `#ef4444` / 12px validation styling to the `-error` file input description and the dropzone's real validation error. It no longer repaints `file-upload.tsx:159`'s disabled/unavailable explanation (13px, muted body text) bright red. The actual validation alert remains in `file-upload.tsx:157` (12px) and `file-dropzone.tsx:92` (12px).

| Source behavior | Legacy source:line | vNext source:line | Finding |
| --- | --- | --- | --- |
| Invalid size/type file selection | `components___global.scss:66-70` `.ln-form-error`, `--status-error:#ef4444`, 12px | `legacy-skin.css:731-736`, `file-upload.tsx:157`, `file-dropzone.tsx:92` | Error red and 12px source match |
| Disabled picker explanation | `components___variables.scss:27-32` muted neutral text roles `#54505d/#a9a7ae` | `file-upload.tsx:159` disabled text `--lms-body-text`, excluded by `legacy-skin.css:732`'s `[id$="-error"]` | Correctly distinct from invalid/error red; still needs rendered comparison |
| Missing picker with alternate | No exact legacy WebView fallback surface established | `file-upload.tsx:126,159` status + optional fallback, unchanged by global error paint | Mismatch cannot be ticked without old WebView reference |

These are static whole-file code comparisons only. The file-owning change is pushed as `[chat-17]`; there is no new layout, no API behavior change, and no fabricated browser evidence. **A1–A4, C1–C7, D remain 0/12 strictly ticked.**
