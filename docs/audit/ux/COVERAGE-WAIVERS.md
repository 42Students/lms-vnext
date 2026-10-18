# Proposed UX coverage exceptions (awaiting owner approval)

These routes are intentional HTTP redirects with no rendered page, interaction target, overlay, card, table or button. The destination has the real shared-kit UI, loading/error boundaries and UX test coverage. Adding a decorative shared component before `redirect()` would have no runtime effect and could mislead the coverage scanner. **Owner approval: pending**; do not count as accepted waivers before signoff.

| Route/file | Reason | Owner approval |
|---|---|---|
| `/college/people` — `src/app/(authenticated)/college/people/page.tsx` | Redirect to `/college/contacts`; no independent UI | Pending |
| `/college/projects/workspaces` — `src/app/(authenticated)/college/projects/workspaces/page.tsx` | Redirect to canonical `/college/projects` | Pending |
| `/college/projects/workspaces/[workspaceId]` — `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/page.tsx` | URL-preserving redirect to canonical workspace detail | Pending |
| `/college/projects/workspaces/[workspaceId]/[section]` — `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/page.tsx` | URL-preserving redirect to canonical workspace section | Pending |
| `/college/projects/[projectId]` — `src/app/(authenticated)/college/projects/[projectId]/page.tsx` | Redirect to canonical workspace summary | Pending |
| `/college-admin/departments` — `src/app/(authenticated)/college-admin/departments/page.tsx` | Role-guarded HTTP redirect to `/college/departments` or dashboard; no rendered page or independent scroll | Pending |
| `/college-admin/programs` — `src/app/(authenticated)/college-admin/programs/page.tsx` | Role-guarded HTTP redirect to `/college/programs` or dashboard; no rendered page or independent scroll | Pending |
