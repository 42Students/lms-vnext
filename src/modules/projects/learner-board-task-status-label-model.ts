const STATUS_LABELS: Readonly<Record<string,string>> = {
  TODO:"To do",IN_PROGRESS:"In progress",BLOCKED:"Blocked",IN_REVIEW:"In review",DONE:"Done",
};
const PRIORITY_LABELS: Readonly<Record<string,string>> = { LOW:"Low",MEDIUM:"Medium",HIGH:"High",CRITICAL:"Critical" };
/** Display labels only: the persisted status/priority and project action routes are unchanged. */
export function learnerBoardTaskStatusLabel(status:string):string {return STATUS_LABELS[status]??"Unknown status";}
export function learnerBoardTaskPriorityLabel(priority:string):string {return PRIORITY_LABELS[priority]??"Unknown priority";}
