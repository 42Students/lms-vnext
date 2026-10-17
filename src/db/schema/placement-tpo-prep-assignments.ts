/** TPO-assigned supplemental preparation from the college's existing course offerings.
 * Does not grant access to unrelated colleges or bypass Course module access. */
import {sql} from "drizzle-orm";
import {check,foreignKey,index,pgTable,timestamp,uniqueIndex,uuid} from "drizzle-orm/pg-core";
import {colleges} from "./colleges";
import {collegeMemberships} from "./memberships";
import {courseOfferings} from "./courses";
import {users} from "./users";
export const placementTpoPrepAssignments=pgTable("placement_tpo_prep_assignments",{
 id:uuid("id").defaultRandom().primaryKey(),
 collegeId:uuid("college_id").notNull().references(()=>colleges.id,{onDelete:"restrict"}),
 membershipId:uuid("membership_id").notNull(),
 offeringId:uuid("offering_id").notNull().references(()=>courseOfferings.id,{onDelete:"restrict"}),
 dueAt:timestamp("due_at",{withTimezone:true}).notNull(),
 assignedByUserId:uuid("assigned_by_user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 foreignKey({name:"tpo_prep_member_college_fk",columns:[t.membershipId,t.collegeId],
  foreignColumns:[collegeMemberships.id,collegeMemberships.collegeId]}).onDelete("restrict"),
 uniqueIndex("tpo_prep_member_offering_uq").on(t.membershipId,t.offeringId),
 index("tpo_prep_college_due_idx").on(t.collegeId,t.dueAt),
 check("tpo_prep_due_after_assigned_ck",sql`${t.dueAt}>${t.createdAt}`),
]);
