import { describe, expect, it } from "vitest";
import { apiErrorResponse } from "@/lib/api-error";
import { PeopleServiceError } from "@/modules/people/errors";

describe("#81 last College Admin HTTP denial contract",()=>{
  it("returns a conflict without leaking membership or identity information",async()=>{
    const response=apiErrorResponse(new PeopleServiceError("LAST_COLLEGE_ADMIN"));
    expect(response.status).toBe(409);
    expect(response.headers.get("x-request-id")).toBeTruthy();
    const body=await response.json();
    expect(body).toMatchObject({error:"LAST_COLLEGE_ADMIN"});
    expect(typeof body.message).toBe("string");
    expect(body).not.toHaveProperty("userId");
    expect(body).not.toHaveProperty("collegeId");
  });
});
