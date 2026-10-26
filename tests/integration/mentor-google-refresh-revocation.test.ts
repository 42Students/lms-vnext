import {randomBytes,randomUUID} from "node:crypto";
import {afterAll,describe,expect,it,vi} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";

const fake=vi.hoisted(()=>({refresh:vi.fn()}));
vi.mock("@/modules/projects/mentor-google-calendar-provider",async importOriginal=>({
 ...await importOriginal<typeof import(
  "@/modules/projects/mentor-google-calendar-provider")>(),
 mentorGoogleRefreshToken:fake.refresh,
}));
import {saveMentorGoogleConnection,getMentorGoogleAccessToken} from
 "@/modules/projects/mentor-google-calendar-connection-service";

if(!process.env.TEST_DATABASE_URL)
 throw new Error("Mentor OAuth revocation tests require disposable TEST_DATABASE_URL");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});

describe("Mentor Google access token revocation after external I/O",()=>{
 it("rejects a refreshed token when a persisted Mentor role was revoked during OAuth refresh",async()=>{
  const names=[
   "MENTOR_GOOGLE_TOKEN_ENCRYPTION_KEY","MENTOR_GOOGLE_CLIENT_ID",
   "MENTOR_GOOGLE_CLIENT_SECRET","MENTOR_GOOGLE_REDIRECT_URI",
  ] as const;
  const previous=names.map(name=>process.env[name]);
  process.env["MENTOR_GOOGLE_TOKEN_ENCRYPTION_KEY"]=
   randomBytes(32).toString("base64url");
  process.env["MENTOR_GOOGLE_CLIENT_ID"]="mentor-acceptance-oauth-client";
  process.env["MENTOR_GOOGLE_CLIENT_SECRET"]="mentor-acceptance-oauth-secret";
  process.env["MENTOR_GOOGLE_REDIRECT_URI"]=
   "https://lms.example/api/mentor/calendar/google/callback";
  const userId=randomUUID(),membershipId=randomUUID(),roleId=randomUUID();
  const actor:RequestContext={
   user:{id:userId,identityUid:"mentor-google-revoke-"+userId,
    platformStatus:"ACTIVE",systemRoles:[]},
   membership:{id:membershipId,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["MENTOR"]},
  };
  try{
   await pool.query(`insert into users
     (id,identity_uid,display_name,platform_status)
     values ($1,$2,'Temporary OAuth Mentor','ACTIVE')`,[
      userId,actor.user.identityUid,
   ]);
   await pool.query(`insert into college_memberships
     (id,user_id,college_id,status) values ($1,$2,$3,'ACTIVE')`,[
      membershipId,userId,SEED_IDS.collegeA,
   ]);
   await pool.query(`insert into membership_roles
     (id,membership_id,role) values ($1,$2,'MENTOR')`,[
      roleId,membershipId,
   ]);
   await saveMentorGoogleConnection(actor,"mock-refresh-token");
   let releaseRefresh!: (result:{
    accessToken:string;refreshToken:null;expiresIn:number;
   })=>void;
   const providerBlocked=new Promise<{
    accessToken:string;refreshToken:null;expiresIn:number;
   }>(resolve=>{releaseRefresh=resolve;});
   fake.refresh.mockReturnValueOnce(providerBlocked);
   const pending=getMentorGoogleAccessToken(actor);
   // Register rejection handling before unblocking the provider promise.
   const rejected=expect(pending).rejects
    .toMatchObject({code:"PROJECT_ACCESS_DENIED"});
   await vi.waitFor(()=>expect(fake.refresh).toHaveBeenCalledTimes(1));
   // The browser still holds the old membership/role cookie, but PostgreSQL
   // no longer grants this user any Mentor authority.
   await pool.query("delete from membership_roles where id=$1",[roleId]);
   releaseRefresh({accessToken:"must-never-escape",refreshToken:null,expiresIn:3600});
   await rejected;
  }finally{
   fake.refresh.mockReset();
   await pool.query(`delete from mentor_google_calendar_connections
     where user_id=$1 and college_id=$2`,[userId,SEED_IDS.collegeA]);
   await pool.query("delete from membership_roles where membership_id=$1",[membershipId]);
   await pool.query("delete from college_memberships where id=$1",[membershipId]);
   await pool.query("delete from users where id=$1",[userId]);
   names.forEach((name,index)=>{
    const value=previous[index];
    if(value===undefined)delete process.env[name];
    else process.env[name]=value;
   });
  }
 });
});
