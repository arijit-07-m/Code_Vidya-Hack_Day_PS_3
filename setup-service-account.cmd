@echo off
echo ===========================================
echo  ClubOps AI - Firebase Service Account Setup
echo ===========================================
echo.
echo Steps:
echo 1. Go to: https://console.firebase.google.com
echo 2. Open project: code-vidya-hack-day-ps-3-6b47d
echo 3. Go to: Project Settings ^> Service accounts
echo 4. Click "Generate new private key"
echo 5. Save the file as "firebase-service-account.json"
echo    in this directory: %~dp0
echo.
echo Once done, run the backend again with:
echo   cd backend ^&^& npm run dev
echo.
pause