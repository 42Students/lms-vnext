# Typecheck errors on main (cloud CI, 2026-10-18 02:00)

ONLY these remain; everything else is green and lint passes. Owners fix their own FIRST (restore what merges dropped; do not delete features):
- src/components/ui/filter-bar.tsx (Button props, aria-expanded/aria-controls typing): chat-17
- src/modules/projects/meeting-service.ts line 168 (SQL|undefined passed to a function that needs SQLWrapper), tests/integration/chat7-mentor-meeting-facilitation.test.ts (facilitation input type): chat-7
- tests/unit/chat11-college-setup-integrity-round11.test.ts (readonly tuple assigned to mutable array, implicit unknown on step): chat-11

Errors:

- src/components/ui/filter-bar.tsx(58,17): Button props type mismatch (variant secondary with aria-expanded/aria-controls)
- src/modules/projects/meeting-service.ts(168,15): argument SQL|undefined not assignable to SQLWrapper
- tests/integration/chat7-mentor-meeting-facilitation.test.ts(101,123): facilitation object does not match the input type
- tests/unit/chat11-college-setup-integrity-round11.test.ts(14-35): readonly tuple / unknown step
