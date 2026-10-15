import {z} from "zod";
export const tpoTeamTabSchema=z.enum(["conversations","people"]);
export function parseTpoTeamTab(value:unknown){return tpoTeamTabSchema.safeParse(value).data??"conversations";}
