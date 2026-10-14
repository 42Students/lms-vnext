export type HrGroupedNotice={id:string;jobId:string;title:string;unread:boolean};
export function groupHrNotificationPage<T extends HrGroupedNotice>(rows:readonly T[]){
 const groups=new Map<string,{jobId:string;title:string;unread:number;items:T[]}>();
 for(const item of rows){
  let group=groups.get(item.jobId);
  if(!group){
   group={jobId:item.jobId,title:item.title,unread:0,items:[]};
   groups.set(item.jobId,group);
  }
  group.items.push(item);
  if(item.unread)group.unread+=1;
 }
 return [...groups.values()];
}
