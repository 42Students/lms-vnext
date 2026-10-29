import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
import {test} from "node:test";

const source=readFileSync(new URL(
  "../src/modules/projects/mentor-meeting-reschedule-service.ts",import.meta.url,
),"utf8");

function guardsWriteTime(body){
 const tx=body.indexOf("return getDb().transaction(async tx=>");
 const projectLock=body.indexOf('.for("update").limit(1)',tx);
 const meetingLock=body.indexOf('.for("update").limit(1)',projectLock+1);
 const status=body.indexOf("mentorMeetingCanReschedule(meeting.status,project.status)",tx);
 const clock=body.indexOf("if(start.getTime()<=Date.now())",status);
 const write=body.indexOf("await tx.update(projectMeetings)",tx);
 const event=body.indexOf("await recordActivityEventInTransaction(",tx);
 return tx>=0&&projectLock>tx&&meetingLock>projectLock&&status>meetingLock&&
   clock>status&&clock<write&&event>write;
}

test("mentor reschedule rechecks future window after row locks and before any write",()=>{
 assert(guardsWriteTime(source));
 assert.equal((source.match(/if\(start\.getTime\(\)<=Date\.now\(\)\)/g)??[]).length,2);
});

test("detects deletion of write-time check even when preflight remains",()=>{
 const last=source.lastIndexOf("if(start.getTime()<=Date.now())");
 assert(last>0);
 assert.equal(guardsWriteTime(source.slice(0,last)+source.slice(last+"if(start.getTime()<=Date.now())".length)),false);
});

test("detects moving the write-time clock check back before the transaction",()=>{
 const last=source.lastIndexOf("if(start.getTime()<=Date.now())");
 const mutant=source.slice(0,last)+source.slice(last+"if(start.getTime()<=Date.now())".length);
 assert.equal(guardsWriteTime(mutant),false);
});
