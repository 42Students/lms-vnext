/** Course card labels must reflect persisted work and a real actionable link. */
export function learnerCourseCardNextLabel(row:{
 readOnly:boolean;learningPathReady:boolean;
 nextItem:{kind:"CONTENT"|"ASSIGNMENT"|"QUIZ";title:string}|null;
 firstOverdue?:{title:string}|null;
 summary:{itemsCompleted:number;itemsTotal:number};
}):string {
 if(row.readOnly)return "View course";
 if(!row.learningPathReady)return "Learning path not published";
 if(row.firstOverdue)return `Overdue assignment · ${row.firstOverdue.title}`;
 if(row.nextItem){
  switch(row.nextItem.kind){
   case "ASSIGNMENT":return `Assignment · ${row.nextItem.title}`;
   case "QUIZ":return `Quiz · ${row.nextItem.title}`;
   default:return `Continue · ${row.nextItem.title}`;
  }
 }
 if(row.summary.itemsTotal<=0)return "No learning items yet";
 return row.summary.itemsCompleted>=row.summary.itemsTotal
  ? "Course work complete" : "Review remaining course work";
}
