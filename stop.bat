@echo off
title Network Intrusion Detection System - Shutdown Agent

echo ===============================================================================
echo     STOPPING NETWORK INTRUSION DETECTION APPLICATION
echo ===============================================================================
echo.

echo [*] Terminating processes on port 8000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [*] Terminating processes on port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [*] Closing CyberIDS console windows...
taskkill /fi "WINDOWTITLE eq CyberIDS-Backend*" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq CyberIDS-Frontend*" /f >nul 2>&1

echo.
echo [OK] All Network Intrusion Detection services have been stopped safely.
echo.
pause

