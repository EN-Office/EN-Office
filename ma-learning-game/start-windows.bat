@echo off
chcp 65001 > nul
cd /d "%~dp0"
where node > nul 2>&1
if errorlevel 1 (
  echo Node.js が見つかりません。https://nodejs.org/ からインストールしてください。
  echo Node.js なしで見る場合は mockup\index.html をダブルクリックしてください。
  pause
  exit /b 1
)
start "" http://localhost:5173
node app\server.js
pause
