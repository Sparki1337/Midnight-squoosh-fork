@echo off
chcp 65001 >nul
title Midnight - Главное меню

:: Анимация загрузки при старте
cls
echo.
echo ===============================================
echo           MIDNIGHT - ЗАГРУЗКА
echo ===============================================
echo.

echo MIDNIGHT - IMAGE COMPRESSION TOOL
echo Инициализация... ГОТОВО!
echo.

:menu
cls
echo.
echo MIDNIGHT - IMAGE COMPRESSION TOOL
echo.
echo ===============================================
echo            MIDNIGHT - УПРАВЛЕНИЕ
echo ===============================================
echo.
echo  [1] Установить зависимости
echo  [2] Запустить сервер разработки
echo  [3] Собрать проект
echo  [4] Выход
echo.
echo ===============================================
echo.

set /p choice=Выберите действие (1-4): 

if "%choice%"=="1" goto install
if "%choice%"=="2" goto start
if "%choice%"=="3" goto build
if "%choice%"=="4" goto exit

echo.
echo Неверный выбор. Пожалуйста, выберите 1-4.
goto menu

:install
cls
echo.
echo ===============================================
echo         ЗАПУСК УСТАНОВКИ ЗАВИСИМОСТЕЙ
echo ===============================================
echo.
call install_dependencies.bat
goto menu

:start
cls
echo.
echo ===============================================
echo                  ЗАПУСК
echo ===============================================
echo.
call start_server.bat
goto menu

:build
cls
echo.
echo ===============================================
echo             ЗАПУСК СБОРКИ ПРОЕКТА
echo ===============================================
echo.
call build_project.bat
goto menu

:exit
cls
echo.
echo MIDNIGHT - IMAGE COMPRESSION TOOL
echo.
echo ===============================================
echo         СПАСИБО ЗА ИСПОЛЬЗОВАНИЕ MIDNIGHT!
echo ===============================================
echo.

echo До свидания!
exit я