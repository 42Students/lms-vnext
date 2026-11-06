## What changed and why

## Security checklist (delete lines that do not apply)

- [ ] No credentials, tokens, keys or personal data in code, tests, logs or screenshots
- [ ] Every new or changed API route/server action checks the actor, the selected role and the college/tenant of each object it touches
- [ ] New or changed database access runs as the restricted runtime role; any new table has tenant scoping and RLS reviewed
- [ ] Inputs are validated at the boundary; file, URL and redirect inputs are allow-listed
- [ ] New dependencies were reviewed (maintenance, licence, install scripts); identity or crypto libraries need explicit security review
- [ ] Positive and negative tests cover the change; no test was skipped or weakened
- [ ] Anything touching `src/security`, `src/db`, `drizzle`, identity, storage or `.github` was reviewed by a code owner

## How it was verified
