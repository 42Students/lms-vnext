# Typecheck errors (CI 834983cc, refreshed by orchestrator)

Production typecheck: PASS. Lint: PASS. Test-file typecheck (non-blocking) errors below; fix in your own files:

- tests/integration/projects-adversarial.test.ts(1158,13): error TS2554: Expected 4 arguments, but got 3.
- tests/integration/projects-p6b-final-evaluation.test.ts(402,7): error TS2554: Expected 4 arguments, but got 3.
- tests/integration/projects-p6b-final-evaluation.test.ts(414,7): error TS2554: Expected 4 arguments, but got 3.
- tests/integration/projects-p6b-final-evaluation.test.ts(440,11): error TS2554: Expected 4 arguments, but got 3.
- tests/integration/projects-p6b-final-evaluation.test.ts(473,11): error TS2554: Expected 4 arguments, but got 3.
- tests/integration/projects-p6b-final-evaluation.test.ts(544,27): error TS2554: Expected 4 arguments, but got 3.
- tests/integration/projects-p6b-final-evaluation.test.ts(620,11): error TS2554: Expected 4 arguments, but got 3.
- tests/unit/PROJ-BREAK-chat6-submission-http-race.test.ts(30,54): error TS2322: Type 'NextResponse<{ error: string; }>' is not assignable to type 'NextResponse<{ message: string; requestId: string; }>'.
- tests/unit/PROJ-BREAK-chat9-evaluation-read.test.ts(41,19): error TS2741: Property 'organizationId' is missing in type '{ collegeId: string; }' but required in type 'AdminScope'.
- tests/unit/PROJ-BREAK-chat9-file-list-scope.test.ts(44,18): error TS2741: Property 'organizationId' is missing in type '{ collegeId: string; }' but required in type 'AdminScope'.
- tests/unit/PROJ-BREAK-chat9-global-template-read.test.ts(83,56): error TS2345: Argument of type '{ organizationId: string; }' is not assignable to parameter of type 'AdminScope'.
- tests/unit/PROJ-BREAK-chat9-sa-shortlisted-detail.test.ts(51,12): error TS18048: 'result.related' is possibly 'undefined'.
- tests/unit/PROJ-BREAK-chat9-sa-student-lookup-tenant.test.ts(42,19): error TS2741: Property 'organizationId' is missing in type '{ collegeId: string; }' but required in type 'AdminScope'.
- tests/unit/chat11-super-admin-branding-save-adversarial.test.ts(44,24): error TS2345: Argument of type '{ user: { platformStatus: "DISABLED"; id: string; identityUid: string; systemRoles: readonly "SUPER_ADMIN"[]; }; membership: ActiveMembership | null; adminScope?: AdminScope | null | undefined; recruiter?: RecruiterContext | ... 1 more ... | undefined; } | { ...; } | { ...; } | { ...; }' is not assignable to parameter of type 'RequestContext | null | undefined'.
- tests/unit/chat11-super-admin-branding-save-adversarial.test.ts(44,34): error TS2345: Argument of type '{ user: { platformStatus: "DISABLED"; id: string; identityUid: string; systemRoles: readonly "SUPER_ADMIN"[]; }; membership: ActiveMembership | null; adminScope?: AdminScope | null | undefined; recruiter?: RecruiterContext | ... 1 more ... | undefined; } | { ...; } | { ...; } | { ...; }' is not assignable to parameter of type 'RequestContext | null | undefined'.
- tests/unit/chat11-tpo-trusted-domain-route.test.ts(59,65): error TS2345: Argument of type 'string' is not assignable to parameter of type '"DOMAIN_NOT_FOUND" | "TRUST_STORAGE_PENDING" | "DOMAIN_ALREADY_TRUSTED"'.
- tests/unit/chat16-public-recruiter-join-pages-26.test.ts(77,7): error TS2345: Argument of type '"Recruiter invitations are temporarily unavailable."' is not assignable to parameter of type '"Recruiter verification is temporarily unavailable. The placement cell must enable verified client networking, email-code delivery and public join storage before recruiters can join."'.
- tests/unit/chat4-super-admin-colleges-bulk-service-behaviour.test.ts(25,18): error TS2741: Property 'collegeId' is missing in type '{ organizationId: string; }' but required in type 'AdminScope'.
- tests/unit/chat4-superadmin-tenant-lifecycle-actor.test.ts(51,31): error TS2502: 'tx' is referenced directly or indirectly in its own type annotation.
