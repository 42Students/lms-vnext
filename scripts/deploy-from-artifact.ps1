# deploy-from-artifact.ps1
# Downloads built images from GitHub Actions artifact and deploys to GKE.
# Usage: .\scripts\deploy-from-artifact.ps1 [-RunId <run-id>]
# If RunId is omitted, uses the latest successful build-images run.

param(
    [string]$RunId = ""
)

$REGISTRY = "asia-south1-docker.pkg.dev/students-384817/lms-vnext"
$NS       = "lms-dev-2026"
$DEPLOY   = "lms-vnext"

# --- 1. Find the run ---
if ($RunId -eq "") {
    Write-Host "Finding latest successful build-images run..."
    $RunId = gh run list --workflow=build-images.yml --status=success --limit=1 --json databaseId --jq ".[0].databaseId" 2>&1
    if (-not $RunId) { Write-Error "No successful build-images run found."; exit 1 }
}
Write-Host "Using run: $RunId"

# --- 2. Download artifact ---
$TmpDir = Join-Path $env:TEMP "lms-deploy-$RunId"
New-Item -ItemType Directory -Force -Path $TmpDir | Out-Null
Write-Host "Downloading artifact to $TmpDir ..."
gh run download $RunId --dir $TmpDir
if ($LASTEXITCODE -ne 0) { Write-Error "Download failed."; exit 1 }

# --- 3. Read SHA ---
$SHA = Get-Content (Get-ChildItem -Recurse -Filter sha.txt $TmpDir | Select-Object -First 1).FullName
Write-Host "SHA: $SHA"

# --- 4. Load images ---
Write-Host "Loading migrator image..."
Get-ChildItem -Recurse -Filter migrator.tar.gz $TmpDir | Select-Object -First 1 | ForEach-Object {
    docker load -i $_.FullName
}
Write-Host "Loading web image..."
Get-ChildItem -Recurse -Filter web.tar.gz $TmpDir | Select-Object -First 1 | ForEach-Object {
    docker load -i $_.FullName
}

# --- 5. Tag and push ---
Write-Host "Tagging and pushing..."
docker tag "lms-vnext/migrator:$SHA" "$REGISTRY/migrator:$SHA"
docker push "$REGISTRY/migrator:$SHA"

docker tag "lms-vnext/web:$SHA" "$REGISTRY/web:$SHA"
docker push "$REGISTRY/web:$SHA"

# --- 6. Deploy ---
Write-Host "Deploying web:$SHA to $NS/$DEPLOY ..."
kubectl set image deployment/$DEPLOY "web=$REGISTRY/web:$SHA" -n $NS
kubectl rollout status deployment/$DEPLOY -n $NS --timeout=120s

Write-Host ""
Write-Host "Done. Deployed web:$SHA"
Write-Host "Migrator image $REGISTRY/migrator:$SHA is available if migrations are needed."

# --- 7. Clean up ---
Remove-Item -Recurse -Force $TmpDir
