# Environment matrix

Generated from `src/config/env-names.ts` and `src/config/features.ts` by `npx tsx scripts/gen-env-matrix.ts`. Do not edit by hand:
`tests/unit/sec-env-matrix.test.ts` fails when this file is out of date.

- **secret**: a credential or key. Set in the deployment's secret store, never in a repository, image or log.
- **flag**: a readiness switch. On only for the exact value shown; anything else (including unset) is off.
- **setting**: ordinary configuration.

| Variable | Kind | Group | Exact value that turns it on | Notes |
|---|---|---|---|---|
| `APP_E2E_SEED_ENABLED` | flag | APP | `true` | Test harness. Must NEVER be set in production. |
| `APP_E2E_SEED_SECRET` | secret | APP |  |  |
| `APP_ENV` | setting | APP |  |  |
| `APP_PUBLIC_URL` | setting | APP |  |  |
| `AUDIT_FINDINGS_CRON_SECRET` | secret | AUDIT |  |  |
| `AUDIT_FINDINGS_GITHUB_APP_ID` | setting | AUDIT |  |  |
| `AUDIT_FINDINGS_GITHUB_INSTALLATION_ID` | setting | AUDIT |  |  |
| `AUDIT_FINDINGS_GITHUB_PRIVATE_KEY` | secret | AUDIT |  |  |
| `AUDIT_FINDINGS_GITHUB_TOKEN` | secret | AUDIT |  |  |
| `AUTH_DEV_REAL_DELIVERY` | setting | AUTH |  |  |
| `AUTH_EMAIL_VERIFICATION_KEY_VERSION` | setting | AUTH |  |  |
| `AUTH_EMAIL_VERIFICATION_SECRET` | secret | AUTH |  |  |
| `AUTH_ONBOARDING_PEPPER` | setting | AUTH |  |  |
| `AUTH_ROLE_PROOF_SECRET` | secret | AUTH |  |  |
| `AUTH_ROLL_NUMBER_COLLEGES` | setting | AUTH |  |  |
| `AUTH_SECRET` | secret | AUTH |  |  |
| `COLLEGE_STUDY_GROUPS_RELEASED` | setting | COLLEGE |  |  |
| `COMPANY_SHARE_PROOF_SECRET` | secret | COMPANY |  |  |
| `COOKIE_SECURE` | setting | COOKIE |  |  |
| `COURSE_BULK_STATUS_MAX` | setting | COURSE |  |  |
| `CSP_NONCE` | setting | CSP |  |  |
| `DATABASE_URL` | secret | DATABASE |  |  |
| `DB045_GRADE_HISTORY_READY` | flag | DB045 | `DB045_VERIFIED` | Feature area: courses |
| `DB045_GRADE_PRODUCERS_READY` | flag | DB045 | `DB045_VERIFIED` | Feature area: courses |
| `DB045_GRADE_REPLAY_READY` | flag | DB045 | `DB045_VERIFIED` | Feature area: courses |
| `DB04_PROFILE_GALLERY_READY` | flag | DB04 | `DB04_VERIFIED` | Feature area: profile |
| `DB05_CONTENT_ORDER_READY` | flag | DB05 | `DB05_VERIFIED` | Feature area: courses |
| `DB05_COURSE_DISPLAY_READY` | flag | DB05 | `DB05_VERIFIED` | Feature area: courses |
| `DB05_LESSON_DISCUSSIONS_READY` | flag | DB05 | `DB05_VERIFIED` | Feature area: courses |
| `DB05_RESOURCE_MATERIALS_READY` | flag | DB05 | `DB05_VERIFIED` | Feature area: courses |
| `DB09_TPO_API_READY` | flag | DB09 | `DB09_VERIFIED` | Feature area: placements |
| `DB10_ANNOUNCEMENTS_READY` | flag | DB10 | `DB10_VERIFIED` | Feature area: notifications |
| `DB10_AUDIT_FINDINGS_LEDGER_READY` | flag | DB10 | `LEDGER_VERIFIED` | Feature area: platform |
| `DB10_AUDIT_FINDINGS_READY` | flag | DB10 | `DB10_VERIFIED` | Feature area: platform |
| `DB10_DIVERSITY_OUTREACH_READY` | flag | DB10 | `PRIVACY_APPROVED` | Feature area: placements |
| `DB10_EMAIL_SENDER_VERIFIED` | setting | DB10 |  |  |
| `DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64` | setting | DB10 |  |  |
| `DB10_GLOBAL_SUPPRESSION_VERIFIED` | setting | DB10 |  |  |
| `DB10_LOG_ALERTS_READY` | flag | DB10 | `DB10_VERIFIED` | Feature area: platform |
| `DB10_NOTIFICATION_DEDUPE_KEY_BASE64` | setting | DB10 |  |  |
| `DB10_NOTIFICATION_OUTBOX_READY` | flag | DB10 | `DB10_VERIFIED` | Feature area: notifications |
| `DB10_NOTIFICATION_SCHEDULER_READY` | flag | DB10 | `DB10_VERIFIED` | Feature area: notifications |
| `DB10_OUTBOUND_DISPATCH_READY` | flag | DB10 | `DB10_VERIFIED` | Feature area: notifications |
| `DB10_OUTBOUND_ENCRYPTION_KEY_BASE64` | setting | DB10 |  |  |
| `DB10_OUTBOUND_READY` | flag | DB10 | `DB10_VERIFIED` | Feature area: notifications |
| `DB10_SKILLS_READY` | flag | DB10 | `DB10_VERIFIED` | Feature area: skills |
| `DB10_SKILLS_SCHEMA_READY` | flag | DB10 | `DB10_REPLAY_VERIFIED` | Feature area: skills |
| `DB10_SKILLS_SOURCE_RECONCILED` | setting | DB10 |  |  |
| `DB10_SKILLS_SYNONYMS_READY` | flag | DB10 | `SEED_VERIFIED` | Feature area: skills |
| `DB10_TRACKER_READY` | flag | DB10 | `DB10_VERIFIED` | Feature area: platform |
| `DB_NAME` | setting | DB |  |  |
| `DB_PASSWORD` | secret | DB |  |  |
| `DB_POOL_MAX` | setting | DB |  |  |
| `DB_TENANT_SCOPE` | setting | DB |  |  |
| `DB_USER` | setting | DB |  |  |
| `DEPLOY_COMMIT` | setting | DEPLOY |  |  |
| `DEPLOY_STARTED_AT` | setting | DEPLOY |  |  |
| `E2E_ALLOW_GRAPH_WRITES` | setting | E2E |  |  |
| `E2E_AUTH_ENABLED` | flag | E2E | `true` | Test harness. Must NEVER be set in production. |
| `E2E_AUTH_SECRET` | secret | E2E |  |  |
| `E2E_FIXTURE_NAMESPACE` | setting | E2E |  |  |
| `E2E_ISOLATED_DATABASE` | setting | E2E |  |  |
| `E2E_SEED_ENABLED` | flag | E2E | `true` | Test harness. Must NEVER be set in production. |
| `E2E_SEED_OPERATOR_SECRET` | secret | E2E |  |  |
| `FACULTY_SCHEDULE_BOOKING_GRACE_MINUTES` | setting | FACULTY |  |  |
| `FACULTY_SCHEDULE_PAST_GRACE_MINUTES` | setting | FACULTY |  |  |
| `GCP_REGION` | setting | GCP |  |  |
| `GOOGLE_CLOUD_PROJECT` | setting | GOOGLE |  |  |
| `HOSTNAME` | setting | HOSTNAME |  |  |
| `INSTANCE_UNIX_SOCKET` | setting | INSTANCE |  |  |
| `INTERNAL_REPLAY_PROTECTION` | setting | INTERNAL |  |  |
| `LOG_ALERT_ACCOUNT_HASH_KEY` | secret | LOG |  |  |
| `LOG_ALERT_CLOUD_POLL_ENABLED` | flag | LOG | `true` | Feature area: platform |
| `LOG_ALERT_K8S_NAMESPACE` | setting | LOG |  |  |
| `MAINTENANCE_MODE` | setting | MAINTENANCE |  |  |
| `MENTOR_PROJECT_EMAIL_OUTBOX_READY` | flag | MENTOR | `verified` | Feature area: projects |
| `NEXTAUTH_SECRET` | secret | NEXTAUTH |  |  |
| `PRIVATE_STORAGE_SCANNER_WEBHOOK_SECRET` | secret | PRIVATE |  |  |
| `PUBLIC_ISSUE_CATALOG_READY` | flag | PUBLIC | `true` | Feature area: platform |
| `PUBLIC_JOIN_TRUSTED_PROXY_READY` | flag | PUBLIC | `VERIFIED` | Feature area: platform |
| `R2_ACCESS_KEY` | secret | R2 |  |  |
| `R2_ACCOUNT_ID` | setting | R2 |  |  |
| `R2_PRIVATE_BUCKET` | setting | R2 |  |  |
| `R2_SECRET_KEY` | secret | R2 |  |  |
| `RECRUITER_MESSAGE_WORKER_SECRET` | secret | RECRUITER |  |  |
| `SECURITY_AUDIT_DB` | setting | SECURITY |  |  |
| `SECURITY_SHIM_RATE_LIMIT` | setting | SECURITY |  |  |
| `TELEGRAM_ALERT_BOT_TOKEN` | secret | TELEGRAM |  |  |
| `TELEGRAM_ALERT_CHAT_ID` | setting | TELEGRAM |  |  |
| `TELEGRAM_ALERT_OPERATOR_IDS` | setting | TELEGRAM |  |  |
| `TELEGRAM_ALERT_WEBHOOK_SECRET` | secret | TELEGRAM |  |  |
| `TENANT_DNS_PUBLIC_FALLBACK` | setting | TENANT |  |  |
| `TENANT_MANAGED_BASE_DOMAIN` | setting | TENANT |  |  |
| `TENANT_MANAGED_WILDCARD_READY` | flag | TENANT | `true` | Feature area: platform |
| `TPO_CAMPAIGN_ZEPTO_TEMPLATE_KEY` | secret | TPO |  |  |
| `TPO_CAMPAIGNS_READY` | flag | TPO | `VERIFIED` | Feature area: placements |
| `TPO_DEADLINE_TODAY_READY` | flag | TPO | `VERIFIED` | Feature area: placements |
| `TPO_INTERVIEW_EMAIL_READY` | flag | TPO | `VERIFIED` | Feature area: placements |
| `TPO_NOTICE_DELIVERY_VERIFIED` | setting | TPO |  |  |
| `TPO_NOTICE_SCHEDULER_SECRET` | secret | TPO |  |  |
| `TPO_RECRUITER_INVITE_EMAIL_READY` | flag | TPO | `VERIFIED` | Feature area: placements |
| `TPO_RECRUITER_INVITE_ZEPTO_TEMPLATE_KEY` | secret | TPO |  |  |
| `TPO_RECRUITER_OTP_DELIVERY_READY` | flag | TPO | `VERIFIED` | Feature area: placements |
| `TPO_RECRUITER_OTP_HMAC_SECRET` | secret | TPO |  |  |
| `TPO_RECRUITER_OTP_READY` | flag | TPO | `VERIFIED` | Feature area: placements |
| `TPO_RECRUITER_REMINDER_READY` | flag | TPO | `VERIFIED` | Feature area: placements |
| `TPO_REMINDER_SYSTEM_IDENTITY_UID` | setting | TPO |  |  |
| `TPO_SCHEDULED_OFFER_EXPIRY_ENABLED` | flag | TPO | `true` | Feature area: placements |
| `TPO_SCHEDULED_OFFER_REMINDERS_ENABLED` | flag | TPO | `true` | Feature area: placements |
| `TPO_SCHEDULER_ACTOR_USER_ID` | setting | TPO |  |  |
| `TRUSTED_CLIENT_IP_HEADERS` | setting | TRUSTED |  |  |
| `UX_ADMIN_COLLEGE_RECOVERY_FIXTURE` | setting | UX |  |  |
| `UX_EXPORT_FIXTURE` | setting | UX |  |  |
| `UX_FIVE_ROUTE_FIXTURE` | setting | UX |  |  |
| `UX_G005_G014_FIXTURE` | setting | UX |  |  |
| `UX_G132_SCHEDULE_FIXTURE` | setting | UX |  |  |
| `UX_G149_PLACEMENT_FIXTURE` | setting | UX |  |  |
| `UX_G156_FIXTURE` | setting | UX |  |  |
| `UX_G157_FIXTURE` | setting | UX |  |  |
| `UX_G158_FIXTURE` | setting | UX |  |  |
| `UX_G159_FIXTURE` | setting | UX |  |  |
| `UX_G160_G133_FIXTURE` | setting | UX |  |  |
| `UX_G166_FIXTURE` | setting | UX |  |  |
| `UX_G173_G179_FIXTURE` | setting | UX |  |  |
| `UX_G176_TELEGRAM_FIXTURE` | setting | UX |  |  |
| `UX_G180_FIXTURE` | setting | UX |  |  |
| `UX_G181_FIXTURE` | setting | UX |  |  |
| `UX_G182_EXPORT_FIXTURE` | setting | UX |  |  |
| `UX_G184_ROUTE_STATE_FIXTURE` | setting | UX |  |  |
| `UX_ROOT_ERROR_FIXTURE` | setting | UX |  |  |
| `UX_STUDY_SHELL_FIXTURE` | setting | UX |  |  |
| `UX_TEN_COLLEGE_FIXTURE` | setting | UX |  |  |
| `UX_TPO_G110_G119_FIXTURE` | setting | UX |  |  |
| `UX_TPO_TEN_FIXTURE` | setting | UX |  |  |
| `ZEPTOMAIL_LEGACY_KEY_REVOKED` | setting | ZEPTOMAIL |  |  |
| `ZEPTOMAIL_OTP_TEMPLATE_KEY` | secret | ZEPTOMAIL |  |  |

136 variables: 25 secrets, 39 flags, 72 settings.
