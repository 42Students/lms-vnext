import { describe, expect, it } from "vitest";
import { parseFacultyInboxQuery } from "@/modules/courses/faculty-inbox-query-model";

const uuid = "2f2cc95d-213f-4b70-8cd1-fdbd9cdb6f55";
describe("Faculty notification URL selectors", () => {
  it("uses an all-inbox default and a safe unread selector", () => {
    expect(parseFacultyInboxQuery({})).toEqual({ view:"all", cursor:null, noticeCursor:null, invalid:false });
    expect(parseFacultyInboxQuery({ view:"unread" }).view).toBe("unread");
  });
  it("accepts a validated older-page cursor", () => {
    const result=parseFacultyInboxQuery({
      view:"unread", beforeCreatedAt:"2026-10-14T02:00:00.000Z", beforeId:uuid,
    });
    expect(result.invalid).toBe(false);
    expect(result.cursor?.beforeId).toBe(uuid);
  });
  it("refuses duplicate query values, unknown keys and partial cursors", () => {
    for (const query of [
      {view:["all","unread"]}, {view:"ALl"}, {view:"unread",secret:"1"},
      {beforeId:uuid}, {beforeCreatedAt:"2026-10-14T02:00:00.000Z"},
      {beforeId:"../../etc",beforeCreatedAt:"2026-10-14T02:00:00.000Z"},
    ]) {
      expect(parseFacultyInboxQuery(query).invalid).toBe(true);
    }
  });
});
