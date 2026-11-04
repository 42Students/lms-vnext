import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const config=readFileSync(new URL("../.gitleaks.toml",import.meta.url),"utf8");
function section(id){
  const group=config.split("[[rules]]").find(x=>x.includes('id = "'+id+'"'));
  assert.ok(group, "Missing configured provider rule: "+id);
  assert.match(group,/secretGroup\s*=\s*1/);
  assert.match(group,/entropy\s*=\s*3(?:\.0)?/);
  const match=group.match(/^regex\s*=\s*'''([^\n]+)'''/m);
  assert.ok(match, "Missing single-line regex for "+id);
  // Gitleaks uses RE2 inline case flags; native JavaScript uses regex flags.
  return new RegExp(match[1].replace(/^\(\?i\)/,""),"i");
}
const synthetic=()=>Array.from({length:88},(_,i)=>"B7z+2fD4_xA9M/0P"[i%16]).join("");
const syntheticUrlSafe=()=>Array.from({length:88},(_,i)=>"B7z_2fD4-xA9M0PQ"[i%16]).join("");
const zepto=()=>["Zoho","-enczapikey ",""+synthetic()].join("");
const openai=(prefix)=>["sk",prefix,syntheticUrlSafe()].join("");

test("security scanner extends all pinned built-ins without any global suppression",()=>{
  assert.match(config,/useDefault\s*=\s*true/);
  assert.doesNotMatch(config,/^\s*\[\[?allowlists?\]?\]/m);
});

test("the exact historical ZeptoMail Authorization credential format is detected",()=>{
  const r=section("42learn-zeptomail-authorization");
  const source='private static final String DEFAULT_ZEPTOMAIL_TOKEN = "'+zepto()+'";';
  const m=r.exec(source);
  assert.ok(m,"Historical ZeptoMail auth format must never escape custom detection");
  assert.equal(m[1],synthetic());
  // Do not print a token value; this only uses a synthetic test sequence.
  assert.equal(r.test("Zoho-enczapikey "+"x".repeat(12)),false);
  assert.equal(r.test('DEFAULT_ZEPTOMAIL_TOKEN="placeholder"'),false);
});

test("ZeptoMail Authorization header works outside Java source",()=>{
  const r=section("42learn-zeptomail-authorization");
  assert.ok(r.test("Authorization: "+zepto()));
  assert.ok(r.test("TOKEN="+zepto()));
});

test("OpenAI key variants are detected without requiring a variable name",()=>{
  const r=section("42learn-openai-key");
  for(const suffix of ["-proj-","-svcacct-","-admin-","-"]){
    assert.ok(r.test("credential="+openai(suffix)),"Missed OpenAI variant: "+suffix);
  }
  assert.equal(r.test("sk-proj-example"),false);
});

test("Google OAuth client-secret tokens are not confused with public Firebase key names",()=>{
  const r=section("42learn-google-oauth-client-secret");
  const fake=["GOCSPX","-",syntheticUrlSafe()].join("");
  assert.ok(r.test("client_secret = "+fake));
  assert.equal(r.test('NEXT_PUBLIC_FIREBASE_API_KEY="not-a-secret"'),false);
  assert.equal(r.test("GOCSPX-short"),false);
});

test("provider keys do not rely on only naming a variable or SDK call",()=>{
  assert.ok(section("42learn-zeptomail-authorization").test(
    "some_log_line="+zepto()));
  assert.ok(section("42learn-openai-key").test(
    "some_log_line="+openai("-proj-")));
  assert.ok(section("42learn-google-oauth-client-secret").test(
    "some_log_line="+["GOCSPX","-",syntheticUrlSafe()].join("")));
});
