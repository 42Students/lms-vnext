import {afterEach,describe,expect,it,vi} from "vitest";
import {limitTelegramAlert,sanitizeTelegramLine,sendTelegramAlert} from "@/modules/log-alerts/telegram-notifier";

const old={token:process.env.TELEGRAM_ALERT_BOT_TOKEN,chat:process.env.TELEGRAM_ALERT_CHAT_ID,env:process.env.APP_ENV};
afterEach(()=>{
  for(const [key,value] of [
    ["TELEGRAM_ALERT_BOT_TOKEN",old.token],
    ["TELEGRAM_ALERT_CHAT_ID",old.chat],
    ["APP_ENV",old.env],
  ] as const){if(value===undefined)delete process.env[key];else process.env[key]=value;}
  vi.restoreAllMocks();
});
describe("chat-16 SA-placements-projects-116 GR-111 graceful Telegram delivery",()=>{
  it.each([
    ["Request ID: af02b19c"],
    ["Time: 2099-01-01T01:02:03.000Z"],
    ["vNext daily error digest (2099-10-17, IST)"],
    ["Deploy: aabbccddee"],
    ["abcdef123456: 90 occurrences"],
  ])("SA-placements-projects-116 retains generated diagnostic metadata %s",(line)=>{
    expect(sanitizeTelegramLine(line)).toBe(line);
  });
  it.each([
    ["Error alice@example.com","alice@example.com"],
    ["Failure +91 9876543210","9876543210"],
    ["Error postgres://root:secret@db.internal/main","postgres://"],
    ["Error https://some-host.example/private?token=abc","https://"],
    ["password=veryPrivate123","veryPrivate123"],
    ["Crash\n at private/internal/stack","private/internal/stack"],
  ])("SA-placements-projects-116 sanitizes untrusted Telegram text %s",(line,secret)=>{
    expect(sanitizeTelegramLine(line)).not.toContain(secret);
  });
  it("SA-placements-projects-116 clips by Unicode characters, not UTF-16 code units",()=>{
    expect(Array.from(limitTelegramAlert("🙂".repeat(4000)))).toHaveLength(3500);
    expect(limitTelegramAlert("A".repeat(3500))).toHaveLength(3500);
    expect(limitTelegramAlert("A".repeat(3501)).endsWith("...")).toBe(true);
  });
  it("SA-placements-projects-116 does not call an endpoint without credentials",async()=>{
    delete process.env.TELEGRAM_ALERT_BOT_TOKEN;
    delete process.env.TELEGRAM_ALERT_CHAT_ID;
    const transport=vi.fn();
    expect(await sendTelegramAlert("an error",{transport})).toBe(false);
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([
    {status:401,payload:'{"ok":false}'},
    {status:500,payload:'{"ok":false}'},
    {status:200,payload:'{"ok":false}'},
    {status:200,payload:"not valid json"},
  ])("SA-placements-projects-116 fails closed on provider HTTP $status",async({status,payload})=>{
    process.env.TELEGRAM_ALERT_BOT_TOKEN="fixture-do-not-log";
    process.env.TELEGRAM_ALERT_CHAT_ID="fixture-chat";
    const transport=vi.fn(async()=>new Response(payload,{status}));
    expect(await sendTelegramAlert("Failure",{transport:transport as unknown as typeof fetch})).toBe(false);
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it("SA-placements-projects-116 hides transport exception contents",async()=>{
    process.env.TELEGRAM_ALERT_BOT_TOKEN="fixture-do-not-log";
    process.env.TELEGRAM_ALERT_CHAT_ID="fixture-chat";
    const stderr=vi.spyOn(process.stderr,"write").mockImplementation(()=>true);
    const ok=await sendTelegramAlert("a failure",{
      transport:(async()=>{throw new Error("secret fixture-do-not-log in provider URL");}) as typeof fetch,
    });
    expect(ok).toBe(false);
    expect(stderr.mock.calls.flat().join(" ")).not.toContain("fixture-do-not-log");
  });
});
