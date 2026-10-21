# ZeptoMail event-template provisioning

Only the deployment operator sets template IDs. Never accept them from a tenant,
a browser form, a CSV file or a request payload; IDs and auth tokens are secrets.

The old LMS used one property per NotificationEvent:
`zepto.template.<legacy-key>`. vNext first resolves
`ZEPTOMAIL_TEMPLATE_<EVENT_NAME>` and then the legacy property name.
Provision these for the six email-enabled legacy events:
`JOB_INTERVIEW_SCHEDULED`, `INTERVIEW_REMINDER`, `INTERVIEW_CONFIRMED`,
`SYSTEM_EMAIL_VERIFICATION`, `SYSTEM_APPLICATION_APPROVED` and
`SYSTEM_APPLICATION_REJECTED`. Other events remain IN_APP or SMS as declared
in `LEGACY_NOTIFICATION_CHANNELS`: do not enable email simply because a
provider template exists. OTP uses `ZEPTOMAIL_OTP_TEMPLATE_KEY` exclusively.

Config is trimmed and rejects blank, control-character or
`TEMP_ID_PLACEHOLDER` template values. Provider IDs are opaque strings
and should not be tested against campaign identifier syntax. Environment
validation can be invoked without any send from
`zeptoMailTemplateReadiness(process.env)`. A server worker logs status once
when the readiness route/page first initializes. To inspect safe per-event
status, sign in as an **unscoped Super Admin** and visit
`/admin/notification-templates` or
`GET /api/admin/notification-templates`. Logs and JSON never contain
template IDs, auth headers, recipient addresses or merge payloads.

Before release, operators should check the readiness status in the target
environment, confirm all six required EMAIL events and the independent OTP
template are ready, and verify that nonproduction
`DEV_MAIL_ALLOW` / `AUTH_TEST_EMAILS` restrict test recipients.
Unconfigured events log **MISSING TEMPLATE** and an aggregate
**STARTUP WARNING**; they do not prevent server boot. The send boundary
continues to fail closed on each missing event, and returns a structured
not-sent result. A successfully configured ID does not prove the remote
provider will accept an email.

The outbound provider sends each email request **once** because no
idempotency contract has been verified for the ZeptoMail template endpoint.
Do not reinstate blind retries. This configuration migration does not
introduce a template upload interface or database mapping.
