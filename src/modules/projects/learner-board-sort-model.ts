import {z} from "zod";
export const learnerBoardSortSchema=z.enum(["DEFAULT","PRIORITY","RECENT","TITLE"]);
export type LearnerBoardSort=z.infer<typeof learnerBoardSortSchema>;
type Task={id:string;title:string;priority:string;updatedAt:Date};
/** Non-mutating sorting only after server authorization and filter application. */
export function sortLearnerBoardTasks<T extends Task>(tasks:readonly T[],mode:LearnerBoardSort):T[]{
 if(mode==="DEFAULT")return [...tasks];
 const order:Record<string,number>={CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3};
 return [...tasks].sort((a,b)=>{
  if(mode==="PRIORITY"){
   const by=(order[a.priority]??4)-(order[b.priority]??4);
   if(by)return by;
  }
  if(mode==="RECENT"){
   const by=b.updatedAt.getTime()-a.updatedAt.getTime();
   if(by)return by;
  }
  return a.title.localeCompare(b.title)||a.id.localeCompare(b.id);
 });
}
