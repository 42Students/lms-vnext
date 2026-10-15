/** Published Course progress is incomplete until the stored counts say otherwise. */
export function learnerRoadmapHeadline(input:{
 nextItemTitle:string|null;itemsMissed:number;itemsCompleted:number;itemsTotal:number;
}):string{
 if(input.nextItemTitle)return `Next: ${input.nextItemTitle}`;
 if(input.itemsTotal<=0)return "No learning items yet";
 if(input.itemsMissed>0)return "Review missed and incomplete items";
 return input.itemsCompleted>=input.itemsTotal ? "Course work complete" : "Review remaining course work";
}
