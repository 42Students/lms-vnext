import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("faculty schedule legacy own-instructor scope", () => {
  it("does not include another faculty member's explicitly assigned events", () => {
    const service = readFileSync("src/modules/courses/faculty-schedule-service.ts", "utf8");
    expect(service).toContain('const assigned = await listFacultyCourseDeliveries(context)');
    expect(service).toContain('const viewerMembershipId = context.membership?.id');
    expect(service).toContain('if (!viewerMembershipId) throw new AuthorizationError("courses.read")');
    expect(service).toContain('eq(sectionScheduleEvents.facultyMembershipId, viewerMembershipId)');
    expect(service).toContain('isNull(sectionScheduleEvents.facultyMembershipId)');
    expect(service).toContain('eq(courseSectionDeliveries.sectionId, sectionScheduleEvents.sectionId)');
    expect(service).toContain('inArray(sectionScheduleEventCourses.deliveryId,options.deliveryId?[options.deliveryId]:deliveryIds)');
  });
});
