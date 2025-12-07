@echo off
echo ========================================
echo   STARTING BACKEND SERVER
echo ========================================
echo.

cd /d C:\Users\Guest1\TriGO

if not exist artisan (
    echo ERROR: artisan file not found!
    echo Backend directory may be incorrect.
    pause
    exit /b 1
)

echo Backend directory: %CD%
echo.
echo Starting Laravel development server...
echo.
echo IMPORTANT: Keep this window open!
echo Press Ctrl+C to stop the server.
echo.

php artisan serve

pause

