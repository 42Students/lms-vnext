import { expect, it } from "vitest";
import { canContactRecipientAtRuntime } from "@/modules/messaging/runtime-safety";
import { createOutboundProvider } from "@/modules/messaging/providers";
import { readExotelConfig } from "@/modules/notifications/exotel-sms";
import { readZeptoMailConfig } from "@/modules/notifications/zeptomail-email";

it("denies a non-test address without provider calls even when credentials exist", async () => {
  let networkCalls = 0;
  const provider = createOutboundProvider({
    email: readZeptoMailConfig({ ZEPTOMAIL_TOKEN: "test-key" }),
    sms: readExotelConfig(),
    templates: { campaign: { zeptoTemplateKey: "registered-campaign" } },
  }, (async () => { networkCalls++; return new Response(null, {status:200}); }) as typeof fetch,
    { APP_ENV:"development", AUTH_TEST_EMAILS:"allowed@example.com", AUTH_TEST_PHONES:"+919999999999" });
  expect(await provider.send({channel:"EMAIL",recipient:"real@example.com",templateKey:"campaign",variables:{},purpose:"campaign"})).toBe(false);
  expect(networkCalls).toBe(0);
  expect(await provider.send({channel:"EMAIL",recipient:"allowed@example.com",templateKey:"campaign",variables:{},purpose:"campaign"})).toBe(true);
  expect(networkCalls).toBe(1);
});
it("denies when APP_ENV is absent or unrecognized and the recipient is unlisted", () => {
  expect(canContactRecipientAtRuntime("EMAIL","real@example.com",{APP_ENV:"staging"})).toBe(false);
  expect(canContactRecipientAtRuntime("SMS","+919888888888",{})).toBe(false);
  expect(canContactRecipientAtRuntime("EMAIL","ALLOWED@example.com",{APP_ENV:"test",AUTH_TEST_EMAILS:"allowed@example.com"})).toBe(true);
});
