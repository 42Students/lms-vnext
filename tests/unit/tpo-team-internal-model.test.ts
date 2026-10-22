import {it,expect} from "vitest";
import {buildTpoTeamFormData} from "@/modules/placements/tpo-team-form-payload";
import {internalThreadSchema,canReadInternalThread,internalMessageSchema} from "@/modules/placements/tpo-team-internal-model";
it("allows only named internal participant memberships",()=>{
 expect(canReadInternalThread({actorMembershipId:"a",startedByMembershipId:"a",invitedMembershipId:"b"})).toBe(true);
 expect(canReadInternalThread({actorMembershipId:"recruiter",startedByMembershipId:"a",invitedMembershipId:"b"})).toBe(false);
 expect(internalMessageSchema.safeParse({threadId:"not-id",body:"x"}).success).toBe(false);
});

it("sends each selected group conversation participant as its own UUID form value",()=>{
 const alice="11111111-1111-4111-8111-111111111111";
 const bob="22222222-2222-4222-8222-222222222222";
 const carol="33333333-3333-4333-8333-333333333333";
 const data=buildTpoTeamFormData({
  recipientMembershipId:alice,kind:"TOPIC",topic:"Training discussion",
  participantMembershipIds:[bob,carol],
 });
 expect(data.getAll("participantMembershipIds")).toEqual([bob,carol]);
 expect(internalThreadSchema.safeParse({
  recipientMembershipId:data.get("recipientMembershipId"),
  kind:data.get("kind"),
  topic:data.get("topic"),
  participantMembershipIds:data.getAll("participantMembershipIds"),
 }).success).toBe(true);
 const direct=buildTpoTeamFormData({recipientMembershipId:alice,kind:"DIRECT",
  topic:"Private discussion",participantMembershipIds:[]});
 expect(direct.getAll("participantMembershipIds")).toEqual([]);
 expect(internalThreadSchema.safeParse({
  recipientMembershipId:direct.get("recipientMembershipId"),
  kind:direct.get("kind"),topic:direct.get("topic"),
  participantMembershipIds:direct.getAll("participantMembershipIds"),
 }).success).toBe(true);
});
