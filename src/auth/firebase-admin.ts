import "server-only";

import {
  applicationDefault,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let app: App | undefined;

function getAdminApp() {
  if (app) return app;

  app =
    getApps()[0] ??
    initializeApp({
      credential: applicationDefault(),
    });

  return app;
}

export function getIdentityAdminAuth() {
  return getAuth(getAdminApp());
}
