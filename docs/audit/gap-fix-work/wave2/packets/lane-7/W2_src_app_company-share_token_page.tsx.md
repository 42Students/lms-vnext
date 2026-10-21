# Work packet (wave 2): edit src/app/company-share/[token]/page.tsx

24 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/company-share-token.md, docs/audit/gap2/lane-15/l20-u031-public-pages.md, docs/audit/gap2/lane-20/public-share-controller.md

## G2-1-029-003  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:145-152: preview names role and company before code.
- vNext now: src/app/company-share/[token]/page.tsx:29-44: code-required title generic 'Enter the 6-digit share code', no role/company.
- Fix: Show safe share role/company preview without leaking applicant data.

## G2-1-029-004  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:134-145: main max1000, padding16; locked Card max480 margin48 auto.
- vNext now: src/app/company-share/[token]/page.tsx:24-45: themed min-height center max-w-xl and padding-top96.
- Fix: Match centered 480px prompt and outer 1000px container.

## G2-1-029-005  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:155-165: full card with title + inline extra downloads + info + Table.
- vNext now: src/app/company-share/[token]/page.tsx:62-111: summary, search, counter, DataTable, pagination, collapsible downloads.
- Fix: Reorder applicant card and actions to old hierarchy.

## G2-1-029-006  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:136-139: fixed diagonal 120 repeated watermarks opacity .07.
- vNext now: src/app/company-share/[token]/page.tsx:63-65: fixed 18 repeated watermarks opacity .20 uppercase.
- Fix: Match count, placement, rotation, opacity and font case for strict clone.

## G2-1-029-007  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:145-146: title 'Applicants for {role}' and 'Shared with {company}. Enter ...'.
- vNext now: src/app/company-share/[token]/page.tsx:31-32: generic heading/copy, no company/role.
- Fix: Restore role/company-specific code entry prompt.

## G2-1-029-008  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:148-150: large code Input+Open Button joined Space.Compact.
- vNext now: src/app/company-share/[token]/page.tsx:35-42: vertical labeled Input and full-width 'Open shared applicants'.
- Fix: Match horizontal compact Input+Open control.

## G2-1-029-010  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:152: link expiry toLocaleDateString and 'Everything you open is logged.'
- vNext now: src/app/company-share/[token]/page.tsx:75-77: shows expiry after opening, not at code prompt.
- Fix: Show expiration information before code entry.

## G2-1-029-016  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:130-132: empty table values shown as '-'.
- vNext now: src/app/company-share/[token]/page.tsx:55-61: uses 'Not recorded' for null.
- Fix: Restore '-' placeholder across all selected columns.

## G2-1-029-020  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:161-162: sharedBy or placement cell and sharedOn localized date.
- vNext now: src/app/company-share/[token]/page.tsx:72-76: collegeName and createdAt IST, not staff name.
- Fix: Map human sender and date if operator disclosure approved.

## G2-1-029-024  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:156: title applicant total from loaded `data.applicants.length`.
- vNext now: src/app/company-share/[token]/page.tsx:92-94: global total/page status and separate title.
- Fix: Show visible count in Card header.

## G2-1-029-025  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:130: applicantId first pinned through array, no row bulk actions.
- vNext now: src/app/company-share/[token]/page.tsx:53-61: selectedColumns only, may not include applicationId.
- Fix: Force Applicant ID first to match legacy identity column.

## G2-1-029-048  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:142: warning 'We couldn't load this share' and retry.
- vNext now: src/app/company-share/[token]/page.tsx:25-27: 'Shared applicants', 'This page is temporarily unavailable. Try Again.'
- Fix: Restore exact warning copy and Retry button.

## G2-1-029-059  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:145: 'Applicants for {role}', L:156 '{n} applicants for {role}'.
- vNext now: src/app/company-share/[token]/page.tsx:68-70: 'Shared with {company}' and title in separate paragraph.
- Fix: Align card headers and counts.

## G2-1-029-061  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:151: 'Email me a code instead', L:158 'Download all resumes (ZIP)'.
- vNext now: src/app/company-share/[token]/page.tsx:104-109: only 'Download list (CSV, up to 500 applicants)'.
- Fix: Add missing button copy only when backed by secure feature.

## G2-20-031-016  [P2] GAP  facet F05  effort M
- Legacy: Legacy public applicant share Antd Table with columns including Applicant ID and derived GitHub/portfolio, client-side list export `company-share/[token].js:130-162`.
- vNext now: vNext DataTable with server query + pagination + search `src/app/company-share/[token]/page.tsx:53-108`.
- Fix: Map table head/row density, empty state, stage labels; document deliberate server-side paging and selected columns as a functional enhancement.

## G2-20-031-020  [P2] GAP  facet F06  effort S
- Legacy: Legacy share code six-digit input max6, button disabled until length 6 `company-share/[token].js:145-151`.
- vNext now: vNext required numeric Input and server post `src/app/company-share/[token]/page.tsx:29-42`.
- Fix: Confirm HTML pattern/length and disabled state until six digits; retain native form submit accessibility.

## G2-20-025-002  [P2] GAP  facet F02  effort S
- Legacy: Pre-code company/role docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoShareService.java:115-120
- vNext now: Code prompt only src/app/company-share/[token]/page.tsx:29-44
- Fix: Show context

## G2-20-025-006  [P2] GAP  facet F06  effort S
- Legacy: Old POST code docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicShareController.java:32-35
- vNext now: 6digit form proof src/app/company-share/[token]/page.tsx:35-43
- Fix: Match code input

## G2-20-025-015  [P2] MISSING  facet F15  effort M
- Legacy: Code email 5/hour docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoShareService.java:156-180
- vNext now: No send-code UI src/app/company-share/[token]/page.tsx:31-43
- Fix: Restore throttle

## G2-1-029-012  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:161: shortlist deadline alert info.
- vNext now: src/app/company-share/[token]/page.tsx:81: shortlist deadline border-left status, different visual.
- Fix: Match blue AntD info banner.

## G2-1-029-047  [P3] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:141: Skeleton active rows4 in 480px Card.
- vNext now: src/app/company-share/[token]/page.tsx:17-28: SSR ErrorState, no same skeleton.
- Fix: Use loading.tsx skeleton.

## G2-1-029-055  [P3] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:135: max1000 px and table scroll x:max-content.
- vNext now: src/app/company-share/[token]/page.tsx:62,95-103: max-w-5xl (~1024px) and DataTable mobile adaptation.
- Fix: Match width/padding and horizontal scroll handling.

## G2-1-029-056  [P3] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:137-139: diagonal watermark even on narrow devices.
- vNext now: src/app/company-share/[token]/page.tsx:63-65: grid watermark fixed 18 tags and opacity20.
- Fix: Match opacity and text density.

## G2-1-029-058  [P3] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:142-143: AntD Alerts include icons.
- vNext now: src/app/company-share/[token]/page.tsx:24-52: role=alert and ErrorState, no AntD icon.
- Fix: Restore icon/heading accessible equivalence.
