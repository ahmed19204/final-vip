@echo off
echo ========================================
echo    VIP Center - Auto Upload to GitHub
echo ========================================
echo.

echo [1/4] Adding all changes...
git add .

echo [2/4] Committing changes...
git commit -m "Fix all reported issues: video title saving, subjects management, student registration, and mobile responsiveness"

echo [3/4] Pushing to GitHub...
git push origin main

echo [4/4] Done!
echo.
echo ========================================
echo   Upload completed successfully! 🎉
echo   Check: https://vip-center-1.vercel.app
echo ========================================
pause
