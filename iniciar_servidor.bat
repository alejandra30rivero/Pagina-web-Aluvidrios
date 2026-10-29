@echo off
title Servidor Aluvidrios Victoria Paez (AVP)
cls

echo ======================================================================
echo    CRISTALERIA ALUVIDRIOS VICTORIA PAEZ (AVP)
echo    Iniciando Servidor Web y Base de Datos...
echo ======================================================================
echo.

cd /d "%~dp0backend"

echo [*] Iniciando servidor con Python...
echo [*] Tu navegador se abrira automaticamente en http://localhost:3000
echo.

python server.py

if %errorlevel% neq 0 (
    echo.
    echo [*] Probando con el comando 'py'...
    py server.py
)

if %errorlevel% neq 0 (
    echo.
    echo ======================================================================
    echo [ERROR] No se pudo iniciar el servidor.
    echo Verifique que Python este instalado en su sistema.
    echo ======================================================================
)

echo.
echo Presione cualquier tecla para cerrar esta ventana.
pause
