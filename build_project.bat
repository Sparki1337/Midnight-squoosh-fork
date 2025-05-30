@echo off
chcp 65001 >nul
title Midnight - Сборка проекта

echo.
echo ===============================================
echo          MIDNIGHT - СБОРКА ПРОЕКТА
echo ===============================================
echo.

echo Запуск сборки проекта...
echo.
echo Этот процесс может занять некоторое время. Пожалуйста, подождите.
echo.

:: Выполняем сборку проекта
npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================
    echo             СБОРКА ЗАВЕРШЕНА УСПЕШНО!
    echo ===============================================
    echo.
    echo Проект успешно собран! Готов к использованию.
) else (
    echo.
    echo ===============================================
    echo              ОШИБКА ПРИ СБОРКЕ!
    echo ===============================================
    echo.
    echo При сборке проекта возникли ошибки. Пожалуйста, проверьте вывод выше.
)

echo.
pause 