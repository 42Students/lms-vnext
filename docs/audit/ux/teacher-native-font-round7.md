# Faculty native input typography — 16px all breakpoints

The signed-off playbook specifies 16px for interactive field text across viewport widths, with compact 14px only for non-input body content. Removed conflicting `sm:text-sm` / `text-sm` utility classes on 10 native fields across eight teacher routes. Kept exact labels, filters, values, request handlers, navigation and focus outlines. Source regression IDs `UX-teacher-*-03` in `tests/unit/UX-teacher-native-font-16px-round7.test.ts`; runtime tests and phone/browser evidence pending.
