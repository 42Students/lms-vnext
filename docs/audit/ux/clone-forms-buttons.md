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
| Link default | `legacy-styles/components___common.scss:68-75` #26bac7 | `src/app/globals.css:20` #0e7c87 | **Mismatch**: retained accessible deep-teal link alias |
| Disabled text | `legacy-styles/components___variables.scss:29` #a9a7ae | `src/app/globals.css:30`, `src/components/ui/input.tsx:7` #a9a7ae | Match |

## A3. Spacing, radii, shadows and transitions

- [ ] A3 scale and effects (missing: all consumer/component rules and active/pressed states; two incompatible legacy radius systems; complete z-layer/responsive comparison).

| Property | Legacy source | vNext source | Result |
| --- | --- | --- | --- |
| Spacing 1–6 | `legacy-styles/components___variables.scss:208-213` 4/8/12/16/24/32px | `src/app/globals.css:332-337` same | Match |
| Spacing 7–8 **effective** | `legacy-styles/components___variables.scss:214-215` 48/64px (overrides earlier lines 122–123) | `src/app/globals.css:338-339` 48/64px | Match after correction |
| Control radius | `legacy-styles/components___variables.scss:133` 6px; measured `old-lms-shell-spec.md:23` 9px | `src/app/globals.css:326` 9px | **Source conflict**; matches measured button |
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
| Scrollbar thumb on explicit scrollbar | `legacy-styles/components___common.scss:294-298` 8px gray thumb for module | `src/app/globals.css:999-1007` opt-in 4px | **Mismatch** for explicitly visible thin scrollbar |

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
| Searchable/creatable select | `legacy-styles/components___common.scss:256-262` AntD searchable selector | `src/components/ui/searchable-select.tsx:10-17` native datalist | **Mismatch** popup and `creatable=false` enforcement |
| Native date/time | `legacy-styles/components___antddesign.scss:93-97` AntD picker focus handling | `src/components/ui/date-input.tsx:8-10` native date/time | **Different picker technology**, visuals unverified |
| Date range | Legacy AntD range popup rules (picker family above) | `src/components/ui/date-range-picker.tsx:21-30` two native dates | **Missing** popup/range drag/day-cell parity |
| OTP | `legacy-styles/components___form.scss:174-195` login input form style | `src/components/ui/otp-input.tsx:5-10` numeric/OS one-time-code | Style/behaviour not fully compared |
| Checkbox checked | `legacy-styles/components___antddesign.scss:123-131` #26bac7 | `src/components/ui/checkbox.tsx:7`, `selection-controls.tsx:20` | Accent match; geometry unverified |
| Radio checked | `legacy-styles/components___variables.scss:10` teal accent | `src/components/ui/radio.tsx:7`, `selection-controls.tsx:21` | Accent match; native rendering unverified |
| Switch checked | `legacy-styles/components___common.scss:226-229` teal | `src/components/ui/selection-controls.tsx:22-30` teal token in checked state | Colour match; size/animation not certified |
| Slider | `legacy-styles/components___variables.scss:10` teal | `src/components/ui/range-slider.tsx:5-9` native range | Only colour; thumb/track parity missing |
| Segmented | Legacy AntD tab/selection variants | `src/components/ui/segmented-control.tsx:14-25` native radio group | Keyboard semantics present; geometry unverified |
| Upload validations | `legacy-styles/components___button.scss:295+` image upload affordance | `src/components/ui/file-upload.tsx:17-25,34-92` type/size; `file-dropzone.tsx:17-42` drag/picker | Upload progress/preview/list parity absent |
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
| Ghost/link | `legacy-styles/components___button.scss:188+` transparent controls | `src/components/ui/button.tsx:13` | Partial, link variant absent |
| Icon sizes | `old-lms-shell-spec.md:24` 36px icon controls | `src/components/ui/button.tsx:16-23` 36px icons, mobile 44px | Desktop base match; tablet/phone verification missing |
| Loading | `legacy-styles/components___antddesign.scss:153-185` no hover while loading | `src/components/ui/button.tsx:25-28` aria-busy, disabled, spinner | Pending/double-submit behavior to verify |
| Disabled | `legacy-styles/components___antddesign.scss:179-184` #e5e9f0, #6b7280 | `src/components/ui/button.tsx:11,27`, `src/app/globals.css:629-633` | Match primary base; other variants unverified |
| Keyboard focus | `legacy-styles/components___antddesign.scss:172-177` teal visible focus | `src/app/globals.css:862-866`, `src/components/ui/button.tsx:27` | Width/opacity still need computed comparison |
| Sizes / groups / split | `legacy-styles/components___button.scss:1-18,53-58` base/xs plus app-specific groups | `src/components/ui/button.tsx:16-23` sm/md/lg/icon/icon-sm | No split-button/shared group parity proven |

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
