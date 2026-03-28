# Deploy SkincareIQ backend to Cloud Run (run from skincare-iq\backend).
# Prerequisites: gcloud CLI, project selected (`gcloud config set project YOUR_PROJECT_ID`).
#
# Usage:
#   $env:GEMINI_API_KEY = "your-key"
#   .\deploy.ps1 -ProjectId "your-gcp-project"
#
# To use Secret Manager instead of env vars, create a secret and deploy with:
#   gcloud run deploy SERVICE --set-secrets GEMINI_API_KEY=SECRET_NAME:latest ...

param(
    [Parameter(Mandatory = $true)][string]$ProjectId,
    [string]$Region = "us-central1",
    [string]$ServiceName = "skincare-iq-api",
    [switch]$SkipGeminiEnv
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

# Pick up GEMINI_API_KEY from Windows User/Machine if not set in this shell (e.g. new terminal after setting env in System Properties).
if (-not $env:GEMINI_API_KEY) {
    $env:GEMINI_API_KEY = [System.Environment]::GetEnvironmentVariable("GEMINI_API_KEY", "User")
}
if (-not $env:GEMINI_API_KEY) {
    $env:GEMINI_API_KEY = [System.Environment]::GetEnvironmentVariable("GEMINI_API_KEY", "Machine")
}

if (-not $SkipGeminiEnv -and -not $env:GEMINI_API_KEY) {
    Write-Error "Set GEMINI_API_KEY in this shell, or pass -SkipGeminiEnv and configure the key in Cloud Run (Secret Manager recommended)."
    exit 1
}

Write-Host "Deploying $ServiceName to Cloud Run ($Region)..."

$gcloudArgs = @(
    "run", "deploy", $ServiceName,
    "--project", $ProjectId,
    "--region", $Region,
    "--source", ".",
    "--allow-unauthenticated"
)
if (-not $SkipGeminiEnv) {
    $gcloudArgs += @("--set-env-vars", "GEMINI_API_KEY=$($env:GEMINI_API_KEY)")
}

& gcloud @gcloudArgs

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host "Deploy finished. Service URL is shown above; use it as the API base for POST /analyze."
