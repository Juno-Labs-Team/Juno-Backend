# Juno Backend Deployment to Google Cloud Run
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

# Build and deploy using Cloud Build
Write-Host "🔨 Building and deploying with Cloud Build..." -ForegroundColor Cyan
gcloud builds submit --config cloudbuild.yaml --project $PROJECT_ID

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    
    # Get the service URL
    $SERVICE_URL = gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)" --project=$PROJECT_ID
    
    Write-Host "🌐 Your backend is deployed at: $SERVICE_URL" -ForegroundColor Green
    Write-Host "🔗 OAuth URL: $SERVICE_URL/auth/google" -ForegroundColor Green
    
    Write-Host "`n📝 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Set OAuth redirect URL:" -ForegroundColor White
    Write-Host "   gcloud run services update $SERVICE_NAME --set-env-vars OAUTH_REDIRECT_URL=$SERVICE_URL/auth/google/callback --region=$REGION --project=$PROJECT_ID" -ForegroundColor Gray
    Write-Host "2. Update Google OAuth settings with: $SERVICE_URL/auth/google/callback" -ForegroundColor White
    Write-Host "3. Set your environment variables (DB_PASSWORD, JWT_SECRET, etc.)" -ForegroundColor White
    Write-Host "4. Update your frontend to use: $SERVICE_URL" -ForegroundColor White
    
} else {
    Write-Host "❌ Build failed. Check the logs above." -ForegroundColor Red
    exit 1
}
