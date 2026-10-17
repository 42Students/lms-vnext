import type {MentorProjectListQuery} from "./mentor-project-list-query";
export function canPageMentorProjectList(query:Pick<MentorProjectListQuery,"attention"|"work"|"status"|"sort">){
 return !query.attention&&!query.work &&
   !["BLOCKED","IN_PROGRESS","READY"].includes(query.status??"") &&
   (query.sort==="RECENT"||query.sort==="TITLE");
}
