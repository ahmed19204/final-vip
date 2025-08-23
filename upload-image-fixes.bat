@echo off
echo ========================================
echo    VIP Center - Image Fixes Upload
echo ========================================
echo.

echo [1/4] Adding image optimization files...
git add css/image-fixes.css
git add js/image-optimizer.js

echo [2/4] Adding updated HTML files...
git add index.html
git add home.html
git add teachers.html

echo [3/4] Adding updated CSS...
git add css/styles.css

echo [4/4] Committing and pushing changes...
git commit -m "🖼️ Fix image sizing issues - Add comprehensive image optimization system

- Add CSS constraints for all image types (max-height: 250px)
- Add JavaScript image optimizer with automatic resizing
- Add responsive image scaling for all devices
- Fix course, teacher, hero, and logo image sizes
- Add lazy loading and error handling for images
- Add mobile-specific image optimizations
- Add print and accessibility improvements

Fixes: Oversized images breaking layout on all devices"

git push origin main

echo.
echo ========================================
echo   Image fixes uploaded successfully! 🎉
echo   All images now properly sized and optimized
echo ========================================
pause
