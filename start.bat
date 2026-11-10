@echo off
setlocal enabledelayedexpansion
title Network Intrusion Detection System - Startup Agent

echo ===============================================================================
echo     INTRUSION DETECTION OF IMBALANCED NETWORK TRAFFIC USING ML AND DL
echo                     College Final-Year Research Project
echo ===============================================================================
echo.

cd /d "%~dp0"

:: 1. Check Python Virtual Environment or System Python
echo [*] Step 1: Checking Python environment...
if exist "backend\venv\Scripts\python.exe" (
    set "PYTHON_EXE=backend\venv\Scripts\python.exe"
    echo [OK] Using pre-configured virtual environment: backend\venv
    goto PYTHON_READY
)

set "PYTHON_EXE="
python -c "import sys" >nul 2>&1
if !errorlevel! equ 0 (
    set "PYTHON_EXE=python"
    goto FOUND_PYTHON
)

py -3 -c "import sys" >nul 2>&1
if !errorlevel! equ 0 (
    set "PYTHON_EXE=py -3"
    goto FOUND_PYTHON
)

if exist "C:\Users\%USERNAME%\Python311\python.exe" (
    set "PYTHON_EXE=C:\Users\%USERNAME%\Python311\python.exe"
    goto FOUND_PYTHON
)
if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
    goto FOUND_PYTHON
)
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    goto FOUND_PYTHON
)
if exist "%LOCALAPPDATA%\Programs\Python\Python310\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python310\python.exe"
    goto FOUND_PYTHON
)
if exist "C:\Program Files\Python311\python.exe" (
    set "PYTHON_EXE=C:\Program Files\Python311\python.exe"
    goto FOUND_PYTHON
)
if exist "C:\Program Files\Python312\python.exe" (
    set "PYTHON_EXE=C:\Program Files\Python312\python.exe"
    goto FOUND_PYTHON
)
if exist "C:\Program Files\Python310\python.exe" (
    set "PYTHON_EXE=C:\Program Files\Python310\python.exe"
    goto FOUND_PYTHON
)

echo [!] Python 3.10+ is not detected on your system.
echo [!] Please install Python 3.10 or 3.11 from https://www.python.org/
echo [!] IMPORTANT: Be sure to check 'Add Python to PATH' during installation!
pause
exit /b 1

:FOUND_PYTHON
echo [OK] Detected System Python: %PYTHON_EXE%

if not exist "backend\venv\Scripts\activate.bat" (
    echo [*] Creating fresh Python virtual environment in backend\venv...
    "%PYTHON_EXE%" -m venv backend\venv
    if not exist "backend\venv\Scripts\python.exe" (
        echo [!] Failed to create virtual environment.
        pause
        exit /b 1
    )
)

:PYTHON_READY
echo [OK] Python virtual environment ready.

:: 2. Check Node.js and NPM
echo [*] Step 2: Checking Node.js environment...
where node >nul 2>&1
if !errorlevel! neq 0 (
    echo [!] Node.js is not found on your system PATH.
    echo [!] Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do echo [OK] Node.js Version: %%v

:: 3. Install Backend Dependencies if needed
echo [*] Step 3: Verifying backend Python dependencies...
if not exist "backend\venv\Lib\site-packages\torch" (
    echo [*] Installing PyTorch CPU wheel...
    backend\venv\Scripts\pip.exe install torch --index-url https://download.pytorch.org/whl/cpu
)
if not exist "backend\venv\Lib\site-packages\fastapi" (
    echo [*] Installing requirements from backend\requirements.txt...
    backend\venv\Scripts\pip.exe install -r backend\requirements.txt
)
echo [OK] Backend dependencies verified.

:: 4. Install Frontend Dependencies if needed
echo [*] Step 4: Verifying frontend Node.js dependencies...
if not exist "frontend\node_modules" (
    echo [*] Installing frontend npm packages...
    cd /d "%~dp0frontend"
    call npm install
    cd /d "%~dp0"
)
echo [OK] Frontend dependencies verified.

:: 5. Seed Database and Initial Pre-trained Models
echo [*] Step 5: Initializing database and pre-trained ML models...
backend\venv\Scripts\python.exe backend\init_db.py
echo [OK] Database and baseline models ready.

:: 6. Launch FastAPI Backend
echo [*] Step 6: Starting FastAPI Backend on http://127.0.0.1:8000 ...
cd /d "%~dp0backend"
start "CyberIDS-Backend" cmd /k "venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

:: Wait 3 seconds using universal ping delay
ping 127.0.0.1 -n 4 >nul

:: 7. Launch React Frontend
echo [*] Step 7: Starting React Frontend on http://localhost:5173 ...
cd /d "%~dp0frontend"
start "CyberIDS-Frontend" cmd /k "npm run dev"
cd /d "%~dp0"

:: Open default web browser
ping 127.0.0.1 -n 4 >nul
start http://localhost:5173

echo.
echo ===============================================================================
echo     APPLICATION LAUNCHED SUCCESSFULLY
echo ===============================================================================
echo   Frontend Dashboard:  http://localhost:5173
echo   Backend REST API:    http://127.0.0.1:8000
echo   Interactive Swagger: http://127.0.0.1:8000/docs
echo.
echo   Evaluation Credentials:
echo     Administrator:  admin   / admin123
echo     SOC Analyst:    analyst / analyst123
echo.
echo   To safely stop the application, run stop.bat.
echo ===============================================================================
echo.
pause
