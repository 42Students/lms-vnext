# CI fix packet (round 1): src/components/admin/tenant-settings-editor.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/components/admin/tenant-settings-editor.tsx

- [tsc] line 164:31 error TS2322: Type '"success" | "warning"' is not assignable to type 'ToastTone'.
- [tsc] line 205:31 error TS2367: This comparison appears to be unintentional because the types '"READER_VERIFICATION_REQUIRED" | "STORED_ONLY"' and '"ACTIVE"' have no overlap.
- [tsc] line 210:53 error TS2339: Property 'help' does not exist on type '{ readonly key: "baseDomain"; readonly scope: "GLOBAL"; readonly type: "text"; readonly label: "Base domain"; readonly group: "Platform & auth"; readonly dangerous: true; readonly placeholder: "42lms.com"; readonly help: "Root domain tenant subdomains hang off, e.g. 42lms.com. Read by tenant bootstrap and the host a...'.
- [tsc] line 211:14 error TS2339: Property 'help' does not exist on type '{ readonly key: "baseDomain"; readonly scope: "GLOBAL"; readonly type: "text"; readonly label: "Base domain"; readonly group: "Platform & auth"; readonly dangerous: true; readonly placeholder: "42lms.com"; readonly help: "Root domain tenant subdomains hang off, e.g. 42lms.com. Read by tenant bootstrap and the host a...'.
- [tsc] line 213:31 error TS2339: Property 'placeholder' does not exist on type '{ readonly key: "baseDomain"; readonly scope: "GLOBAL"; readonly type: "text"; readonly label: "Base domain"; readonly group: "Platform & auth"; readonly dangerous: true; readonly placeholder: "42lms.com"; readonly help: "Root domain tenant subdomains hang off, e.g. 42lms.com. Read by tenant bootstrap and the host a...'.
- [tsc] line 227:26 error TS2339: Property 'placeholder' does not exist on type '{ readonly key: "baseDomain"; readonly scope: "GLOBAL"; readonly type: "text"; readonly label: "Base domain"; readonly group: "Platform & auth"; readonly dangerous: true; readonly placeholder: "42lms.com"; readonly help: "Root domain tenant subdomains hang off, e.g. 42lms.com. Read by tenant bootstrap and the host a...'.
