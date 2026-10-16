import { date, integer, smallint, text, uuid, varchar } from "drizzle-orm/pg-core";

/** COL-projects-02/10/11 staged columns; not registered until migration approval. */
export const stagedProjectInstanceSummaryColumns = {
  progressPercent: smallint("progress_percent").notNull().default(0),
  phase: varchar("phase", { length: 120 }),
  dueLabel: varchar("due_label", { length: 160 }),
  courseLabel: varchar("course_label", { length: 160 }),
  sectionId: uuid("section_id"),
  blocker: text("blocker"),
  nextAction: text("next_action"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  sprintLengthWeeks: integer("sprint_length_weeks"),
  estimationUnit: varchar("estimation_unit", { length: 32 }).default("POINTS"),
};
