import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 AuthRequestBodyTooLarge,MAX_AUTH_JSON_BYTES,readBoundedAuthJson,
} from "@/modules/auth/bounded-json";

function post(body:string,headers?:HeadersInit){
 return new Request("https://campus.test/api/auth/login/start",{
  method:"POST",headers:{"content-type":"application/json",...headers},body,
 });
}
describe("AUTH-OTP-19 bounded unauthenticated sign-in payload",()=>{
 it("accepts exact 8192 bytes, not an arbitrary character count",async()=>{
  const payload="{}"+" ".repeat(MAX_AUTH_JSON_BYTES-2);
  await expect(readBoundedAuthJson(post(payload))).resolves.toEqual({});
 });
 it("rejects 8193 bytes even when the client omits Content-Length",async()=>{
  const payload="{}"+" ".repeat(MAX_AUTH_JSON_BYTES-1);
  await expect(readBoundedAuthJson(post(payload))).rejects.toBeInstanceOf(AuthRequestBodyTooLarge);
 });
 it("counts UTF-8 octets, not JS characters, including 4-byte codepoints",async()=>{
  const payload=JSON.stringify({code:"💡".repeat(2100)});
  expect(payload.length).toBeLessThan(MAX_AUTH_JSON_BYTES);
  await expect(readBoundedAuthJson(post(payload))).rejects.toBeInstanceOf(AuthRequestBodyTooLarge);
 });
 it("rejects huge Content-Length before reading a small claimed JSON body",async()=>{
  const request=post("{}",{"content-length":"90000"});
  await expect(readBoundedAuthJson(request)).rejects.toBeInstanceOf(AuthRequestBodyTooLarge);
 });
 it("rejects empty and malformed JSON without promoting either to a valid challenge",async()=>{
  await expect(readBoundedAuthJson(post("{"))).rejects.toThrow();
  const empty=new Request("https://campus.test/api/auth/login/verify",{method:"POST"});
  await expect(readBoundedAuthJson(empty)).rejects.toThrow();
 });
 it("maps oversized input to a private 413 before any tenant resolution or OTP work",()=>{
  const code=readFileSync("src/modules/auth/http.ts","utf8");
  expect(code).toContain("await readBoundedAuthJson(request)");
  expect(code).toContain("error instanceof AuthRequestBodyTooLarge");
  expect(code).toContain('tooLarge?"REQUEST_TOO_LARGE":"INVALID_REQUEST"');
  expect(code).toContain("tooLarge?413:400");
  expect(code.indexOf("await readBoundedAuthJson(request)")).toBeLessThan(
    code.indexOf('await resolveRequestTenant(request.headers.get("host"))')
  );
 });
});
