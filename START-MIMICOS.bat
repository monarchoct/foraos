@echo off
title MimicOS 2.0 - Launcher
color 0D
cls

echo.
echo  ================================================
echo  =                 MimicOS 2.0                  =
echo  =            Anime AI Companion                =
echo  ================================================
echo.
echo           Welcome to your AI companion!
echo.
echo  Checking dependencies...

:: Create backend data directory if it doesn't exist
if not exist "backend\data" (
    echo  - Creating backend data directory...
    mkdir "backend\data"
    echo  - Backend data directory created
)

:: Check if node_modules exists for frontend
if not exist "node_modules" (
    echo  - Installing frontend dependencies...
    call npm install
    echo  - Frontend dependencies installed
)

:: Check if node_modules exists for backend
if not exist "backend\node_modules" (
    echo  - Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    echo  - Backend dependencies installed
)

:: Check if node_modules exists for minecraft-server
if not exist "minecraft-server\node_modules" (
    echo  - Installing Minecraft server dependencies...
    cd minecraft-server
    call npm install
    cd ..
    echo  - Minecraft server dependencies installed
)

:start
echo.
echo  ================================================
echo  =              Launch Options                  =
echo  ================================================
echo.
echo  1. Full MimicOS (All Services + Minecraft)
echo  2. Backend Only (Twitter Service)
echo  3. Frontend Only (Web Interface)
echo  4. Minecraft Server Only
echo  5. Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto full
if "%choice%"=="2" goto backend
if "%choice%"=="3" goto frontend
if "%choice%"=="4" goto minecraft
if "%choice%"=="5" goto exit
echo Invalid choice. Please try again.
pause
goto start

:full
cls
echo.
echo  ================================================
echo  =         Starting Full MimicOS System        =
echo  ================================================
echo.
echo  Twitter: mimicosx
echo  Email: mimicos792@gmail.com
echo  Frontend: http://localhost:5173
echo  Backend: http://localhost:3001
echo  Minecraft: ws://localhost:3002
echo.
echo  Starting all services...
echo.

:: Start backend in a new window
echo  Starting backend service...
start "MimicOS Backend" cmd /k "cd backend && npm run twitter"

:: Start Minecraft server in a new window
echo  Starting Minecraft server...
start "MimicOS Minecraft" cmd /k "cd minecraft-server && npm run dev"

:: Wait a bit for services to start
timeout /t 5 /nobreak >nul

:: Start frontend
echo  Starting frontend service...
echo  MimicOS is now running!
echo.
call npm run dev
goto end

:backend
cls
echo.
echo  ================================================
echo  =            Backend Only Mode                =
echo  ================================================
echo.
echo  Twitter: mimicosx
echo  Email: mimicos792@gmail.com
echo  Backend: http://localhost:3001
echo.
echo  Starting Twitter service...
echo.

cd backend
call npm run twitter
goto end

:frontend
cls
echo.
echo  ================================================
echo  =           Frontend Only Mode                =
echo  ================================================
echo.
echo  Frontend: http://localhost:5173
echo.
echo  Starting web interface...
echo  Note: Backend features will not be available
echo.

call npm run dev
goto end

:minecraft
cls
echo.
echo  ================================================
echo  =         Minecraft Server Only               =
echo  ================================================
echo.
echo  Minecraft: ws://localhost:3002
echo.
echo  Starting Minecraft bot server...
echo.

cd minecraft-server
call npm run dev
goto end

:exit
echo.
echo  Goodbye! Thanks for using MimicOS!
echo.
exit /b 0

:end
echo.
echo  Services stopped. Press any key to exit...
pause >nul