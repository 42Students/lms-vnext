# /recruiter/messages — UX source review

- **Surface:** `src/app/(authenticated)/recruiter/messages/page.tsx`.
- **Before:** Legacy recruiter alias must not introduce a competing HR page or change action wording.
- **After:** Existing canonical HR route `hr/conversations/page.tsx` stays responsible for page layouts, loading, empty and error states; no parallel form or permission paths were invented.
- **Authority and states:** Inherited HR source requires its own responsive/browser audit, especially touch/keyboard and focus return.
- **Test:** `tests/unit/UX-recruiter-messages-01.test.ts` (authored, **unexecuted**).
- **Still needed:** 320/360/390px device, keyboard, screen-reader and typecheck/unit evidence before acceptance; canonical role UI audits owned by the HR slice where delegated.

- **Route recovery:** Shared bounded loading, error/retry and canonical HR PageHeader are now asserted; no duplicate route-specific UI or permission path. Browser/AT remains to be executed.
