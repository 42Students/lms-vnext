import {describe,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
import {encryptMentorGoogleRefreshToken,decryptMentorGoogleRefreshToken} from
 "@/modules/projects/mentor-google-calendar-connection-service";
const env={MENTOR_GOOGLE_TOKEN_ENCRYPTION_KEY:Buffer.alloc(32,7).toString("base64url")};
const user="11111111-1111-4111-8111-111111111111",
 college="22222222-2222-4222-8222-222222222222";
describe("Mentor Google Calendar token storage",()=>{
 it("round trips authenticated encryption with a unique nonce and correct AAD",()=>{
  const first=encryptMentorGoogleRefreshToken("refresh-token",user,college,env);
  const second=encryptMentorGoogleRefreshToken("refresh-token",user,college,env);
  expect(first).not.toBe(second);
  expect(first.startsWith("v1.")).toBe(true);
  expect(first.includes("refresh-token")).toBe(false);
  expect(decryptMentorGoogleRefreshToken(first,user,college,env))
   .toBe("refresh-token");
  expect(()=>decryptMentorGoogleRefreshToken(first,user,
    "33333333-3333-4333-8333-333333333333",env))
   .toThrow("GOOGLE_CALENDAR_CREDENTIAL_INVALID");
  expect(()=>decryptMentorGoogleRefreshToken(first,
    "44444444-4444-4444-8444-444444444444",college,env))
   .toThrow("GOOGLE_CALENDAR_CREDENTIAL_INVALID");
 });
 it("rejects missing keys, malformed grants and tampered GCM data",()=>{
  expect(()=>encryptMentorGoogleRefreshToken("secret",user,college,{}))
   .toThrow("GOOGLE_CALENDAR_KEY_UNAVAILABLE");
  expect(()=>encryptMentorGoogleRefreshToken("",user,college,env))
   .toThrow("GOOGLE_CALENDAR_REFRESH_INVALID");
  expect(()=>decryptMentorGoogleRefreshToken("v1.invalid",user,college,env))
   .toThrow("GOOGLE_CALENDAR_CREDENTIAL_INVALID");
  const payload=encryptMentorGoogleRefreshToken("refresh",user,college,env);
  const parts=payload.split(".");
  const cipher=parts[2]??"";
  parts[2]=(cipher[0]==="a"?"b":"a")+cipher.slice(1);
  expect(()=>decryptMentorGoogleRefreshToken(parts.join("."),user,college,env))
   .toThrow("GOOGLE_CALENDAR_CREDENTIAL_INVALID");
 });
});
