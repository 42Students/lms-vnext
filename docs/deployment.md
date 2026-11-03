# vNext Deployment Process

Images are built on GitHub Actions, which needs no GCP credentials, then pushed to Artifact Registry and deployed from the developer machine. Cloud Build is not used. Docker is not needed locally.

The repository is private, so builds use the GitHub Actions monthly minutes. A build takes about 7 minutes.

## 1. Check first

- `typecheck` passed in CI for that commit. The image build skips the type check because it runs out of memory on GitHub runners, so nothing else catches type errors.
- Whether migrations changed since the running image:

```bash
git diff --name-status <running-sha> <new-sha> -- drizzle
```

If they changed, ask the owner before deploying. Run the migrator image as a job before updating the web image.

## 2. Build

```bash
gh workflow run build-images.yml --ref main -f ref=main
```

To build a hotfix branch, use the branch name for both `--ref` and `-f ref=`.

## 3. Deploy

Always pass the run id. Without it, the script takes the latest successful build, which may not be the one you reviewed.

```powershell
.\scripts\deploy-from-artifact.ps1 -RunId <run-id>
```

The script downloads the artifact, pushes both images with `tools/crane.exe`, then updates `lms-vnext` in `lms-dev-2026` and waits for the rollout. It stops before `kubectl` if a push fails.

To roll back:

```bash
kubectl rollout undo deployment/lms-vnext -n lms-dev-2026
```

## Prerequisites

- `gh` signed in
- `gcloud` signed in, with `kubectl` pointed at the dev cluster
- `tools/crane.exe` from go-containerregistry. It is not committed.

## Resources

| Thing | Value |
|---|---|
| GKE namespace | `lms-dev-2026` |
| Deployment | `lms-vnext` |
| Registry | `asia-south1-docker.pkg.dev/students-384817/lms-vnext/` |
| Web image | `web:<short-sha>` |
| Migrator image | `migrator:<short-sha>` |
