import {z} from "zod";
export const tpoDriveRequestDecisionSchema=z.strictObject({
  requestId:z.string().uuid(),
  action:z.enum(["APPROVE_LATER","SEND_BACK","DECLINE"]),
  expectedStatus:z.enum(["REQUEST","SENT_BACK"]),
  reason:z.string().trim().min(3).max(1000),
  confirmed:z.literal(true),
});
export type TpoDriveRequestDecision=z.infer<typeof tpoDriveRequestDecisionSchema>;
export const TPO_DRIVE_REQUEST_DECISION_COPY={
  approve:"Approve for later",
  sendBack:"Request a change",
  decline:"Decline this request",
  successApprove:"Approved",
  successDecline:"Declined",
  successSendBack:"Sent back",
} as const;
