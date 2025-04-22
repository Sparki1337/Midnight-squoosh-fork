@echo off
chcp 65001 >nul
title Midnight - Запуск сервера

cls
echo.
echo ===============================================
echo         MIDNIGHT - ЗАПУСК СЕРВЕРА
echo ===============================================
echo.

echo Сервер запускается...
echo.
echo Сервер будет доступен по адресу: http://localhost:5000
echo.
start "" "http://localhost:5000"
echo.
echo Для завершения работы сервера нажмите Ctrl+C и подтвердите завершение (Y)
echo.
echo -----------------------------------------------
echo.

npm run dev 