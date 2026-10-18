import {z} from "zod";
export const hrNotificationReadSchema=z.strictObject({
 expectedCreatedAt:z.iso.datetime(),
});
export function hrNotificationVersionMatches(createdAt:Date,token:string){
 const time=Date.parse(token);
 return Number.isFinite(time)&&createdAt.getTime()===time;
}

/** Mutation ownership is tighter than a bare active recruiter flag: the
 * active recruiter identity must belong to this exact signed-in principal. */
export function ownsHrNotificationActor(context:{
 user:{id:string;platformStatus:string};
 recruiter?:{userId:string;status:string}|null;
}):boolean{
 return context.user.platformStatus==="ACTIVE" &&
  context.recruiter?.status==="ACTIVE" &&
  context.recruiter.userId===context.user.id;
}
