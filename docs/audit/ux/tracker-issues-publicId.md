# /tracker/issues/[publicId] — UX source review

- **Surface:** `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx`.
- **Before:** Evidence links opened a new tab without a WebView-safe fall-through; page links had 40px targets.
- **After:** Existing 'Open linked evidence ↗' now uses the audited ThirdPartyLink (HTTPS validation + visible copyable URL) without popup; remaining action links meet 44px touch minimum.
- **Access and state contract:** Super Admin gate, private metadata, bounded history and workflow approvals untouched.
- **Test:** `tests/unit/UX-tracker-issues-publicId-01.test.ts` (authored, not executed).
- **Verification outstanding:** 320/360/390px, screen reader, real keyboard and typecheck/unit evidence; a source review or redirect test is not browser acceptance.
