# Work packet: NEW / MISSING items from docs/audit/gap2/lane-2/admin-assignment-controller.md

13 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-assignment-controller.md

## G2-2-007-009  [P1] GAP  facet F04  effort S
- Legacy: LC:129-137 per-assignment stats with fallback stats:null if error
- vNext now: NS:180-197 batched submission count, NS:199-240 eligibility & grade counts; errors currently propagate
- Fix: Isolate per-assignment stats failures so one bad row does not blank directory.

## G2-2-007-013  [P1] MISSING  facet F05  effort S
- Legacy: LL:403-413 course autocomplete then class select disabled until course selected
- vNext now: NV:129-151 course-code input, audience broad enum, no per-class picker
- Fix: Add specific section picker constrained to selected course.

## G2-2-007-017  [P1] GAP  facet F05  effort S
- Legacy: LL:408-413 class options sorted alphabetically, class filter exact ID
- vNext now: NM:13 scope SHARED/SECTION not exact section ID
- Fix: Add class/sectionId exact filtering across assignments and stats.

## G2-2-007-032  [P1] GAP  facet F10  effort S
- Legacy: LC:129-137 catch stats exception individually, return stats:null
- vNext now: NS:180-197 group query failure rejects whole directory
- Fix: Make counts best-effort per row or distinguish total query failure from row failure.

## G2-2-007-038  [P1] GAP  facet F12  effort S
- Legacy: LC:132-137 orphan/stale class stats failure isolated as Unavailable
- vNext now: NS:180-240 counts join authorized/current roster; no per-row fallback
- Fix: Render Unavailable for broken per-row statistics instead of claiming zero.

## G2-2-007-056  [P1] GAP  facet F20  effort S
- Legacy: LC:129-137 stats exception isolates row
- vNext now: NS:180-240 aggregate/grouped counts can throw and reject entire page
- Fix: Provide partial stats fallback or explicit degraded mode with rows intact.

## G2-2-007-063  [P1] MISSING  facet F23  effort S
- Legacy: LL:408-413 exact selected Section filter
- vNext now: NM:13 only SHARED/SECTION broad scope
- Fix: Implement exact class filter rather than treating presence as identity.

## G2-2-007-022  [P2] GAP  facet F07  effort S
- Legacy: LC:81-88 rejects cross-scoped superadmin with two distinct messages
- vNext now: NS:53-59 scoped superadmin only; authorization errors generic
- Fix: Map college-vs-org denial safely and do not disclose other college data.

## G2-2-007-023  [P2] GAP  facet F07  effort S
- Legacy: LC:150-152 catch all returns 500 'Failed to fetch assignments'
- vNext now: NA:42-48 'Assignments unavailable' and Retry
- Fix: Keep full error details in logs and scoped retry UI; preserve consistent generic message.

## G2-2-007-025  [P2] GAP  facet F08  effort S
- Legacy: LL:295-313 publish all result counts + individual failed students in warning Modal
- vNext now: NR:29-70 publishes per Section, returns published/failed counts inline
- Fix: Align failures report and per-college cross-section semantics.

## G2-2-007-021  [P3] GAP  facet F07  effort S
- Legacy: LC:100 'collegeId must be a positive integer'
- vNext now: NA:32-35 'Select a college to continue'; NC:21 missing scope component
- Fix: Keep accessible missing-scope state; document changed error body.

## G2-2-007-024  [P3] GAP  facet F08  effort S
- Legacy: LC:149 success 'Assignments fetched successfully'
- vNext now: NS:47-127 internal service; NC:37-43 SSR result without success message
- Fix: N/A toast for list retrieval; API contract changed.

## G2-2-007-026  [P3] GAP  facet F08  effort S
- Legacy: LL:316-326 delete toast 'Assignment deleted' or 'Failed to delete assignment'
- vNext now: NW:67-69 'Assignment deleted.' or generic error
- Fix: Restore exact toast copy.
