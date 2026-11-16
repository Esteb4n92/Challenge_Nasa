@echo off
title Beyond Survival - servidor local
cd /d "%~dp0"

rem Puerto: 8000, o el que se pase como argumento (jugar.bat 8080).
set PORT=8000
if not "%~1"=="" set PORT=%~1

rem Busca Python: lanzador py, instalacion de usuario o python del PATH.
set "PY="
where py >nul 2>nul && set "PY=py -3"
if not defined PY if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" set "PY="%LOCALAPPDATA%\Programs\Python\Python312\python.exe""
if not defined PY (python --version >nul 2>nul && set "PY=python")
if not defined PY (
  echo No se encontro Python. Instalalo con:  winget install Python.Python.3.12
  pause
  exit /b 1
)

rem IP de esta computadora en la red local (para abrir el juego desde otro equipo o celular).
set "IPLAN="
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.PrefixOrigin -ne 'WellKnown' } | Sort-Object InterfaceMetric | Select-Object -First 1).IPAddress"`) do set "IPLAN=%%i"

echo.
echo  ==================================================
echo   BEYOND SURVIVAL
echo.
echo   En esta computadora:   http://127.0.0.1:%PORT%
if defined IPLAN echo   Desde otro equipo/celular (misma red WiFi):
if defined IPLAN echo                          http://%IPLAN%:%PORT%
echo.
echo   Deja esta ventana abierta mientras juegas.
echo   Para cerrar el juego, cierra esta ventana.
echo  ==================================================
echo.

rem Abre el navegador cuando el servidor ya esta listo (espera ~2 s).
start "" /min cmd /c "ping -n 3 127.0.0.1 >nul & start "" http://127.0.0.1:%PORT%/"

rem 0.0.0.0 = acepta conexiones de esta computadora y de la red local.
%PY% tools\servidor.py %PORT%
echo.
echo El servidor se detuvo. Si dice que el puerto %PORT% esta en uso,
echo cierra la otra ventana de Beyond Survival o usa:  jugar.bat 8080
pause
