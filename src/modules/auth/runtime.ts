import "server-only";

import { randomUUID } from "node:crypto";
import { createExotelSmsProvider } from "@/modules/notifications/exotel-sms";
import { createZeptoMailEmailProvider } from "@/modules/notifications/zeptomail-email";
import { getAuthConfig } from "./config";
import {effectiveCollegeSignInCapabilities} from "@/modules/colleges/public-signin-policy-service";
import {LoginError} from "./login-service";
import { drizzleLoginRepository } from "./login-repository";
import {
  sendEmailFallback,
  startLogin,
  verifyLogin,
  type LoginDependencies,
} from "./login-service";

/** Production wiring: real Exotel + ZeptoMail, Postgres, system clock.
 * Live transport is disabled in development unless explicitly verified.
 * Provider acceptance never means handset/inbox delivery; webhook status is
 * tracked by notification adapters without exposing recipients or OTPs. */
function dependencies(): LoginDependencies {
  const config=getAuthConfig();
  // Development fixtures never hit live DLT or ZeptoMail by accident.
  const liveTransport=config.appEnv==="production" || process.env.AUTH_DEV_REAL_DELIVERY==="VERIFIED";
  return {
    repository: drizzleLoginRepository,
    sms:liveTransport?createExotelSmsProvider():{sendOtp:async()=>false},
    email:liveTransport?createZeptoMailEmailProvider():{sendOtpEmail:async()=>false},
    config,
    newId: () => randomUUID(),
    now: () => new Date(),
  };
}

export async function startLoginWithRuntime(
  input: Parameters<typeof startLogin>[0],
) {
  const channels=await effectiveCollegeSignInCapabilities(input.tenantCollegeId);
  if(input.channel==="EMAIL"&&!channels.email || input.channel==="PHONE"&&!channels.phone)
   throw new LoginError("CHANNEL_DISABLED");
  return startLogin(input, dependencies());
}

export async function sendEmailFallbackWithRuntime(
  input: Parameters<typeof sendEmailFallback>[0],
) {
  if(!(await effectiveCollegeSignInCapabilities(input.tenantCollegeId)).email)
   throw new LoginError("CHANNEL_DISABLED");
  return sendEmailFallback(input, dependencies());
}

export function verifyLoginWithRuntime(
  input: Parameters<typeof verifyLogin>[0],
) {
  return verifyLogin(input, dependencies());
}
