import { describe, expect, it } from "vitest";
import { collegeDriveListQuerySchema, driveListHref, driveQueryFromSearch } from "@/modules/placements/college-drive-read-model";

describe("College drives filters", () => {
  it("strictly validates bounded filters and never accepts caller college", () => {
    expect(collegeDriveListQuerySchema.parse({})).toEqual({q:"",status:"PUBLISHED",sort:"TITLE",page:1});
    for (const input of [{collegeId:"foreign"},{page:0},{page:1001},{status:"UNKNOWN"},{seasonId:"bad"}]) {
      expect(collegeDriveListQuerySchema.safeParse(input).success).toBe(false);
    }
    expect(driveQueryFromSearch({page:["1","2"]})).toBeNull();
    expect(driveQueryFromSearch({relationshipId:""})).toEqual({q:"",status:"PUBLISHED",sort:"TITLE",page:1});
  });
  it("encodes only trusted drive path/filter", () => {
    const url = new URL(driveListHref(collegeDriveListQuerySchema.parse({q:"a & b",status:"DRAFT",page:2})),"https://example.test");
    expect(url.pathname).toBe("/college/placements/drives");
    expect(url.searchParams.get("q")).toBe("a & b");
    expect(url.searchParams.has("collegeId")).toBe(false);
  });
});
