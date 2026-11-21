@echo off
title Linea de Tiempo - MODO ONLINE (Internet)
cd /d "%~dp0"
echo ================================================================
echo   LINEA DE TIEMPO - MODO ONLINE (4G/5G y cualquier Wi-Fi)
echo ================================================================
echo.
echo 1) Iniciando servidor del juego en puerto 3001...
start "Servidor Linea de Tiempo" /min cmd /c "node server/src/index.js"
timeout /t 2 /nobreak >nul
echo.
echo 2) Abriendo enlace publico seguro (Cloudflare)...
echo    COPIA EL LINK https://....trycloudflare.com QUE APAREZCA ABAJO
echo    y compartelo por WhatsApp con todos los jugadores!
echo.
npx.cmd --yes cloudflared tunnel --url http://localhost:3001
pause
