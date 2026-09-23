@echo off
chcp 65001 >nul
cd /d "%~dp0mini-figma"
if not exist node_modules (
  echo Installing dependencies...
  npm install
)
npm run dev
