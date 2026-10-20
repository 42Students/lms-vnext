# UI/UX polish evidence — lane chat-5

## Surface 1 — Super Admin / Academic Setup
**Surface:** `src/app/(authenticated)/admin/academics/page.tsx`  
**Scope:** Academic Setup only; scoped and missing-college states, four create forms, four record tables, row edit/archive/activate dialogs, loading and error route fallbacks.  
**Problems found and fixed: 14.**

| Dimension | Problems found | Changes made |
| --- | --- | --- |
| Clutter | Three same-weight links in the scoped page header; two unrelated links crowd the no-scope header | Kept **Open Programs directory** visible when scoped; moved **Elective slots** and **Batch Promotion Preview →** into a single keyboard-accessible **More** dropdown. Both destinations remain accessible without a college scope. |
| Hierarchy | Four expanded creation forms dominated the first screen and pushed every academic record below the fold | Kept the dependency order period → program → cohort → section, but used four collapsed shared Disclosures. Existing headings, helper copy, inputs, selectors, submit buttons, route destinations, and mutation handlers remain intact. |
| Density | All creation fields and four submit actions were visible simultaneously | Show the relevant form only when its title is expanded; preserve form state while collapsed, validation, pending status, success/error toasts, and refresh. |
| Mobile 375 | Header actions wrapped as three full-width buttons | One full-width directory action plus a full-width **More** trigger on phones; the menu opens as the shared mobile sheet. |
| Tablet 768 / alignment | Header menu and links could have different heights; long action groups aligned to the right on mobile | Match the desktop 36px control-height token, use shared legacy gaps, and left-align row actions on phones while retaining right alignment on desktop. |
| Mobile forms | Individual create buttons used intrinsic widths | All four submissions fill available phone width and return to intrinsic width from tablet up. |
| Table actions | Planned cohorts presented three equal-priority actions per row | Retained **Activate** as the immediate action and grouped **Edit / Archive** in a shared dropdown; confirmations and optimistic mutations remain unchanged. |
| Table actions | Sections presented **Open**, **Edit**, **Archive** together, crowding 375px rows | Retained **Open** visible and grouped **Edit / Archive** in a dropdown; route, validation and confirmation unchanged. |
| Alignment | The overview had 20px outer rhythm while the page used 24px legacy gutters | Standardized its top-level separation to the legacy 24px scale; aligned collapsed form summaries and content to the same leading edge as section heads. |
| Empty states | All four tables said **No records to show.** without any next action | Preserved the title; reused the relevant existing help sentence and added an in-page link to the matching creation disclosure (period/program/cohort/section). |
| Loading / error | Risk of different recovery patterns if locally reimplemented | Audited existing `loading.tsx` / `error.tsx` and the shared GracefulPageLoading / GracefulErrorBoundary. Kept their bounded retry and error actions; no duplicate new fallback. |

**Files changed:** `src/app/(authenticated)/admin/academics/page.tsx`; `src/components/academics/academics-create-panel.tsx`; `src/components/academics/academics-overview.tsx`; `src/components/academics/academics-actions.tsx`; `docs/orchestrator/queues/clone/lane-5-polish.md`; this proof file.

**Preserved:** existing page titles and business copy, all existing IDs / data-testid / aria labels, destination paths, permission and tenant scoping, API mutations, validation, toast messages, legacy colour/radius/typography/control tokens and shared Dialog / ConfirmDialog flows. No new packages, CI or runtime screenshots; checked structure and breakpoint class coverage in source for 375/768/1280. Changes are limited to this surface's components.
