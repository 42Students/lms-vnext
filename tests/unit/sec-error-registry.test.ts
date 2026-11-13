import { describe, expect, it, vi } from "vitest";

vi.mock("@/observability/logger", () => ({ logError: () => {} }));

import { apiErrorResponse } from "@/lib/api-error";
import { AppError, ERROR_FAMILIES, statusForCode } from "@/lib/error-registry";
import { tpoCrmApiErrorResponse } from "@/lib/tpo-crm-api-error";
import { tpoMessagingApiErrorResponse } from "@/lib/tpo-messaging-api-error";
import { lectureHallErrorResponse } from "@/app/api/lecture-halls/error-response";
import { TpoCrmError } from "@/modules/placements/tpo-crm-service";
import { TpoMessagingError } from "@/modules/placements/tpo-messaging-service";
import { LectureHallError } from "@/modules/academics/lecture-hall-service";

describe("error registry", () => {
  it("resolves override, then the lists, then the family fallback", () => {
    expect(statusForCode("projects", "PROJECT_UPDATE_RATE_LIMITED")).toBe(429);
    expect(statusForCode("projects", "PROJECT_NOT_FOUND")).toBe(404);
    expect(statusForCode("projects", "PROJECT_ACCESS_DENIED")).toBe(403);
    expect(statusForCode("courses", "QUIZ_ANSWER_INVALID")).toBe(400);
    expect(statusForCode("tpoCrm", "TPO_CRM_INVALID_DUE_AT")).toBe(422);
    expect(statusForCode("projects", "SOMETHING_NEW")).toBe(409);
    expect(statusForCode("department", "SOMETHING_NEW")).toBe(404);
  });
  it("never lists one code under two competing outcomes in the same family", () => {
    for (const [name, family] of Object.entries(ERROR_FAMILIES)) {
      const lists = [family.notFound, family.forbidden, family.badRequest, family.unprocessable, Object.keys(family.overrides ?? {})];
      const seen = new Set<string>();
      for (const list of lists) for (const code of list ?? []) {
        expect(seen.has(code), `${name}.${code}`).toBe(false);
        seen.add(code);
      }
    }
  });
  it("AppError carries its own status and detail through the central mapper", async () => {
    const response = apiErrorResponse(new AppError("QUOTA_EXCEEDED", { status: 429, retryable: true, details: { limit: 5 } }));
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body).toMatchObject({ error: "QUOTA_EXCEEDED", limit: 5, retryable: true });
    expect(typeof body.requestId).toBe("string");
  });
  it("the TPO and lecture-hall mappers take their statuses from the same table", () => {
    expect(tpoCrmApiErrorResponse(new TpoCrmError("TPO_CRM_LEAD_NOT_FOUND" as never)).status).toBe(404);
    expect(tpoMessagingApiErrorResponse(new TpoMessagingError("TPO_MESSAGE_THREAD_NOT_FOUND" as never)).status).toBe(404);
    expect(lectureHallErrorResponse(new LectureHallError("HALL_NAME_TAKEN" as never)).status).toBe(409);
    expect(lectureHallErrorResponse(new LectureHallError("DEPARTMENT_NOT_FOUND" as never)).status).toBe(400);
  });
});
