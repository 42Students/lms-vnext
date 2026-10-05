import "server-only";

import {
  applicationDefault,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { getServerEnv } from "@/lib/env";

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


export function getAdminStorageBucket() {
  const bucketName = getServerEnv().GCS_BUCKET;
  if (!bucketName) {
    throw new Error(
      "GCS_BUCKET is required for storage-backed course content",
    );
  }

  return getStorage(getAdminApp()).bucket(
    bucketName,
  );
}
