# Backend Fix Script
# This script will help you start and configure your backend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BACKEND FIX SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendDir = "C:\Users\Guest1\TriGO"

# Step 1: Check if backend directory exists
Write-Host "Step 1: Checking backend directory..." -ForegroundColor Yellow
if (Test-Path $backendDir) {
    Write-Host "✅ Backend directory found: $backendDir" -ForegroundColor Green
    if (Test-Path "$backendDir\artisan") {
        Write-Host "✅ Laravel project confirmed (artisan file exists)" -ForegroundColor Green
    } else {
        Write-Host "❌ artisan file not found in $backendDir" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Backend directory not found: $backendDir" -ForegroundColor Red
    Write-Host "   Please verify the backend location" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 2: Check if backend is already running
Write-Host "Step 2: Checking if backend is running..." -ForegroundColor Yellow
$backendRunning = $false
$backendPort = 0
$ports = @(8000, 3000, 8080, 8001)

foreach ($port in $ports) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        Write-Host "✅ Backend IS ALREADY RUNNING on port $port" -ForegroundColor Green
        $backendRunning = $true
        $backendPort = $port
        break
    } catch {}
}

if (-not $backendRunning) {
    Write-Host "❌ Backend is NOT running" -ForegroundColor Red
    Write-Host ""
    Write-Host "Step 3: Starting backend server..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: You need to start the backend manually!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please open a NEW terminal and run these commands:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  cd $backendDir" -ForegroundColor White
    Write-Host "  php artisan serve" -ForegroundColor White
    Write-Host ""
    Write-Host "Then come back and run this script again to verify." -ForegroundColor Yellow
    Write-Host ""
    
    # Ask if user wants to try starting it
    $response = Read-Host "Do you want to try starting the backend now? (Y/N)"
    if ($response -eq "Y" -or $response -eq "y") {
        Write-Host ""
        Write-Host "Starting backend server..." -ForegroundColor Yellow
        Set-Location $backendDir
        Write-Host "Current directory: $(Get-Location)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Running: php artisan serve" -ForegroundColor Yellow
        Write-Host "⚠️  This will start the server. Press Ctrl+C to stop it." -ForegroundColor Yellow
        Write-Host ""
        php artisan serve
    }
} else {
    Write-Host ""
    Write-Host "Step 3: Testing CORS configuration..." -ForegroundColor Yellow
    
    try {
        $body = @{email='test@test.com'; password='test'} | ConvertTo-Json
        $headers = @{
            'Content-Type'='application/json'
            'Origin'='http://localhost:5173'
        }
        $response = Invoke-WebRequest -Uri "http://localhost:$backendPort/api/login" -Method POST -Headers $headers -Body $body -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        
        Write-Host "✅ API endpoint is accessible" -ForegroundColor Green
        if ($response.Headers['Access-Control-Allow-Origin']) {
            Write-Host "✅ CORS configured: $($response.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Green
        } else {
            Write-Host "⚠️  CORS header not found in response" -ForegroundColor Yellow
        }
    } catch {
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode.value__
            Write-Host "⚠️  API responded with status: $statusCode (endpoint exists)" -ForegroundColor Yellow
            
            $corsHeaders = $_.Exception.Response.Headers
            if ($corsHeaders['Access-Control-Allow-Origin']) {
                Write-Host "✅ CORS configured: $($corsHeaders['Access-Control-Allow-Origin'])" -ForegroundColor Green
            } else {
                Write-Host "❌ CORS NOT configured!" -ForegroundColor Red
                Write-Host ""
                Write-Host "CORS Configuration Required:" -ForegroundColor Yellow
                Write-Host "1. Edit: $backendDir\config\cors.php" -ForegroundColor White
                Write-Host "2. Set allowed_origins to include 'http://localhost:5173'" -ForegroundColor White
                Write-Host "3. Run: php artisan config:clear" -ForegroundColor White
            }
        } else {
            Write-Host "❌ Cannot test API endpoint" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($backendRunning) {
    Write-Host "✅ Backend Status: RUNNING on port $backendPort" -ForegroundColor Green
} else {
    Write-Host "❌ Backend Status: NOT RUNNING" -ForegroundColor Red
    Write-Host ""
    Write-Host "To start backend:" -ForegroundColor Yellow
    Write-Host "  cd $backendDir" -ForegroundColor White
    Write-Host "  php artisan serve" -ForegroundColor White
}

Write-Host ""
Write-Host "Frontend URL: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend URL: http://localhost:$backendPort" -ForegroundColor Cyan
Write-Host ""

