/**
 * W03 DB07 SOURCE-ONLY schema candidates. Do not import into db/schema/index.ts,
 * run against live endpoints or assume tables exist until W01 registers/replays
 * the corresponding Drizzle migration and verifies composite tenant/project FKs.
 *
 * Source: legacy DB07 16-table/358-field ledger (2026-10-10).
 */
import { desc, sql } from "drizzle-orm";
import {
  check, foreignKey, index, integer, jsonb, pgTable, text, timestamp, uuid, varchar,
} from "drizzle-orm/pg-core";
import { projectInstances, projectMeetings, projectResources, projectSubmissions,
  projectTasks } from "./projects";
import { users } from "./users";

const time = () => timestamp("created_at",{withTimezone:true}).notNull().defaultNow();
const json = (name:string) => jsonb(name).$type<Record<string,unknown>>();

export const projectMeetingAuditHistoryStaged = pgTable("project_meeting_history",{
  id:uuid("id").defaultRandom().primaryKey(),
  projectId:uuid("project_id").notNull().references(()=>projectInstances.id,{onDelete:"restrict"}),
  meetingId:uuid("project_meeting_id").references(()=>projectMeetings.id,{onDelete:"restrict"}),
  meetingKey:varchar("meeting_key",{length:120}).notNull(),
  actionType:varchar("action_type",{length:40}).notNull(),
  actorUserId:uuid("actor_user_id").references(()=>users.id,{onDelete:"restrict"}),
  actorUserType:varchar("actor_user_type",{length:20}),
  actorName:varchar("actor_name",{length:160}),
  beforeJson:json("before_json"),
  afterJson:json("after_json"),
  /** Legacy changedFields may contain a JSON array. */
  changedFields:jsonb("changed_fields").$type<unknown>(),
  notes:text("notes"),
  createdAt:time(),
  updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
  deletedAt:timestamp("deleted_at",{withTimezone:true}),
},t=>[
  foreignKey({name:"project_meeting_history_project_fk",
    columns:[t.projectId,t.meetingId],
    foreignColumns:[projectMeetings.projectId,projectMeetings.id]}).onDelete("restrict"),
  index("project_meeting_history_project_time_idx").on(t.projectId,t.createdAt),
  index("project_meeting_history_meeting_idx").on(t.meetingId,t.createdAt),
  index("project_meeting_history_project_key_time_id_idx").on(t.projectId,t.meetingKey,desc(t.createdAt),desc(t.id)),
  check("project_meeting_history_updated_after_created_ck",sql`${t.updatedAt} >= ${t.createdAt}`),
  check("project_meeting_history_deleted_after_created_ck",sql`${t.deletedAt} is null or ${t.deletedAt} >= ${t.createdAt}`),
  check("project_meeting_history_action_nonempty_ck",sql`length(trim(${t.actionType})) > 0`),
]);

export const projectResourceAuditHistoryStaged=pgTable("project_resource_audit",{
  id:uuid("id").defaultRandom().primaryKey(),
  projectId:uuid("project_id").notNull().references(()=>projectInstances.id,{onDelete:"restrict"}),
  /** Retain source resource ID even after resource deletion. */
  resourceId:uuid("project_resource_id"),
  resourceKey:varchar("resource_key",{length:120}).notNull(),
  actionType:varchar("action_type",{length:40}).notNull(),
  actorUserId:uuid("actor_user_id").references(()=>users.id,{onDelete:"restrict"}),
  actorUserType:varchar("actor_user_type",{length:20}),
  actorName:varchar("actor_name",{length:160}),
  resourceOrder:integer("resource_order"),
  beforeJson:json("before_json"),
  afterJson:json("after_json"),
  changedFields:jsonb("changed_fields").$type<unknown>(),
  createdAt:time(),
  updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
  deletedAt:timestamp("deleted_at",{withTimezone:true}),
},t=>[
  // History references project only: resource key can outlive resource deletion.
  index("project_resource_audit_project_time_idx").on(t.projectId,t.createdAt),
  index("project_resource_audit_resource_idx").on(t.resourceId,t.createdAt),
  check("project_resource_audit_updated_after_created_ck",sql`${t.updatedAt} >= ${t.createdAt}`),
  check("project_resource_audit_deleted_after_created_ck",sql`${t.deletedAt} is null or ${t.deletedAt} >= ${t.createdAt}`),
  check("project_resource_audit_action_nonempty_ck",sql`length(trim(${t.actionType})) > 0`),
]);

export const projectDeliveryEventsStaged=pgTable("project_delivery_events",{
  id:uuid("id").defaultRandom().primaryKey(),
  projectId:uuid("project_id").notNull().references(()=>projectInstances.id,{onDelete:"restrict"}),
  deliveryId:uuid("delivery_id").notNull().references(()=>projectSubmissions.id,{onDelete:"restrict"}),
  action:varchar("action",{length:60}),
  status:varchar("status",{length:60}),
  actorUserId:uuid("actor_user_id").references(()=>users.id,{onDelete:"restrict"}),
  actorName:varchar("actor_name",{length:160}),
  actorType:varchar("actor_type",{length:20}),
  notes:text("notes"),
  attachmentUrl:text("attachment_url"),
  attachmentObjectPath:text("attachment_object_path"),
  feedback:text("feedback"),
  revisionCount:integer("revision_count").notNull().default(0),
  createdAt:time(),
},t=>[
  foreignKey({name:"project_delivery_events_project_fk",
    columns:[t.projectId,t.deliveryId],
    foreignColumns:[projectSubmissions.projectId,projectSubmissions.id]}).onDelete("restrict"),
  index("project_delivery_events_project_time_idx").on(t.projectId,t.createdAt),
  index("project_delivery_events_delivery_idx").on(t.deliveryId,t.createdAt),
  check("project_delivery_events_revision_ck",sql`${t.revisionCount} is null or ${t.revisionCount} >= 0`),
]);

export const projectTaskCommentsStaged=pgTable("project_task_comments",{
  id:uuid("id").defaultRandom().primaryKey(),
  projectId:uuid("project_id").notNull().references(()=>projectInstances.id,{onDelete:"restrict"}),
  taskId:uuid("project_task_id").notNull().references(()=>projectTasks.id,{onDelete:"restrict"}),
  commenterUserId:uuid("commenter_user_id").references(()=>users.id,{onDelete:"restrict"}),
  commenterType:varchar("commenter_type",{length:20}),
  commenterName:varchar("commenter_name",{length:160}),
  message:text("message"),
  progressValue:integer("progress_value"),
  commentType:varchar("comment_type",{length:30}).notNull(),
  taskStatusSnapshot:varchar("task_status_snapshot",{length:30}),
  createdAt:time(),
  updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
  deletedAt:timestamp("deleted_at",{withTimezone:true}),
},t=>[
  foreignKey({name:"project_task_comments_project_fk",
    columns:[t.projectId,t.taskId],
    foreignColumns:[projectTasks.projectId,projectTasks.id]}).onDelete("restrict"),
  index("project_task_comments_task_time_idx").on(t.taskId,t.createdAt),
  index("project_task_comments_project_idx").on(t.projectId,t.createdAt),
  check("project_task_comments_progress_ck",
    sql`${t.progressValue} is null or ${t.progressValue} between 0 and 100`),
  check("project_task_comments_message_ck",
    sql`${t.message} is null or length(trim(${t.message})) > 0`),
  check("project_task_comments_type_ck",
    sql`length(trim(${t.commentType})) > 0`),
  // SQL promotion draft additionally installs UPDATE/DELETE/TRUNCATE triggers
  // for comment identity and recoverable deletion; Drizzle check metadata must
  // preserve the same chronology requirements.
  check("w03_task_comments_updated_after_created_ck",
    sql`${t.updatedAt} >= ${t.createdAt}`),
  check("w03_task_comments_deleted_after_created_ck",
    sql`${t.deletedAt} is null or ${t.deletedAt} >= ${t.createdAt}`),
]);
