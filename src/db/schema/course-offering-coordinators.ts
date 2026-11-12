import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  check,
} from "drizzle-orm/pg-core";
import { collegeMemberships } from "./memberships";
import { colleges } from "./colleges";
import { courseOfferings } from "./courses";

/**
 * A course's coordinator is one of its own teachers, picked by the college admin: one active coordinator per
 * offering. The row is only a nomination. Whether it counts is decided on every request from live data (active
 * membership with the FACULTY role, and an active teaching assignment on a section of this offering), so the
 * grant lapses while the teacher no longer teaches the offering and works again if they return.
 *
 * Revoking sets revoked_at; rows are never deleted and every change is also written to
 * course_offering_coordinator_events (append-only).
 */
export const courseOfferingCoordinators = pgTable(
  "course_offering_coordinators",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => courseOfferings.id, { onDelete: "restrict" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id").notNull(),
    grantedByMembershipId: uuid("granted_by_membership_id"),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedByMembershipId: uuid("revoked_by_membership_id"),
    /** Write CAS for grant/revoke races. */
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // The nominee must belong to the same college as the row (and so as the offering, see the 0343 trigger).
    foreignKey({
      name: "course_offering_coordinators_membership_college_fk",
      columns: [t.membershipId, t.collegeId],
      foreignColumns: [collegeMemberships.id, collegeMemberships.collegeId],
    }).onDelete("restrict"),
    foreignKey({
      name: "course_offering_coordinators_granted_by_fk",
      columns: [t.grantedByMembershipId],
      foreignColumns: [collegeMemberships.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "course_offering_coordinators_revoked_by_fk",
      columns: [t.revokedByMembershipId],
      foreignColumns: [collegeMemberships.id],
    }).onDelete("restrict"),
    // One coordinator per offering at a time.
    uniqueIndex("course_offering_coordinators_active_uq")
      .on(t.offeringId)
      .where(sql`${t.revokedAt} is null`),
    index("course_offering_coordinators_membership_active_idx")
      .on(t.membershipId, t.offeringId)
      .where(sql`${t.revokedAt} is null`),
    index("course_offering_coordinators_college_idx").on(t.collegeId),
    check(
      "course_offering_coordinators_lifecycle_ck",
      sql`(${t.revokedAt} is null and ${t.revokedByMembershipId} is null)
        or (${t.revokedAt} is not null and ${t.revokedAt} >= ${t.grantedAt})`,
    ),
  ],
);

export const courseOfferingCoordinatorEvents = pgTable(
  "course_offering_coordinator_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    coordinatorId: uuid("coordinator_id")
      .notNull()
      .references(() => courseOfferingCoordinators.id, { onDelete: "restrict" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    action: text("action").notNull(),
    actorMembershipId: uuid("actor_membership_id").references(() => collegeMemberships.id, {
      onDelete: "restrict",
    }),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("course_offering_coordinator_events_history_idx").on(t.coordinatorId, t.occurredAt),
    index("course_offering_coordinator_events_college_idx").on(t.collegeId),
    check(
      "course_offering_coordinator_events_action_ck",
      sql`${t.action} in ('GRANTED', 'REGRANTED', 'REVOKED')`,
    ),
  ],
);
