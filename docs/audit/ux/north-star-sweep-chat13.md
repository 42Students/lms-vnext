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
