# Typecheck errors on main (cloud CI, 2026-10-18 02:35): STABILIZATION ROUND

Every lane: fix ONLY the errors in your section below, restoring what merges dropped, no feature deletion, no new work. Then say done. Main must typecheck before the dev deploy. Owner = the lane that last touched the file.

## chat-11 (5)

- src/modules/placements/tpo-students-service.ts(450,35) TS2448: Block-scoped variable 'prep' used before its declaration.
- src/modules/placements/tpo-students-service.ts(450,35) TS2454: Variable 'prep' is used before being assigned.
- tests/unit/chat11-college-setup-integrity-round11.test.ts(41,28) TS18047: 'step.href' is possibly 'null'.
- tests/unit/chat11-final-TPO-settings-audit-07.test.ts(9,49) TS2322: Type 'readonly [{ readonly id: "season"; readonly label: "Placement seasons"; readonly href: "/tpo/settings/season"; }, { readonly id: "rules"; readonly label: "Placement rule
- tests/unit/chat11-final-TPO-settings-audit-07.test.ts(9,74) TS18046: 'item' is of type 'unknown'.

## chat-12 (2)

- src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx(158,60) TS2339: Property 'chatPollIntervalMs' does not exist on type '{ saveIntervalMs: number; watchedThresholdPercent: number; minInProgressPercent: number; } | { sav
- src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/page.tsx(130,47) TS2322: Type '{ jobId: string; preferenceKey: string; ready: boolean; status: "ACTIVE" | "ALL" | "EXPIRED" | "REVOKED"; linkPage: number; initialLinks: { id: st

## chat-13 (14)

- src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/company-share-controls.tsx(82,44) TS2304: Cannot find name 'changeExpiry'.
- src/modules/activity/taxonomy.ts(152,3) TS1117: An object literal cannot have multiple properties with the same name.
- src/modules/activity/taxonomy.ts(153,3) TS1117: An object literal cannot have multiple properties with the same name.
- src/modules/activity/taxonomy.ts(154,3) TS1117: An object literal cannot have multiple properties with the same name.
- src/modules/activity/taxonomy.ts(155,3) TS1117: An object literal cannot have multiple properties with the same name.
- src/modules/activity/taxonomy.ts(156,3) TS1117: An object literal cannot have multiple properties with the same name.
- src/modules/activity/taxonomy.ts(157,3) TS1117: An object literal cannot have multiple properties with the same name.
- src/modules/projects/mentor-release-write-service.ts(68,54) TS2551: Property 'PROJECTS_RELEASE_CREATED' does not exist on type '{ readonly PLATFORM_USER_BLOCKED: "platform.user.blocked"; readonly PLATFORM_USER_REACTIVATED: "platform.user.react
- src/modules/projects/mentor-release-write-service.ts(69,45) TS2551: Property 'PROJECTS_RELEASE_UPDATED' does not exist on type '{ readonly PLATFORM_USER_BLOCKED: "platform.user.blocked"; readonly PLATFORM_USER_REACTIVATED: "platform.user.react
- src/modules/projects/mentor-release-write-service.ts(70,26) TS2339: Property 'PROJECTS_RELEASE_DELETED' does not exist on type '{ readonly PLATFORM_USER_BLOCKED: "platform.user.blocked"; readonly PLATFORM_USER_REACTIVATED: "platform.user.react
- src/modules/projects/template-service.ts(11,9) TS2300: Duplicate identifier 'recordActivityEventInTransaction'.
- src/modules/projects/template-service.ts(12,9) TS2300: Duplicate identifier 'ACTIVITY_EVENT_TYPES'.
- src/modules/projects/template-service.ts(21,9) TS2300: Duplicate identifier 'recordActivityEventInTransaction'.
- src/modules/projects/template-service.ts(22,9) TS2300: Duplicate identifier 'ACTIVITY_EVENT_TYPES'.

## chat-14 (2)

- src/app/api/placements/tpo/jobs/[jobId]/cancel-preview/route.ts(1,9) TS2305: Module '"next/server"' has no exported member 'getTpoDriveCancelPreview'.
- src/app/api/placements/tpo/jobs/[jobId]/close-preview/route.ts(1,9) TS2305: Module '"next/server"' has no exported member 'getTpoDriveClosePreview'.

## chat-17 (6)

- src/modules/placements/job-service.ts(709,38) TS2551: Property 'PLACEMENTS_JOB_CANCELLED' does not exist on type '{ readonly PLATFORM_USER_BLOCKED: "platform.user.blocked"; readonly PLATFORM_USER_REACTIVATED: "platform.user.reactivated"; reado
- tests/unit/tpo-drive-edit-model.test.ts(14,48) TS2345: Argument of type '{ confirmed: true; expectedUpdatedAt: string; reason: string; title: string; description: string; locations: string[]; openings: number; minimumAnnualCtcInr: number; maxi
- tests/unit/tpo-drive-edit-model.test.ts(15,52) TS2345: Argument of type '{ confirmed: true; expectedUpdatedAt: string; reason: string; title: string; description: string; locations: string[]; openings: number; minimumAnnualCtcInr: number; maxi
- tests/unit/tpo-drive-edit-model.test.ts(16,48) TS2345: Argument of type '{ confirmed: true; expectedUpdatedAt: string; reason: string; title: string; description: string; locations: string[]; openings: number; minimumAnnualCtcInr: number; maxi
- tests/unit/tpo-drive-edit-model.test.ts(17,48) TS2345: Argument of type '{ maximumAnnualCtcInr: number; confirmed: true; expectedUpdatedAt: string; reason: string; title: string; description: string; locations: string[]; openings: number; mini
- tests/unit/tpo-drive-edit-model.test.ts(22,48) TS2345: Argument of type '{ locations: string[]; confirmed: true; expectedUpdatedAt: string; reason: string; title: string; description: string; openings: number; minimumAnnualCtcInr: number; maxi

## chat-2 (3)

- src/app/(authenticated)/tpo/companies/[companyId]/team/page.tsx(19,5) TS2367: This comparison appears to be unintentional because the types '"READY" | "NOT_REGISTERED"' and '"NOT_FOUND"' have no overlap.
- src/app/(authenticated)/tpo/companies/[companyId]/team/page.tsx(43,13) TS2339: Property 'canPost' does not exist on type '{ status: "READY"; companyName: string; messages: any[]; members: { membershipId: string; name: string | null; }[]; follo
- src/app/api/placements/tpo/companies/[companyId]/team/route.ts(6,9) TS2305: Module '"@/modules/placements/tpo-company-team-service"' has no exported member 'postTpoCompanyTeamMessage'.

## chat-3 (2)

- src/modules/placements/tpo-company-team-service.ts(6,2) TS2724: '"@/db/schema"' has no exported member named 'placementTpoCompanyTeamMessages'. Did you mean 'placementTpoInternalMessages'?
- src/modules/placements/tpo-company-team-service.ts(6,46) TS2305: Module '"@/db/schema"' has no exported member 'placementTpoCompanyTeamFollows'.

## chat-4 (3)

- src/app/(authenticated)/college/companies/page.tsx(36,9) TS2451: Cannot redeclare block-scoped variable 'exportParams'.
- src/app/(authenticated)/college/companies/page.tsx(39,9) TS2451: Cannot redeclare block-scoped variable 'exportParams'.
- tests/unit/chat4-learner-discussion-poll-r22.test.ts(8,36) TS2339: Property 'chatPollIntervalMs' does not exist on type '{ readonly saveIntervalMs: 5000; readonly watchedThresholdPercent: 90; readonly minInProgressPercent: 5; }'.

## chat-7 (2)

- src/app/(authenticated)/admin/lessons/page.tsx(68,84) TS2339: Property 'description' does not exist on type 'CollegeLessonRecord'.
- src/app/(authenticated)/admin/lessons/page.tsx(71,63) TS2339: Property 'learningPathId' does not exist on type 'CollegeLessonRecord'.

## chat-9 (3)

- src/app/api/public/campaign-unsubscribe/route.ts(15,92) TS2559: Type 'ProcessEnv' has no properties in common with type '{ TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET?: string | undefined; TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET?: string | undefined; }'.
- src/modules/messaging/tpo-campaign-dispatch-service.ts(26,46) TS2559: Type 'ProcessEnv' has no properties in common with type '{ TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET?: string | undefined; TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET?: string | undefined;
- src/modules/messaging/tpo-campaign-unsubscribe-service.ts(23,47) TS2559: Type 'ProcessEnv' has no properties in common with type '{ TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET?: string | undefined; TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET?: string | undefin

