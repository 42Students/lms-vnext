/** DB06 grade audit cutover model.
 * This helper accepts only snapshots read inside the grading transaction
 * (SELECT ... FOR UPDATE for the previous row, UPDATE ... RETURNING for next).
 * Never construct historical values from a client payload or an old page.
 * Persisting the event and enabling deferred DB guards require DB06 promotion.
 */
export type LockedGradeSnapshot={
 id:string;assignmentId:string;deliveryId:string;membershipId:string;
 version:number;pointsAwarded:number|null;gradingStatus:string;gradePublished:boolean;
};
export type VerifiedGradeActor={userId:string;membershipId:string|null;role:"FACULTY"|"COLLEGE_ADMIN"|"SUPER_ADMIN"};
export type GradeAuditTransition={
 submissionId:string;assignmentId:string;deliveryId:string;learnerMembershipId:string;
 actorUserId:string;actorMembershipId:string|null;actorRole:VerifiedGradeActor["role"];
 action:"GRADE"|"REGRADE"|"PUBLISH_GRADE";
 sourceAction:"UPDATE_POINTS"|"PUBLISH_GRADE";
 previousPoints:number|null;newPoints:number|null;
 previousGradingStatus:string;newGradingStatus:string;
 previousPublished:boolean;newPublished:boolean;
 submissionVersionBefore:number;submissionVersionAfter:number;
 occurredAt:Date;
};
export function deriveGradeAuditTransition(
 previous:Readonly<LockedGradeSnapshot>,
 updated:Readonly<LockedGradeSnapshot>,
 actor:Readonly<VerifiedGradeActor>,
 occurredAt:Date,
):GradeAuditTransition{
 if(!previous.id||previous.id!==updated.id||
    previous.assignmentId!==updated.assignmentId||
    previous.deliveryId!==updated.deliveryId||
    previous.membershipId!==updated.membershipId)
  throw new Error("GRADE_AUDIT_SUBMISSION_SCOPE_CHANGED");
 if(!Number.isSafeInteger(previous.version)||updated.version!==previous.version+1)
  throw new Error("GRADE_AUDIT_VERSION_NOT_ATOMIC");
 if(!actor.userId||!["FACULTY","COLLEGE_ADMIN","SUPER_ADMIN"].includes(actor.role))
  throw new Error("GRADE_AUDIT_ACTOR_REQUIRED");
 if(!Number.isFinite(occurredAt.getTime()))throw new Error("GRADE_AUDIT_TIME_INVALID");
 const published=updated.gradePublished&&!previous.gradePublished;
 const gradeChanged=previous.pointsAwarded!==updated.pointsAwarded||
    previous.gradingStatus!==updated.gradingStatus;
 const hide=previous.gradePublished&&!updated.gradePublished;
 if(!published&&!gradeChanged&&!hide)throw new Error("GRADE_AUDIT_NO_CHANGE");
 if(published&&gradeChanged)throw new Error("GRADE_AUDIT_PUBLISH_MUST_NOT_REGRADE");
 return {
  submissionId:updated.id,assignmentId:updated.assignmentId,
  deliveryId:updated.deliveryId,learnerMembershipId:updated.membershipId,
  actorUserId:actor.userId,actorMembershipId:actor.membershipId,
  actorRole:actor.role,
  action:published?"PUBLISH_GRADE":previous.gradingStatus==="GRADED"?"REGRADE":"GRADE",
  sourceAction:published?"PUBLISH_GRADE":"UPDATE_POINTS",
  previousPoints:previous.pointsAwarded,newPoints:updated.pointsAwarded,
  previousGradingStatus:previous.gradingStatus,newGradingStatus:updated.gradingStatus,
  previousPublished:previous.gradePublished,newPublished:updated.gradePublished,
  submissionVersionBefore:previous.version,submissionVersionAfter:updated.version,
  occurredAt,
 };
}
