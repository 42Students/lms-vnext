import {z} from "zod";
export const announcementMutationSchema=z.object({action:z.enum(["EDIT","DELETE","UNDO_DELETE","REMIND"]),expectedVersion:z.number().int().nonnegative()}).strict();
export function announcementActionAllowed(input:{deleted:boolean;action:z.infer<typeof announcementMutationSchema>["action"]}){return input.action==="UNDO_DELETE"?input.deleted:!input.deleted;}
