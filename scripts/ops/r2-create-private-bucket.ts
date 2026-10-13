import { signedFetch } from "../../src/modules/storage/s3-client";

// One-off: create a PRIVATE bucket (no public access is ever enabled on it).
async function main() {
  const bucketName = process.argv[2];
  if (!bucketName) throw new Error("usage: r2-create-private-bucket.ts <name>");
  const response = await signedFetch(
    {
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      bucket: "",
      accessKeyId: process.env.R2_ACCESS_KEY!,
      secretAccessKey: process.env.R2_SECRET_KEY!,
    },
    { method: "PUT", path: `/${bucketName}` },
  );
  const text = await response.text();
  console.log(response.status, text.replace(/<[^>]+>/g, " ").slice(0, 200));
}
void main();
