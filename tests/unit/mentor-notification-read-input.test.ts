import { describe, expect, it } from "vitest";
import { parseMentorNotificationReadBody } from "@/modules/activity/mentor-notification-read-input";

describe("Mentor inbox mutation body",()=>{
  it("accepts only an absent/empty JSON body",()=>{
    expect(parseMentorNotificationReadBody("")).toEqual({});
    expect(parseMentorNotificationReadBody("{}")).toEqual({});
    for (const malformed of [
      '{"collegeId":"foreign"}','{"userId":"other"}',"[]","not json","null",
    ]) expect(()=>parseMentorNotificationReadBody(malformed)).toThrow();
  });
});
