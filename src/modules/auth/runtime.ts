import "server-only";

import { randomUUID } from "node:crypto";
import { createExotelSmsProvider } from "@/modules/notifications/exotel-sms";
import { createZeptoMailEmailProvider } from "@/modules/notifications/zeptomail-email";
import { getAuthConfig } from "./config";
import { drizzleLoginRepository } from "./login-repository";
import {
  sendEmailFallback,
  startLogin,
  verifyLogin,
  type LoginDependencies,
} from "./login-service";

/** Production wiring: real Exotel + ZeptoMail, Postgres, system clock. */
function dependencies(): LoginDependencies {
  return {
    repository: drizzleLoginRepository,
    sms: createExotelSmsProvider(),
    email: createZeptoMailEmailProvider(),
    config: getAuthConfig(),
    newId: () => randomUUID(),
    now: () => new Date(),
  };
}

export function startLoginWithRuntime(
  input: Parameters<typeof startLogin>[0],
) {
  return startLogin(input, dependencies());
}

export function sendEmailFallbackWithRuntime(
  input: Parameters<typeof sendEmailFallback>[0],
) {
  return sendEmailFallback(input, dependencies());
}

export function verifyLoginWithRuntime(
  input: Parameters<typeof verifyLogin>[0],
) {
  return verifyLogin(input, dependencies());
}
