import {expect,it,vi} from "vitest";
import {createOutboundProvider,type OutboundProviderConfig} from "@/modules/messaging/providers";
import type {OutboundSendRequest} from "@/modules/messaging/model";
const cfg:OutboundProviderConfig={
 email:{apiUrl:"https://api.zeptomail.in/v1.1/email/template",token:"test",
  otpTemplateKey:"otp",fromAddress:"sender@example.com",fromName:"Sender"},
 sms:{apiKey:"",apiToken:"",accountSid:"fake",dltEntityId:"",
  otpSenderId:"",otpDltTemplateId:"",smsType:"transactional_opt_in"},
 templates:{campaign:{zeptoTemplateKey:"campaign"}},
};
it("fails closed at direct provider boundary for invalid payloads",async()=>{
 const fetcher=vi.fn(async()=>new Response("{}",{status:200}));
 const provider=createOutboundProvider(cfg,fetcher as typeof fetch,{APP_ENV:"production"});
 const bad={channel:"EMAIL",recipient:"a@example.com",purpose:"outreach",
  templateKey:"campaign",variables:{"bad.key":"unsafe"}};
 expect(await provider.send(bad as OutboundSendRequest)).toBe(false);
 expect(fetcher).not.toHaveBeenCalled();
});
