@echo off
setlocal enabledelayedexpansion
title Network Intrusion Detection System - Zero-Config Auto Installer and Launcher

echo ===============================================================================
echo     INTRUSION DETECTION OF IMBALANCED NETWORK TRAFFIC USING ML AND DL
echo               Autonomous Zero-Configuration Student Launcher
echo ===============================================================================
echo.

cd /d "%~dp0"

:: -----------------------------------------------------------------------------
:: 1. VERIFY OR AUTO-INSTALL PYTHON
:: -----------------------------------------------------------------------------
echo [*] Step 1: Checking Python environment...

if exist "backend\venv\Scripts\python.exe" (
    set "PYTHON_EXE=backend\venv\Scripts\python.exe"
    echo [OK] Using pre-configured project virtual environment.
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

:: Python is missing - Automatically download and install Python 3.11
echo.
echo [!] Python 3.10+ is not detected on this computer.
echo [*] Initiating automatic zero-click installation of official Python 3.11...
echo [*] Downloading Python installer from python.org (~26 MB)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe', '%TEMP%\python_installer.exe')"

if not exist "%TEMP%\python_installer.exe" (
    echo [!] Download failed. Please connect to the internet and re-run start.bat.
    pause
    exit /b 1
)

echo [*] Installing Python 3.11 silently (configured with PATH)...
start /wait "" "%TEMP%\python_installer.exe" /quiet InstallAllUsers=0 PrependPath=1 Include_test=0 SimpleInstall=1
del /f /q "%TEMP%\python_installer.exe" >nul 2>&1

:: Refresh environment PATH
set "PATH=%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python311\Scripts;!PATH!"

if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
    echo [OK] Python 3.11 installed successfully!
    goto FOUND_PYTHON
) else (
    echo [!] Python installation could not be completed automatically.
    echo [!] Please install Python 3.11 manually from https://www.python.org/
    pause
    exit /b 1
)

:FOUND_PYTHON
echo [OK] Detected System Python: %PYTHON_EXE%

if not exist "backend\venv\Scripts\activate.bat" (
    echo [*] Creating isolated Python virtual environment in backend\venv...
    "%PYTHON_EXE%" -m venv backend\venv
    if not exist "backend\venv\Scripts\python.exe" (
        echo [!] Failed to create virtual environment.
        pause
        exit /b 1
    )
)

:PYTHON_READY
echo [OK] Python virtual environment ready.

:: -----------------------------------------------------------------------------
:: 2. VERIFY OR AUTO-INSTALL NODE.JS
:: -----------------------------------------------------------------------------
echo [*] Step 2: Checking Node.js environment...

where node >nul 2>&1
if !errorlevel! equ 0 goto NODE_READY

if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=C:\Program Files\nodejs;!PATH!"
    goto NODE_READY
)
if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    set "PATH=%LOCALAPPDATA%\Programs\nodejs;!PATH!"
    goto NODE_READY
)

:: Node.js is missing - Automatically download and install Node.js LTS
echo.
echo [!] Node.js is not detected on this computer.
echo [*] Initiating automatic installation of Node.js LTS (~26 MB)...
echo [*] Downloading Node.js installer from nodejs.org...
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi', '%TEMP%\nodejs_installer.msi')"

if not exist "%TEMP%\nodejs_installer.msi" (
    echo [!] Download failed. Please connect to the internet and re-run start.bat.
    pause
    exit /b 1
)

echo [*] Installing Node.js LTS silently (click Yes if prompted by Windows)...
start /wait msiexec /i "%TEMP%\nodejs_installer.msi" /qn /norestart
del /f /q "%TEMP%\nodejs_installer.msi" >nul 2>&1

set "PATH=C:\Program Files\nodejs;!PATH!"

if exist "C:\Program Files\nodejs\node.exe" (
    echo [OK] Node.js LTS installed successfully!
    goto NODE_READY
) else (
    echo [!] Node.js automatic installation could not complete.
    echo [!] Please install Node.js manually from https://nodejs.org/
    pause
    exit /b 1
)

:NODE_READY
for /f "tokens=*" %%v in ('node --version') do echo [OK] Node.js Version: %%v

:: -----------------------------------------------------------------------------
:: 3. VERIFY OR INSTALL BACKEND DEPENDENCIES
:: -----------------------------------------------------------------------------
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

:: -----------------------------------------------------------------------------
:: 4. VERIFY OR INSTALL FRONTEND DEPENDENCIES
:: -----------------------------------------------------------------------------
echo [*] Step 4: Verifying frontend Node.js dependencies...
if not exist "frontend\node_modules" (
    echo [*] Installing frontend npm packages...
    cd /d "%~dp0frontend"
    call npm install
    cd /d "%~dp0"
)
echo [OK] Frontend dependencies verified.

:: -----------------------------------------------------------------------------
:: 5. SEED DATABASE AND MODELS
:: -----------------------------------------------------------------------------
echo [*] Step 5: Initializing database and pre-trained ML models...
backend\venv\Scripts\python.exe backend\init_db.py
echo [OK] Database and baseline models ready.

:: -----------------------------------------------------------------------------
:: 6. LAUNCH APPLICATION SERVERS
:: -----------------------------------------------------------------------------
echo [*] Step 6: Starting FastAPI Backend on http://127.0.0.1:8000 ...
cd /d "%~dp0backend"
start "CyberIDS-Backend" cmd /k "venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

ping 127.0.0.1 -n 4 >nul

echo [*] Step 7: Starting React Frontend on http://localhost:5173 ...
cd /d "%~dp0frontend"
start "CyberIDS-Frontend" cmd /k "npm run dev"
cd /d "%~dp0"

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
