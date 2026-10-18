import {describe,expect,it} from "vitest";
import {FriendlyFetchError} from "@/lib/api-fetch";
import {finalDeliveryUserError} from "@/modules/projects/final-delivery-user-error";
import {FRIENDLY_MESSAGES} from "@/lib/friendly-error";

describe("PROJ-BREAK-resilience-16 safe user-facing final-delivery failures",()=>{
 it("shows approved recovery text for missing or invalid server revisions",()=>{
  for(const message of [
   "Refresh this final draft to get its latest revision before saving.",
   "Could not confirm the draft revision. Refresh before editing again.",
  ])expect(finalDeliveryUserError(new Error(message))).toBe(message);
 });
 it("never renders arbitrary server, provider or browser exception details",()=>{
  for(const error of [
   new Error("postgresql://secret:password@internal:5432"),
   new TypeError("Cannot read property of undefined"),
   {message:"internal key has leaked"},
   null,
   undefined,
  ])expect(finalDeliveryUserError(error)).toBe(FRIENDLY_MESSAGES.unexpected);
 });
 it("preserves the curated API response for expired session, conflict and outages",()=>{
  const messages=[
   "Your session has ended. Please sign in again.",
   "This changed while you were working. Refresh and try again.",
   "We are making a quick update. Please try again in a minute.",
  ];
  for(const [index,status] of [401,409,503].entries()){
   expect(finalDeliveryUserError(new FriendlyFetchError(messages[index]!,status))).toBe(messages[index]);
  }
 });
});
