@echo off
title Linea de Tiempo - Servidor Multijugador
cd /d "%~dp0"
echo ========================================================
echo   LINEA DE TIEMPO - JUEGO MULTIJUGADOR
echo ========================================================
echo.
echo Iniciando servidor...
start "" http://localhost:3001
node server/src/index.js
pause
