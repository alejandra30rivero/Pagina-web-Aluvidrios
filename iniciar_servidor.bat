@echo off
chcp 65001 > nul
title Servidor Aluvidrios Victoria Páez (AVP)

echo ======================================================================
echo    CRISTALERÍA ALUVIDRIOS VICTORIA PÁEZ (AVP)
echo    Iniciando Servidor Web y Base de Datos...
echo ======================================================================
echo.

cd /d "%~dp0backend"

:: Probamos primero con Python ya que está instalado de forma nativa en tu equipo
echo [*] Iniciando servidor con Python...
start "" http://localhost:3000
python server.py

if %errorlevel% neq 0 (
    echo.
    echo [*] Probando con el comando 'py'...
    py server.py
)

if %errorlevel% neq 0 (
    echo.
    echo [*] Probando con Node.js...
    node server.js
)

echo.
echo Presione cualquier tecla para cerrar.
pause
