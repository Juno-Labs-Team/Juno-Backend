# Juno Backend Deployment Script - Production Ready
# Run this script from the backend directory

Write-Host "🚀 Deploying Juno Backend to Google Cloud Run" -ForegroundColor Green

# Check if gcloud is installed
if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Google Cloud CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Set project variables
$PROJECT_ID = "juno-rideshare-461800"
$REGION = "us-east4"
$SERVICE_NAME = "juno-backend"

Write-Host "📋 Project: $PROJECT_ID" -ForegroundColor Yellow
Write-Host "📍 Region: $REGION" -ForegroundColor Yellow
Write-Host "🔧 Service: $SERVICE_NAME" -ForegroundColor Yellow

# Build and push the Docker image
Write-Host "🔨 Building Docker image..." -ForegroundColor Cyan
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME --project $PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker image built successfully!" -ForegroundColor Green

# Deploy to Google Cloud Run with all environment variables
Write-Host "🚀 Deploying to Google Cloud Run..." -ForegroundColor Cyan

gcloud run deploy $SERVICE_NAME `
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME `
    --platform managed `
    --region $REGION `
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
    --cpu 1 `
    --project $PROJECT_ID

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 Deployment successful!" -ForegroundColor Green
    Write-Host "" 
    Write-Host "🔗 Your APIs:" -ForegroundColor Cyan
    Write-Host "   OAuth URL: https://juno-backend-587837548118.us-east4.run.app/auth/google" -ForegroundColor White
    Write-Host "   API Base: https://juno-backend-587837548118.us-east4.run.app" -ForegroundColor White
    Write-Host "   Health Check: https://juno-backend-587837548118.us-east4.run.app/health" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 Test your deployment:" -ForegroundColor Yellow
    Write-Host "   curl https://juno-backend-587837548118.us-east4.run.app/health" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📱 Update your frontend API_BASE_URL to:" -ForegroundColor Green
    Write-Host "   https://juno-backend-587837548118.us-east4.run.app" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}