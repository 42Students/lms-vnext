import {describe,expect,it} from "vitest";
import {isRecruiterUnreadReminderDue,RECRUITER_MAIL_FIRST_UNREAD_MS,
 RECRUITER_MAIL_QUIET_MS,RECRUITER_MAIL_MAX_WAIT_MS,
 RECRUITER_MAIL_COOLDOWN_MS,safeRecruiterDigestMessages}
 from "@/modules/placements/recruiter-message-email-model";
const epoch=Date.parse("2099-03-20T00:00:00Z");
const clock=(minutes:number)=>new Date(epoch+minutes*60_000);
const timing=(first:number,last:number,now:number,sent?:number)=>
 isRecruiterUnreadReminderDue({firstUnreadAt:clock(first),lastMessageAt:clock(last),
 now:clock(now),lastSentAt:sent===undefined?null:clock(sent)});
const cases=[
 {name:"before first 15 minutes",first:0,last:0,now:14,expected:false},
 {name:"exact 15-minute cutoff after quiet",first:0,last:0,now:15,expected:true},
 {name:"15 minutes with only one minute quiet",first:0,last:14,now:15,expected:false},
 {name:"two minutes quiet after 15",first:0,last:14,now:16,expected:true},
 {name:"14-minute first wait even after quiet",first:0,last:1,now:14,expected:false},
 {name:"perpetual activity before 45-minute cap",first:0,last:43.5,now:44,expected:false},
 {name:"45-minute cap despite newest message",first:0,last:44.9,now:45,expected:true},
 {name:"15-minute first wait with last at 14.9",first:0,last:14.9,now:15,expected:false},
 {name:"long quiet after delayed initial message",first:4,last:8,now:19,expected:true},
 {name:"newest message in future",first:0,last:20,now:19,expected:false},
 {name:"first unread later than newest",first:20,last:19,now:50,expected:false},
 {name:"first unread in future",first:30,last:30,now:15,expected:false},
 {name:"first unread not old enough after a later day",first:1000,last:1000,now:1010,expected:false},
 {name:"unread long enough even next day",first:0,last:1430,now:1440,expected:true},
 {name:"cooldown 359 minutes after prior send",first:0,last:14,now:379,sent:20,expected:false},
 {name:"cooldown exactly 360 minutes after prior send",first:0,last:14,now:380,sent:20,expected:true},
 {name:"cooldown while previous send timestamp is future",first:0,last:14,now:380,sent:999,expected:false},
 {name:"cooldown takes precedence over 45-minute cap",first:0,last:44,now:45,sent:30,expected:false},
 {name:"no cooldown for never-sent thread",first:0,last:14,now:16,expected:true},
 {name:"quiet period for new activity at minute 200",first:0,last:200,now:200.1,expected:true},
] as const;
describe("REC-calendar-messages-profile-R01 unread mail deterministic boundaries",()=>{
 it("REC-calendar-messages-profile-R01 preserves named legacy durations",()=>{
  expect(RECRUITER_MAIL_FIRST_UNREAD_MS).toBe(15*60_000);
  expect(RECRUITER_MAIL_QUIET_MS).toBe(2*60_000);
  expect(RECRUITER_MAIL_MAX_WAIT_MS).toBe(45*60_000);
  expect(RECRUITER_MAIL_COOLDOWN_MS).toBe(6*60*60_000);
 });
 it.each(cases)("REC-calendar-messages-profile-R01 $name",c=>{
  expect(timing(c.first,c.last,c.now,"sent" in c?c.sent:undefined)).toBe(c.expected);
 });
 it("REC-calendar-messages-profile-R01 invalid timestamps never authorize dispatch",()=>{
  expect(isRecruiterUnreadReminderDue({firstUnreadAt:new Date(Number.NaN),
   lastMessageAt:clock(0),lastSentAt:null,now:clock(16)})).toBe(false);
  expect(isRecruiterUnreadReminderDue({firstUnreadAt:clock(0),
   lastMessageAt:new Date(Number.NaN),lastSentAt:null,now:clock(16)})).toBe(false);
  expect(isRecruiterUnreadReminderDue({firstUnreadAt:clock(0),
   lastMessageAt:clock(0),lastSentAt:new Date(Number.NaN),now:clock(16)})).toBe(false);
 });
 it("REC-calendar-messages-profile-R01 exposes only newest three excerpts",()=>{
  expect(safeRecruiterDigestMessages(["first","second","third","fourth"].map(body=>({body}))))
   .toEqual(["second","third","fourth"]);
 });
 it("REC-calendar-messages-profile-R01 escapes quoted HTML in latest excerpt",()=>{
  expect(safeRecruiterDigestMessages([{body:"<script>bad & worse</script>"}]))
   .toEqual(["&lt;script&gt;bad &amp; worse&lt;/script&gt;"]);
 });
 it("REC-calendar-messages-profile-R01 handles empty digest without undefined variables",()=>{
  expect(safeRecruiterDigestMessages([])).toEqual([]);
 });
});
