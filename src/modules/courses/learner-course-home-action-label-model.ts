/** A genuinely overdue assignment cannot be advertised as 'Due soon'. */
export function learnerCourseHomeActionLabel(state:{
 readOnly:boolean;priorityType:"Assignment"|"Quiz"|"Live Session"|null;
 overdue:boolean;hasNext:boolean;hasTrackable:boolean;
}):string{
 if(state.readOnly)return "Past semester";
 if(state.overdue&&state.priorityType==="Assignment")return "Overdue assignment";
 if(state.priorityType==="Live Session")return "Upcoming live session";
 if(state.priorityType)return "Due soon";
 if(state.hasNext)return "Next up";
 return state.hasTrackable?"All clear":"Start here";
}
