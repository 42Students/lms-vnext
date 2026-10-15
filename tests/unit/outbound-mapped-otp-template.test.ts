import {expect,it,vi} from "vitest";
import {createOutboundProvider,type OutboundProviderConfig} from "@/modules/messaging/providers";
const config:OutboundProviderConfig={
 email:{apiUrl:"https://api.zeptomail.in/v1.1/email/template",token:"dummy",
  otpTemplateKey:"registered-login",fromAddress:"test@example.com",fromName:"Test"},
 sms:{apiKey:"",apiToken:"",accountSid:"test",dltEntityId:"",
  otpSenderId:"",otpDltTemplateId:"",smsType:"transactional_opt_in"},
 templates:{notice:{zeptoTemplateKey:"registered-login"}},
};
it("never sends an authentication ZeptoMail template through a campaign alias",async()=>{
 const fetcher=vi.fn(async()=>new Response("{}",{status:200}));
 const provider=createOutboundProvider(config,fetcher as typeof fetch,{APP_ENV:"production"});
 const accepted=await provider.send({
  channel:"EMAIL",recipient:"test@example.com",templateKey:"notice",purpose:"invite",variables:{},
 });
 expect(accepted).toBe(false);
 expect(fetcher).not.toHaveBeenCalled();
});
