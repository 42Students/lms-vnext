import {z} from "zod";
const uuid=z.string().uuid();
export function learnerCourseNextItemHref(row:{
  readOnly:boolean;learningPathReady:boolean;
  course:{deliveryId:string};
  nextItem:{lessonId:string;itemId:string;kind:"CONTENT"|"ASSIGNMENT"|"QUIZ"}|null;
}):string|null{
  if(row.readOnly||!row.learningPathReady||!row.nextItem)return null;
  const {deliveryId}=row.course;
  const {lessonId,itemId,kind}=row.nextItem;
  if(![deliveryId,lessonId,itemId].every(id=>uuid.safeParse(id).success))return null;
  const filter=kind==="CONTENT"?"all":"assessments";
  return `/learn/courses/${encodeURIComponent(deliveryId)}/roadmap?filter=${filter}&lesson=${encodeURIComponent(lessonId)}&content=${encodeURIComponent(itemId)}`;
}
