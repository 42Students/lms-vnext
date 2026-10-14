export type LearnerBoardCardTask={id:string;title:string;status:string;priority:string;sprintId:string};
export function learnerBoardCardMetadata(task:LearnerBoardCardTask,sprints:readonly {id:string;title:string}[]) {
  return {
    title:task.title,
    status:task.status.split("_").join(" "),
    priority:task.priority,
    sprintTitle:sprints.find(s=>s.id===task.sprintId)?.title??"Unknown sprint",
  };
}
