# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/l11-u020-tpo-recruiters.md

31 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l11-u020-tpo-recruiters.md

## G2-11-020-002  [P2] GAP  facet F01  effort S
- Legacy: ?due=1 rewrites to followUp OVERDUE+TODAY via shallow router (index.js:248-254).
- vNext now: ?due=1 initializes nextFollowup=DUE, with no rewrite (recruiters/page.tsx:56-65).
- Fix: Preserve accepted redirect alias and exact two-bucket filter semantics.

## G2-11-020-004  [P2] GAP  facet F02  effort M
- Legacy: Header title Engage, exact subtitle relationships/followups/drives; Import + Add side by side (index.js:505-512).
- vNext now: PageHeader title sourced via TPO_OWNER_PAGE_COPY, description differs; Add then More actions dropdown (recruiter-leads-workspace.tsx:663-685).
- Fix: Restore exact subtitle, standalone Import and Add action order.

## G2-11-020-005  [P2] GAP  facet F02  effort S
- Legacy: Needs doing chips immediately under header when total>0, then tabs (index.js:514-531).
- vNext now: Needs doing collapsible panel, search/Stage row, tabs below (recruiter-leads-workspace.tsx:706-755).
- Fix: Restore always-visible four chips above tab strip without intermediate controls.

## G2-11-020-006  [P2] GAP  facet F02  effort M
- Legacy: Table tab uses Card wrapping TpoDataTable (index.js:534-543).
- vNext now: GridWorkspace direct with toolbar and AG Grid (recruiter-leads-workspace.tsx:1013-1056).
- Fix: Match legacy one-canvas table border, toolbar positions and card geometry.

## G2-11-020-007  [P2] GAP  facet F03  effort S
- Legacy: Import dedicated outlined button on page header (index.js:507-512).
- vNext now: Import action hidden within More ··· dropdown (recruiter-leads-workspace.tsx:675-682).
- Fix: Surface Import as immediately visible header button.

## G2-11-020-008  [P2] GAP  facet F03  effort S
- Legacy: Needs doing chips use label · bold count, pressed states and data-testid (index.js:514-523).
- vNext now: Expandable button + FilterChip count parentheses, no individual data-testid (recruiter-leads-workspace.tsx:706-725).
- Fix: Use legacy chip label/count punctuation and direct filter buttons.

## G2-11-020-009  [P2] GAP  facet F03  effort S
- Legacy: Four attention chips Follow-ups due, No next step, Gone quiet, Unassigned (index.js:280-287,514-523).
- vNext now: Four chips only when needsExpanded; 'Unassigned' via separate need model (recruiter-leads-workspace.tsx:713-723).
- Fix: Expose all four immediately, no default collapsed hiding.

## G2-11-020-011  [P2] GAP  facet F04  effort S
- Legacy: Contact cell name plus designation; fallback Unnamed contact (index.js:418-428).
- vNext now: Contact grid read only name; designation separately not in grid model (recruiter-leads-workspace.tsx:73-89).
- Fix: Render designation beneath name within Contact cell.

## G2-11-020-013  [P2] GAP  facet F04  effort M
- Legacy: Stage cell rendered colored StageTag; stage options New/Contacted/Not now (index.js:435-447).
- vNext now: Grid reads label text, separate RecruiterInlineStage row action (recruiter-leads-workspace.tsx:75-76,1042-1052).
- Fix: Reinstate colored stage pill and matching inline editor placement.

## G2-11-020-014  [P2] GAP  facet F04  effort S
- Legacy: Company missing value shown 'Not set' (index.js:449).
- vNext now: Company reads empty string (recruiter-leads-workspace.tsx:77).
- Fix: Display exact Not set placeholder.

## G2-11-020-015  [P2] GAP  facet F04  effort S
- Legacy: Owner missing 'Unassigned' (index.js:455-456).
- vNext now: Owner reads empty string (recruiter-leads-workspace.tsx:81).
- Fix: Restore exact Unassigned placeholder.

## G2-11-020-016  [P2] GAP  facet F04  effort M
- Legacy: Last activity includes lowercase event type · D MMM; missing '-' (index.js:465).
- vNext now: Grid returns raw ISO-like timestamp (recruiter-leads-workspace.tsx:82).
- Fix: Render event + D MMM in IST and '-'; retain raw export value.

## G2-11-020-017  [P2] GAP  facet F04  effort S
- Legacy: Next follow-up format D MMM, missing '-' (index.js:466).
- vNext now: Reads raw ISO datetime (recruiter-leads-workspace.tsx:83).
- Fix: Format day/month and missing dash.

## G2-11-020-018  [P2] GAP  facet F04  effort M
- Legacy: Invite includes recruiterActivity joined text, NOT_SENT/SENT/CLICKED/JOINED/BOUNCED labels (index.js:41,467-468).
- vNext now: Invite strips underscores only (recruiter-leads-workspace.tsx:84).
- Fix: Map exact labels, including Clicked and joined activity message.

## G2-11-020-019  [P2] GAP  facet F04  effort S
- Legacy: Added D MMM YYYY, null '-' (index.js:469).
- vNext now: Added raw createdAt (recruiter-leads-workspace.tsx:85).
- Fix: Format dates as legacy day month year.

## G2-11-020-020  [P2] GAP  facet F04  effort S
- Legacy: Came from source label from configurable choices (index.js:470).
- vNext now: Column called Source, raw code or Manual (recruiter-leads-workspace.tsx:86).
- Fix: Use exact header 'Came from' and source choice labels.

## G2-11-020-021  [P2] GAP  facet F04  effort M
- Legacy: Flags Quiet N d and color-tag specific per chip (index.js:32,415,453).
- vNext now: Semicolon joined chip labels, no Quiet days (recruiter-leads-workspace.tsx:80).
- Fix: Restore separate colored chips and quiet day count.

## G2-11-020-022  [P2] MISSING  facet F05  effort M
- Legacy: Table columns Contact,Status,Stage,Company,Designation hidden,Email hidden,Phone hidden,Flags,Owner,Last activity,Next follow-up,Invite,Added hidden,Came from,Company drives,Students placed,Actions (index.js:418-474).
- vNext now: Roster grid lacks Designation and Students placed; Source renamed; extra sort metadata (recruiter-leads-workspace.tsx:73-89).
- Fix: Restore each missing/renamed column and correct default visibility.

## G2-11-020-024  [P2] GAP  facet F05  effort L
- Legacy: Filters grouped Pipeline, Timing, Contact, Company, 14 keys incl drive/hired ranges (index.js:78-101).
- vNext now: Dropdown form flat fields and drive count bucket, no hired range visible (recruiter-leads-workspace.tsx:772-875).
- Fix: Restore grouped checklist/range filter sections and Students placed range.

## G2-11-020-026  [P2] GAP  facet F05  effort S
- Legacy: Invite filter NOT_SENT, SENT, CLICKED, JOINED, BOUNCED (index.js:41,87-88).
- vNext now: Invite filter NOT_INVITED, SENT, OPENED, BOUNCED, JOINED (recruiter-leads-workspace.tsx:790-795).
- Fix: Preserve CLICKED vs OPENED mapping and enum aliases.

## G2-11-020-030  [P2] GAP  facet F06  effort M
- Legacy: Add form fields Name,Designation,Email,Phone,Company,Source,Follow up on date+time,About (index.js:630-656).
- vNext now: Form fields Name,Email,Phone,Company,Designation,Source,date-only,Follow-up note (recruiter-leads-workspace.tsx:1128-1175).
- Fix: Restore field order and date-time picker with minute precision.

## G2-11-020-031  [P2] GAP  facet F06  effort S
- Legacy: Name required message Name is required, placeholder Ravi Kumar (index.js:640).
- vNext now: HTML required maxlength150 no placeholder (recruiter-leads-workspace.tsx:1133-1134).
- Fix: Restore exact placeholder and field error text.

## G2-11-020-033  [P2] GAP  facet F06  effort S
- Legacy: Email placeholder ravi@acme.com, validator Enter a valid email (index.js:644).
- vNext now: Email type=email maxLength150, no placeholder (recruiter-leads-workspace.tsx:1135-1136).
- Fix: Restore placeholder and visible validation wording.

## G2-11-020-034  [P2] GAP  facet F06  effort M
- Legacy: Phone placeholder 98xxxxxx01, regex starts + or digit then at least 7 chars of digits/spaces/dashes (index.js:645).
- vNext now: type tel maxLength30, no displayed regex or placeholder (recruiter-leads-workspace.tsx:1137-1138).
- Fix: Restore sample placeholder and equivalent phone validation.

## G2-11-020-035  [P2] GAP  facet F06  effort M
- Legacy: Company autocomplete from known names, auto-derived work email domain with exclusions (index.js:631-648).
- vNext now: HTML datalist, no domain auto-fill in form field handler (recruiter-leads-workspace.tsx:539-545,1144-1153).
- Fix: Reimplement domain suggestion excluding free-mail providers and legacy helper text.

## G2-11-020-036  [P2] GAP  facet F06  effort M
- Legacy: Source optional placeholder Alumni, referral, LinkedIn…; option list from server choices (index.js:650-652).
- vNext now: Hard-coded SOURCE_CHOICES and Added by hand default (recruiter-leads-workspace.tsx:131-136,1156-1162).
- Fix: Use server-backed pickable choices and exact optional hint.

## G2-11-020-048  [P2] GAP  facet F10  effort M
- Legacy: Create POST addRecruiterLead then optional separate addFollowUp (index.js:378-406).
- vNext now: POST /api/placements/tpo/leads with confirmed lead and nested followup (recruiter-leads-workspace.tsx:629-648).
- Fix: Document transactional equivalence and preserve follow-up partial failure contract.

## G2-11-020-053  [P2] GAP  facet F12  effort M
- Legacy: Follow-up due = today+overdue with dj startOf/endOf day and next7 buckets (index.js:43-53).
- vNext now: nextFollowup DUE/TODAY/etc with future IST 09:00 default on create (recruiter-leads-workspace.tsx:839-849,623-625).
- Fix: Align due boundary and optional time by IST business date.

## G2-11-020-061  [P2] GAP  facet F17  effort M
- Legacy: Chips aria-pressed; card drag/drop and Escape/keyboard fields via Ant; contact button (index.js:514-520,571-579,424-428).
- vNext now: Native links, pressed FilterChip, HTML5 drag drop only CONTACTED (recruiter-leads-workspace.tsx:713-724,1059-1117).
- Fix: Preserve keyboard accessible action parity for all manual stage changes.

## G2-11-020-062  [P2] GAP  facet F18  effort S
- Legacy: Exact 'Engage' subtitle, 'Import', chips punctuation, table 'Came from' (index.js:507-523,470).
- vNext now: Description different, Import hidden, 'Source' header (recruiter-leads-workspace.tsx:665-682,73-89).
- Fix: Use exact catalogue-B strings and positions.

## G2-11-020-032  [P3] GAP  facet F06  effort S
- Legacy: Designation optional placeholder HR Manager (index.js:641).
- vNext now: Designation input no placeholder, maxLength100 (recruiter-leads-workspace.tsx:1154-1155).
- Fix: Add original placeholder; verify maxlength parity.
