import {sql,type SQL} from "drizzle-orm";
/**
 * Tenant-scoped SELECT of matching ACTIVE membership IDs.
 * SQL is executed inside the publication transaction; never client supplied.
 */
export type TpoTargetedNoticeAudience={
 kind:"PLACEMENTS"|"BATCHES"|"BRANCHES"|"DRIVE";
 targetId?:string;
 targetIds?:string[];
};
export function tpoTargetedRecipientQuery(collegeId:string,audience:TpoTargetedNoticeAudience):SQL{
 const targets=audience.targetIds?.length?audience.targetIds:audience.targetId?[audience.targetId]:[];
 const targetSql=targets.length?sql.join(targets.map(id=>sql`${id}::uuid`),sql`,`) : sql`NULL::uuid`;
 const active=sql`m.college_id=${collegeId}::uuid AND m.status='ACTIVE'
  AND u.platform_status='ACTIVE'`;
 const learner=sql`JOIN learner_program_enrollments e ON e.membership_id=m.id
  AND e.status='ACTIVE'
  JOIN programs p ON p.id=e.program_id
  JOIN departments d ON d.id=p.department_id AND d.college_id=m.college_id`;
 if(audience.kind==="PLACEMENTS")return sql`
  SELECT DISTINCT m.id FROM college_memberships m JOIN users u ON u.id=m.user_id
  ${learner}
  JOIN placement_batch_registrations b ON b.membership_id=m.id
   AND b.college_id=m.college_id AND b.cohort_id=e.cohort_id
   AND b.choice='PLACEMENTS'
  WHERE ${active} ORDER BY m.id LIMIT 100001`;
 if(audience.kind==="BATCHES")return sql`
  SELECT DISTINCT m.id FROM college_memberships m JOIN users u ON u.id=m.user_id
  ${learner}
  WHERE ${active} AND e.cohort_id IN (${targetSql})
  ORDER BY m.id LIMIT 100001`;
 if(audience.kind==="BRANCHES")return sql`
  SELECT DISTINCT m.id FROM college_memberships m JOIN users u ON u.id=m.user_id
  ${learner}
  WHERE ${active} AND d.id IN (${targetSql})
  ORDER BY m.id LIMIT 100001`;
 return sql`
  SELECT DISTINCT m.id FROM college_memberships m JOIN users u ON u.id=m.user_id
  JOIN placement_applications a ON a.membership_id=m.id AND a.status='SUBMITTED'
  JOIN placement_jobs j ON j.id=a.job_id AND j.college_id=m.college_id
  WHERE ${active} AND j.id=${audience.targetId}::uuid
  ORDER BY m.id LIMIT 100001`;
}
