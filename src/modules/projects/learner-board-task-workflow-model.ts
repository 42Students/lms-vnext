import {z} from "zod";
import {learnerBoardTaskHref,type LearnerTaskBoardUrlFilters} from "./learner-board-task-detail-model";
const idSchema=z.string().uuid();
export function learnerBoardTaskWorkspaceHref(
 projectId:string, filters:LearnerTaskBoardUrlFilters, taskId:string,
):string {
 const base=learnerBoardTaskHref(projectId,filters);
 if(!idSchema.safeParse(taskId).success)return base;
 return base+"#mentor-task-"+encodeURIComponent(taskId);
}
