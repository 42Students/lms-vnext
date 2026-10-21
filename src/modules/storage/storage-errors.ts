export class PrivateObjectStorageError extends Error {
  constructor(
    public readonly code:
      | "PRIVATE_STORAGE_INVALID_SCOPE"
      | "PRIVATE_STORAGE_INVALID_NAMESPACE"
      | "PRIVATE_STORAGE_INVALID_MIME"
      | "PRIVATE_STORAGE_INVALID_SIZE"
      | "PRIVATE_STORAGE_BUCKET_UNSAFE"
      | "PRIVATE_STORAGE_NOT_CONFIGURED"
      | "PRIVATE_STORAGE_OBJECT_NOT_ATTESTED"
      | "PRIVATE_STORAGE_PROVIDER_UNAVAILABLE",
  ) {
    super(code);
    this.name = "PrivateObjectStorageError";
  }
}
