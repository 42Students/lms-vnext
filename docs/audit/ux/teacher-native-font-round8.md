# Faculty input typography — round 8

Removed smaller desktop font overrides from 5 route/shared component sources, covering 18 controls. The playbook calls for 16px fields at all widths; existing helper text may remain 14px. Shared Button, Input, Select and Textarea APIs, legacy field labels, state guards, and focus outlines are unchanged.

Source contract tests: `UX-teacher-native-font-shared-01..` in `tests/unit/UX-teacher-native-font-shared-round8.test.ts`. Browser/CI verification pending.
