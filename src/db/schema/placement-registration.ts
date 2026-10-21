import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { cohorts } from "./academics";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";
import { users } from "./users";

/**
 * DB08-B: registration is per academic batch, not placement season.
 * Caller and SQL scope guards must prove that membership+cohort belong to
 * the same college and that the learner is enrolled in the cohort.
 * Legacy placement_registration.season_id is NOT the new cohort_id:
 * a future approved import must resolve legacy season->academic cohort with
 * explicit same-college learner enrollment evidence and a verified source
 * season mapping. Ambiguous or stale consent is quarantined, not treated as
 * new consent. Only source SELF/TPO/BACKFILL is persisted, from a trusted
 * authenticated writer. The source's old numeric learner ID maps to active
 * college membership UUID; nullable legacy consent never overrides the
 * current check requiring version+timestamp for PLACEMENTS.
 * No legacy registrations are imported in greenfield vNext.
 */
export const placementBatchRegistrations = pgTable(
  "placement_batch_registrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    cohortId: uuid("cohort_id")
      .notNull()
      .references(() => cohorts.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    choice: varchar("choice", { length: 24 }).notNull(),
    consentVersion: varchar("consent_version", { length: 32 }),
    consentAt: timestamp("consent_at", { withTimezone: true }),
    source: varchar("source", { length: 16 }).notNull(),
    recordedByUserId: uuid("recorded_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    version: integer("version").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("placement_batch_registrations_member_cohort_uq").on(
      t.membershipId, t.cohortId,
    ),
    index("placement_batch_registrations_college_cohort_idx").on(
      t.collegeId, t.cohortId, t.choice,
    ),
    check(
      "placement_batch_registrations_choice_ck",
      sql`${t.choice} in (
        'PLACEMENTS','HIGHER_STUDIES','NOT_INTERESTED',
        'ENTREPRENEURSHIP','COMPETITIVE_EXAMS')`,
    ),
    check(
      "placement_batch_registrations_source_ck",
      sql`${t.source} in ('SELF','TPO','BACKFILL')`,
    ),
    check(
      "placement_batch_registrations_consent_ck",
      sql`(${t.choice} = 'PLACEMENTS' and ${t.consentAt} is not null
          and length(trim(coalesce(${t.consentVersion}, ''))) > 0)
        or (${t.choice} <> 'PLACEMENTS' and ${t.consentAt} is null
          and ${t.consentVersion} is null)`,
    ),
    check("placement_batch_registrations_version_ck", sql`${t.version} >= 0`),
  ],
);

/**
 * The registration row can change, but event history cannot. Repeated consent
 * is auditable; do not infer consent from a non-PLACEMENTS choice.
 */
export const placementBatchRegistrationEvents = pgTable(
  "placement_batch_registration_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => placementBatchRegistrations.id, { onDelete: "restrict" }),
    previousChoice: varchar("previous_choice", { length: 24 }),
    nextChoice: varchar("next_choice", { length: 24 }).notNull(),
    consentVersion: varchar("consent_version", { length: 32 }),
    consentAt: timestamp("consent_at", { withTimezone: true }),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    source: varchar("source", { length: 16 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("placement_batch_registration_events_registration_time_idx").on(
      t.registrationId, t.occurredAt,
    ),
    check(
      "placement_batch_registration_events_source_ck",
      sql`${t.source} in ('SELF','TPO','BACKFILL')`,
    ),
    check(
      "placement_batch_registration_events_consent_ck",
      sql`(${t.nextChoice} = 'PLACEMENTS' and ${t.consentAt} is not null
           and length(trim(coalesce(${t.consentVersion}, ''))) > 0)
        or (${t.nextChoice} <> 'PLACEMENTS' and ${t.consentAt} is null
           and ${t.consentVersion} is null)`,
    ),
  ],
);

/** Old registration used a season ID, while the current record is one choice
 * per learner and academic cohort. Crosswalk season->cohort and numeric learner
 * ID->college membership only after verifying both in the same college.
 * A legacy consent with no version/date is NOT fresh PLACEMENTS consent. */
export const LEGACY_PLACEMENT_REGISTRATION_FIELDS={
 learner_id:"membershipId",season_id:"cohortId (verified only)",
 choice:"choice",consent_version:"consentVersion",
 consent_at:"consentAt",source:"source",
 created_at:"createdAt",updated_at:"updatedAt",
} as const;
export function mapLegacyPlacementRegistrationChoice(raw:{
 choice:string;consentVersion?:string|null;consentAt?:string|null;
 source:string;
}){
 const choices=["PLACEMENTS","HIGHER_STUDIES","NOT_INTERESTED",
  "ENTREPRENEURSHIP","COMPETITIVE_EXAMS"] as const;
 const choice=choices.find(value=>value===raw.choice);
 if(!choice)throw new Error("Unrecognized source registration choice");
 if(!["SELF","TPO","BACKFILL"].includes(raw.source))
  throw new Error("Unrecognized source registration writer");
 if(choice!=="PLACEMENTS")return {choice,consentVersion:null,consentAt:null};
 const value=raw.consentAt ?new Date(raw.consentAt):null;
 if(!value||!Number.isFinite(value.getTime())||
    !/(?:Z|[+-]\d{2}:\d{2})$/.test(raw.consentAt??"")||
    !(raw.consentVersion?.trim()))
  throw new Error("Source placement consent requires independent review");
 return {choice,consentVersion:raw.consentVersion.trim(),consentAt:value};
}
