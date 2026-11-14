import "server-only";
import {type RequestContext,hasActiveMembership,hasMembershipRole} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {loadCourseSectionDeliveryScope} from "./scope";
import {requireDeliveryContentMutation} from "./learning-access";
import {CoursesServiceError} from "./errors";
import {facultyDiscussionReplySchema} from "./faculty-discussion-reply-model";
import {createCourseDiscussionMessage} from "./discussion-service";
import {z} from "zod";
import { ROLE } from "@/modules/identity/roles";
import { zUuid } from "@/lib/schema-primitives";
export async function postFacultyDiscussionReply(context:RequestContext,rawDeliveryId:unknown,raw:unknown){
 const deliveryId=zUuid.parse(rawDeliveryId);
 const input=facultyDiscussionReplySchema.parse(raw);
 const member=context.membership;
 if(!member||!hasActiveMembership(context)||!hasMembershipRole(context,ROLE.FACULTY))
  throw new CoursesServiceError("DISCUSSION_POST_ACCESS_DENIED");
 const delivery=await loadCourseSectionDeliveryScope(deliveryId);
 if(delivery.collegeId!==member.collegeId||
  !can(context,"courses.read",{collegeId:delivery.collegeId,organizationId:delivery.organizationId}))
  throw new CoursesServiceError("DISCUSSION_POST_ACCESS_DENIED");
 if(await requireDeliveryContentMutation(context,deliveryId)!==ROLE.FACULTY)
  throw new CoursesServiceError("DISCUSSION_POST_ACCESS_DENIED");
 return createCourseDiscussionMessage(context,deliveryId,input);
}
