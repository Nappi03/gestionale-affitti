@echo off
chcp 65001 > nul
title DomusRent - WhatsApp Outreach Bot
color 0A
cd /d "c:\Users\emanu\AntigravityProject\gestionale-affitti"
echo ======================================================
echo    DOMUS RENT - WHATSAPP OUTREACH AUTOMATICO
echo ======================================================
echo.
echo Avvio in corso...
node "c:\Users\emanu\AntigravityProject\gestionale-affitti\scripts\whatsapp_outreach.cjs" 15
echo.
echo ======================================================
echo Operazione conclusa.
pause
