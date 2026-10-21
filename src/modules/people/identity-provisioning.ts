import {
  resolveOrCreateIdentity,
  type IdentityDirectory,
} from "./identity";
import {
  identityProvisionInputSchema,
} from "./validation";
import type { UserPlatformStatus } from "@/modules/identity/constants";

export type PersistResolvedIdentityInput = {
  identityUid: string;
  phoneE164?: string;
  email?: string;
  displayName: string;
};

export type ProvisionedPlatformIdentity = {
  userId: string;
  identityUid: string;
  existed: boolean;
  platformStatus: UserPlatformStatus;
};

export interface IdentityProvisioningRepository {
  persistResolvedIdentity(
    input: PersistResolvedIdentityInput,
  ): Promise<ProvisionedPlatformIdentity>;
}

export type IdentityProvisioningDependencies = {
  identityDirectory: IdentityDirectory;
  repository: IdentityProvisioningRepository;
};

/**
 * Resolve/create the external identity first, then persist exactly one
 * canonical platform user. Firebase and PostgreSQL cannot share one ACID
 * transaction, so both layers independently enforce contact uniqueness and
 * retry-safe collision detection. A disabled platform user is returned as
 * DISABLED; provisioning never reactivates an account.
 */
export async function provisionPlatformIdentity(
  rawInput: unknown,
  dependencies: IdentityProvisioningDependencies,
) {
  // Legacy UserDto required a username/password pair. Central vNext auth
  // intentionally retires local passwords: external identity UID and verified
  // OTP/email sign-in replace them. Enforce the legacy 255-char email limit
  // without converting an unverified profile into an authenticated session.
  const input=identityProvisionInputSchema.superRefine((value,ctx)=>{
    if(value.email&&value.email.length>255)
      ctx.addIssue({code:"custom",path:["email"],message:"Email must be 255 characters or less"});
    if(value.phoneE164&&value.phoneE164.length>20)
      ctx.addIssue({code:"custom",path:["phoneE164"],message:"Phone must be 20 characters or less"});
    if(value.displayName.length>255)
      ctx.addIssue({code:"custom",path:["displayName"],message:"Name must be 255 characters or less"});
  }).parse(rawInput);
  const identity = await resolveOrCreateIdentity(
    {
      phoneE164: input.phoneE164,
      email: input.email,
      displayName: input.displayName,
    },
    dependencies.identityDirectory,
  );

  // OTP delivery, session revocation and selected-college authorization are
  // enforced by their separate runtime services, not by provisioning. A
  // canonical identity alone must never grant an active college session.
  const persisted=await dependencies.repository.persistResolvedIdentity({
    identityUid: identity.uid,
    phoneE164:
      identity.phoneNumber ??
      input.phoneE164 ??
      undefined,
    email:
      identity.email ??
      input.email ??
      undefined,
    displayName: input.displayName,
  });
  // Persisting a user neither sends an invitation nor establishes that the
  // learner may sign in; the college grant and OTP provider decide separately.
  return {...persisted,notificationSent:false,signInAccess:"NOT_VERIFIED" as const};
}
