# deploy-from-artifact.ps1
# Downloads built images from GitHub Actions artifact and deploys to GKE.
# Usage: .\scripts\deploy-from-artifact.ps1 [-RunId <run-id>]
# If RunId is omitted, uses the latest successful build-images run.

param(
    [string]$RunId = ""
)

$ErrorActionPreference = "Stop"

$REGISTRY = "asia-south1-docker.pkg.dev/students-384817/lms-vnext"
$NS       = "lms-dev-2026"
$DEPLOY   = "lms-vnext"
$CRANE    = "$PSScriptRoot\..\tools\crane.exe"

function Decompress-Gz($src, $dst) {
    $in  = [System.IO.File]::OpenRead($src)
    $gz  = [System.IO.Compression.GzipStream]::new($in, [System.IO.Compression.CompressionMode]::Decompress)
    $out = [System.IO.File]::Create($dst)
    $gz.CopyTo($out)
    $out.Close(); $gz.Close(); $in.Close()
}

# --- 1. Find the run ---
if ($RunId -eq "") {
    Write-Host "Finding latest successful build-images run..."
    $RunId = gh run list --workflow=build-images.yml --status=success --limit=1 --json databaseId --jq ".[0].databaseId"
    if (-not $RunId) { throw "No successful build-images run found." }
}
Write-Host "Using run: $RunId"

# --- 2. Download artifact ---
$TmpDir = Join-Path $env:TEMP "lms-deploy-$RunId"
New-Item -ItemType Directory -Force -Path $TmpDir | Out-Null
Write-Host "Downloading artifact to $TmpDir ..."
gh run download $RunId --dir $TmpDir

# --- 2b. Verify the downloaded images against the sums printed in the run log (SEC-18-016) ---
$sumsFile = Get-ChildItem -Recurse -Filter SHA256SUMS $TmpDir | Select-Object -First 1
if (-not $sumsFile) { Write-Warning "No SHA256SUMS in this run (built before checksums existed); skipping the integrity check." }
else {
  $log = gh run view $RunId --log 2>$null | Out-String
  foreach ($line in (Get-Content $sumsFile.FullName)) {
    $parts = $line -split 's+', 2
    $expected = $parts[0]; $name = $parts[1].Trim().TrimStart('*')
    $file = (Get-ChildItem -Recurse -Filter $name $TmpDir | Select-Object -First 1).FullName
    $actual = (Get-FileHash -Algorithm SHA256 $file).Hash.ToLower()
    if ($actual -ne $expected) { throw "Integrity check failed for ${name}: file ${actual}, artifact sums ${expected}." }
    if ($log -and ($log -notmatch [regex]::Escape($expected))) { throw "Integrity check failed for ${name}: the run log does not list ${expected}." }
  }
  Write-Host "Image checksums match the run log."
}

# --- 3. Read SHA ---
$SHA = Get-Content (Get-ChildItem -Recurse -Filter sha.txt $TmpDir | Select-Object -First 1).FullName
Write-Host "SHA: $SHA"

# --- 4. Auth crane to Artifact Registry (use isolated config, avoid Docker Desktop credsStore) ---
Write-Host "Configuring crane auth..."
$token = gcloud auth print-access-token
$CraneConfig = Join-Path $env:TEMP "crane-config-$RunId"
New-Item -ItemType Directory -Force -Path $CraneConfig | Out-Null
$b64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("oauth2accesstoken:$token"))
@{ auths = @{ "asia-south1-docker.pkg.dev" = @{ auth = $b64 } } } | ConvertTo-Json | Set-Content "$CraneConfig\config.json"
$env:DOCKER_CONFIG = $CraneConfig

# --- 5. Decompress .tar.gz → .tar (crane needs uncompressed tar) ---
Write-Host "Decompressing images..."
$migratorGz  = (Get-ChildItem -Recurse -Filter migrator.tar.gz $TmpDir | Select-Object -First 1).FullName
$migratorTar = $migratorGz -replace '\.gz$', ''
Decompress-Gz $migratorGz $migratorTar

$webGz  = (Get-ChildItem -Recurse -Filter web.tar.gz $TmpDir | Select-Object -First 1).FullName
$webTar = $webGz -replace '\.gz$', ''
Decompress-Gz $webGz $webTar

# --- 6. Push images ---
# crane logs progress to stderr; each native command is checked through $LASTEXITCODE instead.
$ErrorActionPreference = "Continue"
Write-Host "Pushing migrator image..."
& $CRANE push $migratorTar "$REGISTRY/migrator:$SHA"
if ($LASTEXITCODE -ne 0) { throw "crane push migrator failed." }

Write-Host "Pushing web image..."
& $CRANE push $webTar "$REGISTRY/web:$SHA"
if ($LASTEXITCODE -ne 0) { throw "crane push web failed." }

# --- 7. Deploy ---
Write-Host "Deploying web:$SHA to $NS/$DEPLOY ..."
Remove-Item -Recurse -Force $CraneConfig
kubectl set image deployment/$DEPLOY "web=$REGISTRY/web:$SHA" -n $NS
if ($LASTEXITCODE -ne 0) { throw "kubectl set image failed." }
kubectl rollout status deployment/$DEPLOY -n $NS --timeout=180s
if ($LASTEXITCODE -ne 0) { throw "Rollout did not finish. Check the pod, or run: kubectl rollout undo deployment/$DEPLOY -n $NS" }

Write-Host ""
Write-Host "Done. Deployed web:$SHA"
Write-Host "Migrator image $REGISTRY/migrator:$SHA is available if migrations are needed."

# --- 8. Clean up ---
Remove-Item -Recurse -Force $TmpDir
