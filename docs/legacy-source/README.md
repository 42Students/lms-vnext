# Legacy source (read-only reference)

Old 42Students LMS source, taken from the `lms-dev-2026` branches (frontend 04f7b54b, backend 3717e755), filtered to source files only. Used for the vNext gap audit: compare behaviour, fields, validations, messages and business rules line by line.

- `frontend/src` : Next.js Pages Router app (pages, components, API calls, styles, small i18n json).
- `backend/src` : Spring Boot app (controllers, services, validations, SQL migrations, email templates, tests without personal data).
- Excluded on purpose: env and properties files, secrets, key material, binary assets, build output, large data json/csv, any file containing real-looking emails or phone numbers.

Do NOT import from this folder in vNext code. Do not edit it. It is documentation, not part of the build.
