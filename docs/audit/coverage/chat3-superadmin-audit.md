# Chat-3 Super Admin academics + people — second-eye source audit

**Scope:** Eight routes: `/admin/academics`, `/admin/academics/sections/[sectionId]`, `/admin/people`, `/admin/people/directory`, `/admin/people/directory/[membershipId]`, `/admin/people/directory/[membershipId]/audit`, `/admin/people/unassigned`, `/admin/recruiters`.

## Findings and repairs

| ID | Severity | Evidence | Failure | Repair/test |
|---|---|---|---|---|
| SA3-PEOPLE-01 | MAJOR | `src/app/(authenticated)/admin/people/page.tsx` original `Number(rawPageSize)` | Repeated `pageSize=20&pageSize=50` normalized the filter with `one(rawPageSize)`, then parsed the **array** and produced NaN for DB LIMIT; risks hard error rather than bounded directory | `parsePeoplePageSize` helper accepts repeated/invalid values, limits to 10/20/50. Unit test `SA3-PEOPLE-01/02` |
| SA3-PEOPLE-03 | MAJOR (mobile accessibility) | `admin/people/unassigned/page.tsx` raw form fields | Native controls inherited 14px label type and had no consistent keyboard focus | Shared Input/Select/Button and 16px fields; test `SA3-PEOPLE-03` |
| SA3-FOCUS-01 | MINOR | `admin/academics`, `admin/people`, `admin/people/directory`, `admin/people/directory/[membershipId]`, `admin/people/unassigned` | Deep-teal links without explicit focus-visible outline | Added focus-visible deep-teal ring to 19 existing controls; all text/targets unchanged |
| SA3-ACADEMICS-01/02 | checked | `admin/academics/page.tsx` and Section detail | No scoped mutation without selected college; unknown Section is private not-found | Regression cases in `chat3-superadmin-academics-people-audit-r2.test.ts`; no source defect observed |
| SA3-PEOPLE-04..08 | checked | Super Admin directory, membership, audit and people list | Contact masking, global access and scope safety traced through services; URL paging retained | Explicit test cases; live data/role browser matrix pending |
| SA3-RECRUITERS-01 | checked | `admin/recruiters/page.tsx` | Legacy alias must not fork authorization | Re-export `../hr/page` retained; test |

| SA3-PEOPLE-09 | MAJOR (stale deep-link recovery) | `listAdminScopedPeople` offset used raw page | Previously valid page numbers could exceed the new filtered total after role removals and show an incorrect empty list. | Count then clamp to last page before rows; behavioral service test `chat3-superadmin-scoped-people-pagination.test.ts`. |

## Acceptance and blocker

Unit tests added: 3 pagination/forms + 8 page/scope contracts = **11**. No production changes. The cross-audit was code-level only; CI currently queued, so typecheck, PostgreSQL transaction, browser 320/360/390, screenreader and real-role acceptance remain **unverified**. The master queue's full service/route integration matrix is not complete: GitHub-only environment has no checked-out repository or PostgreSQL fixture and cannot execute the tests here. Do not mark item finished solely from source contracts.
