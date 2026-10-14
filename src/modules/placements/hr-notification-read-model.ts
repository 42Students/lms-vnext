import {z} from "zod";
export const hrNotificationReadSchema=z.strictObject({
 expectedCreatedAt:z.iso.datetime(),
});
export function hrNotificationVersionMatches(createdAt:Date,token:string){
 const time=Date.parse(token);
 return Number.isFinite(time)&&createdAt.getTime()===time;
}
