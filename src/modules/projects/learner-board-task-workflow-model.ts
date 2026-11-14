import {z} from "zod";
import {learnerBoardTaskHref,type LearnerTaskBoardUrlFilters} from "./learner-board-task-detail-model";
import { zUuid } from "@/lib/schema-primitives";
const idSchema=zUuid;
export function learnerBoardTaskWorkspaceHref(
 projectId:string, filters:LearnerTaskBoardUrlFilters, taskId:string,
):string {
 const base=learnerBoardTaskHref(projectId,filters);
 if(!idSchema.safeParse(taskId).success)return base;
 return base+"#mentor-task-"+encodeURIComponent(taskId);
}
