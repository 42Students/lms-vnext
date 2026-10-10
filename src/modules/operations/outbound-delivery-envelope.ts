import {
  createCipheriv,
  createDecipheriv,
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
