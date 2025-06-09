# Juno Backend Deployment Script - Fixed Version
# This script builds and deploys the backend to Google Cloud Run with proper OAuth configuration

Write-Host "Starting Juno Backend Deployment (Fixed Version)" -ForegroundColor Cyan

# Build and push the Docker image to Google Container Registry
Write-Host "Building Docker image..." -ForegroundColor Yellow
gcloud builds submit --tag gcr.io/juno-rideshare-461800/juno-backend

if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker image built successfully!" -ForegroundColor Green
} else {
    Write-Host "Docker build failed!" -ForegroundColor Red
    exit 1
}

# Deploy to Google Cloud Run with all environment variables
Write-Host "Deploying to Google Cloud Run..." -ForegroundColor Yellow

gcloud run deploy juno-backend `
    --image gcr.io/juno-rideshare-461800/juno-backend `
    --platform managed `
    --region us-east4 `
    --allow-unauthenticated `
    --add-cloudsql-instances juno-rideshare-461800:us-east4:juno-production-db `
    --set-env-vars DB_HOST="juno-rideshare-461800:us-east4:juno-production-db" `
    --set-env-vars DB_USER="postgres" `
    --set-env-vars DB_PASSWORD="(Oe+#<:ft+6d1^4R" `
    --set-env-vars DB_NAME="juno" `
    --set-env-vars DB_PORT="5432" `
    --set-env-vars JWT_SECRET="juno_rideshare_super_secret_key_2025_change_this" `
    --set-env-vars GOOGLE_CLIENT_ID="587837548118-nvfqsrnjvshri8ni04dkslkcalq71g92.apps.googleusercontent.com" `
    --set-env-vars GOOGLE_CLIENT_SECRET="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" `
    --set-env-vars OAUTH_REDIRECT_URL="https://juno-backend-587837548118.us-east4.run.app/auth/google/callback" `
    --set-env-vars GIN_MODE="release" `
    --memory 512Mi `
    --cpu 1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment successful!" -ForegroundColor Green
    Write-Host "" 
    Write-Host "Your OAuth URL: https://juno-backend-587837548118.us-east4.run.app/auth/google" -ForegroundColor Cyan
    Write-Host "API Base URL: https://juno-backend-587837548118.us-east4.run.app" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Test your deployment:" -ForegroundColor Yellow
    Write-Host "curl https://juno-backend-587837548118.us-east4.run.app/" -ForegroundColor Gray
} else {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}
