# Private object storage contract

**Owner:** W01 / issue #21. **Consumers:** DB04 profile verification, W02 assignment/course files, W03 project resources.

The platform exposes one server-only GCS contract in `src/modules/storage/private-object-storage.ts`.

- Keys are opaque and always `private/<college UUID>/<membership UUID>/<namespace>/<object UUID>`; clients never choose paths.
- Signed PUT grants last 1–15 minutes and bind content type, tenant/member scope, expected size, a random upload token and PENDING scan metadata.
- The bucket must use Uniform Bucket-Level Access and enforced Public Access Prevention before signing or attestation.
- Feature APIs persist only the SHA-256 **hash** of the upload token, never the raw token.
- A privileged scanner must attest `malware_scan_status=CLEAN`, `scan_attested_by=lms-vnext-privileged-scanner`, and `sha256`.
- `readPrivateObjectAttestation` fails closed unless tenant/member scope, generation, size, MIME, scanner attestation, SHA-256 and optional token hash agree.

Feature owners still own role checks, receipt persistence and download authorization. Signed URL and scanner integration remain runtime BLOCKED until real GCP credentials/private bucket are available; pure validation/key tests do not prove GCS runtime behavior.
