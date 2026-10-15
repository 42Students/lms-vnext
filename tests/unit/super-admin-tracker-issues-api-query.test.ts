import {describe,it,expect} from "vitest";
import {parseTrackerIssuesApiQuery as parse} from "@/modules/bug-tracker/issues-api-query";
describe("tracker issues API filters",()=>{
 it("accepts explicit bounded filters",()=>{expect(parse(new URLSearchParams("status=NEW&limit=15"))).toMatchObject({status:"NEW",limit:"15"});});
 it("allows a blank search field to behave as no filter",()=>{expect(parse(new URLSearchParams("q="))?.q).toBeUndefined();});
 it.each(["status=NEW&status=CLOSED","q=x&q=y","other=sensitive","limit=101","limit=0","beforeId=123e4567-e89b-42d3-a456-426614174000"])("rejects unsafe %s",query=>expect(parse(new URLSearchParams(query))).toBeNull());
});
