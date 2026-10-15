import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {announcementsRuntimeEnabled} from "@/modules/announcements/readiness";
import {listVisibleAnnouncementsForMembership} from "@/modules/announcements/service";
import {requireLearnerPlacementAccess} from "./learner-participation-guard";
import {learnerPlacementNoticeFeed} from "./learner-placement-announcement-model";
import {learnerRecentCollegeNoticePreview} from "./learner-dashboard-college-notices-model";

/** Missing DB10 is not a zero-notice claim. Membership and tenant scope are rechecked. */
export async function getOwnLearnerRecentCollegeNotices(context:RequestContext){
 const member=await requireLearnerPlacementAccess(context);
 requirePermission(context,"placements.read",{
  collegeId:member.collegeId,organizationId:member.organizationId,
 });
 if(!announcementsRuntimeEnabled())return null;
 const rows=await listVisibleAnnouncementsForMembership(context);
 return learnerRecentCollegeNoticePreview(learnerPlacementNoticeFeed(rows));
}
