# Backend Connection Test Script
# Run this script to test if your backend is running

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BACKEND CONNECTION TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test common ports
$ports = @(8000, 3000, 8080, 8001, 5000)
$found = $false

Write-Host "Testing common backend ports..." -ForegroundColor Yellow
Write-Host ""

foreach ($port in $ports) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        Write-Host "✅ Port $port - BACKEND IS RUNNING!" -ForegroundColor Green
        Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   URL: http://localhost:$port" -ForegroundColor Green
        $found = $true
        break
    } catch {
        Write-Host "❌ Port $port - Not running" -ForegroundColor Red
    }
}

Write-Host ""

if (-not $found) {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ❌ BACKEND NOT FOUND" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "ACTION REQUIRED:" -ForegroundColor Yellow
    Write-Host "1. Open a NEW terminal" -ForegroundColor White
    Write-Host "2. Navigate to your backend directory" -ForegroundColor White
    Write-Host "3. Run: php artisan serve" -ForegroundColor White
    Write-Host "4. Keep that terminal open!" -ForegroundColor White
    Write-Host ""
    Write-Host "See START_BACKEND_NOW.md for detailed instructions" -ForegroundColor Cyan
} else {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ BACKEND IS RUNNING!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now testing CORS configuration..." -ForegroundColor Yellow
    Write-Host ""
    
    # Test CORS
    try {
        $body = @{email='test@test.com'; password='test'} | ConvertTo-Json
        $headers = @{
            'Content-Type'='application/json'
            'Origin'='http://localhost:5173'
        }
        $response = Invoke-WebRequest -Uri "http://localhost:$port/api/login" -Method POST -Headers $headers -Body $body -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        
        Write-Host "✅ API Endpoint: WORKING" -ForegroundColor Green
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
        
        if ($response.Headers['Access-Control-Allow-Origin']) {
            Write-Host "   ✅ CORS: Access-Control-Allow-Origin = $($response.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  CORS: Access-Control-Allow-Origin header MISSING" -ForegroundColor Yellow
        }
    } catch {
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode.value__
            Write-Host "⚠️  API Endpoint: Status $statusCode" -ForegroundColor Yellow
            Write-Host "   (This is OK - endpoint exists, just returned an error)" -ForegroundColor Yellow
            
            $corsHeaders = $_.Exception.Response.Headers
            if ($corsHeaders['Access-Control-Allow-Origin']) {
                Write-Host "   ✅ CORS: Access-Control-Allow-Origin = $($corsHeaders['Access-Control-Allow-Origin'])" -ForegroundColor Green
            } else {
                Write-Host "   ❌ CORS: Access-Control-Allow-Origin header MISSING" -ForegroundColor Red
                Write-Host ""
                Write-Host "CORS NOT CONFIGURED!" -ForegroundColor Red
                Write-Host "Update config/cors.php in your backend" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ Cannot test API endpoint" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

