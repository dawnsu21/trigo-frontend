# Script to help update backend CORS configuration for port 5175

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  UPDATE BACKEND CORS CONFIGURATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendDir = "C:\Users\Guest1\TriGO"
$corsFile = "$backendDir\config\cors.php"

Write-Host "Backend Directory: $backendDir" -ForegroundColor Yellow
Write-Host "CORS Config File: $corsFile" -ForegroundColor Yellow
Write-Host ""

# Check if backend directory exists
if (-not (Test-Path $backendDir)) {
    Write-Host "❌ Backend directory not found: $backendDir" -ForegroundColor Red
    Write-Host "   Please verify the backend location" -ForegroundColor Yellow
    exit 1
}

# Check if CORS file exists
if (-not (Test-Path $corsFile)) {
    Write-Host "❌ CORS config file not found: $corsFile" -ForegroundColor Red
    Write-Host "   Please verify the file exists" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ CORS config file found" -ForegroundColor Green
Write-Host ""

# Read current file
$content = Get-Content $corsFile -Raw

# Check if already updated
if ($content -match "localhost:5175") {
    Write-Host "✅ CORS already configured for port 5175!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Current configuration includes:" -ForegroundColor Yellow
    $content | Select-String -Pattern "localhost:5175" | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Cyan
    }
    Write-Host ""
    Write-Host "If you're still getting CORS errors, try:" -ForegroundColor Yellow
    Write-Host "  1. php artisan config:clear" -ForegroundColor White
    Write-Host "  2. php artisan cache:clear" -ForegroundColor White
    Write-Host "  3. Restart backend server" -ForegroundColor White
    exit 0
}

# Check if has old port 5173
if ($content -match "localhost:5173") {
    Write-Host "⚠️  Found old port 5173 in config" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Current configuration:" -ForegroundColor Yellow
    $content | Select-String -Pattern "localhost:5173" | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "You need to manually update the file:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Open: $corsFile" -ForegroundColor White
    Write-Host "2. Find: 'http://localhost:5173'" -ForegroundColor White
    Write-Host "3. Replace with: 'http://localhost:5175'" -ForegroundColor White
    Write-Host "4. Save the file" -ForegroundColor White
    Write-Host ""
    
    # Ask if user wants to open the file
    $response = Read-Host "Do you want to open the file now? (Y/N)"
    if ($response -eq "Y" -or $response -eq "y") {
        notepad $corsFile
        Write-Host ""
        Write-Host "After updating, run these commands:" -ForegroundColor Yellow
        Write-Host "  cd $backendDir" -ForegroundColor White
        Write-Host "  php artisan config:clear" -ForegroundColor White
        Write-Host "  php artisan cache:clear" -ForegroundColor White
    }
} else {
    Write-Host "⚠️  No port 5173 or 5175 found in config" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You need to add port 5175 to allowed_origins:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Open: $corsFile" -ForegroundColor White
    Write-Host ""
    Write-Host "Add to 'allowed_origins' array:" -ForegroundColor Yellow
    Write-Host "  'http://localhost:5175'," -ForegroundColor Cyan
    Write-Host "  'http://127.0.0.1:5175'," -ForegroundColor Cyan
    Write-Host ""
    
    $response = Read-Host "Do you want to open the file now? (Y/N)"
    if ($response -eq "Y" -or $response -eq "y") {
        notepad $corsFile
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NEXT STEPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "After updating the CORS config file:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Clear config cache:" -ForegroundColor White
Write-Host "   cd $backendDir" -ForegroundColor Cyan
Write-Host "   php artisan config:clear" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Clear application cache:" -ForegroundColor White
Write-Host "   php artisan cache:clear" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Restart backend server:" -ForegroundColor White
Write-Host "   (Stop with Ctrl+C, then run: php artisan serve)" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Test in browser:" -ForegroundColor White
Write-Host "   Go to http://localhost:5175 and try logging in" -ForegroundColor Cyan
Write-Host ""

