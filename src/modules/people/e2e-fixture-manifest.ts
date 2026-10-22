import {createHash} from "node:crypto";
import {z} from "zod";

/** Pure, deterministic E2E fixture contract. NO write or auth side effects:
 * it is consumed by explicit module-owned seed writers after an operator has
 * enabled the nonproduction fixture environment. Never import into public UI.
 * Each fixture node's foreign keys must be persisted before the node itself.
 */
export const E2E_FIXTURE_SCHEMA_VERSION="vnext-e2e-2026-10-v1";
export const E2E_LEGACY_FIXTURE_KEYS=[
 "orgColleges","org42Learn",
 "collegeA","collegeB","deptA","deptB","programA","programB",
 "batchA","batchB","classA","classB",
 "courseA","courseB","lessonA","lessonB",
 "lectureA","videoA","youtubeA","assignmentA","lectureB",
 "facultyA","facultyB","adminA","learnerA","learnerB",
 "hallA","classScheduleA","attendanceA","notificationA","announcementA",
 "jobA","jobApplicationA","jobHistoryA","interviewA","discussionA",
 "skillJava","skillSynonymJdk","skillSynonymLanguage",
 "qualificationA","videoProgressA","youtubeProgressA",
 "assignmentSubmissionA","studentImageA","projectWorkspaceA",
] as const;
export type E2EFixtureKey=typeof E2E_LEGACY_FIXTURE_KEYS[number];

export type E2EFixtureNode={
 key:E2EFixtureKey;id:string;table:string;requires:readonly E2EFixtureKey[];
 title:string;credentialSafe:boolean;externalBinaryRequired:boolean;
};

/** A stable UUID with explicit v4/variant bits; never derive from test phones,
 * production user identifiers, or secrets. Fixture namespace is mandatory. */
export function deterministicE2EFixtureId(namespace:string,key:E2EFixtureKey){
 const seed=z.string().min(6).max(80).regex(/^[A-Za-z0-9_-]+$/).parse(namespace);
 const hex=createHash("sha256").update(
  E2E_FIXTURE_SCHEMA_VERSION+":"+seed+":"+key).digest("hex");
 return [hex.slice(0,8),hex.slice(8,12),"4"+hex.slice(13,16),
  "8"+hex.slice(17,20),hex.slice(20,32)].join("-");
}

const definitions:readonly [E2EFixtureKey,string,readonly E2EFixtureKey[],string,boolean?][]=[
 ["orgColleges","organizations",[],"E2E Colleges"],
 ["org42Learn","organizations",[],"E2E 42Learn"],
 ["collegeA","colleges",["orgColleges"],"E2E College A"],
 ["collegeB","colleges",["orgColleges"],"E2E College B"],
 ["deptA","departments",["collegeA"],"E2E Dept A"],
 ["deptB","departments",["collegeB"],"E2E Dept B"],
 ["programA","programs",["deptA"],"E2E Program A"],
 ["programB","programs",["deptB"],"E2E Program B"],
 ["batchA","cohorts",["programA"],"E2E Batch A"],
 ["batchB","cohorts",["programB"],"E2E Batch B"],
 ["classA","sections",["batchA"],"E2E Class A"],
 ["classB","sections",["batchB"],"E2E Class B"],
 ["courseA","courses",["deptA","org42Learn"],"E2E Course A"],
 ["courseB","courses",["deptB","org42Learn"],"E2E Course B"],
 ["lessonA","lessons",["courseA"],"E2E Lesson A"],
 ["lessonB","lessons",["courseB"],"E2E Lesson B"],
 ["lectureA","lesson_content",["lessonA","classA"],"E2E Lecture A"],
 ["videoA","lesson_videos",["lessonA","classA"],"E2E Video A",true],
 ["youtubeA","lesson_content",["lessonA","classA"],"E2E YouTube A"],
 ["assignmentA","course_assignments",["lessonA","classA"],"E2E Assignment A"],
 ["lectureB","lesson_content",["lessonB","classB"],"E2E Lecture B"],
 ["facultyA","college_memberships",["collegeA","deptA"],"E2E Teacher A"],
 ["facultyB","college_memberships",["collegeB","deptB"],"E2E Teacher B"],
 ["adminA","college_memberships",["collegeA","deptA"],"E2E Admin A"],
 ["learnerA","college_memberships",["collegeA","programA","classA"],"E2E Learner A"],
 ["learnerB","college_memberships",["collegeB","programB","classB"],"E2E Learner B"],
 ["hallA","lecture_halls",["collegeA","deptA"],"E2E Hall A"],
 ["classScheduleA","section_schedule_events",["classA","facultyA","hallA"],"E2E Session A"],
 ["attendanceA","attendance_records",["classScheduleA","learnerA"],"E2E Attendance A"],
 ["notificationA","in_app_notifications",["learnerA","classA"],"E2E Notification A"],
 ["announcementA","announcements",["collegeA","adminA"],"E2E Announcement A"],
 ["jobA","placement_jobs",["collegeA","programA","adminA"],"E2E Job A"],
 ["jobApplicationA","placement_applications",["jobA","learnerA"],"E2E Application A"],
 ["jobHistoryA","placement_application_stage_history",["jobApplicationA"],"E2E Application History"],
 ["interviewA","placement_round_candidate_slots",["jobApplicationA","jobA"],"E2E Interview A"],
 ["discussionA","course_discussion_posts",["lectureA","learnerA"],"E2E Discussion A"],
 ["skillJava","db10_skills",[],"Java"],
 ["skillSynonymJdk","db10_skill_synonyms",["skillJava"],"jdk"],
 ["skillSynonymLanguage","db10_skill_synonyms",["skillJava"],"java language"],
 ["qualificationA","learner_profiles",["learnerA"],"E2E Qualification A"],
 ["videoProgressA","lesson_progress",["videoA","learnerA"],"E2E Video Progress"],
 ["youtubeProgressA","lesson_progress",["youtubeA","learnerA"],"E2E YouTube Progress"],
 ["assignmentSubmissionA","assignment_submissions",["assignmentA","learnerA"],"E2E Submission A"],
 ["studentImageA","profile_private_document_receipts",["learnerA"],"E2E Profile Image",true],
 ["projectWorkspaceA","project_workspaces",["collegeA","facultyA","learnerA","classA"],"E2E Project A"],
];

/** Legacy SeedResult has every entity category; these values are stable
 * prospective targets, NOT claims about rows already present in PostgreSQL.
 * Signed, scanned media attachments are deliberately not fabricated. */
export function buildE2EFixtureManifest(namespace="e2e-dev"){
 const nodes:E2EFixtureNode[]=[];
 const seen=new Set<E2EFixtureKey>();
 for(const [key,table,requires,title,externalBinaryRequired] of definitions){
  if(requires.some(dependency=>!seen.has(dependency)))
   throw new Error("E2E fixture ordering or foreign key dependency invalid: "+key);
  nodes.push({key,id:deterministicE2EFixtureId(namespace,key),
   table,requires,title,credentialSafe:true,
   externalBinaryRequired:Boolean(externalBinaryRequired)});
  seen.add(key);
 }
 const ids=Object.fromEntries(nodes.map(node=>[node.key,node.id]))
  as Record<E2EFixtureKey,string>;
 const testPhones={
  facultyA:"+919000000001",facultyB:"+919000000002",adminA:"+919000000003",
  learnerA:"+919000000011",learnerB:"+919000000012",
 } as const;
 return {schemaVersion:E2E_FIXTURE_SCHEMA_VERSION,namespace,ids,nodes,
  projectWorkspaceASlug:"e2e-project-a-"+namespace,
  testPhones,uploadedMediaReady:false,
  mediaPrecondition:"PRIVATE_SCANNED_UPLOAD_REQUIRED" as const};
}

export function reconcileE2EFixtureManifest(
 manifest:ReturnType<typeof buildE2EFixtureManifest>,
 actual:ReadonlyMap<E2EFixtureKey,string>,
){
 const decisions=manifest.nodes.map(node=>{
  const existing=actual.get(node.key);
  if(existing&&existing!==node.id)
   throw new Error("E2E fixture key collides with an existing foreign UUID: "+node.key);
  return {...node,action:existing?"REUSE" as const:"CREATE" as const};
 });
 return {reused:decisions.filter(x=>x.action==="REUSE").length,
  missing:decisions.filter(x=>x.action==="CREATE").length,decisions};
}

/** Callers may not substitute this manifest for a successful database seed.
 * A separate authorized, transactional service must persist actual FK rows,
 * reconcile all IDs, and explicitly attest the media scan before activation. */
export function e2eFixtureActivationReady(input:{
 developmentMode:boolean;operatorAuthorized:boolean;
 schemaMigrationsReady:boolean;persistedNodeCount:number;
 verifiedMediaCount:number;
},manifest:ReturnType<typeof buildE2EFixtureManifest>){
 return input.developmentMode&&input.operatorAuthorized&&
  input.schemaMigrationsReady&&input.persistedNodeCount===manifest.nodes.length&&
  input.verifiedMediaCount>=manifest.nodes.filter(x=>x.externalBinaryRequired).length;
}
