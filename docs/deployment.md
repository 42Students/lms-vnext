# vNext Deployment Process

## How it works

Builds happen on **GitHub Actions** (free, public repo). Images are downloaded locally and pushed to GCP from the developer machine — no Cloud Build, no GCP compute cost.

```
GitHub Actions (free)          Developer machine
──────────────────────         ─────────────────────────────
docker build migrator   →      gh run download
docker build runner     →      docker load
docker save → tar.gz    →      docker tag + docker push → Artifact Registry
upload artifact         →      kubectl set image → GKE
```

## Step 1 — Trigger a build

Go to GitHub → Actions → **Build images** → Run workflow (choose branch/commit).

Or via CLI:
```bash
gh workflow run build-images.yml --ref main
```

Wait for it to go green (~10–15 min).

## Step 2 — Deploy locally

```powershell
.\scripts\deploy-from-artifact.ps1
```

This automatically:
- Downloads the latest successful build artifact
- Loads both images into local Docker
- Tags and pushes to `asia-south1-docker.pkg.dev/students-384817/lms-vnext/`
- Runs `kubectl set image` and waits for rollout

To deploy a specific run:
```powershell
.\scripts\deploy-from-artifact.ps1 -RunId 12345678
```

## Prerequisites

- `gh` CLI authenticated (`gh auth status`)
- `docker` running locally
- `gcloud` authenticated (`gcloud auth list`)
- `kubectl` pointed at the right cluster (`kubectl config current-context`)

## Namespaces / resources

| Thing | Value |
|---|---|
| GKE namespace | `lms-dev-2026` |
| Deployment | `lms-vnext` |
| Registry | `asia-south1-docker.pkg.dev/students-384817/lms-vnext/` |
| Web image | `web:<short-sha>` |
| Migrator image | `migrator:<short-sha>` |

## Migrations

If there are new migration files, run the migrator job manually after pushing the image — ask before doing this.
