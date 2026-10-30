import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {listVisibleAnnouncementsForMembershipPage} from "@/modules/announcements/service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import type {RequestContext} from "@/modules/identity/context";

if(!process.env.TEST_DATABASE_URL)
 throw new Error("Faculty announcements PG acceptance requires disposable TEST_DATABASE_URL");

const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const marker="faculty-announcements-"+randomUUID();
const ids:string[]=[];
const faculty:RequestContext={
 user:{id:SEED_IDS.facultyUser,identityUid:"seed-shared-faculty",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,
  organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA,
  status:"ACTIVE",roles:["FACULTY"]},
};
const facultyB:RequestContext={
 ...faculty,membership:{...faculty.membership!,
  id:SEED_IDS.facultyCollegeBMembership,collegeId:SEED_IDS.collegeB},
};
afterAll(async()=>{
 try{
  if(ids.length)await pool.query("delete from announcements where id = any($1::uuid[])",[ids]);
 }finally{await pool.end();await closeDatabaseConnection();}
});
async function insertNotice(input:{
 collegeId:string;receiverType:"COLLEGE"|"FACULTY";receiverId:string;
 title:string;createdAt:Date;isPinned?:boolean;expiresAt?:Date;scheduledAt?:Date;
}){
 const id=randomUUID();ids.push(id);
 await pool.query(`insert into announcements
 (id,organization_id,college_id,receiver_type,receiver_id,title,message,
 sender_user_id,sender_type,created_at,is_pinned,expires_at,scheduled_at)
 values ($1::uuid,$2::uuid,$3::uuid,$4::text,$5::uuid,$6::text,$7::text,
 $8::uuid,'FACULTY',$9::timestamptz,$10::boolean,$11::timestamptz,$12::timestamptz)`,[
  id,SEED_IDS.organization,input.collegeId,input.receiverType,input.receiverId,
  input.title,"Authorized Faculty announcement fixture",SEED_IDS.facultyUser,
  input.createdAt,input.isPinned??false,input.expiresAt??null,input.scheduledAt??null,
 ]);
 return id;
}
describe("Faculty announcements membership and history are real PostgreSQL records",()=>{
 it("pages over 100 visible notices without cross-college, foreign-role, expired or scheduled leakage",async()=>{
  const now=new Date();
  const older=new Date(now.getTime()-120_000);
  for(let i=0;i<101;i++)await insertNotice({
   collegeId:SEED_IDS.collegeA,receiverType:"COLLEGE",receiverId:SEED_IDS.collegeA,
   title:marker+" a"+i,
   createdAt:new Date(older.getTime()-i*1000),
  });
  const facultyId=await insertNotice({
   collegeId:SEED_IDS.collegeA,receiverType:"FACULTY",
   receiverId:SEED_IDS.facultyCollegeAMembership,title:marker+" faculty A",
   createdAt:new Date(now.getTime()-60_000),isPinned:true,
  });
  const foreignCollege=await insertNotice({
   collegeId:SEED_IDS.collegeB,receiverType:"COLLEGE",receiverId:SEED_IDS.collegeB,
   title:marker+" college B",createdAt:new Date(now.getTime()-60_000),
  });
  const foreignFaculty=await insertNotice({
   collegeId:SEED_IDS.collegeB,receiverType:"FACULTY",
   receiverId:SEED_IDS.facultyCollegeBMembership,title:marker+" faculty B",
   createdAt:new Date(now.getTime()-60_000),
  });
  const expired=await insertNotice({
   collegeId:SEED_IDS.collegeA,receiverType:"COLLEGE",receiverId:SEED_IDS.collegeA,
   title:marker+" expired",createdAt:older,
   expiresAt:new Date(now.getTime()-60_000),
  });
  const scheduled=await insertNotice({
   collegeId:SEED_IDS.collegeA,receiverType:"COLLEGE",receiverId:SEED_IDS.collegeA,
   title:marker+" future",createdAt:older,
   scheduledAt:new Date(now.getTime()+3600_000),
  });
  const first=await listVisibleAnnouncementsForMembershipPage(faculty,now);
  expect(first.items).toHaveLength(100);
  expect(first.nextCursor).not.toBeNull();
  expect(first.items.some(row=>row.id===facultyId)).toBe(true);
  const second=await listVisibleAnnouncementsForMembershipPage(faculty,now,first.nextCursor!);
  const marked=[...first.items,...second.items].filter(row=>row.title.startsWith(marker));
  expect(marked).toHaveLength(102);
  expect(new Set(marked.map(row=>row.id)).size).toBe(102);
  for(const excluded of [foreignCollege,foreignFaculty,expired,scheduled])
   expect(marked.some(row=>row.id===excluded)).toBe(false);
  const other=await listVisibleAnnouncementsForMembershipPage(facultyB,now);
  expect(other.items.some(row=>row.id===foreignCollege)).toBe(true);
  expect(other.items.some(row=>row.id===foreignFaculty)).toBe(true);
  expect(other.items.some(row=>row.id===facultyId)).toBe(false);
  const disabled:RequestContext={...faculty,
   membership:{...faculty.membership!,status:"SUSPENDED"}};
  expect(await listVisibleAnnouncementsForMembershipPage(disabled,now)).toEqual({
   items:[],nextCursor:null,
  });
 });
});
