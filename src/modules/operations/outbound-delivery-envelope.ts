import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  hkdfSync,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import {
  OutboundDeliveryError,
  parseOutboundIntent,
  type OutboundDeliveryIntent,
} from "./outbound-delivery-contract";


/** Legacy assignment/quiz and interview reminder merge fields, converted to
 * IST with the original old-LMS keys. This is a pure producer-side mapper,
 * not a send action: it must enter a registered, permission-checked template
 * before any outbound transport is enabled. No plaintext is stored here.
 */
function reminderInstant(value: Date | string): Date {
  const result=value instanceof Date ? value : new Date(value);
  if(!Number.isFinite(result.getTime()))throw new OutboundDeliveryError("INVALID_OUTBOUND_INTENT");
  return result;
}
function indiaReminderParts(instant: Date | string) {
  const date=reminderInstant(instant);
  const format=new Intl.DateTimeFormat("en-GB",{
    timeZone:"Asia/Kolkata",year:"numeric",month:"short",day:"2-digit",
    hour:"2-digit",minute:"2-digit",hour12:true,
  });
  const entries=Object.fromEntries(format.formatToParts(date).map(part=>[part.type,part.value]));
  return {
    day:String(Number(entries.day)),
    paddedDay:entries.day??"",
    month:entries.month??"",
    year:entries.year??"",
    hour:String(Number(entries.hour)),
    paddedHour:entries.hour??"",
    minute:entries.minute??"",
    period:(entries.dayPeriod??"").toUpperCase(),
  };
}
export type AssignmentReminderTemplateInput={
  learnerName:string;
  assignmentName?:string|null;
  contentType?:"ASSIGNMENT"|"QUIZ"|string|null;
  dueAt?:Date|string|null;
  assignmentId:string;
  courseId?:string|null;
  courseSlug?:string|null;
  courseName?:string|null;
};
export function legacyAssignmentReminderVariables(input:AssignmentReminderTemplateInput){
  if(!input.assignmentId.trim())throw new OutboundDeliveryError("INVALID_OUTBOUND_INTENT");
  const at=input.dueAt?indiaReminderParts(input.dueAt):null;
  return {
    learnerName:input.learnerName.trim(),
    assignmentName:input.assignmentName?.trim()||"Assignment",
    contentType:input.contentType?.trim().toUpperCase()==="QUIZ"?"QUIZ":"ASSIGNMENT",
    contentLabel:input.contentType?.trim().toUpperCase()==="QUIZ"?"Quiz":"Assignment",
    ...(at?{dueDate:`${at.day} ${at.month} ${at.year}, ${at.hour}:${at.minute} ${at.period}`}:{}),
    assignmentId:input.assignmentId,
    ...(input.courseId?{courseId:input.courseId}:{}),
    ...(input.courseSlug?{courseSlug:input.courseSlug}:{}),
    ...(input.courseName?{courseName:input.courseName}:{}),
  };
}
/** The legacy interview notifications display the stage in title case with
 * a final "Round" suffix, not the internal enum value. */
export function legacyInterviewRoundLabel(raw:string|null|undefined):string {
 const value=(raw??"").trim();
 if(!value)return "Interview";
 const key=value.replace(/[ _-]+/g," ").replace(/\s+round$/i,"").trim().toUpperCase();
 const known:Record<string,string>={
  SCREENING:"Screening Round",TECHNICAL:"Technical Round",HR:"HR Round",
  MANAGERIAL:"Managerial Round",FINAL:"Final Round",
 };
 return known[key]??(/\s+round$/i.test(value)?value:value+" Round");
}
export type InterviewReminderTemplateInput={
  learnerName:string;jobTitle:string;companyName:string;
  applicationId:string;interviewId:string;
  appliedAt?:Date|string|null;
  scheduledAt?:Date|string|null;
  interviewMode?:string|null;
  interviewLocation?:string|null;
  roundName?:string|null;
  roundDescription?:string|null;
};
export function legacyInterviewReminderVariables(input:InterviewReminderTemplateInput){
  if(!input.applicationId.trim()||!input.interviewId.trim())
    throw new OutboundDeliveryError("INVALID_OUTBOUND_INTENT");
  const date=input.scheduledAt?indiaReminderParts(input.scheduledAt):null;
  const applied=input.appliedAt?indiaReminderParts(input.appliedAt):null;
  return {
    learnerName:input.learnerName.trim(),jobTitle:input.jobTitle,
    companyName:input.companyName,applicationId:input.applicationId,
    interviewId:input.interviewId,
    roundName:legacyInterviewRoundLabel(input.roundName),
    roundDescription:input.roundDescription?.trim()||"",
    ...(applied?{applicationDate:`${applied.paddedDay} ${applied.month} ${applied.year}`}:{}),
    ...(date?{
      interviewDate:`${date.paddedDay} ${date.month} ${date.year}`,
      interviewTime:`${date.paddedHour}:${date.minute} ${date.period}`,
    }:{}),
    ...(input.interviewMode?{interviewMode:input.interviewMode}:{}),
    ...(input.interviewLocation?{interviewLocation:input.interviewLocation}:{}),
  };
}

/**
 * v1 envelope intentionally contains NO plaintext recipient, invitation URL,
 * merge data, token or rendered message. DB rows and logs may store only this
 * structure (and delivery state), never the input intent.
 *
 * This is a storage envelope, NOT permission to send via an external provider.
 */
export type SealedOutboundDelivery = {
  id: string;
  schemaVersion: 1;
  keyId: "v1";
  organizationId: string;
  collegeId: string;
  sourceEventId: string;
  channel: OutboundDeliveryIntent["channel"];
  templateKey: OutboundDeliveryIntent["templateKey"];
  idempotencyKey: string;
  recipientHash: string;
  requestDigest: string;
  nonceBase64: string;
  ciphertextBase64: string;
  tagBase64: string;
  notBefore: string | null;
  expiresAt: string | null;
};

function keyMaterial(keyBase64: string) {
  if (!/^(?:[A-Za-z0-9+/]{4}){10}(?:[A-Za-z0-9+/]{3}=)$/.test(keyBase64)) {
    throw new OutboundDeliveryError("OUTBOUND_KEY_UNAVAILABLE");
  }
  const master = Buffer.from(keyBase64, "base64");
  if (master.length !== 32 || master.toString("base64") !== keyBase64) {
    throw new OutboundDeliveryError("OUTBOUND_KEY_UNAVAILABLE");
  }
  const cipherKey = Buffer.from(hkdfSync(
    "sha256", master, Buffer.alloc(0), "lms-outbound-encryption-v1", 32,
  ));
  const digestKey = Buffer.from(hkdfSync(
    "sha256", master, Buffer.alloc(0), "lms-outbound-digest-v1", 32,
  ));
  return { cipherKey, digestKey };
}

function digest(key: Buffer, label: string, payload: string) {
  return createHmac("sha256", key)
    .update(label + ":" + payload, "utf8")
    .digest("hex");
}

function binding(record: Pick<SealedOutboundDelivery,
  "id" | "organizationId" | "collegeId" | "sourceEventId" |
  "channel" | "templateKey" | "idempotencyKey" | "recipientHash" | "requestDigest"
>) {
  return Buffer.from(JSON.stringify([
    "lms-outbound-envelope-v1",
    record.id,
    record.organizationId,
    record.collegeId,
    record.sourceEventId,
    record.channel,
    record.templateKey,
    record.idempotencyKey,
    record.recipientHash,
    record.requestDigest,
  ]), "utf8");
}

/**
 * Seals everything containing recipient PII or a single-use link.
 * Deterministic HMAC keys distinguish an intentional retry from a new event;
 * do not derive them from email/contact IDs without the secret HMAC key.
 */
export function sealOutboundDelivery(
  rawIntent: unknown,
  keyBase64: string,
): SealedOutboundDelivery {
  const intent = parseOutboundIntent(rawIntent);
  const { cipherKey, digestKey } = keyMaterial(keyBase64);
  const plaintext = JSON.stringify(intent);
  const recipientHash = digest(digestKey, "recipient", JSON.stringify([
    intent.organizationId, intent.channel, intent.recipient,
  ]));
  const idempotencyKey = digest(digestKey, "idempotency", JSON.stringify([
    intent.organizationId, intent.sourceEventId,
    intent.channel, intent.templateKey, intent.recipient,
  ]));
  const requestDigest = digest(digestKey, "request", plaintext);
  const id = randomUUID();
  const nonce = randomBytes(12);
  const common = {
    id,
    schemaVersion: 1 as const,
    keyId: "v1" as const,
    organizationId: intent.organizationId,
    collegeId: intent.collegeId,
    sourceEventId: intent.sourceEventId,
    channel: intent.channel,
    templateKey: intent.templateKey,
    idempotencyKey,
    recipientHash,
    requestDigest,
    notBefore: intent.notBefore ?? null,
    expiresAt: intent.expiresAt ?? null,
  };
  const cipher = createCipheriv("aes-256-gcm", cipherKey, nonce);
  cipher.setAAD(binding(common));
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"), cipher.final(),
  ]);
  return {
    ...common,
    nonceBase64: nonce.toString("base64"),
    ciphertextBase64: ciphertext.toString("base64"),
    tagBase64: cipher.getAuthTag().toString("base64"),
  };
}

/**
 * Legacy email suppression is GLOBAL, not organization-scoped. The existing
 * recipientHash deliberately includes organizationId for tenant-local outbox
 * identity, so it MUST NOT be reused to look up a global email opt-out.
 *
 * Derive a second deterministic, secret-keyed, domain-separated HMAC only for
 * EMAIL; never store raw addresses or a plain SHA256 of an address. The HMAC
 * uses a separate stable key from outbound encryption so ordinary envelope
 * key rotation cannot silently forget prior opt-outs. The HMAC is deliberately
 * not added to the generic encrypted envelope/DB row.
 *
 * The final dispatcher must re-derive and recheck this immediately before
 * provider handoff; an unsubscribe can race with queued messages.
 */
export function deriveGlobalEmailSuppressionHash(
  rawIntent: unknown,
  globalEmailHmacKeyBase64: string,
): string | null {
  const intent = parseOutboundIntent(rawIntent);
  if (intent.channel !== "EMAIL") return null;
  // Separate key from ciphertext: opt-outs must remain stable when the
  // outbox AES encryption key rotates. Missing/malformed key fails closed.
  const { digestKey } = keyMaterial(globalEmailHmacKeyBase64);
  return digest(digestKey, "global-email-suppression-v1", intent.recipient);
}

/**
 * Bind the EMAIL-global opt-out HMAC to this exact outbound row without
 * persisting a reusable cross-organization recipient identifier.
 *
 * Unlike storing the global HMAC in every outbox row, this per-message SHA-256
 * commitment cannot correlate two organizations' outgoing messages without
 * already possessing the keyed recipient HMAC. The PostgreSQL pre-send guard
 * recomputes this from the supplied HMAC and the locked message UUID.
 */
export function bindGlobalEmailSuppressionHashToOutbox(
  messageId: string,
  globalEmailHash: string | null,
): string | null {
  if (globalEmailHash === null) return null;
  if (!/^[0-9a-f-]{36}$/.test(messageId) ||
      !/^[0-9a-f]{64}$/.test(globalEmailHash)) {
    throw new OutboundDeliveryError("OUTBOUND_ENVELOPE_INVALID");
  }
  return createHash("sha256")
    .update(`db10-global-email-binding-v1:${messageId}:${globalEmailHash}`, "utf8")
    .digest("hex");
}

/** Only a privileged background sender should ever decrypt this. */
export function openOutboundDelivery(
  sealed: SealedOutboundDelivery,
  keyBase64: string,
): OutboundDeliveryIntent {
  const { cipherKey, digestKey } = keyMaterial(keyBase64);
  try {
    if (sealed.schemaVersion !== 1 || sealed.keyId !== "v1" ||
        !/^[0-9a-f]{64}$/.test(sealed.requestDigest) ||
        !/^[0-9a-f]{64}$/.test(sealed.recipientHash) ||
        !/^[0-9a-f]{64}$/.test(sealed.idempotencyKey)) {
      throw new Error("invalid envelope");
    }
    const decipher = createDecipheriv(
      "aes-256-gcm",
      cipherKey,
      Buffer.from(sealed.nonceBase64, "base64"),
    );
    decipher.setAAD(binding(sealed));
    decipher.setAuthTag(Buffer.from(sealed.tagBase64, "base64"));
    const body = Buffer.concat([
      decipher.update(Buffer.from(sealed.ciphertextBase64, "base64")),
      decipher.final(),
    ]).toString("utf8");
    const intent = parseOutboundIntent(JSON.parse(body));
    const regenerated = digest(digestKey, "request", JSON.stringify(intent));
    if (!timingSafeEqual(
      Buffer.from(regenerated, "hex"),
      Buffer.from(sealed.requestDigest, "hex"),
    )) throw new Error("invalid digest");
    const recipientHash = digest(digestKey, "recipient", JSON.stringify([
      intent.organizationId, intent.channel, intent.recipient,
    ]));
    const idem = digest(digestKey, "idempotency", JSON.stringify([
      intent.organizationId, intent.sourceEventId,
      intent.channel, intent.templateKey, intent.recipient,
    ]));
    if (recipientHash !== sealed.recipientHash || idem !== sealed.idempotencyKey ||
        intent.collegeId !== sealed.collegeId ||
        intent.notBefore !== (sealed.notBefore ?? undefined) ||
        intent.expiresAt !== (sealed.expiresAt ?? undefined)) {
      throw new Error("invalid metadata");
    }
    return intent;
  } catch {
    // Crucially, never propagate decrypted invitation URL or provider text.
    throw new OutboundDeliveryError("OUTBOUND_ENVELOPE_INVALID");
  }
}
