import { activityName, activityTone, describeActivity } from "@/components/admin/activity/activityText";

describe("activity log sentences", () => {
  test.each([
    ["DEPARTMENT_DELETE", "deleted department"],
    ["BATCH_PROMOTE", "promoted batch"],
    ["SEMESTER_COURSE_BULK_ADD", "added courses to semester"], ["PROJECT_ASSIGN_MENTOR", "assigned a mentor to project"],
    ["ATTENDANCE_MARK_BULK", "marked attendance"],
    ["CLASS_SCHEDULE_CREATE", "created a class session"],
    ["LEARNER_IDENTITY_READ", "viewed student identity documents of"],
    ["PROJECT_TASK_COMMENT_ADD", "added a comment on task"],
    ["COURSE_BULK_STATUS_UPDATE", "updated the status of courses"],
    ["MODULE_ACCESS_SET", "changed module access for"],
  ])("%s reads as '%s'", (actionKey, sentence) => {
    expect(describeActivity({ actionKey }).sentence).toBe(sentence);
  });

  test("bulk actions are flagged", () => {
    expect(describeActivity({ actionKey: "ATTENDANCE_MARK_BULK" }).bulk).toBe(true);
    expect(describeActivity({ actionKey: "DEPARTMENT_DELETE" }).bulk).toBe(false);
  });

  test("names come from the payload, people included", () => {
    expect(activityName({ payloadJson: { title: "Build CSS layout", status: "TO_DO" } })).toBe("Build CSS layout");
    expect(activityName({ payloadJson: { firstName: "Asha", lastName: "Rao" } })).toBe("Asha Rao");
    expect(activityName({ payloadJson: {} })).toBeNull();
  });

  test("destructive and access changes stand out", () => {
    expect(activityTone({ actionKey: "FACULTY_DELETE" })).toBe("danger");
    expect(activityTone({ actionKey: "LEARNER_IDENTITY_READ" })).toBe("danger");
    expect(activityTone({ actionKey: "BATCH_PROMOTE" })).toBe("warn");
    expect(activityTone({ actionKey: "BATCH_CREATE" })).toBe("good");
    expect(activityTone({ actionKey: "PROJECT_TASK_UPDATE" })).toBe("neutral");
  });
});

describe("rows that store only an id", () => {
  const { activityName, describeActivity } = require("@/components/admin/activity/activityText");
  test("name comes from the server's targetNames lookup", () => {
    const row = { actionKey: "LEARNER_SUSPEND", entityType: "user", entityId: "160", payloadJson: {} };
    expect(activityName(row, { "user:160": "Meghana Reddy" })).toBe("Meghana Reddy");
    expect(describeActivity(row).sentence).toBe("suspended student");
  });
  test("payload name still wins", () => {
    const row = { actionKey: "PROJECT_TASK_DELETE", entityType: "PROJECT_TASK", entityId: "s02-t01", payloadJson: { title: "CSS layout" } };
    expect(activityName(row, { "project_task:s02-t01": "other" })).toBe("CSS layout");
  });
});

