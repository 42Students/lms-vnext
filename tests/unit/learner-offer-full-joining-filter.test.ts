import { expect, it } from "vitest";
import { filterOwnOffersByJoining, learnerJoiningFilterSchema } from "@/modules/placements/learner-offer-joining-filter-model";
import { learnerOfferStatusHref } from "@/modules/placements/learner-offers-navigation-model";
it("shows only recorded own joining outcomes, with a separate not-recorded state", () => {
 const rows = [
  {id:"a",joining:null},
  {id:"b",joining:{status:"PENDING"}},
  {id:"c",joining:{status:"JOINED"}},
  {id:"d",joining:{status:"DEFERRED"}},
  {id:"e",joining:{status:"DID_NOT_JOIN"}},
 ];
 for(const [filter,id] of [["not-recorded","a"],["pending","b"],["joined","c"],["deferred","d"],["did-not-join","e"]] as const) {
  expect(filterOwnOffersByJoining(rows,filter).map(r=>r.id)).toEqual([id]);
  expect(learnerOfferStatusHref("accepted",{searchTerm:"",dueOnly:false,sort:"priority",joining:filter})).toContain("joining="+filter);
 }
 expect(filterOwnOffersByJoining(rows,"all")).toEqual(rows);
 expect(learnerJoiningFilterSchema.safeParse("other").success).toBe(false);
});
