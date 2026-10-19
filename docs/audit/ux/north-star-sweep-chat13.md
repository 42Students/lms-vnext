# North Star shell and Super Admin first-third sweep — chat-13

Date: 2026-10-19 IST. Branch: `chatgpt/chat-13-b`.

## Measured header rebuilt

The authenticated layout swaps only its header slot to `src/components/shell/topbar/legacy-topbar.tsx`. The sidebar/navigation item tree remains owned by chat-19; it was not edited by this lane. Implementation files:

- `portal-config.ts`: path-based portal command scope; role/portal-aware search copy and scoped quick-create destinations (only when a verified creation route exists); avatar initials fallback.
- `icons.tsx`: real vector search, plus, Messages, notification, chevron icons instead of text-link cluster.
- `topbar.module.css`: 68px white header, 1px `#e7ecf2` hairline, `0 1px 3px rgba(26,45,72,.035)` shadow, 20px horizontal inset, 291×36 search in `#f8fafc`, 9px radius, 82×36 solid `#0a7c88` and white New, 36px action icons with red count, 12px/600 `#334155` organization, 42px avatar (40px phone), mobile control compression.
- `command-search.tsx`: Ctrl/Meta+K shortcut, Escape/outside close, portal-separated navigation shortcuts, scoped search route, and learner course lookup using the existing authorized API.
- `notification-actions.tsx`: confirmed TPO message/notification counts from the existing counters API; reusable learner and recruiter notification drawers; generic notification badge from the existing API, preserving unknown state on failure.
- `account-menu.tsx`: existing My Account route copy, session DELETE, cross-tab logout, Super Admin scope and membership switchers in the avatar dropdown; profile text links no longer float in the header.

The previous TPO text Messages link, in-header MembershipSwitcher, AccountActions text-link group, recruiter Request a drive header link and separate learner course search/notification strip are removed from the app-shell header. Page-local business controls, whose placement and meaning belong to each portal, were not deleted. The new header has one command/search action row instead of separate duplicated header strips.

## First-third of Super Admin source pages reviewed

Scope: **the first 37 routes** from `docs/orchestrator/ui-ux/pages-admin.md`, `/admin/academics` through `/admin/features/[collegeId]/trace` (and checked the next `/admin/hr` boundary when locating the slice). All first-third page sources were inspected for literal hex colors, raw custom inline styles, uncontrolled utility color shades, and manually inverted primary-button text.

**Positive finding:** all 37 page source files already use shared CSS variables for explicit accent colors, rather than literal `#...` color styles; no raw `style={{...}}` appearance overrides were found in this slice. This does not prove every delegated child component obeys the shared kit, nor browser visual parity.

**Targeted code changes:** 13 manually styled primary controls combined `bg-primary` with `text-foreground`, which can show a dark foreground on teal despite the owner's white-on-teal requirement. Their foreground class was changed to the existing `text-on-primary` token without altering any route, page arrangement, form, table, action, or wording.

| Route relative to /admin | Work |
|---|---|
| `announcements` | Primary button text token |
| `batch-promotion` | Primary button text token |
| `batches` | Primary button text token |
| `classes` | Primary button text token |
| `colleges` | Primary button text token |
| `colleges/[collegeId]/readiness` | Primary button text token |
| `companies` | Primary button text token |
| `course-progress` | Primary button text token |
| `electives` | Primary button text token |
| `features` | Primary button text token |
| `features/[collegeId]` | Primary button text token |
| `features/[collegeId]/students/[membershipId]/history` | Primary button text token |
| `features/[collegeId]/trace` | Primary button text token |

Other first-third route sources already lacked this particular foreground conflict. Shared UI primitives and global tokens are separately owned by chat-17; sidebar and grouping are owned by chat-19. No changes were made to those files.

## Authored validation (NOT executed)

- `tests/unit/chat13-legacy-topbar-portal-contract.test.ts`: portal isolation, route selection, initials and measured shell/header swap.
- `tests/unit/chat13-legacy-topbar-accessibility-contract.test.ts`: keyboard shortcuts, focus/recovery, sign-out/switchers, confirmed unread counts and existing notification drawers.
- `tests/unit/chat13-super-admin-first-third-skin.test.ts`: discovers the actual 37 recorded route files and checks the primary-action foreground contract and remaining manual color overrides.

**Release checks remaining:** on-device 320/360/390px keyboard and overflow; Chrome/Safari account and notification overlays; actual global search outcomes for all portals; badge counts from a real authenticated session; account menu scope switching; TPO/HR/Learner role journeys; app-shell/sidebar hover interaction; visual screenshot comparison at 1280×800. The owner requested no code/CI execution. No production acceptance, pixel-perfect browser comparison or green-test claim is made here.

## Continuation — 19 October: next Super Admin files, TPO, then recruiter/HR

**Workflow:** pulled the moving `origin/main` (fast-forward to `ee98b58c86df02c0513136baab6d35ef633fef59` before further edits), committed each unit on `chatgpt/chat-13-b`, and merged subsequent main updates by retaining non-overlapping changes and resolving the HR focus-ring edits in the resulting source. All this work is **source-authored without CI, runtime or screenshots**.

### Main-header migration gaps closed in the next files

- `src/components/shell/topbar/tpo-quick-create.tsx` + `legacy-topbar.tsx`: old TPO create menu has its contextual `Recruiter lead`, `Drive` and follow-up modal, not just a plain new-drive link. Company-specific prefill and keyboard summary remain. `Suspense` surrounds `useSearchParams`.
- `src/components/shell/topbar/tpo-find-suggestions.tsx` + `command-search.tsx`: added the actual, college-scoped `/api/tpo/find-suggestions` backend and retained the existing authenticated learner course search; filters malformed suggestions to internal TPO paths, debounces requests, cancels stale searches, supports ArrowDown/ArrowUp result navigation and on-open cleanup. The initial static navigation shortcuts remain.
- `src/components/shell/topbar/tpo-notification-cluster.tsx` + `notification-actions.tsx` + `src/components/tpo/tpo-bell-panel.tsx`: the previous topbar migration initially replaced the TPO bell with a plain route link, losing the read/mark-all drawer. This pass **restores the original drawer** and unread counts from the validated TPO header snapshot; only the 36px trigger presentation is compact. Unknown/error count is not silently displayed as zero.
- `src/app/(authenticated)/tpo/layout.tsx`: removed the **entire duplicate quick-access strip** (Find, + New, messages and notifications) from the page canvas after its features moved to the shared top bar. This also removes two independent server reads for every TPO page; the new client header fetches on visibility/polling. `TpoKeyboardShortcuts showTrigger={false}` retains the global `?`, `G → …` and `N → …` bindings with no redundant visible button. TPO mobile footer remains.
- Search commands now expose only supported portal-local directory searches: TPO students/recruiters/companies, Super Admin people/companies/placement drives/projects, HR drives/conversations and College Admin students/courses. Each destination applies its existing route permission and filter parser. No synthetic cross-tenant federated search was introduced.

### Super Admin first-third follow-up

Beyond the earlier 13 white-on-primary repairs, `/admin/{announcements,batch-promotion,batches,classes,colleges,companies,course-progress,electives,faculty-assignment,features*}` now uses measured 9px shared control radius and 36px desktop/44px phone action-height rules for manually skinned controls. **Batches, Classes, Batch Promotion and Announcements** have ordinary filter/list outer card chrome flattened to hairline separators so the global `PageCanvas` is the one white canvas; meaningful alert, individual review, confirmation and data objects keep their boundaries. `bg-surface-subtle`, not part of the canonical theme, was changed to the supported `bg-muted` on one batch summary.

### Next portal: HR/Recruiter

The adjacent completed `docs/audit/ux/north-star-sweep-chat-15.md` was read and compared against the actual HR source. This follow-up changed only the **HR drives, conversations and notifications search/forms** from native `input`/`select`/`button` overrides to `@/components/ui/{input,select,button}`, retaining hidden filters, GET navigation, POST actions, exact wording and readable/mobile form layouts. The same files received concurrent focus-ring token changes on main; source was rebuilt against main's latest version before branch merge, preserving those edits.

### Test and release caveat

`chat13-legacy-topbar-accessibility-contract.test.ts` now asserts the migrated TPO drawer, inbox actions, new menu, dynamic records and removal of the duplicate strip. `chat13-legacy-topbar-portal-contract.test.ts` covers actual route/alias separation and directory search mappings. No automated checks were executed. The browser/mobile visual comparison, service authorization/tenant tests and deployment acceptance remain the orchestrator's work.
