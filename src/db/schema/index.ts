export * from "./enums";
export * from "./organizations";
export * from "./colleges";
export * from "./users";
export * from "./memberships";
export * from "./departments";
export * from "./profiles";
export * from "./tenant-domains";
export * from "./legacy-id-map";
export * from "./academics";
export * from "./academic-terms";
export * from "./academic-progression";
export * from "./lecture-halls";
export * from "./faculty-course-associations";
export * from "./courses";
export * from "./assessments";
export * from "./course-assignment-materials";
export * from "./quizzes";
export * from "./projects";
export * from "./placements";
export * from "./placement-general-requests";
export * from "./placement-tpo-prep-assignments";
export * from "./placement-company-identities";
export * from "./activity";

export * from "./attendance";
export * from "./attendance-parent-sms";

export * from "./discussions";

export * from "./module-access";
export * from "./placement-access";

export * from "./drive-day";

export * from "./groups";
export * from "./electives";
export * from "./tpo-policy";
export * from "./tpo-crm";

export * from "./identity-auth-attempts";
export * from "./identity-device-sessions";

export * from "./college-branding";

export * from "./placement-application-notes";

export * from "./messaging-receipts";

export * from "./profile-verification";

export * from "./tpo-configuration";

export * from "./placement-batches";

export * from "./college-signin";

export * from "./inbound-mail";

export * from "./platform-broadcasts";

export * from "./tpo-internal";
export * from "./tpo-company-team";
export * from "./tpo-collaboration";
export * from "./placement-external";

export * from "./placement-registration";

export * from "./placement-debarments";
export * from "./placement-public-page";
export * from "./placement-public-joins";
export * from "./placement-public-enquiries";
export * from "./db10-announcements";
export * from "./placement-tpo-notice-audiences";
export * from "./db10-bug-tracker";
export * from "./placement-company-shares";
export * from "./placement-hr-interview-slots";
export * from "./placement-outside-drives";
export * from "./storage-files";
export * from "./placement-drive-requests";
export * from "./tpo-campaign-drafts";
export * from "./placement-recruiter-public-contacts";
export * from "./placement-recruiter-candidate-ratings";
export * from "./placement-tpo-application-stages";
export * from "./placement-tpo-recruiter-saved-views";
export * from "./assignment-submission-links";
export * from "./placement-college-application-stages";
export * from "./placement-college-interviews";
export * from "./placement-waitlist-promotions";
export * from "./placement-drive-change-requests";
export * from "./placement-drive-selections";
export * from "./placement-round-candidate-slots";
export * from "./platform-setting-overrides";
export * from "./placement-tpo-company-communication";
export * from "./placement-company-share-selection";
export * from "./lesson-content-materials";

export * from "./placement-public-page-content";

export * from "./recruiter-message-email";

// Registered storage only; DB10_OUTBOUND_READY and dispatch remain fail-closed.
export { db10OutboundMessages, db10OutboundSuppressions, db10GlobalEmailSuppressions } from "./db10-outbound-messages.draft";

// Registered lineage only; no mass import rollback/delete endpoint is activated.
export { learnerImportBatches, learnerImportBatchMembers } from "./db02-learner-import-batches.staged";
